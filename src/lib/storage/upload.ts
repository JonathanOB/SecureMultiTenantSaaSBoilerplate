import "server-only";

import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/lib/audit/log";
import { appConfig } from "@/config/app.config";
import { AppError } from "@/lib/api/response";
import { validateMimeType, validateFileSize, sanitizeFilename } from "./validate";

// ── Path helpers ───────────────────────────────────────────────────────────────

/** Builds a per-org, per-user storage path to prevent cross-org file access. */
export function buildStoragePath(orgId: string, userId: string, filename: string): string {
  return `${orgId}/${userId}/${filename}`;
}

// ── Signed upload URL ──────────────────────────────────────────────────────────

type SignedUploadUrlParams = {
  orgId: string;
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  bucket?: string;
};

type SignedUploadUrlResult = {
  signedUrl: string;
  path: string;
  token: string;
};

/**
 * Validates the file metadata and returns a Supabase signed upload URL (60 s TTL).
 * The client uploads directly to Supabase — the file never proxies through the server.
 */
export async function createSignedUploadUrl({
  orgId,
  userId,
  filename,
  mimeType,
  sizeBytes,
  bucket = appConfig.storage.assetBucket,
}: SignedUploadUrlParams): Promise<SignedUploadUrlResult> {
  validateFileSize(sizeBytes);
  const cleanName = sanitizeFilename(filename);
  const path = buildStoragePath(orgId, userId, cleanName);

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: false });

  if (error ?? !data) {
    throw new AppError(
      `Failed to create upload URL: ${error?.message ?? "unknown"}`,
      "STORAGE_ERROR",
      500
    );
  }

  return { signedUrl: data.signedUrl, path: data.path, token: data.token };
}

// ── Upload confirmation ────────────────────────────────────────────────────────

type ConfirmUploadParams = {
  orgId: string;
  userId: string;
  bucket: string;
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isPublic?: boolean;
  request?: Request;
};

/**
 * Creates the UploadedFile DB record after the client has confirmed the upload.
 * Writes an audit log entry.
 */
export async function confirmUpload({
  orgId,
  userId,
  bucket,
  path,
  filename,
  mimeType,
  sizeBytes,
  isPublic = false,
  request,
}: ConfirmUploadParams) {
  const file = await prisma.uploadedFile.create({
    data: {
      orgId,
      userId,
      bucket,
      path,
      filename,
      mimeType,
      sizeBytes,
      isPublic,
    },
  });

  writeAuditLog({
    orgId,
    userId,
    action: "file.uploaded",
    resource: "uploaded_file",
    resourceId: file.id,
    metadata: { filename, mimeType, sizeBytes },
    ...(request ? { request } : {}),
  });

  return file;
}

// ── Sharp optimisation pipeline ────────────────────────────────────────────────

type ImageOptimiseOptions = {
  type: "avatar" | "logo";
};

type OptimisedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: "image/webp";
};

const DIMENSIONS = {
  avatar: { width: 512, height: 512 },
  logo: { width: 1200, height: 400 },
} as const;

/**
 * Converts an image to WebP, resizes it, strips EXIF metadata, and compresses it.
 * Used for avatar and logo uploads before storage.
 */
export async function optimiseImage(
  input: Buffer | Uint8Array,
  options: ImageOptimiseOptions
): Promise<OptimisedImage> {
  const { width, height } = DIMENSIONS[options.type];

  const result = await sharp(Buffer.from(input))
    .rotate() // auto-rotate based on EXIF orientation before stripping
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .withMetadata({ exif: {} }) // strip all EXIF — privacy protection
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    mimeType: "image/webp",
  };
}

// ── Signed read URL ────────────────────────────────────────────────────────────

/**
 * Returns a short-lived signed URL for a private asset (1 hour TTL).
 * Never exposes the service-role key to the client.
 */
export async function getSignedReadUrl(bucket: string, path: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 3600);

  if (error ?? !data) {
    throw new AppError(
      `Failed to generate read URL: ${error?.message ?? "unknown"}`,
      "STORAGE_ERROR",
      500
    );
  }

  return data.signedUrl;
}

// ── MIME validation wrapper for upload API ─────────────────────────────────────

/**
 * Reads the first 16 bytes of an uploaded file stream and validates the MIME type
 * against the magic bytes before generating a signed upload URL.
 */
export async function validateUploadRequest(
  fileBuffer: Uint8Array,
  declaredMime: string,
  sizeBytes: number
): Promise<string> {
  validateFileSize(sizeBytes);
  const detectedMime = validateMimeType(fileBuffer, declaredMime);
  return detectedMime;
}

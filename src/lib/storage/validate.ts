import { appConfig } from "@/config/app.config";
import { ValidationError } from "@/lib/api/response";

// ── Magic byte signatures ──────────────────────────────────────────────────────
// Validates MIME type by inspecting the actual file bytes, not the extension.
// Attackers can rename a .exe to .jpg — magic bytes cannot be faked at read time.

type MagicSignature = {
  mime: string;
  bytes: number[];
  offset?: number; // byte offset where the signature starts (default 0)
};

const MAGIC_SIGNATURES: MagicSignature[] = [
  // JPEG: FF D8 FF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  // GIF: 47 49 46 38
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  // PDF: %PDF
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

/**
 * Detects the MIME type from the first bytes of a file buffer.
 * Returns null if no known signature matches.
 */
export function detectMimeFromBytes(buffer: Uint8Array): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;

    const matches = sig.bytes.every((byte, i) => buffer[offset + i] === byte);
    if (matches) {
      // Extra check for WebP: bytes 8–11 must be "WEBP"
      if (sig.mime === "image/webp") {
        const webpMark = [0x57, 0x45, 0x42, 0x50];
        if (buffer.length < 12) continue;
        const isWebp = webpMark.every((b, i) => buffer[8 + i] === b);
        if (!isWebp) continue;
      }
      return sig.mime;
    }
  }
  return null;
}

// ── MIME allow-list guard ──────────────────────────────────────────────────────

/**
 * Validates that the file's actual MIME type (via magic bytes) is in the
 * allow-list from appConfig.storage. Throws ValidationError on failure.
 */
export function validateMimeType(buffer: Uint8Array, declaredMime?: string): string {
  const detected = detectMimeFromBytes(buffer);

  if (!detected) {
    throw new ValidationError("File type could not be determined from its contents.");
  }

  // Ensure the detected type matches what the client declared (prevents spoofing).
  if (declaredMime && detected !== declaredMime) {
    throw new ValidationError(`File contents do not match the declared type "${declaredMime}".`);
  }

  const allowed = appConfig.storage.allowedMimeTypes as readonly string[];
  if (!allowed.includes(detected)) {
    throw new ValidationError(
      `File type "${detected}" is not allowed. Accepted: ${allowed.join(", ")}.`
    );
  }

  return detected;
}

// ── File size guard ────────────────────────────────────────────────────────────

/** Throws ValidationError if the file exceeds appConfig.storage.maxFileSizeMb. */
export function validateFileSize(sizeBytes: number): void {
  const maxBytes = appConfig.storage.maxFileSizeMb * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    throw new ValidationError(
      `File size ${(sizeBytes / 1024 / 1024).toFixed(1)} MB exceeds the ${appConfig.storage.maxFileSizeMb} MB limit.`
    );
  }
}

// ── Path traversal guard ───────────────────────────────────────────────────────

const DANGEROUS_PATTERNS = [
  /\.\./, // directory traversal
  /^\/+/, // absolute path
  /[<>:"|?*]/, // Windows-illegal chars
  /[\x00-\x1f]/, // control characters
];

/**
 * Sanitizes a filename by stripping directory components and dangerous characters.
 * Throws ValidationError if the result is empty.
 */
export function sanitizeFilename(filename: string): string {
  // Take only the basename to strip any directory separators.
  const base = filename.split(/[/\\]/).pop() ?? "";
  const clean = base.replace(/[<>:"|?*\x00-\x1f]/g, "").trim();

  if (!clean || DANGEROUS_PATTERNS.some((re) => re.test(clean))) {
    throw new ValidationError(`Filename "${filename}" is not acceptable.`);
  }

  return clean;
}

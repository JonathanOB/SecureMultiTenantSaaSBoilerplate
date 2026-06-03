"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { appConfig } from "@/config/app.config";

type UploadState =
  | { status: "idle" }
  | { status: "preview"; file: File; previewUrl: string }
  | { status: "uploading"; file: File; previewUrl: string; progress: number }
  | { status: "done"; path: string; publicUrl?: string }
  | { status: "error"; message: string };

type ImageUploadProps = {
  bucket?: string;
  onUploadComplete?: (path: string) => void;
  className?: string;
  accept?: string;
};

export function ImageUpload({
  bucket = appConfig.storage.assetBucket,
  onUploadComplete,
  className = "",
  accept,
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = appConfig.storage.allowedMimeTypes as readonly string[];
  const maxBytes = appConfig.storage.maxFileSizeMb * 1024 * 1024;
  const acceptStr = accept ?? allowedTypes.join(",");

  function validateFile(file: File): string | null {
    if (file.size > maxBytes) {
      return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — maximum is ${appConfig.storage.maxFileSizeMb} MB.`;
    }
    if (!allowedTypes.includes(file.type)) {
      return `File type "${file.type}" is not allowed.`;
    }
    return null;
  }

  function selectFile(file: File) {
    const error = validateFile(file);
    if (error) {
      setState({ status: "error", message: error });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setState({ status: "preview", file, previewUrl });
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) selectFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  }

  async function handleUpload() {
    if (state.status !== "preview") return;
    const { file, previewUrl } = state;
    setState({ status: "uploading", file, previewUrl, progress: 0 });

    try {
      // 1. Request a signed upload URL from the server.
      const metaRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          bucket,
        }),
      });

      if (!metaRes.ok) {
        const { error } = (await metaRes.json()) as { error?: { message?: string } };
        throw new Error(error?.message ?? "Failed to get upload URL.");
      }

      const { signedUrl, path } = (await metaRes.json()) as {
        signedUrl: string;
        path: string;
      };

      // 2. Upload directly to Supabase Storage using XHR for progress tracking.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setState((prev) => (prev.status === "uploading" ? { ...prev, progress: pct } : prev));
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // 3. Confirm the upload with the server so it creates the DB record.
      const confirmRes = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          bucket,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!confirmRes.ok) throw new Error("Upload confirmation failed.");

      URL.revokeObjectURL(previewUrl);
      setState({ status: "done", path });
      onUploadComplete?.(path);
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Upload failed." });
    }
  }

  function reset() {
    if (state.status === "preview" || state.status === "uploading") {
      URL.revokeObjectURL((state as { previewUrl: string }).previewUrl);
    }
    setState({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  const isImage =
    (state.status === "preview" || state.status === "uploading") &&
    state.file.type.startsWith("image/");

  return (
    <div className={`space-y-3 ${className}`}>
      {state.status === "idle" || state.status === "error" ? (
        <div
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <Upload className="text-muted-foreground mb-2 size-8" />
          <p className="text-sm font-medium">Drag & drop or click to upload</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {allowedTypes
              .map((t) => t.split("/")[1])
              .join(", ")
              .toUpperCase()}{" "}
            up to {appConfig.storage.maxFileSizeMb} MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptStr}
            className="sr-only"
            onChange={handleInputChange}
          />
        </div>
      ) : null}

      {(state.status === "preview" || state.status === "uploading") && (
        <div className="space-y-3">
          {isImage && (
            <div className="relative w-full overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.previewUrl} alt="Preview" className="max-h-48 w-full object-cover" />
              {state.status === "preview" && (
                <button
                  className="bg-background/80 hover:bg-background absolute top-2 right-2 rounded-full p-1"
                  onClick={reset}
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}
          {state.status === "uploading" && <Progress value={state.progress} className="h-2" />}
          {state.status === "preview" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpload}>
                Upload
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>
                Remove
              </Button>
            </div>
          )}
        </div>
      )}

      {state.status === "done" && (
        <div className="bg-muted/50 flex items-center gap-2 rounded-lg border p-3">
          <p className="text-muted-foreground flex-1 truncate text-sm">Upload complete</p>
          <Button size="sm" variant="outline" onClick={reset}>
            Replace
          </Button>
        </div>
      )}

      {state.status === "error" && (
        <div className="border-destructive/50 bg-destructive/10 flex items-center gap-2 rounded-lg border p-3">
          <AlertCircle className="text-destructive size-4 shrink-0" />
          <p className="text-destructive flex-1 text-sm">{state.message}</p>
          <Button size="sm" variant="outline" onClick={reset}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

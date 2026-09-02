import "server-only";

/**
 * StorageService adapter (PRD §28). Cloudinary first, with the same interface
 * a future S3/R2 adapter implements.
 */
export type StoredFile = { url: string; name: string; mimeType: string; sizeBytes: number };

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
]);

export function validateUpload(file: { type: string; size: number }) {
  if (!ALLOWED.has(file.type)) return "Unsupported file type.";
  if (file.size > MAX_BYTES) return "File is larger than the 8 MB limit.";
  return null;
}

export async function uploadFile(file: File): Promise<StoredFile> {
  const invalid = validateUpload({ type: file.type, size: file.size });
  if (invalid) throw new Error(invalid);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (process.env.STORAGE_PROVIDER === "cloudinary" && cloudName && preset) {
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", preset);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: "POST", body },
    );
    if (!response.ok) throw new Error(`Cloudinary responded ${response.status}`);
    const data = (await response.json()) as { secure_url: string };
    return { url: data.secure_url, name: file.name, mimeType: file.type, sizeBytes: file.size };
  }

  // Local development fallback: keep the bytes inline rather than failing.
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    url: `data:${file.type};base64,${buffer.toString("base64")}`,
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

/** Cloudinary transformation for automatic format/quality (PRD §40.6). */
export function optimizedImageUrl(url: string, width?: number) {
  if (!url.includes("res.cloudinary.com")) return url;
  const transform = ["f_auto", "q_auto", width ? `w_${width}` : "", "c_limit"]
    .filter(Boolean)
    .join(",");
  return url.replace("/upload/", `/upload/${transform}/`);
}

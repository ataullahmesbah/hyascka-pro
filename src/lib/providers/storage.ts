import "server-only";

import { IMAGE_GUIDANCE, UPLOAD_LIMITS } from "@/lib/upload-limits";

export { IMAGE_GUIDANCE, UPLOAD_LIMITS };

/**
 * StorageService adapter (PRD §28). Cloudinary first, with the same interface
 * a future S3/R2 adapter implements.
 */
export type StoredFile = {
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

const ALL_TYPES = new Set<string>([...UPLOAD_LIMITS.image.types, ...UPLOAD_LIMITS.document.types]);

export function validateUpload(file: { type: string; size: number }) {
  if (!ALL_TYPES.has(file.type)) {
    return "Unsupported file type. Use JPG, PNG, WebP, AVIF, SVG or PDF.";
  }
  const kind = UPLOAD_LIMITS.image.types.includes(file.type as never)
    ? UPLOAD_LIMITS.image
    : UPLOAD_LIMITS.document;
  if (file.size > kind.maxBytes) return `File is larger than the ${kind.label} limit.`;
  return null;
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Uploads through Cloudinary's *signed* endpoint.
 *
 * A signed upload keeps the API secret on the server; an unsigned preset would
 * have to be shipped to the browser, where anyone could use it to fill your
 * quota. The signature is a plain SHA-1 of the sorted parameters, so no SDK is
 * needed (PRD §6.7).
 */
export async function uploadFile(file: File, folder = "hyascka"): Promise<StoredFile> {
  const invalid = validateUpload({ type: file.type, size: file.size });
  if (invalid) throw new Error(invalid);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    const { createHash } = await import("crypto");
    const timestamp = Math.floor(Date.now() / 1000);
    const params = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash("sha1").update(`${params}${apiSecret}`).digest("hex");

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", apiKey);
    body.append("timestamp", String(timestamp));
    body.append("folder", folder);
    body.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[cloudinary]", response.status, detail);
      throw new Error("Cloudinary rejected the upload. Check the credentials in Integrations.");
    }

    const data = (await response.json()) as {
      secure_url: string;
      width?: number;
      height?: number;
    };
    return {
      url: data.secure_url,
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      width: data.width,
      height: data.height,
    };
  }

  // No Cloudinary yet: inline the bytes so uploads still work in development.
  // Large files are refused rather than bloating the database.
  if (file.size > 512 * 1024) {
    throw new Error(
      "Cloudinary is not configured, so only files under 512 KB can be stored. Add your Cloudinary keys in Integrations.",
    );
  }
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

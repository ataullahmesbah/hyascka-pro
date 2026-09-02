import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { UPLOAD_LIMITS, uploadFile, validateUpload } from "@/lib/providers/storage";

/**
 * Dashboard media upload (PRD §6.7). Private: a session with `media.manage` is
 * required, the file is validated server-side before it leaves us, and the
 * resulting asset is recorded in the media library.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HARD_CAP = UPLOAD_LIMITS.document.maxBytes;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = {
    id: user.id,
    role: user.role,
    extraPermissions: user.extraPermissions,
    revokedPermissions: user.revokedPermissions,
  };
  if (!can(actor, "media.manage") && !can(actor, "content.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > HARD_CAP + 1024 * 64) {
    return NextResponse.json({ error: "That file is too large." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const folder = String(form.get("folder") ?? "hyascka").replace(/[^a-z0-9/_-]/gi, "") || "hyascka";
  const altText = String(form.get("altText") ?? "").slice(0, 300);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  const invalid = validateUpload({ type: file.type, size: file.size });
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const stored = await uploadFile(file, folder);

    // A data: URL is a development fallback and does not belong in the library.
    if (!stored.url.startsWith("data:")) {
      await prisma.mediaAsset
        .create({
          data: {
            name: stored.name,
            url: stored.url,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            width: stored.width ?? null,
            height: stored.height ?? null,
            altText: altText || null,
            uploadedById: user.id,
          },
        })
        .catch(() => undefined);
    }

    await audit({
      actorId: user.id,
      actorRole: user.role,
      action: "media.uploaded",
      entityType: "MediaAsset",
      summary: `Uploaded ${stored.name} (${Math.round(stored.sizeBytes / 1024)} KB)`,
    });

    return NextResponse.json({ url: stored.url, name: stored.name });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}

import { db } from "@/lib/db";
import { shareLinks, files } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = await params;

    const shareRecord = await db
      .select({
        shareLink: shareLinks,
        file: files,
      })
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(eq(shareLinks.shareToken, token))
      .limit(1);

    if (!shareRecord || shareRecord.length === 0) {
      return Response.json({ error: "Share link not found" }, { status: 404 });
    }

    const share = shareRecord[0].shareLink;
    const file = shareRecord[0].file;

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return Response.json(
        { error: "Share link has expired" },
        { status: 410 }
      );
    }

    // Check download limit
    if (share.maxDownloads && share.downloadCount! >= share.maxDownloads) {
      return Response.json(
        { error: "Download limit reached" },
        { status: 410 }
      );
    }

    return Response.json({
      success: true,
      file: {
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        iv: file.iv,
        salt: file.salt,
        authTag: file.authTag,
      },
      shareInfo: {
        downloadsRemaining: share.maxDownloads
          ? share.maxDownloads - share.downloadCount!
          : null,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error) {
    console.error("[v0] Get share error:", error);
    return Response.json(
      { error: "Failed to fetch share information" },
      { status: 500 }
    );
  }
}

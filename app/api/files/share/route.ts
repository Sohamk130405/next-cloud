import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, files, shareLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  logActivity,
  getClientIp,
  getUserAgent,
} from "@/lib/utils/activity-logger";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { fileId, shareToken, expiresAt, maxDownloads } =
      await request.json();

    if (!fileId || !shareToken) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const fileRecord = await db.query.files.findFirst({
      where: and(eq(files.id, fileId), eq(files.userId, user.id)),
    });

    if (!fileRecord) {
      return Response.json(
        { error: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    const shareId = crypto.randomUUID();
    await db.insert(shareLinks).values({
      id: shareId,
      fileId,
      ownerId: user.id,
      shareToken,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxDownloads,
    });

    // Log activity
    await logActivity({
      userId: user.id,
      actionType: "share",
      fileId,
      shareId,
      description: `Shared file: ${
        fileRecord.fileName
      } (Token: ${shareToken.substring(0, 8)}...)`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json(
      {
        success: true,
        shareLink: `/share/${shareToken}`,
        shareToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[v0] Share error:", error);
    return Response.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return Response.json(
        { error: "Missing fileId parameter" },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const links = await db.query.shareLinks.findMany({
      where: and(
        eq(shareLinks.fileId, fileId),
        eq(shareLinks.ownerId, user.id)
      ),
      orderBy: (shareLinks, { desc }) => [desc(shareLinks.createdAt)],
    });

    return Response.json({ shareLinks: links });
  } catch (error) {
    console.error("[v0] Get shares error:", error);
    return Response.json(
      { error: "Failed to fetch share links" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { shareId } = await request.json();

    if (!shareId) {
      return Response.json({ error: "Missing shareId" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const shareRecord = await db.query.shareLinks.findFirst({
      where: and(eq(shareLinks.id, shareId), eq(shareLinks.ownerId, user.id)),
    });

    if (!shareRecord) {
      return Response.json(
        { error: "Share link not found or unauthorized" },
        { status: 404 }
      );
    }

    await db.delete(shareLinks).where(eq(shareLinks.id, shareId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("[v0] Delete share error:", error);
    return Response.json(
      { error: "Failed to delete share link" },
      { status: 500 }
    );
  }
}

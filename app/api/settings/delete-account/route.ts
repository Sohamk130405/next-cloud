import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteFromGoogleDrive } from "@/lib/google-drive";
import {
  logActivity,
  getClientIp,
  getUserAgent,
} from "@/lib/utils/activity-logger";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const userFiles = await db.query.files.findMany({
      where: eq(files.userId, user.id),
    });

    for (const file of userFiles) {
      if (file.driveFileId) {
        try {
          await deleteFromGoogleDrive(user.id, file.driveFileId);
          console.log("[v0] File deleted from Google Drive:", file.driveFileId);
        } catch (error) {
          console.error("[v0] Failed to delete file from Google Drive:", error);
          // Continue with next file
        }
      }
    }

    // Log activity before deletion
    await logActivity({
      userId: user.id,
      actionType: "account_delete",
      description: `Account deleted along with ${userFiles.length} files`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    // Delete user (cascades to all related records via database constraints)
    await db.delete(users).where(eq(users.id, user.id));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("[v0] Account deletion error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete account" }), {
      status: 500,
    });
  }
}

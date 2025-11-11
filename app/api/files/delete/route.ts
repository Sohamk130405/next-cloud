import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFromGoogleDrive } from "@/lib/google-drive";
import {
  logActivity,
  getClientIp,
  getUserAgent,
} from "@/lib/utils/activity-logger";

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return new Response(JSON.stringify({ error: "File ID required" }), {
        status: 400,
      });
    }

    // Get file record before deleting
    const fileRecord = await db.query.files.findFirst({
      where: and(eq(files.id, fileId), eq(files.userId, user.id)),
    });

    if (!fileRecord) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
      });
    }

    if (fileRecord.driveFileId) {
      try {
        await deleteFromGoogleDrive(user.id, fileRecord.driveFileId);
        console.log(
          "[v0] File deleted from Google Drive:",
          fileRecord.driveFileId
        );
      } catch (error) {
        console.error("[v0] Failed to delete from Google Drive:", error);
        // Continue with database deletion even if Drive deletion fails
      }
    }

    // Log activity BEFORE deleting from database to avoid foreign key issues
    try {
      await logActivity({
        userId: user.id,
        actionType: "delete",
        fileId,
        description: `Deleted file: ${fileRecord.fileName}`,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    } catch (logError) {
      console.error("[v0] Failed to log activity:", logError);
      // Don't fail the delete operation if logging fails
    }

    // Delete file record from database
    const result = await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.userId, user.id)));

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("[v0] Delete file error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete file" }), {
      status: 500,
    });
  }
}

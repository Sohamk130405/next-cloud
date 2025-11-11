import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files, users, googleTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { uploadToGoogleDrive } from "@/lib/google-drive";
import {
  logActivity,
  getClientIp,
  getUserAgent,
} from "@/lib/utils/activity-logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
      return new Response(
        JSON.stringify({ error: "User initialization failed" }),
        { status: 500 }
      );
    }

    const userGoogleToken = await db.query.googleTokens.findFirst({
      where: eq(googleTokens.userId, user.id),
    });

    if (!userGoogleToken) {
      return new Response(
        JSON.stringify({
          error:
            "Google Drive not connected. Please connect your Google Drive in settings.",
        }),
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const iv = formData.get("iv") as string;
    const salt = formData.get("salt") as string;
    const authTag = formData.get("authTag") as string;
    const encryptedBuffer = formData.get("encryptedBuffer") as unknown;
    const originalMimeType = formData.get("originalMimeType") as string;
    const originalFileName = formData.get("originalFileName") as string;

    if (!file || !iv || !salt || !authTag) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    let driveFileId: string;
    try {
      driveFileId = await uploadToGoogleDrive(
        user.id,
        file,
        encryptedBuffer as ArrayBuffer,
        file.name
      );
      console.log("[v0] File uploaded to Google Drive:", driveFileId);
    } catch (error) {
      console.error("[v0] Google Drive upload failed:", error);
      return new Response(
        JSON.stringify({ error: "Failed to upload to Google Drive" }),
        { status: 500 }
      );
    }

    // Generate file ID
    const fileId = nanoid();

    await db.insert(files).values({
      id: fileId,
      userId: user.id,
      driveFileId, // Now the actual Google Drive ID
      iv,
      salt,
      authTag,
      fileName: originalFileName || file.name,
      mimeType: originalMimeType || file.type,
      fileSize: file.size,
    });

    // Log activity
    await logActivity({
      userId: user.id,
      actionType: "upload",
      fileId,
      description: `Uploaded file: ${originalFileName || file.name} (${
        file.size
      } bytes)`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return new Response(
      JSON.stringify({
        success: true,
        fileId,
        message: "File uploaded and encrypted successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Upload error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
    });
  }
}

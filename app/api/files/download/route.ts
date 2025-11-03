import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { downloadFromGoogleDrive } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

    const { fileId } = await request.json();

    if (!fileId) {
      return new Response(JSON.stringify({ error: "Missing file ID" }), {
        status: 400,
      });
    }

    // Get file record
    const fileRecord = await db.query.files.findFirst({
      where: and(eq(files.id, fileId), eq(files.userId, user.id)),
    });

    if (!fileRecord) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
      });
    }

    let encryptedData: ArrayBuffer;
    try {
      encryptedData = await downloadFromGoogleDrive(
        user.id,
        fileRecord.driveFileId!
      );
      console.log(
        "[v0] File downloaded from Google Drive:",
        fileRecord.driveFileId
      );
    } catch (error) {
      console.error("[v0] Google Drive download failed:", error);
      return new Response(
        JSON.stringify({ error: "Failed to download file from Google Drive" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        fileId,
        fileName: fileRecord.fileName,
        mimeType: fileRecord.mimeType,
        iv: fileRecord.iv,
        salt: fileRecord.salt,
        authTag: fileRecord.authTag,
        encryptedData: Array.from(new Uint8Array(encryptedData)), // Convert to array for JSON serialization
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Download error:", error);
    return new Response(JSON.stringify({ error: "Download failed" }), {
      status: 500,
    });
  }
}

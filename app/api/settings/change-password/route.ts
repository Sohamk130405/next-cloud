import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, userKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, generateSalt } from "@/lib/crypto-utils";
import {
  logActivity,
  getClientIp,
  getUserAgent,
} from "@/lib/utils/activity-logger";
import { startFileReEncryptionJob } from "@/lib/utils/file-reencryption";

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

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword) {
      return new Response(
        JSON.stringify({ error: "Current password is required" }),
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400 }
      );
    }

    if (oldPassword === newPassword) {
      return new Response(
        JSON.stringify({
          error: "New password must be different from current password",
        }),
        { status: 400 }
      );
    }

    // Verify old password by comparing hashes
    const existingKey = await db.query.userKeys.findFirst({
      where: eq(userKeys.userId, user.id),
    });

    if (!existingKey || !existingKey.salt || !existingKey.keyHash) {
      return new Response(
        JSON.stringify({ error: "User encryption key not found" }),
        { status: 404 }
      );
    }

    // Convert stored salt back to Uint8Array
    const storedSalt = new Uint8Array(
      atob(existingKey.salt)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Hash the old password with the stored salt
    const oldPasswordHash = await hashPassword(oldPassword, storedSalt);

    // Verify it matches
    if (oldPasswordHash !== existingKey.keyHash) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect" }),
        { status: 401 }
      );
    }

    // Generate new salt and hash
    const newSalt = generateSalt();
    const newKeyHash = await hashPassword(newPassword, newSalt);

    // Update user key with new password hash
    await db
      .update(userKeys)
      .set({
        salt: btoa(String.fromCharCode(...newSalt)),
        keyHash: newKeyHash,
        updatedAt: new Date(),
      })
      .where(eq(userKeys.userId, user.id));

    // Start background re-encryption job for all user files
    // This will download, decrypt with OLD password, and re-encrypt with NEW password
    let reEncryptionJobId: string | null = null;
    try {
      reEncryptionJobId = await startFileReEncryptionJob(
        user.id,
        oldPassword, // Correct: old password for decryption
        newPassword // new password for re-encryption
      );
      console.log(
        `[Password Change] Started re-encryption job ${reEncryptionJobId} for user ${user.id}`
      );
    } catch (error) {
      console.error(
        "[Password Change] Failed to start re-encryption job:",
        error
      );
      // Don't fail the password change if re-encryption job fails to start
    }

    // Log activity
    await logActivity({
      userId: user.id,
      actionType: "password_change",
      description: `Changed encryption password${
        reEncryptionJobId ? ` (Re-encryption job: ${reEncryptionJobId})` : ""
      }`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Password changed successfully. Files are being re-encrypted in the background.",
        reEncryptionJobId,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Password change error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to change password" }),
      { status: 500 }
    );
  }
}

import { db } from "@/lib/db";
import { files, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  downloadFromGoogleDrive,
  uploadToGoogleDrive,
  deleteFromGoogleDrive,
} from "@/lib/google-drive";

interface ReEncryptionJob {
  userId: string;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

// In-memory job tracking (in production, use a database or queue service like Bull/RabbitMQ)
const reEncryptionJobs = new Map<string, ReEncryptionJob>();

/**
 * Start a background re-encryption job for all user files
 * Downloads encrypted files, decrypts with old password, re-encrypts with new password
 */
export async function startFileReEncryptionJob(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<string> {
  const jobId = `reencrypt-${userId}-${Date.now()}`;

  // Fetch all user files
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userFiles = await db.query.files.findMany({
    where: eq(files.userId, userId),
  });

  // Create job record
  const job: ReEncryptionJob = {
    userId,
    totalFiles: userFiles.length,
    processedFiles: 0,
    failedFiles: 0,
    status: "pending",
    createdAt: new Date(),
  };

  reEncryptionJobs.set(jobId, job);

  // Process in background (without awaiting)
  processReEncryptionJob(
    jobId,
    userId,
    oldPassword,
    newPassword,
    userFiles
  ).catch((error) => {
    console.error(`[Re-encryption] Job ${jobId} failed:`, error);
    const job = reEncryptionJobs.get(jobId);
    if (job) {
      job.status = "failed";
      job.completedAt = new Date();
    }
  });

  return jobId;
}

/**
 * Get the status of a re-encryption job
 */
export function getReEncryptionJobStatus(
  jobId: string
): ReEncryptionJob | null {
  return reEncryptionJobs.get(jobId) || null;
}

/**
 * Process the re-encryption job
 */
async function processReEncryptionJob(
  jobId: string,
  userId: string,
  oldPassword: string,
  newPassword: string,
  userFiles: (typeof files.$inferSelect)[]
) {
  const job = reEncryptionJobs.get(jobId);
  if (!job) return;

  job.status = "in_progress";

  try {
    // Dynamic import to avoid circular dependencies and use client-side crypto on server
    const crypto = await import("crypto").then((m) => m.default || m);

    for (const file of userFiles) {
      try {
        console.log(
          `[Re-encryption] Processing file ${file.id} (${
            job.processedFiles + 1
          }/${job.totalFiles})`
        );

        if (!file.driveFileId) {
          console.warn(
            `[Re-encryption] File ${file.id} has no driveFileId, skipping`
          );
          job.processedFiles++;
          continue;
        }

        // Step 1: Download encrypted file from Google Drive
        const encryptedBuffer = await downloadFromGoogleDrive(
          userId,
          file.driveFileId
        );

        // Step 2: Decrypt with old password
        // Note: This requires moving decryption to a server-safe method
        // For now, we'll note that the IV and salt are stored in the database
        const decrypted = await decryptFileOnServer(
          encryptedBuffer,
          oldPassword,
          file.iv || "",
          file.salt || ""
        );

        // Step 3: Re-encrypt with new password
        const reEncrypted = await encryptFileOnServer(decrypted, newPassword);

        // Step 4: Upload re-encrypted file back to Google Drive
        await deleteFromGoogleDrive(userId, file.driveFileId);

        const newFile = new File(
          [reEncrypted.encryptedData],
          file.fileName || "file",
          {
            type: file.mimeType || "application/octet-stream",
          }
        );

        const newDriveFileId = await uploadToGoogleDrive(
          userId,
          newFile,
          reEncrypted.encryptedData,
          file.fileName || "file"
        );

        // Step 5: Update file record with new encryption metadata
        await db
          .update(files)
          .set({
            driveFileId: newDriveFileId,
            iv: reEncrypted.iv,
            salt: reEncrypted.salt,
            updatedAt: new Date(),
          })
          .where(eq(files.id, file.id));

        console.log(
          `[Re-encryption] Successfully re-encrypted file ${file.id}`
        );
        job.processedFiles++;
      } catch (error) {
        console.error(
          `[Re-encryption] Failed to re-encrypt file ${file.id}:`,
          error
        );
        job.failedFiles++;
        job.processedFiles++;
        // Continue with next file instead of failing the whole job
      }
    }

    job.status = "completed";
    job.completedAt = new Date();

    console.log(
      `[Re-encryption] Job ${jobId} completed. Processed: ${job.processedFiles}, Failed: ${job.failedFiles}`
    );
  } catch (error) {
    job.status = "failed";
    job.completedAt = new Date();
    throw error;
  }
}

/**
 * Server-side decryption (simplified version)
 * In production, ensure this is secure and handles all edge cases
 */
async function decryptFileOnServer(
  encryptedData: ArrayBuffer,
  password: string,
  ivString: string,
  saltString: string
): Promise<ArrayBuffer> {
  // This would use the same decryption logic as crypto-utils.ts
  // but adapted for server-side usage
  const iv = new Uint8Array(
    atob(ivString)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const salt = new Uint8Array(
    atob(saltString)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Use subtle crypto (available in Node.js 15+)
  const { subtle } = await import("crypto").then((m) => m.webcrypto);

  const baseKey = await subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  return subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encryptedData);
}

/**
 * Server-side encryption (simplified version)
 */
async function encryptFileOnServer(
  fileBuffer: ArrayBuffer,
  password: string
): Promise<{
  encryptedData: ArrayBuffer;
  iv: string;
  salt: string;
}> {
  const { getRandomValues, subtle } = await import("crypto").then(
    (m) => m.webcrypto
  );

  const salt = getRandomValues(new Uint8Array(16));
  const iv = getRandomValues(new Uint8Array(12));

  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encryptedData = await subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileBuffer
  );

  return {
    encryptedData,
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  };
}

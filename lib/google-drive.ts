import { db } from "@/lib/db";
import { googleTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { refreshAccessToken } from "@/lib/google-oauth";

async function getValidAccessToken(userId: string) {
  const tokenRecord = await db.query.googleTokens.findFirst({
    where: eq(googleTokens.userId, userId),
  });

  if (!tokenRecord) {
    throw new Error("Google account not connected");
  }

  // Check if token is expired and refresh if needed
  if (new Date() >= tokenRecord.expiresAt!) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    try {
      const { accessToken, expiresAt } = await refreshAccessToken(
        tokenRecord.refreshToken!,
        clientId,
        clientSecret
      );

      // Update token in database
      await db
        .update(googleTokens)
        .set({
          accessToken,
          expiresAt,
        })
        .where(eq(googleTokens.id, tokenRecord.id));

      return accessToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw new Error("Failed to refresh Google credentials");
    }
  }

  return tokenRecord.accessToken;
}

export async function uploadToGoogleDrive(
  userId: string,
  file: File,
  encryptedBuffer: ArrayBuffer,
  fileName: string
) {
  const accessToken = await getValidAccessToken(userId);

  // Create metadata
  const metadata = {
    name: `${fileName}.encrypted`,
    parents: ["appDataFolder"],
    properties: {
      encrypted: "true",
      uploadedBy: "secure-storage",
    },
  };

  // Create multipart form data
  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append(
    "file",
    new Blob([encryptedBuffer], { type: "application/octet-stream" })
  );

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Google Drive upload error:", error);
    throw new Error("Failed to upload file to Google Drive");
  }

  const driveFile = await response.json();
  return driveFile.id;
}

export async function downloadFromGoogleDrive(
  userId: string,
  driveFileId: string
): Promise<ArrayBuffer> {
  const accessToken = await getValidAccessToken(userId);

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download file from Google Drive");
  }

  return response.arrayBuffer();
}

export async function deleteFromGoogleDrive(
  userId: string,
  driveFileId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(userId);

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete file from Google Drive");
  }
}

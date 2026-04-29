"use client";

import { useCallback, useState } from "react";
import { decryptFile } from "@/lib/crypto-utils";

interface DownloadFileOptions {
  fileId: string;
  password: string;
  token?: string;
  fileName?: string;
  mimeType?: string;
  iv?: string;
  salt?: string;
}

export interface DecryptedFile {
  data: Uint8Array;
  fileName: string;
  mimeType: string;
}

async function fetchEncryptedFile(fileId: string, token?: string) {
  const response = await fetch("/api/files/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, token }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || "Failed to fetch file");
  }

  const data = await response.json();

  if (!data.encryptedData || !data.iv || !data.salt) {
    throw new Error("Invalid file data received from server");
  }

  return data as {
    encryptedData: number[];
    fileName: string;
    mimeType: string;
    iv: string;
    salt: string;
  };
}

export function saveDecryptedFile(file: DecryptedFile) {
  const blob = new Blob([file.data as BlobPart], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useFileDownload() {
  const [isWorking, setIsWorking] = useState(false);

  const decryptRemoteFile = useCallback(async (options: DownloadFileOptions): Promise<DecryptedFile> => {
    setIsWorking(true);

    try {
      const encryptedFile = await fetchEncryptedFile(options.fileId, options.token);
      const encryptedBuffer = new Uint8Array(encryptedFile.encryptedData).buffer;

      try {
        const decryptedBuffer = await decryptFile(
          encryptedBuffer,
          options.password,
          options.iv || encryptedFile.iv,
          options.salt || encryptedFile.salt,
        );

        return {
          data: new Uint8Array(decryptedBuffer),
          fileName: options.fileName || encryptedFile.fileName,
          mimeType: options.mimeType || encryptedFile.mimeType,
        };
      } catch {
        throw new Error("Failed to decrypt file. Please check your password.");
      }
    } finally {
      setIsWorking(false);
    }
  }, []);

  const downloadFile = useCallback(
    async (options: DownloadFileOptions) => {
      const file = await decryptRemoteFile(options);
      saveDecryptedFile(file);
      return file;
    },
    [decryptRemoteFile],
  );

  return {
    decryptRemoteFile,
    downloadFile,
    isWorking,
  };
}

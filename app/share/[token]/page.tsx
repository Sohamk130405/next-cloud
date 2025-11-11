"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Download, AlertCircle, Loader } from "lucide-react";
import { decryptFile } from "@/lib/crypto-utils";
import { useToast } from "@/hooks/use-toast";

interface SharedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  iv: string;
  salt: string;
  authTag: string;
}

interface ShareInfo {
  downloadsRemaining: number | null;
  expiresAt: string | null;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const { toast } = useToast();

  const [file, setFile] = useState<SharedFile | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchShareInfo();
  }, [token]);

  const fetchShareInfo = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/share/${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load share");
      }

      const data = await response.json();
      setFile(data.file);
      setShareInfo(data.shareInfo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load shared file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !password) {
      toast({
        title: "Error",
        description: "Please enter the password",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDecrypting(true);

      // Fetch encrypted file from Google Drive
      const response = await fetch("/api/files/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          token: token, // Include token for public share downloads
        }),
      });
      if (!response.ok) throw new Error("Failed to download file");

      const data = await response.json();

      const encryptedData = new Uint8Array(data.encryptedData).buffer;
      const decrypted = await decryptFile(
        encryptedData,
        password,
        file.iv,
        file.salt,
      );

      // Create download link
      const blob = new Blob([decrypted], { type: file.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded and decrypted",
      });

      // Refresh share info to update download count
      fetchShareInfo();
    } catch (err) {
      console.error("[v0] Download error:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to download file",
        variant: "destructive",
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border-border max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading shared file...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 border-destructive/50 bg-destructive/5 max-w-md w-full">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h1 className="font-semibold text-foreground">Error</h1>
              <p className="text-sm text-destructive mt-2">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 border-border max-w-md w-full text-center">
          <p className="text-muted-foreground">File not found</p>
        </Card>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Shared File</h1>
          <p className="text-sm text-muted-foreground">
            Enter the password to download and decrypt this file
          </p>
        </div>

        {/* File Info Card */}
        <Card className="p-6 border-border space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">File Name</p>
            <p className="font-semibold text-foreground break-words">
              {file.fileName}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">File Size</p>
            <p className="font-medium text-foreground">
              {formatFileSize(file.fileSize)}
            </p>
          </div>

          {shareInfo && (
            <div className="flex flex-wrap gap-2 pt-2">
              {shareInfo.downloadsRemaining !== null && (
                <Badge variant="secondary">
                  {shareInfo.downloadsRemaining} download
                  {shareInfo.downloadsRemaining !== 1 ? "s" : ""} remaining
                </Badge>
              )}
              {shareInfo.expiresAt && (
                <Badge variant="secondary">
                  Expires {new Date(shareInfo.expiresAt).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Password Input */}
        <Card className="p-6 border-border space-y-4">
          <div>
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter the password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDownload()}
              className="mt-2"
              disabled={isDecrypting}
            />
            <p className="text-xs text-muted-foreground mt-2">
              This password was set by the file owner
            </p>
          </div>

          <Button
            onClick={handleDownload}
            disabled={!password || isDecrypting}
            className="w-full bg-primary hover:bg-primary/90 gap-2"
          >
            {isDecrypting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Decrypting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download & Decrypt
              </>
            )}
          </Button>
        </Card>

        {/* Security Info */}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex gap-3">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium">AES-256-GCM Encryption</p>
              <p className="text-muted-foreground mt-1">
                This file is encrypted end-to-end. Only you can decrypt it with
                the correct password.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

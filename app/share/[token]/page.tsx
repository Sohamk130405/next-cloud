"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileText, Lock, AlertCircle, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFileDownload } from "@/hooks/use-file-download";
import { formatDate, formatFileSize } from "@/lib/file-utils";

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
  const { downloadFile, isWorking } = useFileDownload();

  const [file, setFile] = useState<SharedFile | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [password, setPassword] = useState("");
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
        err instanceof Error ? err.message : "Failed to load shared file",
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
      await downloadFile({
        fileId: file.id,
        password,
        token,
        fileName: file.fileName,
        mimeType: file.mimeType,
        iv: file.iv,
        salt: file.salt,
      });

      toast({
        title: "Success",
        description: "File downloaded and decrypted",
      });

      setPassword("");
      fetchShareInfo();
    } catch (err) {
      console.error("[v0] Download error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to download file";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
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
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">File Name</p>
              <p className="break-words font-semibold text-foreground">
                {file.fileName}
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-muted-foreground">File Size</p>
              <p className="font-medium text-foreground">
                {formatFileSize(file.fileSize)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-muted-foreground">Type</p>
              <p className="truncate font-medium text-foreground">
                {file.mimeType}
              </p>
            </div>
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
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  Expires {formatDate(shareInfo.expiresAt)}
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
              disabled={isWorking}
            />
            <p className="text-xs text-muted-foreground mt-2">
              This password was set by the file owner
            </p>
          </div>

          <Button
            onClick={handleDownload}
            disabled={!password || isWorking}
            className="w-full bg-primary hover:bg-primary/90 gap-2"
          >
            {isWorking ? (
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

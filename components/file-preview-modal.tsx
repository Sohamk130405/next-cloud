"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { decryptFile } from "@/lib/crypto-utils";

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
  mimeType: string;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  fileId,
  fileName,
  mimeType,
}: FilePreviewModalProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your encryption password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/files/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const data = await response.json();

      const encryptedBuffer = new Uint8Array(data.encryptedData).buffer;
      const decryptedBuffer = await decryptFile(
        encryptedBuffer,
        password,
        data.iv,
        data.salt
      );

      // Create blob and trigger download
      const blob = new Blob([decryptedBuffer], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File decrypted and downloaded successfully",
      });

      setPassword("");
      onOpenChange(false);
    } catch (error) {
      console.error("[v0] Download error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to decrypt file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Access File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">File</p>
            <p className="text-sm text-muted-foreground break-all">
              {fileName}
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              Enter your encryption password to download this file
            </p>
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">
              Encryption Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPassword("");
                onOpenChange(false);
              }}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!password || isLoading}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

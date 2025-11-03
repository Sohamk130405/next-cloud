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
import { Download, Eye, AlertCircle, FileText, Loader } from "lucide-react";
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
  const [previewMode, setPreviewMode] = useState<
    "password" | "preview" | "decrypting"
  >("password");
  const [previewData, setPreviewData] = useState<{
    data: Uint8Array;
    mimeType: string;
  } | null>(null);

  const handlePreview = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your encryption password",
        variant: "destructive",
      });
      return;
    }

    setPreviewMode("decrypting");
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

      setPreviewData({
        data: new Uint8Array(decryptedBuffer),
        mimeType: data.mimeType,
      });
      setPreviewMode("preview");
    } catch (error) {
      console.error("[v0] Preview error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to decrypt file",
        variant: "destructive",
      });
      setPreviewMode("password");
    } finally {
      setIsLoading(false);
    }
  };

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

  const renderPreview = () => {
    if (!previewData) return null;

    if (previewData.mimeType.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(
        new Blob([previewData.data as BlobPart], { type: previewData.mimeType })
      );
      return (
        <div className="w-full max-h-96 overflow-auto rounded-lg border border-border">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={fileName}
            className="w-full h-auto"
          />
        </div>
      );
    }

    if (
      previewData.mimeType.startsWith("text/") ||
      previewData.mimeType === "application/json" ||
      previewData.mimeType === "application/pdf"
    ) {
      const text = new TextDecoder()
        .decode(previewData.data)
        .substring(0, 10000);
      return (
        <div className="w-full max-h-96 overflow-auto rounded-lg border border-border bg-muted/50 p-4">
          <pre className="text-xs text-foreground font-mono whitespace-pre-wrap wrap-break-words">
            {text}
            {new TextDecoder().decode(previewData.data).length > 10000 &&
              "\n... (truncated)"}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg border border-border">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Preview not available for this file type
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            File Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              File Name
            </p>
            <p className="text-sm text-muted-foreground break-all">
              {fileName}
            </p>
          </div>

          {previewMode === "password" && (
            <>
              <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg border border-accent/30">
                <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-xs text-accent/90">
                  Enter your encryption password to preview or download this
                  file
                </p>
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-foreground font-medium"
                >
                  Encryption Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 bg-card border-border"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password) {
                      handlePreview();
                    }
                  }}
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
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!password || isLoading}
                  className="flex-1 gap-2 bg-transparent"
                >
                  <Eye className="w-4 h-4" />
                  {isLoading ? "Loading..." : "Preview"}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!password || isLoading}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isLoading ? "Downloading..." : "Download"}
                </Button>
              </div>
            </>
          )}

          {previewMode === "decrypting" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">
                Decrypting file...
              </p>
            </div>
          )}

          {previewMode === "preview" && previewData && (
            <>
              {renderPreview()}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPassword("");
                    setPreviewMode("password");
                    setPreviewData(null);
                    onOpenChange(false);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

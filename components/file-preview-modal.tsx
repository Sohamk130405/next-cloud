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

  // Helper function to detect MIME type from filename
  const getMimeTypeFromFileName = (name: string): string => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const mimeTypeMap: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      // Text
      txt: "text/plain",
      md: "text/markdown",
      json: "application/json",
      xml: "application/xml",
      csv: "text/csv",
      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Video
      mp4: "video/mp4",
      webm: "video/webm",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
    };
    return mimeTypeMap[ext] || "application/octet-stream";
  };

  const getEffectiveMimeType = (mimeType: string, fileName: string): string => {
    // If MIME type is generic, try to detect from filename
    if (
      mimeType === "application/octet-stream" ||
      !mimeType ||
      mimeType === "application/x-octet-stream"
    ) {
      return getMimeTypeFromFileName(fileName);
    }
    return mimeType;
  };

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any)?.error || "Failed to fetch file");
      }

      const data = await response.json();

      if (!data.encryptedData || !data.iv || !data.salt) {
        throw new Error("Invalid file data received from server");
      }

      const encryptedBuffer = new Uint8Array(data.encryptedData).buffer;

      let decryptedBuffer: ArrayBuffer;
      try {
        decryptedBuffer = await decryptFile(
          encryptedBuffer,
          password,
          data.iv,
          data.salt
        );
      } catch (decryptError) {
        throw new Error("Failed to decrypt file. Please check your password.");
      }

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any)?.error || "Failed to fetch file");
      }

      const data = await response.json();

      if (!data.encryptedData || !data.iv || !data.salt) {
        throw new Error("Invalid file data received from server");
      }

      const encryptedBuffer = new Uint8Array(data.encryptedData).buffer;

      let decryptedBuffer: ArrayBuffer;
      try {
        decryptedBuffer = await decryptFile(
          encryptedBuffer,
          password,
          data.iv,
          data.salt
        );
      } catch (decryptError) {
        throw new Error("Failed to decrypt file. Please check your password.");
      }

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

    try {
      const effectiveMimeType = getEffectiveMimeType(
        previewData.mimeType,
        fileName
      );

      if (effectiveMimeType.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(
          new Blob([previewData.data as BlobPart], {
            type: effectiveMimeType,
          })
        );
        return (
          <div className="w-full max-h-96 overflow-auto rounded-lg border border-border">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={fileName}
              className="w-full h-auto"
              onError={(e) => {
                console.error("Image failed to load:", e);
              }}
            />
          </div>
        );
      }

      if (
        effectiveMimeType.startsWith("text/") ||
        effectiveMimeType === "application/json"
      ) {
        try {
          const text = new TextDecoder()
            .decode(previewData.data)
            .substring(0, 10000);
          const fullLength = new TextDecoder().decode(previewData.data).length;

          return (
            <div className="w-full max-h-96 overflow-auto rounded-lg border border-border bg-muted/50 p-4">
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap wrap-break-word">
                {text}
                {fullLength > 10000 && "\n... (truncated)"}
              </pre>
            </div>
          );
        } catch (e) {
          console.error("Text decode error:", e);
          throw new Error("Failed to decode text file");
        }
      }

      if (
        effectiveMimeType === "application/pdf" ||
        fileName.toLowerCase().endsWith(".pdf")
      ) {
        // PDF preview not directly supported in browser preview
        return (
          <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg border border-border">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                PDF preview not available. Please download to view.
              </p>
            </div>
          </div>
        );
      }

      if (effectiveMimeType.startsWith("video/")) {
        return (
          <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg border border-border">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Video preview not available. Please download to view.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg border border-border">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Preview not available for {effectiveMimeType || "this"} file type
            </p>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Preview render error:", error);
      return (
        <div className="flex items-center justify-center h-48 bg-destructive/10 rounded-lg border border-destructive/30">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive/30 mx-auto mb-2" />
            <p className="text-sm text-destructive">Failed to render preview</p>
          </div>
        </div>
      );
    }
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
                <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
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

          {previewMode === "preview" && !previewData && (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-8 h-8 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground">
                Unable to preview this file
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                You can still download it and open it with an appropriate
                application
              </p>
              <div className="flex gap-3 mt-4 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPassword("");
                    setPreviewMode("password");
                    setPreviewData(null);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

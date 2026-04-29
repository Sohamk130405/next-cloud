"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  saveDecryptedFile,
  useFileDownload,
  type DecryptedFile,
} from "@/hooks/use-file-download";
import { getEffectiveMimeType } from "@/lib/file-utils";

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
  const router = useRouter();
  const [password, setPassword] = useState("");
  const { decryptRemoteFile, downloadFile, isWorking } = useFileDownload();
  const [previewMode, setPreviewMode] = useState<
    "password" | "preview" | "decrypting"
  >("password");
  const [previewData, setPreviewData] = useState<DecryptedFile | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setPreviewMode("password");
      setPreviewData(null);
    }
  }, [open]);

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
    try {
      const decryptedFile = await decryptRemoteFile({ fileId, password, fileName, mimeType });
      setPreviewData(decryptedFile);
      setPreviewMode("preview");
    } catch (error) {
      console.error("[v0] Preview error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to decrypt file";

      // Check if the error indicates Google account needs reconnection
      if (errorMessage.includes("Google account access has expired")) {
        toast({
          title: "Google Account Disconnected",
          description: errorMessage,
          variant: "destructive",
        });
        // Redirect to settings page
        router.push("/dashboard/settings");
        return;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setPreviewMode("password");
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

    try {
      if (previewData) {
        saveDecryptedFile(previewData);
        toast({
          title: "Success",
          description: "File downloaded successfully",
        });
        return;
      }

      await downloadFile({ fileId, password, fileName, mimeType });

      toast({
        title: "Success",
        description: "File decrypted and downloaded successfully",
      });

      setPassword("");
      onOpenChange(false);
    } catch (error) {
      console.error("[v0] Download error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to decrypt file";

      // Check if the error indicates Google account needs reconnection
      if (errorMessage.includes("Google account access has expired")) {
        toast({
          title: "Google Account Disconnected",
          description: errorMessage,
          variant: "destructive",
        });
        // Redirect to settings page
        router.push("/dashboard/settings");
        return;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const renderPreview = () => {
    if (!previewData) return null;

    try {
      const effectiveMimeType = getEffectiveMimeType(
        previewData.mimeType,
        fileName,
      );

      if (effectiveMimeType.startsWith("image/")) {
        return (
          <ImagePreview
            data={previewData.data}
            fileName={fileName}
            mimeType={effectiveMimeType}
          />
        );
      }

      if (
        effectiveMimeType.startsWith("text/") ||
        effectiveMimeType === "application/json"
      ) {
        try {
          const decoded = new TextDecoder().decode(previewData.data);
          const text = decoded.substring(0, 10000);

          return (
            <div className="w-full max-h-96 overflow-auto rounded-lg border border-border bg-muted/50 p-4">
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap wrap-break-word">
                {text}
                {decoded.length > 10000 && "\n... (truncated)"}
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
                  disabled={isWorking}
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
                  disabled={isWorking}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!password || isWorking}
                  className="flex-1 gap-2 bg-transparent"
                >
                  <Eye className="w-4 h-4" />
                  {isWorking ? "Loading..." : "Preview"}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!password || isWorking}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isWorking ? "Downloading..." : "Download"}
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

function ImagePreview({
  data,
  fileName,
  mimeType,
}: {
  data: Uint8Array;
  fileName: string;
  mimeType: string;
}) {
  const imageUrl = useMemo(
    () => URL.createObjectURL(new Blob([data as BlobPart], { type: mimeType })),
    [data, mimeType],
  );

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  return (
    <div className="w-full max-h-[65vh] overflow-auto rounded-lg border border-border bg-muted/30">
      <img
        src={imageUrl}
        alt={fileName}
        className="h-auto w-full"
        onError={(event) => {
          console.error("Image failed to load:", event);
        }}
      />
    </div>
  );
}

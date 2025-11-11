"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UploadIcon, File, Lock, AlertCircle } from "lucide-react";
import { encryptFile } from "@/lib/crypto-utils";
import { useToast } from "@/hooks/use-toast";

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 1GB)
      if (selectedFile.size > 1024 * 1024 * 1024) {
        setError("File size exceeds 1GB limit");
        setTimeout(() => setError(""), 5000);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file || !password) {
      setError("Please select a file and enter matching passwords");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Verify password before uploading
    setIsVerifyingPassword(true);
    try {
      const verifyResponse = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || "Failed to verify password");
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.isValid) {
        setError(
          "Incorrect password. Please enter your encryption password from settings."
        );
        setIsVerifyingPassword(false);
        return;
      }
    } catch (err) {
      console.error("[v0] Password verification error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to verify password"
      );
      setIsVerifyingPassword(false);
      return;
    }
    setIsVerifyingPassword(false);

    setIsUploading(true);
    setError("");

    try {
      // Read file as array buffer
      const fileBuffer = await file.arrayBuffer();

      const { encryptedData, iv, salt, authTag } = await encryptFile(
        fileBuffer,
        password
      );

      // Create form data with encrypted file
      const formData = new FormData();
      const encryptedBlob = new Blob([encryptedData], {
        type: "application/octet-stream",
      });
      formData.append("file", encryptedBlob, file.name);
      formData.append("iv", iv);
      formData.append("salt", salt);
      formData.append("authTag", authTag);
      formData.append("encryptedBuffer", encryptedBlob);
      formData.append("originalMimeType", file.type);
      formData.append("originalFileName", file.name);

      // Upload to server
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      await response.json();

      toast({
        title: "Success",
        description: "File uploaded and encrypted to Google Drive successfully",
      });

      // Reset form
      setFile(null);
      setPassword("");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("[v0] Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-8 border-2 border-dashed border-border bg-muted/30">
        <label className="cursor-pointer block">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <UploadIcon className="w-12 h-12 text-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                Drop your file here or click to select
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supported: Images, Videos, Documents (Max 1GB)
              </p>
            </div>
          </div>
        </label>
      </Card>

      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </Card>
      )}

      {file && (
        <Card className="p-6 border-border bg-card">
          <div className="flex items-center gap-4 mb-6">
            <File className="w-10 h-10 text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Badge variant="secondary">Selected</Badge>
          </div>

          {/* Encryption Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Lock className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Your file will be encrypted with AES-256-GCM before uploading to
                Google Drive
              </p>
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">
                Encryption Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter the password you set before or set new one from the
                settings
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setFile(null)}
          disabled={!file || isUploading || isVerifyingPassword}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || !password || isUploading || isVerifyingPassword}
        >
          {isVerifyingPassword
            ? "Verifying Password..."
            : isUploading
            ? "Uploading..."
            : "Upload & Encrypt"}
        </Button>
      </div>
    </div>
  );
}

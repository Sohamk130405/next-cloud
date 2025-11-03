"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Eye,
  Trash2,
  Search,
  FileText,
  FileVideo,
  File,
} from "lucide-react";
import { FilePreviewModal } from "@/components/file-preview-modal";
import { useToast } from "@/hooks/use-toast";

interface FileRecord {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("video")) return <FileVideo className="w-8 h-8" />;
  if (mimeType.startsWith("image")) return <FileText className="w-8 h-8" />;
  return <File className="w-8 h-8" />;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default function FilesPage() {
  const { isLoaded } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);

  useEffect(() => {
    if (isLoaded) {
      initializeUserAndFetchFiles();
    }
  }, [isLoaded]);

  const initializeUserAndFetchFiles = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/auth/user-init", { method: "POST" });
      await fetchFiles();
    } catch (error) {
      console.error("[v0] Init error:", error);
      toast({
        title: "Error",
        description: "Failed to initialize user session",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/files/list");
      if (!response.ok) throw new Error("Failed to fetch files");

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch("/api/files/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) throw new Error("Failed to delete file");

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      fetchFiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handlePreviewClick = (file: FileRecord) => {
    setSelectedFile(file);
    setPreviewModalOpen(true);
  };

  const filteredFiles = files.filter((file) =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* File Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground">Total Files</div>
          <div className="text-3xl font-bold text-foreground mt-2">
            {files.length}
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground">Total Size</div>
          <div className="text-3xl font-bold text-foreground mt-2">
            {formatFileSize(files.reduce((acc, f) => acc + f.fileSize, 0))}
          </div>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="text-sm text-muted-foreground">Encrypted</div>
          <div className="text-3xl font-bold text-accent mt-2">100%</div>
        </Card>
      </div>

      {/* Files Table */}
      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  File Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Size
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Uploaded
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {file.fileName}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {file.mimeType}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {formatFileSize(file.fileSize)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreviewClick(file)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreviewClick(file)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(file.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredFiles.length === 0 && (
        <Card className="p-12 text-center border-border bg-muted/30">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No files found
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No files match your search criteria"
              : "Start by uploading your first encrypted file"}
          </p>
        </Card>
      )}

      {selectedFile && (
        <FilePreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          fileId={selectedFile.id}
          fileName={selectedFile.fileName}
          mimeType={selectedFile.mimeType}
        />
      )}
    </div>
  );
}

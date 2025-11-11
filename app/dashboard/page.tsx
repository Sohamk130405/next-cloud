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
  Upload,
  Lock,
  Calendar,
  ArrowUpDown,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FilePreviewModal } from "@/components/file-preview-modal";
import { useToast } from "@/hooks/use-toast";
import { FileShareDialog } from "@/components/file-share-dialog";

interface FileRecord {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

type SortBy = "name" | "date" | "size";
type SortOrder = "asc" | "desc";

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

function sortFiles(
  files: FileRecord[],
  sortBy: SortBy,
  sortOrder: SortOrder
): FileRecord[] {
  const sorted = [...files];

  sorted.sort((a, b) => {
    let compareValue = 0;

    if (sortBy === "name") {
      compareValue = a.fileName.localeCompare(b.fileName);
    } else if (sortBy === "date") {
      compareValue =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "size") {
      compareValue = a.fileSize - b.fileSize;
    }

    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  return sorted;
}

export default function FilesPage() {
  const { isLoaded } = useUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [shareFileName, setShareFileName] = useState("");

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

  const handleShareClick = (file: FileRecord) => {
    setShareFileId(file.id);
    setShareFileName(file.fileName);
    setShareDialogOpen(true);
  };

  const filteredFiles = files.filter((file) =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedFiles = sortFiles(filteredFiles, sortBy, sortOrder);
  const totalSize = files.reduce((acc, f) => acc + f.fileSize, 0);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Files</h1>
          <p className="text-muted-foreground mt-1">
            Securely stored and encrypted
          </p>
        </div>
        <a href="/dashboard/upload">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Upload className="w-4 h-4" />
            Upload New File
          </Button>
        </a>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {files.length}
              </p>
            </div>
            <FileText className="w-10 h-10 text-primary/20" />
          </div>
        </Card>
        <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Size</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatFileSize(totalSize)}
              </p>
            </div>
            <Lock className="w-10 h-10 text-accent/20" />
          </div>
        </Card>
        <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Encryption</p>
              <p className="text-3xl font-bold text-accent mt-2">AES-256</p>
            </div>
            <Lock className="w-10 h-10 text-accent/20" />
          </div>
        </Card>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        <DropdownMenu>
          <Button
            variant="outline"
            className="gap-2 border-border bg-transparent"
            asChild
          >
            <button>
              <ArrowUpDown className="w-4 h-4" />
              Sort
            </button>
          </Button>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSortBy("name")}
              className={sortBy === "name" ? "bg-primary/10" : ""}
            >
              File Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("date")}
              className={sortBy === "date" ? "bg-primary/10" : ""}
            >
              Upload Date
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("size")}
              className={sortBy === "size" ? "bg-primary/10" : ""}
            >
              File Size
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSortOrder("asc")}
              className={sortOrder === "asc" ? "bg-primary/10" : ""}
            >
              Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOrder("desc")}
              className={sortOrder === "desc" ? "bg-primary/10" : ""}
            >
              Descending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Files Table */}
      {sortedFiles.length > 0 ? (
        <Card className="overflow-hidden border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
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
                {sortedFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-primary">
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
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShareClick(file)}
                          title="Share file"
                          className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreviewClick(file)}
                          title="Preview file"
                          className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreviewClick(file)}
                          title="Download file"
                          className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(file.id)}
                          title="Delete file"
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
      ) : (
        <Card className="p-12 text-center border-border bg-muted/30">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No files found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No files match your search criteria"
              : "Start by uploading your first encrypted file"}
          </p>
          {!searchQuery && (
            <a href="/dashboard/upload">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First File
              </Button>
            </a>
          )}
        </Card>
      )}

      {/* Share Dialog */}
      {shareFileId && (
        <FileShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          fileId={shareFileId}
          fileName={shareFileName}
        />
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

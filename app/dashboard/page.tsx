"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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
  Upload,
  Lock,
  Calendar,
  ArrowUpDown,
  Share2,
  Check,
  ShieldCheck,
  HardDrive,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FilePreviewModal } from "@/components/file-preview-modal";
import { useToast } from "@/hooks/use-toast";
import { FileShareDialog } from "@/components/file-share-dialog";
import {
  formatDate,
  formatFileSize,
  getFileIcon,
  getFileKind,
} from "@/lib/file-utils";

interface FileRecord {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

type SortBy = "name" | "date" | "size";
type SortOrder = "asc" | "desc";

function sortFiles(
  files: FileRecord[],
  sortBy: SortBy,
  sortOrder: SortOrder,
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
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch("/api/files/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: deleteTarget.id }),
      });

      if (!response.ok) throw new Error("Failed to delete file");

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      fetchFiles();
      setDeleteTarget(null);
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

  const sortedFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredFiles = normalizedQuery
      ? files.filter((file) =>
          file.fileName.toLowerCase().includes(normalizedQuery),
        )
      : files;

    return sortFiles(filteredFiles, sortBy, sortOrder);
  }, [files, searchQuery, sortBy, sortOrder]);

  const totalSize = useMemo(
    () => files.reduce((acc, file) => acc + file.fileSize, 0),
    [files],
  );
  const sharedFileId = shareFileId;

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Encrypted media vault
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              My Files
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Search, preview, share, and download private files that stay
              encrypted in your Google Drive storage.
            </p>
          </div>
          <Button asChild className="h-11 w-full gap-2 sm:w-auto">
            <Link href="/dashboard/upload">
              <Upload className="w-4 h-4" />
              Upload New File
            </Link>
          </Button>
        </div>
      </section>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-border bg-card p-6 shadow-sm transition-colors hover:bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {files.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden border-border bg-card p-6 shadow-sm transition-colors hover:bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Size</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatFileSize(totalSize)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <HardDrive className="h-6 w-6" />
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden border-border bg-card p-6 shadow-sm transition-colors hover:bg-card/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Encryption</p>
              <p className="text-3xl font-bold text-accent mt-2">AES-256</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Lock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-3 shadow-sm sm:flex-row sm:items-center">
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
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2 border-border bg-transparent sm:w-auto"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort: {sortBy}, {sortOrder}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSortBy("name")}
              className={sortBy === "name" ? "bg-primary/10" : ""}
            >
              {sortBy === "name" && <Check className="w-4 h-4" />}
              File Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("date")}
              className={sortBy === "date" ? "bg-primary/10" : ""}
            >
              {sortBy === "date" && <Check className="w-4 h-4" />}
              Upload Date
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("size")}
              className={sortBy === "size" ? "bg-primary/10" : ""}
            >
              {sortBy === "size" && <Check className="w-4 h-4" />}
              File Size
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSortOrder("asc")}
              className={sortOrder === "asc" ? "bg-primary/10" : ""}
            >
              {sortOrder === "asc" && <Check className="w-4 h-4" />}
              Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortOrder("desc")}
              className={sortOrder === "desc" ? "bg-primary/10" : ""}
            >
              {sortOrder === "desc" && <Check className="w-4 h-4" />}
              Descending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Files Table */}
      {sortedFiles.length > 0 ? (
        <Card className="overflow-hidden border-border">
          <div className="hidden overflow-x-auto md:block">
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
                  <FileTableRow
                    key={file.id}
                    file={file}
                    onDelete={() => setDeleteTarget(file)}
                    onPreview={() => handlePreviewClick(file)}
                    onShare={() => handleShareClick(file)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {sortedFiles.map((file) => (
              <FileMobileCard
                key={file.id}
                file={file}
                onDelete={() => setDeleteTarget(file)}
                onPreview={() => handlePreviewClick(file)}
                onShare={() => handleShareClick(file)}
              />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center border-border bg-muted/30 sm:p-12">
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
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First File
              </Link>
            </Button>
          )}
        </Card>
      )}

      {/* Share Dialog */}
      {sharedFileId && (
        <FileShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          fileId={sharedFileId}
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{deleteTarget?.fileName}" from your encrypted storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FileTableRow({
  file,
  onDelete,
  onPreview,
  onShare,
}: {
  file: FileRecord;
  onDelete: () => void;
  onPreview: () => void;
  onShare: () => void;
}) {
  const Icon = getFileIcon(getFileKind(file.mimeType, file.fileName));

  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="max-w-[22rem] truncate font-medium text-foreground">
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
                        {formatDate(file.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onShare}
                          title="Share file"
                          className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onPreview}
                          title="Preview file"
                          className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onPreview}
                          title="Download file"
                          className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onDelete}
                          title="Delete file"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
    </tr>
  );
}

function FileMobileCard({
  file,
  onDelete,
  onPreview,
  onShare,
}: {
  file: FileRecord;
  onDelete: () => void;
  onPreview: () => void;
  onShare: () => void;
}) {
  const Icon = getFileIcon(getFileKind(file.mimeType, file.fileName));

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words font-medium text-foreground">{file.fileName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="max-w-full truncate text-xs">
              {file.mimeType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatFileSize(file.fileSize)}
            </Badge>
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(file.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" size="icon" onClick={onShare} title="Share file">
          <Share2 className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onPreview} title="Preview file">
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onPreview} title="Download file">
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          title="Delete file"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

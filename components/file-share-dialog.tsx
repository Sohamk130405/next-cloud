"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Share2, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareLink {
  id: string;
  shareToken: string;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  created_at: string;
}

interface FileShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
}

export function FileShareDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
}: FileShareDialogProps) {
  const { toast } = useToast();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expiryDays, setExpiryDays] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");

  const generateShareLink = async () => {
    try {
      const shareToken = crypto.randomUUID();
      const expiresAt = expiryDays
        ? new Date(
            Date.now() + Number.parseInt(expiryDays) * 24 * 60 * 60 * 1000
          )
        : null;

      const response = await fetch("/api/files/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          shareToken,
          expiresAt: expiresAt?.toISOString() || null,
          maxDownloads: maxDownloads ? Number.parseInt(maxDownloads) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create share link");

      const data = await response.json();

      toast({
        title: "Success",
        description: "Share link created successfully",
      });

      setExpiryDays("");
      setMaxDownloads("");
      fetchShareLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    }
  };

  const fetchShareLinks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/files/share?fileId=${fileId}`);
      if (!response.ok) throw new Error("Failed to fetch share links");

      const data = await response.json();
      setShareLinks(data.shareLinks || []);
    } catch (error) {
      console.error("[v0] Fetch shares error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShareLink = async (shareId: string) => {
    try {
      const response = await fetch("/api/files/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });

      if (!response.ok) throw new Error("Failed to delete share link");

      toast({
        title: "Success",
        description: "Share link deleted",
      });

      fetchShareLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete share link",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Share link copied to clipboard",
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchShareLinks();
    }
    onOpenChange(newOpen);
  };

  useEffect(() => {
    fetchShareLinks();
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{fileName}"
          </DialogTitle>
          <DialogDescription>
            Create and manage public share links for this file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Share Link */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
            <h3 className="font-semibold text-foreground">
              Create New Share Link
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry" className="text-sm">
                  Expires In (days)
                </Label>
                <Input
                  id="expiry"
                  type="number"
                  placeholder="Leave empty for no expiry"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="mt-2"
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="downloads" className="text-sm">
                  Max Downloads
                </Label>
                <Input
                  id="downloads"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  className="mt-2"
                  min="1"
                />
              </div>
            </div>

            <Button
              onClick={generateShareLink}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Generate Share Link
            </Button>
          </div>

          {/* Share Links List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">
              Active Share Links
            </h3>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading share links...
              </p>
            ) : shareLinks.length > 0 ? (
              <div className="space-y-3">
                {shareLinks.map((share) => (
                  <Card key={share.id} className="p-4 border-border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                            {share.shareToken}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              copyToClipboard(
                                `${window.location.origin}/share/${share.shareToken}`
                              )
                            }
                            className="h-6 w-6"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {share.expires_at && (
                            <Badge variant="secondary" className="gap-1">
                              <Calendar className="w-3 h-3" />
                              Expires{" "}
                              {new Date(share.expires_at).toLocaleDateString()}
                            </Badge>
                          )}
                          {share.max_downloads && (
                            <Badge variant="secondary" className="gap-1">
                              <Download className="w-3 h-3" />
                              {share.download_count}/{share.max_downloads}{" "}
                              downloads
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteShareLink(share.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active share links. Create one to get started.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Copy, Trash2, Share2, Calendar, Download, ShieldAlert } from "lucide-react";
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
  const [isCreating, setIsCreating] = useState(false);
  const [expiryDays, setExpiryDays] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");

  const origin = useMemo(
    () => (typeof window === "undefined" ? "" : window.location.origin),
    [],
  );

  const fetchShareLinks = useCallback(async () => {
    if (!fileId || !open) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/files/share?fileId=${encodeURIComponent(fileId)}`);
      if (!response.ok) throw new Error("Failed to fetch share links");

      const data = await response.json();
      setShareLinks(data.shareLinks || []);
    } catch (error) {
      console.error("[v0] Fetch shares error:", error);
      toast({
        title: "Error",
        description: "Failed to load share links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fileId, open, toast]);

  const generateShareLink = async () => {
    try {
      const parsedExpiryDays = expiryDays ? Number.parseInt(expiryDays, 10) : null;
      const parsedMaxDownloads = maxDownloads
        ? Number.parseInt(maxDownloads, 10)
        : null;

      if (
        (parsedExpiryDays !== null && (!Number.isFinite(parsedExpiryDays) || parsedExpiryDays < 1)) ||
        (parsedMaxDownloads !== null && (!Number.isFinite(parsedMaxDownloads) || parsedMaxDownloads < 1))
      ) {
        toast({
          title: "Invalid limits",
          description: "Expiry days and max downloads must be positive numbers.",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);
      const shareToken = crypto.randomUUID();
      const expiresAt = parsedExpiryDays
        ? new Date(
            Date.now() + parsedExpiryDays * 24 * 60 * 60 * 1000,
          )
        : null;

      const response = await fetch("/api/files/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          shareToken,
          expiresAt: expiresAt?.toISOString() || null,
          maxDownloads: parsedMaxDownloads,
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
      await fetchShareLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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

      await fetchShareLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete share link",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Share link copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  };

  const revokeAllShareLinks = async () => {
    if (shareLinks.length === 0) return;

    try {
      await Promise.all(
        shareLinks.map((share) =>
          fetch("/api/files/share", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shareId: share.id }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error("Failed to revoke one or more links");
            }
          }),
        ),
      );

      toast({
        title: "Links revoked",
        description: "All share links for this file were removed.",
      });
      await fetchShareLinks();
    } catch {
      toast({
        title: "Error",
        description: "Failed to revoke all share links",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchShareLinks();
    }
    onOpenChange(newOpen);
  };

  useEffect(() => {
    if (open) {
      fetchShareLinks();
    }
  }, [fetchShareLinks, open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <span className="min-w-0 truncate">Share "{fileName}"</span>
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

            <div className="grid gap-4 sm:grid-cols-2">
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
              disabled={isCreating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isCreating ? "Generating..." : "Generate Share Link"}
            </Button>
          </div>

          {/* Share Links List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">
                Share Links
              </h3>
              {shareLinks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revokeAllShareLinks}
                  className="border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Revoke All
                </Button>
              )}
            </div>

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
                                `${origin}/share/${share.shareToken}`,
                              )
                            }
                            className="h-6 w-6"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <ShareStatusBadge share={share} />
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
                No share links. Create one to get started.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareStatusBadge({ share }: { share: ShareLink }) {
  const isExpired = share.expires_at
    ? new Date(share.expires_at).getTime() < Date.now()
    : false;
  const isLimitReached =
    share.max_downloads !== null && share.download_count >= share.max_downloads;

  if (isExpired) {
    return <Badge variant="destructive">Expired</Badge>;
  }

  if (isLimitReached) {
    return <Badge variant="destructive">Limit reached</Badge>;
  }

  return <Badge className="bg-emerald-600">Active</Badge>;
}

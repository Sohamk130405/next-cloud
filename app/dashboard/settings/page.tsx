"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Lock,
  Chrome,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader,
  ShieldCheck,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    checkGoogleStatus();
  }, []);

  const checkGoogleStatus = async () => {
    try {
      setIsCheckingGoogle(true);
      const response = await fetch("/api/auth/check-google-status");
      const data = await response.json();
      setGoogleConnected(data.connected);
    } catch (error) {
      console.error("Failed to check Google status:", error);
    } finally {
      setIsCheckingGoogle(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !oldPassword) {
      toast({
        title: "Error",
        description: "Enter your current and new encryption passwords",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, oldPassword }),
      });

      if (!response.ok) throw new Error("Failed to change password");

      toast({
        title: "Success",
        description:
          "Password updated successfully. All files will use the new password.",
      });
      setNewPassword("");
      setOldPassword("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const response = await fetch("/api/auth/google/url");
      const { url } = await response.json();

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const googleWindow = window.open(
        url,
        "google-auth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!googleWindow) {
        toast({
          title: "Error",
          description: "Failed to open Google login",
          variant: "destructive",
        });
        return;
      }

      const checkInterval = setInterval(() => {
        try {
          if (googleWindow.closed) {
            clearInterval(checkInterval);
            setIsConnectingGoogle(false);
            checkGoogleStatus();
            toast({
              title: "Success",
              description: "Google Drive connected successfully",
            });
          }
        } catch (error) {
          clearInterval(checkInterval);
        }
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Google Drive",
        variant: "destructive",
      });
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      const response = await fetch("/api/auth/disconnect-google", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to disconnect");

      setGoogleConnected(false);
      toast({
        title: "Success",
        description: "Google Drive disconnected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect Google Drive",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/settings/delete-account", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete account");

      toast({
        title: "Account deleted",
        description: "Your account and all files have been deleted",
      });

      await signOut();
      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Vault controls
            </Badge>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Keep the account surface small: Drive connection, encryption
              password, and account lifecycle controls.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase text-muted-foreground">Signed in as</p>
            <p className="mt-1 max-w-[18rem] truncate text-sm font-medium">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="border-border p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Clerk handles authentication and sessions.
                </p>
              </div>
            </div>
            <Separator className="my-5 bg-border" />
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">
                  {user?.fullName || user?.firstName || "SecureVault user"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="break-words font-medium text-foreground">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Delete account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Permanently remove account data and encrypted file records.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              variant="outline"
              className="mt-5 w-full border-destructive/30 bg-background/60 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Chrome className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Google Drive
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Storage for encrypted file blobs.
                  </p>
                </div>
              </div>
              <Badge
                variant={googleConnected ? "default" : "secondary"}
                className={googleConnected ? "bg-emerald-600" : ""}
              >
                {googleConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <Separator className="my-5 bg-border" />
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                {isCheckingGoogle ? (
                  <Loader className="mt-0.5 h-5 w-5 animate-spin text-muted-foreground" />
                ) : googleConnected ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {isCheckingGoogle
                      ? "Checking connection..."
                      : googleConnected
                        ? "Drive is ready"
                        : "Connect Drive to use uploads"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Files are encrypted before upload and stored in your Drive
                    app folder.
                  </p>
                </div>
              </div>
            </div>
            {!googleConnected ? (
              <Button
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle || isCheckingGoogle}
                className="mt-5 w-full gap-2"
              >
                {isConnectingGoogle ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="h-4 w-4" />
                )}
                {isConnectingGoogle ? "Connecting..." : "Connect Google Drive"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleDisconnectGoogle}
                className="mt-5 w-full border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Disconnect Google Drive
              </Button>
            )}
          </Card>

          <Card className="border-border p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Encryption password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Change the password used to decrypt your files.
                </p>
              </div>
            </div>
            <Separator className="my-5 bg-border" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="old-password" className="text-foreground">
                  Current password
                </Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="Current encryption password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-2 bg-card border-border"
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="new-password" className="text-foreground">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 bg-card border-border"
                  disabled={isSaving}
                />
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || !oldPassword || isSaving}
              className="mt-5 w-full"
            >
              {isSaving ? "Updating..." : "Update Encryption Password"}
            </Button>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your SecureVault account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your account data and encrypted file
              records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
  Lock,
  Chrome,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader,
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
        description: "Passwords must match",
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
    const confirmed = window.confirm(
      "Are you sure you want to delete your account and all files? This action cannot be undone."
    );

    if (!confirmed) return;

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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and security preferences
        </p>
      </div>

      {/* User Info */}
      <Card className="p-6 border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Account Information
        </h2>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">
              {user?.firstName || "User"}
            </p>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6 border-border">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Security Settings
          </h2>
        </div>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Change your encryption password. All existing files will be
            re-encrypted with the new password.
          </p>

          <div>
            <Label
              htmlFor="new-password"
              className="text-foreground font-medium"
            >
              New Encryption Password
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 bg-card border-border"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label
              htmlFor="old-password"
              className="text-foreground font-medium"
            >
              Old Encryption Password
            </Label>
            <Input
              id="old-password"
              type="password"
              placeholder="Enter old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-2 bg-card border-border"
              disabled={isSaving}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={!newPassword || !oldPassword || isSaving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </Card>

      {/* Google Drive Integration */}
      <Card className="p-6 border-border">
        <div className="flex items-center gap-2 mb-4">
          <Chrome className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Google Drive Integration
          </h2>
        </div>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-4">
          {/* Status Card */}
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              {isCheckingGoogle ? (
                <>
                  <Loader className="w-5 h-5 text-muted-foreground animate-spin" />
                  <div>
                    <p className="font-medium text-foreground">
                      Checking status...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {googleConnected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      Google Drive Status
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {googleConnected
                        ? "Connected to your Google Drive"
                        : "Not connected"}
                    </p>
                  </div>
                </>
              )}
            </div>
            <Badge
              variant={googleConnected ? "default" : "secondary"}
              className={googleConnected ? "bg-green-600" : ""}
            >
              {googleConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {/* Action Buttons */}
          {!googleConnected ? (
            <Button
              onClick={handleConnectGoogle}
              disabled={isConnectingGoogle || isCheckingGoogle}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {isConnectingGoogle ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Chrome className="w-4 h-4" />
                  Connect Google Drive
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleDisconnectGoogle}
              className="w-full text-destructive hover:bg-destructive/10 border-destructive/30 bg-transparent"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Disconnect Google Drive
            </Button>
          )}

          <p className="text-xs text-muted-foreground bg-accent/5 p-3 rounded-lg border border-accent/20">
            Your files will be encrypted before being uploaded to your Google
            Drive. Only you can decrypt them with your password.
          </p>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-destructive/30 bg-destructive/5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
        </div>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deleting your account will permanently remove all your encrypted
            files and account data. This action cannot be undone.
          </p>
          <Button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            variant="outline"
            className="w-full text-destructive hover:bg-destructive/10 border-destructive/30 bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Account & All Files"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

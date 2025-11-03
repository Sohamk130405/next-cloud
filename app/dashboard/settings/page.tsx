"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useClerk } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Lock, Cookie as Google, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { toast } = useToast()

  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "Passwords must match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) throw new Error("Failed to change password")

      toast({
        title: "Success",
        description: "Password updated successfully. All files will use the new password.",
      })
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true)
    try {
      const response = await fetch("/api/auth/google/url")
      const { url } = await response.json()

      // Open Google OAuth flow in new window
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const googleWindow = window.open(url, "google-auth", `width=${width},height=${height},left=${left},top=${top}`)

      if (!googleWindow) {
        toast({
          title: "Error",
          description: "Failed to open Google login",
          variant: "destructive",
        })
        return
      }

      // Poll for completion
      const checkInterval = setInterval(() => {
        try {
          if (googleWindow.closed) {
            clearInterval(checkInterval)
            setGoogleConnected(true)
            setIsConnectingGoogle(false)
            toast({
              title: "Success",
              description: "Google Drive connected successfully",
            })
          }
        } catch (error) {
          clearInterval(checkInterval)
        }
      }, 500)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Google Drive",
        variant: "destructive",
      })
      setIsConnectingGoogle(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    setGoogleConnected(false)
    toast({
      title: "Success",
      description: "Google Drive disconnected",
    })
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account and all files? This action cannot be undone.",
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/settings/delete-account", {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete account")

      toast({
        title: "Account deleted",
        description: "Your account and all files have been deleted",
      })

      // Sign out and redirect
      await signOut()
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* User Info */}
      <Card className="p-6 border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Account Information</h2>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">{user?.firstName || "User"}</p>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6 border-border">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Security Settings</h2>
        </div>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Change your encryption password. All existing files will be re-encrypted with the new password.
          </p>

          <div>
            <Label htmlFor="new-password" className="text-foreground">
              New Encryption Password
            </Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-foreground">
              Confirm New Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="mt-2"
              disabled={isSaving}
            />
          </div>

          {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={!newPassword || newPassword !== confirmNewPassword || isSaving}
            className="w-full"
          >
            {isSaving ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </Card>

      {/* Google Drive Integration */}
      <Card className="p-6 border-border">
        <div className="flex items-center gap-2 mb-4">
          <Google className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Google Drive Integration</h2>
        </div>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <p className="font-medium text-foreground">Google Drive Status</p>
              <p className="text-sm text-muted-foreground">
                {googleConnected ? "Connected to your Google Drive" : "Not connected"}
              </p>
            </div>
            <Badge variant={googleConnected ? "default" : "secondary"}>
              {googleConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {!googleConnected && (
            <Button onClick={handleConnectGoogle} disabled={isConnectingGoogle} className="w-full">
              {isConnectingGoogle ? "Connecting..." : "Connect Google Drive"}
            </Button>
          )}

          {googleConnected && (
            <Button
              variant="outline"
              onClick={handleDisconnectGoogle}
              className="w-full text-destructive hover:text-destructive bg-transparent"
            >
              Disconnect Google Drive
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Your files will be encrypted before being uploaded to your Google Drive. Only you can decrypt them.
          </p>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-destructive/50 bg-destructive/5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
        </div>
        <Separator className="mb-6 bg-border" />

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete all your encrypted files and account data. This action cannot be undone.
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
  )
}

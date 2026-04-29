"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  CheckCircle2,
  Cloud,
  FileText,
  Loader2,
  Lock,
  Menu,
  Settings,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "My Files", icon: FileText },
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const pathname = usePathname();
  const { toast } = useToast();
  const showDriveOnboarding =
    googleConnected === false && pathname !== "/dashboard/settings";

  useEffect(() => {
    checkGoogleStatus();
  }, []);

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch("/api/auth/check-google-status");
      const data = await response.json();
      setGoogleConnected(Boolean(data.connected));
    } catch {
      setGoogleConnected(null);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);

    try {
      const response = await fetch("/api/auth/google/url");
      const { url } = await response.json();
      const width = 520;
      const height = 640;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const googleWindow = window.open(
        url,
        "google-auth",
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!googleWindow) {
        throw new Error("Popup blocked. Allow popups and try again.");
      }

      const checkInterval = window.setInterval(() => {
        if (googleWindow.closed) {
          window.clearInterval(checkInterval);
          setIsConnectingGoogle(false);
          checkGoogleStatus();
        }
      }, 500);
    } catch (error) {
      setIsConnectingGoogle(false);
      toast({
        title: "Google Drive connection failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-background to-muted/40">
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[16px_0_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-[width] duration-300 md:flex",
          sidebarOpen ? "w-72" : "w-20",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Lock className="h-5 w-5" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">SecureVault</p>
                <p className="truncate text-xs text-muted-foreground">
                  Private Drive vault
                </p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((open) => !open)}
            className="h-9 w-9 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent/20"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {sidebarOpen && (
          <div className="px-4 pt-4">
            <div className="rounded-xl border border-sidebar-border bg-background/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  AES-256
                </Badge>
                {googleConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium">Encrypted before upload</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Files stay private while using your Google Drive storage.
              </p>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1.5 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "group flex h-11 items-center rounded-xl text-sm font-medium transition-colors",
                  sidebarOpen ? "justify-start gap-3 px-3" : "justify-center px-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <Card
            className={cn(
              "border-sidebar-border bg-background/60 p-3 shadow-none",
              sidebarOpen ? "" : "flex justify-center",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <UserButton />
              {sidebarOpen && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground">Manage session</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 md:hidden">
                <Lock className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">SecureVault</h1>
              </div>
              <h1 className="hidden text-2xl font-bold text-foreground md:block">
                SecureVault
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                Encrypted media storage powered by your Google Drive
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild className="hidden gap-2 sm:inline-flex">
                <Link href="/dashboard/upload">
                  <Upload className="h-4 w-4" />
                  Upload
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {showDriveOnboarding && (
            <GoogleDriveOnboarding
              isConnecting={isConnectingGoogle}
              onConnect={handleConnectGoogle}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

function GoogleDriveOnboarding({
  isConnecting,
  onConnect,
}: {
  isConnecting: boolean;
  onConnect: () => void;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-background p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">Connect Google Drive</h2>
              <Badge variant="secondary">Required for uploads</Badge>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              SecureVault encrypts files in your browser, then stores the
              encrypted version in your Google Drive app folder. Connect once to
              unlock uploads, downloads, previews, and sharing.
            </p>
          </div>
        </div>
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          className="h-11 shrink-0 gap-2 px-5"
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Cloud className="h-4 w-4" />
          )}
          {isConnecting ? "Connecting..." : "Connect Drive"}
        </Button>
      </div>
    </section>
  );
}

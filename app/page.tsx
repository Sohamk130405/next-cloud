"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Cloud,
  Download,
  FileImage,
  FileText,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const files = [
  { name: "product-roadmap.pdf", type: "PDF", size: "2.4 MB", icon: FileText },
  { name: "launch-assets.zip", type: "Archive", size: "84 MB", icon: FileImage },
  { name: "financial-model.xlsx", type: "Sheet", size: "918 KB", icon: FileText },
];

const features = [
  {
    icon: Lock,
    title: "Client-side encryption",
    copy: "Files are encrypted with your password before upload, so storage only receives protected data.",
  },
  {
    icon: Cloud,
    title: "Your Google Drive",
    copy: "SecureVault uses your Drive app folder instead of locking you into another storage silo.",
  },
  {
    icon: Calendar,
    title: "Controlled sharing",
    copy: "Create public links with expiry dates and download limits for safer handoffs.",
  },
];

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const primaryHref = isLoaded && isSignedIn ? "/dashboard" : "/sign-up";

  return (
    <main className="min-h-screen bg-background">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-semibold text-foreground">
                SecureVault
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Encrypted Drive storage
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {isLoaded && isSignedIn ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <Badge variant="secondary" className="mb-5 gap-1">
              <Sparkles className="h-3 w-3" />
              Private files, familiar storage
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
              Encrypted file storage that lives in your Google Drive.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              SecureVault encrypts media and documents before upload, then gives
              you previews, downloads, and controlled share links from one clean
              workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 gap-2">
                <Link href={primaryHref}>
                  {isLoaded && isSignedIn ? "Open Dashboard" : "Create Your Vault"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 bg-background/70">
                <a href="#features">View Features</a>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {["AES-256-GCM", "Drive app folder", "Expiring links"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card/70 p-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section
        id="features"
        className="border-y border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline" className="mb-3">
                Workflow
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                Built around the file actions you actually use
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Upload, preview, share, and recover files without exposing raw
              content to storage providers.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/30"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {feature.copy}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 text-center shadow-sm sm:p-10">
          <KeyRound className="mb-4 h-9 w-9 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">
            Keep ownership of your files and your storage.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Start with a private vault, connect Drive when you are ready, and
            use SecureVault as the encrypted layer on top.
          </p>
          <Button asChild size="lg" className="mt-7 h-11 gap-2">
            <Link href={primaryHref}>
              {isLoaded && isSignedIn ? "Go to Dashboard" : "Start Securely"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl shadow-foreground/10">
        <div className="rounded-xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">SecureVault</p>
                <p className="text-xs text-muted-foreground">
                  Google Drive connected
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600">Protected</Badge>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold">Encryption status</p>
              <div className="mt-5 space-y-4">
                {[
                  ["Client encryption", "Complete"],
                  ["Drive upload", "Synced"],
                  ["Share policy", "Limited"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <Button className="mt-6 w-full gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>

            <div className="space-y-3">
              {files.map((file) => {
                const Icon = file.icon;
                return (
                  <div
                    key={file.name}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.type} · {file.size}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

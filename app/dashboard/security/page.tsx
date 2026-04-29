"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  EyeOff,
  FileKey,
  KeyRound,
  Lock,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const architectureSteps = [
  {
    icon: KeyRound,
    title: "Password-derived key",
    body: "A user password is combined with a per-file salt using PBKDF2 before encrypting or decrypting file bytes.",
  },
  {
    icon: Lock,
    title: "AES-GCM encryption",
    body: "Files are encrypted as binary data with AES-GCM, preserving confidentiality and integrity through authenticated encryption.",
  },
  {
    icon: Cloud,
    title: "Drive storage",
    body: "Only encrypted blobs are uploaded to the user's Google Drive app folder. Metadata needed for decryption stays in the app database.",
  },
  {
    icon: Route,
    title: "Controlled access",
    body: "Authenticated users can manage their own files, while public shares require a valid token, expiry checks, and download-limit checks.",
  },
];

const controls = [
  "Clerk authentication protects dashboard routes and owner-only API actions.",
  "Google OAuth is scoped to Drive storage used by the app integration.",
  "Share links support expiration and max-download limits.",
  "Activity logs record sensitive file actions for auditability.",
  "Security headers reduce browser-side attack surface.",
  "Files are decrypted only after the user supplies the correct encryption password.",
];

const limitations = [
  "Users must remember their encryption password; without it, encrypted file contents cannot be recovered.",
  "A compromised browser or device can still expose decrypted content after the user unlocks it.",
  "Public share URLs should be treated as secrets until revoked or expired.",
  "This project is educational and should receive external penetration testing before production use.",
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm sm:p-8">
        <Badge variant="secondary" className="mb-4 gap-1">
          <ShieldCheck className="h-3 w-3" />
          Cybersecurity architecture
        </Badge>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          SecureVault threat model and protection design
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          This page documents the security posture of the project for review,
          demos, and evaluation. It explains what is protected, how encryption is
          applied, and where the remaining risks are.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileKey className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Encryption Flow</h2>
              <p className="text-sm text-muted-foreground">
                From local file bytes to protected cloud storage.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {architectureSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-[auto_1fr]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-border p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Security Controls</h2>
            </div>
            <div className="space-y-3">
              {controls.map((control) => (
                <div key={control} className="flex gap-3 text-sm leading-6">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{control}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-border p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <EyeOff className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Protected Assets</h2>
            </div>
            <div className="grid gap-3 text-sm">
              {[
                ["File contents", "Encrypted before cloud upload"],
                ["Share access", "Token, expiry, download-limit checks"],
                ["User storage", "Owner-scoped Drive credentials"],
                ["Activity history", "Auditable file actions"],
              ].map(([asset, protection]) => (
                <div
                  key={asset}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <span className="font-medium">{asset}</span>
                  <span className="text-right text-muted-foreground">
                    {protection}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Known Limitations</h2>
            <p className="text-sm text-muted-foreground">
              A strong cybersecurity project names its boundaries clearly.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {limitations.map((limitation) => (
            <div
              key={limitation}
              className="rounded-xl border border-amber-500/20 bg-background/70 p-4 text-sm leading-6"
            >
              {limitation}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Evaluation Talking Points</h2>
        </div>
        <div className="grid gap-3 text-sm leading-6 sm:grid-cols-3">
          <p className="rounded-xl border border-border bg-muted/20 p-4">
            Demonstrates applied cryptography through password-derived AES-GCM
            encryption.
          </p>
          <p className="rounded-xl border border-border bg-muted/20 p-4">
            Shows access control design across authenticated and token-based
            download paths.
          </p>
          <p className="rounded-xl border border-border bg-muted/20 p-4">
            Includes operational security through audit trails and security
            headers.
          </p>
        </div>
      </Card>
    </div>
  );
}

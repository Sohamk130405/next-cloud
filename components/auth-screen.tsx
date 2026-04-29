import type { ReactNode } from "react";
import { CheckCircle2, Cloud, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AuthScreenProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">SecureVault</p>
              <p className="text-sm text-muted-foreground">
                Private media storage
              </p>
            </div>
          </div>

          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-5 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Browser-side encryption
            </Badge>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Your files, encrypted before they ever reach storage.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Connect Google Drive, upload privately, preview safely, and share
              controlled links without giving up ownership of your data.
            </p>
          </div>

          <div className="grid max-w-xl gap-3">
            {[
              "AES-256-GCM encryption",
              "Google Drive app-folder storage",
              "Expiring links and download limits",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/70 p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Lock className="h-6 w-6" />
              </div>
              <p className="text-lg font-semibold">SecureVault</p>
            </div>

            <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-xl shadow-foreground/5 backdrop-blur sm:p-7">
              <div className="mb-6 space-y-2">
                <Badge variant="outline" className="gap-1">
                  <Cloud className="h-3 w-3" />
                  Google Drive powered
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {subtitle}
                </p>
              </div>
              <div className="clerk-auth-shell">{children}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

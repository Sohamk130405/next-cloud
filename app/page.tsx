"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Shield, CloudOff, ArrowRight } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">VaultSafe</span>
          </div>
          <div className="flex gap-4">
            {isLoaded && isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-muted"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <p className="text-sm font-medium text-accent">
              Military-Grade Encryption
            </p>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-foreground text-balance leading-tight">
            Your files, encrypted. Your privacy, protected.
          </h1>

          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            End-to-end encrypted file storage with zero-knowledge architecture.
            Store sensitive documents, media, and backups with absolute privacy.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-muted bg-transparent"
              >
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-16">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-2xl p-12 min-h-64">
              <div className="flex items-center justify-center h-full">
                <Lock className="w-24 h-24 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-muted-foreground text-balance">
              Built for security professionals and privacy-conscious users
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                End-to-End Encrypted
              </h3>
              <p className="text-muted-foreground">
                AES-256-GCM encryption ensures your files are encrypted before
                leaving your device. Only you hold the keys.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CloudOff className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Zero-Knowledge Design
              </h3>
              <p className="text-muted-foreground">
                We cannot access your files. No master keys, no backdoors, no
                government access. Your data remains truly private.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Google Drive Integration
              </h3>
              <p className="text-muted-foreground">
                Seamlessly backup your encrypted files to your Google Drive. Use
                your existing storage without compromises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Ready to secure your files?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of users protecting their data with military-grade
              encryption.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">VaultSafe</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Privacy-first encrypted file storage. Your data, your control.
          </p>
        </div>
      </footer>
    </main>
  );
}

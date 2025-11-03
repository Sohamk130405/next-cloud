"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  FileText,
  Settings,
  Menu,
  X,
  Lock,
  BarChart3,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard", label: "My Files", icon: FileText },
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div
            className={`flex items-center gap-3 ${!sidebarOpen && "hidden"}`}
          >
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-lg">SecureVault</span>
          </div>
          {!sidebarOpen && (
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          {sidebarOpen && (
            <Card className="p-4 bg-sidebar-accent/50 border-sidebar-border">
              <div className="flex items-center justify-between gap-3">
                <UserButton />
                <span className="text-sm font-medium">Account</span>
              </div>
            </Card>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="bg-background/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border p-6">
          <h1 className="text-2xl font-bold text-foreground">SecureVault</h1>
          <p className="text-sm text-muted-foreground">
            Encrypted media storage powered by your Google Drive
          </p>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

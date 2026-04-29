"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  Check,
  Circle,
  Heart,
  Monitor,
  Moon,
  Palette,
  Sprout,
  Sun,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "ocean-light", label: "Ocean Light", icon: Waves },
  { value: "ocean-dark", label: "Ocean Dark", icon: Waves },
  { value: "forest-light", label: "Forest Light", icon: Sprout },
  { value: "forest-dark", label: "Forest Dark", icon: Sprout },
  { value: "rose-light", label: "Rose Light", icon: Heart },
  { value: "rose-dark", label: "Rose Dark", icon: Heart },
  { value: "slate-light", label: "Slate Light", icon: Circle },
  { value: "slate-dark", label: "Slate Dark", icon: Circle },
];

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Change theme"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((item) => {
          const Icon = item.icon;
          const isActive = theme === item.value;

          return (
            <DropdownMenuItem
              key={item.value}
              onClick={() => setTheme(item.value)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {isActive && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

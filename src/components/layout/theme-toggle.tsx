"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme/use-theme";

// Toggle button between light and dark. The icon is chosen by CSS (`dark:`),
// so it is right on first paint, before React knows the theme.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={className}
      aria-label="Dark mode"
      aria-pressed={theme === null ? undefined : dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Moon aria-hidden="true" className="stroke-[2.5] dark:hidden" />
      <Sun aria-hidden="true" className="hidden stroke-[2.5] dark:block" />
    </Button>
  );
}

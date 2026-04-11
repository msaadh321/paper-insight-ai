import { Moon, Sun, Eye } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "high-contrast" | "high-contrast-dark";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");
    if (mode === "dark") root.classList.add("dark");
    else if (mode === "high-contrast") root.classList.add("high-contrast");
    else if (mode === "high-contrast-dark") {
      root.classList.add("dark", "high-contrast");
    }
    localStorage.setItem("theme", mode);
  }, [mode]);

  const cycle = () => {
    setMode((prev) => {
      const order: ThemeMode[] = ["light", "dark", "high-contrast", "high-contrast-dark"];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  };

  const label = {
    light: "Light mode",
    dark: "Dark mode",
    "high-contrast": "High contrast",
    "high-contrast-dark": "High contrast dark",
  }[mode];

  const Icon = mode.includes("high-contrast") ? Eye : mode === "dark" ? Sun : Moon;

  return (
    <button
      onClick={cycle}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={`Current: ${label}. Click to switch theme.`}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

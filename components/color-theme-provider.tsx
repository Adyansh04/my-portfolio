"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ColorTheme = "emerald" | "cyan" | "violet" | "amber" | "rose";

interface ColorThemeColors {
  primary: string;
  primaryRgb: string;
  name: string;
}

export const colorThemes: Record<ColorTheme, ColorThemeColors> = {
  emerald: {
    primary: "#00FF9D",
    primaryRgb: "0, 255, 157",
    name: "Emerald",
  },
  cyan: {
    primary: "#00D4FF",
    primaryRgb: "0, 212, 255",
    name: "Cyan",
  },
  violet: {
    primary: "#A855F7",
    primaryRgb: "168, 85, 247",
    name: "Violet",
  },
  amber: {
    primary: "#FBBF24",
    primaryRgb: "251, 191, 36",
    name: "Amber",
  },
  rose: {
    primary: "#FB7185",
    primaryRgb: "251, 113, 133",
    name: "Rose",
  },
};

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  colors: ColorThemeColors;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("emerald");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("color-theme") as ColorTheme | null;
    if (saved && colorThemes[saved]) {
      setColorTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("color-theme", colorTheme);
      const colors = colorThemes[colorTheme];
      document.documentElement.style.setProperty("--primary", colors.primary);
      document.documentElement.style.setProperty("--accent", colors.primary);
      document.documentElement.style.setProperty("--ring", colors.primary);
      document.documentElement.style.setProperty("--lidar", colors.primary);
      document.documentElement.style.setProperty(
        "--lidar-glow",
        `0 0 20px rgba(${colors.primaryRgb}, 0.5), 0 0 40px rgba(${colors.primaryRgb}, 0.3)`
      );
      document.documentElement.style.setProperty("--chart-1", colors.primary);
    }
  }, [colorTheme, mounted]);

  const handleSetColorTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
  };

  return (
    <ColorThemeContext.Provider
      value={{
        colorTheme,
        setColorTheme: handleSetColorTheme,
        colors: colorThemes[colorTheme],
      }}
    >
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
}

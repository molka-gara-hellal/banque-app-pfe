import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Appearance, Platform } from "react-native";

const STORAGE_KEY = "app_theme";
const FONT_KEY = "app_font_size";

// ─── Palettes clair / sombre ──────────────────────────────────────────────────
export const LIGHT = {
  mode: "light",
  bg: "#F2F4F8",
  card: "#FFFFFF",
  header: "#FFFFFF",
  border: "#eef0f5",
  text: "#1a1a2e",
  textMuted: "#888888",
  textSecondary: "#475569",
  primary: "#1a3c6e",
  primaryLight: "#EBF5FF",
  inputBg: "#F2F4F8",
  divider: "#F2F4F8",
  success: "#EDFFF2",
  successText: "#1a7a3c",
  danger: "#fee2e2",
  dangerText: "#dc2626",
  shadow: "#000",
  tabBar: "#FFFFFF",
  tabBarBorder: "#eef0f5",
  statusBar: "dark",
};

export const DARK = {
  mode: "dark",
  bg: "#0f1117",
  card: "#1c1f2e",
  header: "#161927",
  border: "#2a2d3e",
  text: "#f0f2f8",
  textMuted: "#6b7280",
  textSecondary: "#9ca3af",
  primary: "#4d7cc7",
  primaryLight: "#1e2a45",
  inputBg: "#252836",
  divider: "#2a2d3e",
  success: "#1a2e20",
  successText: "#4ade80",
  danger: "#2e1a1a",
  dangerText: "#f87171",
  shadow: "#000",
  tabBar: "#161927",
  tabBarBorder: "#2a2d3e",
  statusBar: "light",
};

// ─── Font sizes ───────────────────────────────────────────────────────────────
export const FONT_SCALES = {
  small: 0.85,
  medium: 1.0,
  large: 1.18,
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext({
  theme: LIGHT,
  themeKey: "light",
  setThemeKey: () => {},
  fontSize: "medium",
  setFontSize: () => {},
  fs: (size) => size,
});

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKeyState] = useState("light");
  const [fontSize, setFontSizeState] = useState("medium");

  useEffect(() => {
    const load = async () => {
      try {
        const th = Platform.OS === "web"
          ? localStorage.getItem(STORAGE_KEY)
          : await AsyncStorage.getItem(STORAGE_KEY);
        const fs = Platform.OS === "web"
          ? localStorage.getItem(FONT_KEY)
          : await AsyncStorage.getItem(FONT_KEY);
        if (th) setThemeKeyState(th);
        if (fs) setFontSizeState(fs);
      } catch (_) {}
    };
    load();
  }, []);

  const setThemeKey = async (key) => {
    setThemeKeyState(key);
    try {
      if (Platform.OS === "web") localStorage.setItem(STORAGE_KEY, key);
      else await AsyncStorage.setItem(STORAGE_KEY, key);
    } catch (_) {}
  };

  const setFontSize = async (key) => {
    setFontSizeState(key);
    try {
      if (Platform.OS === "web") localStorage.setItem(FONT_KEY, key);
      else await AsyncStorage.setItem(FONT_KEY, key);
    } catch (_) {}
  };

  // Résoudre le thème effectif (system = auto)
  const resolvedKey = themeKey === "system"
    ? (Appearance.getColorScheme() === "dark" ? "dark" : "light")
    : themeKey;

  const theme = resolvedKey === "dark" ? DARK : LIGHT;

  // fs() = helper pour scaler les font sizes
  const scale = FONT_SCALES[fontSize] || 1.0;
  const fs = (size) => Math.round(size * scale);

  return (
    <ThemeContext.Provider value={{ theme, themeKey, setThemeKey, fontSize, setFontSize, fs }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
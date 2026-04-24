import { Slot } from "expo-router";
import { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { LanguageProvider, useLanguage } from "../i18n/LanguageContext";
import { ThemeProvider, useTheme } from "../i18n/ThemeContext";

function AppContent() {
  const { langue, langVersion } = useLanguage();
  const { themeKey } = useTheme();

  useEffect(() => {
    if (Platform.OS !== "web") {
      I18nManager.forceRTL(langue === "ar");
    }
  }, [langue]);

  // ✅ key forces complete remount when language or theme changes
  return <Slot key={`${langVersion}-${themeKey}`} />;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
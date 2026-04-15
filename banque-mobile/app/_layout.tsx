import { Slot } from "expo-router";
import { LanguageProvider } from "../i18n/LanguageContext";
import { ThemeProvider } from "../i18n/ThemeContext";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </LanguageProvider>
  );
}
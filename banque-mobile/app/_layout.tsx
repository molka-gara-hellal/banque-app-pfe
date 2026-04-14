import { Slot } from "expo-router";
import { LanguageProvider } from "../i18n/LanguageContext";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Slot />
    </LanguageProvider>
  );
}

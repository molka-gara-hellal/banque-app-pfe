import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { I18nManager, Platform } from "react-native";

import ar from "./ar";
import en from "./en";
import fr from "./fr";

const TRANSLATIONS = { fr, ar, en };
const STORAGE_KEY = "app_language";

const LanguageContext = createContext({
  langue: "fr",
  t: (key) => key,
  setLangue: () => {},
  isRTL: false,
  langVersion: 0,
});

export function LanguageProvider({ children }) {
  const [langue, setLangueState] = useState("fr");
  // ✅ langVersion changes on every language switch → forces full re-render
  const [langVersion, setLangVersion] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const stored =
          Platform.OS === "web"
            ? localStorage.getItem(STORAGE_KEY)
            : await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && TRANSLATIONS[stored]) {
          setLangueState(stored);
          if (Platform.OS !== "web") {
            I18nManager.forceRTL(stored === "ar");
          }
        }
      } catch (_) {}
    };
    load();
  }, []);

  const setLangue = async (code) => {
    if (!TRANSLATIONS[code]) return;
    setLangueState(code);
    setLangVersion((v) => v + 1); // ✅ trigger re-render for ALL consumers
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(STORAGE_KEY, code);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, code);
        I18nManager.forceRTL(code === "ar");
      }
    } catch (_) {}
  };

  const t = (key) => {
    const keys = key.split(".");
    let value = TRANSLATIONS[langue];
    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }
    return value ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{ langue, t, setLangue, isRTL: langue === "ar", langVersion }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
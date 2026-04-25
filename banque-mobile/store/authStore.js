import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

// ── Token ──────────────────────────────────────────────────────────────────
export const saveToken = async (token) => {
  if (isWeb) localStorage.setItem("token", token);
  else await AsyncStorage.setItem("token", token);
};
export const getToken = async () => {
  if (isWeb) return localStorage.getItem("token");
  return await AsyncStorage.getItem("token");
};
export const removeToken = async () => {
  if (isWeb) localStorage.removeItem("token");
  else await AsyncStorage.removeItem("token");
};

// ── User ───────────────────────────────────────────────────────────────────
export const saveUser = async (user) => {
  if (isWeb) localStorage.setItem("user", JSON.stringify(user));
  else await AsyncStorage.setItem("user", JSON.stringify(user));
};
export const getUser = async () => {
  if (isWeb) {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  }
  const u = await AsyncStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

// ── Compte sélectionné (persisté) ─────────────────────────────────────────
export const saveSelectedAccountId = async (id) => {
  if (!id) return;
  const val = String(id);
  if (isWeb) localStorage.setItem("selected_account_id", val);
  else await AsyncStorage.setItem("selected_account_id", val);
};
export const getSelectedAccountId = async () => {
  if (isWeb) return localStorage.getItem("selected_account_id") || null;
  return (await AsyncStorage.getItem("selected_account_id")) || null;
};
export const removeSelectedAccountId = async () => {
  if (isWeb) localStorage.removeItem("selected_account_id");
  else await AsyncStorage.removeItem("selected_account_id");
};
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
// ── Token biométrique (ne jamais supprimer lors du logout) ─────────────────
export const saveBioToken = async (token) => {
  if (isWeb) return;
  await AsyncStorage.setItem("bio_token", token);
};
export const getBioToken = async () => {
  if (isWeb) return null;
  return await AsyncStorage.getItem("bio_token");
};
export const getBioUser = async () => {
  if (isWeb) return null;
  const u = await AsyncStorage.getItem("bio_user");
  return u ? JSON.parse(u) : null;
};
export const saveBioUser = async (user) => {
  if (isWeb) return;
  await AsyncStorage.setItem("bio_user", JSON.stringify(user));
};
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

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

export const saveUser = async (user) => {
  if (isWeb) localStorage.setItem("user", JSON.stringify(user));
  else await AsyncStorage.setItem("user", JSON.stringify(user));
};

export const getUser = async () => {
  if (isWeb) {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
  const user = await AsyncStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

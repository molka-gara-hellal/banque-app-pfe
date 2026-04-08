import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

const baseURL =
  Platform.OS === "web"
    ? "http://localhost:5000/api"
    : "http://192.168.1.74:5000/api";

const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  try {
    if (Platform.OS === "web") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } else {
      const token = await AsyncStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

export default api;

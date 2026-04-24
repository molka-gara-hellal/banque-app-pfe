import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { saveToken, saveUser } from "../../store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../i18n/LanguageContext";

async function detectAndStoreDevice() {
  try {
    if (Platform.OS === "web") return;
    let deviceName = "Application Mobile";
    let deviceModel = "Smartphone";
    let deviceOS = Platform.OS === "ios" ? "iOS" : "Android";
    try {
      const Device = require("expo-device");
      deviceModel = Device.modelName || "Smartphone";
      deviceName = Device.deviceName || deviceModel;
      deviceOS = Platform.OS === "ios" ? "iOS " + Platform.Version : "Android " + Platform.Version;
    } catch (_) {}
    await AsyncStorage.setItem("device_name", deviceName);
    await AsyncStorage.setItem("device_model", deviceModel);
    await AsyncStorage.setItem("device_os", deviceOS);
  } catch (_) {}
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Veuillez remplir tous les champs"); return; }
    setLoading(true);
    try {
      await detectAndStoreDevice();
      const res = await api.post("/auth/login", { email, password });
      await saveToken(res.data.token);
      await saveUser(res.data.user);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      const status = err.response?.data?.status;
      if (status === "pending") {
        setError(t("auth.pendingMessage") || "Compte en attente de validation.");
      } else if (status === "rejected") {
        setError(t("auth.rejectedMessage") || "Demande refusée.");
      } else {
        setError(err.response?.data?.message || "Connexion echouee");
      }
    } finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <View style={s.logoSection}>
        <Image source={require("../../assets/images/wifak-logo.png")} style={s.logo} />
        <Text style={s.subtitle}>{t("auth.login")}</Text>
      </View>
      {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
      <View style={s.fieldsContainer}>
        <TextInput style={s.input} placeholder={t("auth.email")} placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <View style={s.pwdWrapper}>
          <TextInput style={[s.input, { paddingRight: 50, marginBottom: 0 }]} placeholder={t("auth.password")} placeholderTextColor="#aaa" value={password} onChangeText={setPassword} secureTextEntry={!showPwd} autoCapitalize="none" />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(!showPwd)}>
            <Text style={{ fontSize: 18, color: "#aaa" }}>{showPwd ? "visibility" : "visibility_off"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{t("auth.loginBtn")}</Text>}
      </TouchableOpacity>
      <View style={s.linksContainer}>
        <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
          <Text style={s.link}>{t("auth.forgotPassword")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(auth)/register-step1")}>
          <Text style={s.link}>{t("auth.noAccount")} {t("auth.register")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  logoSection: { alignItems: "center", marginBottom: 32 },
  logo: { width: 128, height: 128, resizeMode: "contain", marginBottom: 16 },
  subtitle: { fontSize: 18, color: "#888" },
  errorBox: { width: "100%", backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  fieldsContainer: { width: "100%", gap: 14, marginBottom: 20 },
  input: { width: "100%", backgroundColor: "#fff", borderWidth: 1, borderColor: "#dde3ed", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1a1a2e" },
  pwdWrapper: { position: "relative" },
  eyeBtn: { position: "absolute", right: 14, top: "50%", transform: [{ translateY: -12 }] },
  btn: { width: "100%", backgroundColor: "#1a3c6e", borderRadius: 10, paddingVertical: 16, alignItems: "center", marginBottom: 20 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linksContainer: { alignItems: "center", gap: 10 },
  link: { color: "#1a3c6e", fontSize: 14 },
});

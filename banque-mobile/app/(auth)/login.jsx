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

const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(`${title}: ${message}`);
  } else {
    const { Alert } = require("react-native");
    Alert.alert(title, message);
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      await saveToken(res.data.token);
      await saveUser(res.data.user);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Connexion échouée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* LOGO + TITRE */}
      <View style={styles.brandRow}>
        <Image
          source={require("../../assets/images/wifak-logo.png")}
          style={styles.brandLogo}
        />
        <Text style={styles.title}>Wifak Bank</Text>
      </View>

      <Text style={styles.subtitle}>Connexion</Text>

      {error ? (
        <View style={styles.errorBox}>
          {/* Emoji supprimé ici */}
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
        <Text style={styles.link}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.link}>Pas encore de compte ? S inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f5f7fa",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },

  // ✅ NEW
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10, // si jamais ça bug sur ton RN, je te donne alternative
    marginBottom: 8,
  },
  // ✅ NEW
  brandLogo: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a3c6e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#dde3ed",
  },
  button: {
    backgroundColor: "#1a3c6e",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "#1a3c6e",
    textAlign: "center",
    fontSize: 14,
    marginTop: 8,
  },
});

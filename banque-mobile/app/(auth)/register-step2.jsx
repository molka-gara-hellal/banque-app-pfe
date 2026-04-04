import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";

export default function RegisterStep2() {
  const router = useRouter();
  const { fullName, email } = useLocalSearchParams();

  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError("");
    if (!telephone || !password || !confirmPassword || !dateNaissance) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      const parts = String(fullName || "").trim().split(" ");
      const prenom = parts[0] || "";
      const nom = parts.slice(1).join(" ") || "";

      await api.post("/auth/register", {
        nom,
        prenom,
        email,
        password,
        telephone,
      });

      await api.post("/auth/send-otp-email", { email });

      router.push({
        pathname: "/(auth)/otp",
        params: { email },
      });
    } catch (e) {
      setError(e.response?.data?.message || "Erreur inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Bouton retour */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Logo centré */}
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/wifak-logo.png")}
          style={styles.logo}
        />
        <Text style={styles.subtitle}>Inscription - Étape 2/2</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.fieldsContainer}>
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.passwordContainer, { marginTop: 16 }]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirmer mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowConfirm(!showConfirm)}
          >
            <Text style={styles.eyeIcon}>{showConfirm ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.input, { marginTop: 16 }]}
          placeholder="Date de naissance (JJ/MM/AAAA)"
          value={dateNaissance}
          onChangeText={setDateNaissance}
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Créer mon compte</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.link}>Tu as déjà un compte ? Connecte-toi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  backArrow: {
    fontSize: 28,
    color: "#1a3c6e",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 36,
    marginTop: 8,
  },
  logo: {
    width: 128,
    height: 128,
    resizeMode: "contain",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
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
  fieldsContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#dde3ed",
    color: "#1a1a2e",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 52,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#dde3ed",
    color: "#1a1a2e",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  eyeIcon: {
    fontSize: 20,
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
    marginTop: 4,
  },
});

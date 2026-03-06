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

const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(`${title}: ${message}`);
  } else {
    const { Alert } = require("react-native");
    Alert.alert(title, message);
  }
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setError("");
    if (!email) {
      setError("Veuillez saisir votre adresse email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Adresse email invalide");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'envoi. Réessayez."
      );
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

      {/* Bouton retour */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Mot de passe oublié</Text>
      <Text style={styles.description}>
        Saisissez votre adresse email pour recevoir un lien de réinitialisation
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✅ Un lien de réinitialisation a été envoyé à votre adresse email.
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Adresse email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Envoyer le lien</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.link}>Retour à la connexion</Text>
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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  backArrow: {
    fontSize: 20,
    color: "#1a3c6e",
  },
  backText: {
    fontSize: 15,
    color: "#1a3c6e",
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a3c6e",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 28,
    lineHeight: 20,
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
  successBox: {
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  successText: {
    color: "#16a34a",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#dde3ed",
  },
  button: {
    backgroundColor: "#1a3c6e",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
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
    textDecorationLine: "underline",
  },
});

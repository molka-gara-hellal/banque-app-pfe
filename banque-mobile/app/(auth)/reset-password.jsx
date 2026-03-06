import { useLocalSearchParams, useRouter } from "expo-router";
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

// Calcul de la force du mot de passe
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "#dde3ed" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Faible", color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Moyen", color: "#f59e0b" };
  if (score === 3) return { score: 3, label: "Bon", color: "#3b82f6" };
  return { score: 4, label: "Fort", color: "#16a34a" };
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(newPassword);

  const handleReset = async () => {
    setError("");
    if (!newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setSuccess(true);
      setTimeout(() => router.replace("/(auth)/login"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la réinitialisation. Réessayez."
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

      <Text style={styles.subtitle}>Nouveau mot de passe</Text>
      <Text style={styles.description}>
        Créez un mot de passe sécurisé pour votre compte
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✅ Mot de passe réinitialisé avec succès ! Redirection...
          </Text>
        </View>
      ) : (
        <>
          {/* Nouveau mot de passe */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputField}
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNew(!showNew)}
            >
              <Text style={styles.eyeIcon}>{showNew ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {/* Barre de force */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <Text style={styles.strengthLabel}>Mot de passe</Text>
              <View style={styles.strengthBarBg}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Confirmer mot de passe */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputField}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Text style={styles.eyeIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Confirmer</Text>
            )}
          </TouchableOpacity>
        </>
      )}
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dde3ed",
    marginBottom: 16,
    paddingRight: 12,
  },
  inputField: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  strengthContainer: {
    marginBottom: 16,
    marginTop: -8,
  },
  strengthLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4,
  },
  strengthBarBg: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  strengthBarFill: {
    height: 6,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#1a3c6e",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

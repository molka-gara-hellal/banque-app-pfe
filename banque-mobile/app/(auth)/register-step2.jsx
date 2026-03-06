import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../../servives/api";

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

export default function RegisterStep2() {
  const router = useRouter();
  const { fullName, email, phone } = useLocalSearchParams();

  const [cin, setCin] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getStrength(password), [password]);
  const strengthPct = (strength / 4) * 100;

  const next = async () => {
    setError("");

    if (!cin || !password || !confirm) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      // ✅ Register (adapter aux champs backend: nom/prenom/email/password/telephone)
      // fullName => nom + prenom (simple)
      const parts = String(fullName || "")
        .trim()
        .split(" ");
      const prenom = parts.pop() || "";
      const nom = parts.join(" ") || "";

      await api.post("/auth/register", {
        nom,
        prenom,
        email,
        password,
        telephone: phone,
        // cin: si tu veux le stocker plus tard, ajoute colonne cin dans users
      });

      // ✅ Send OTP email
      await api.post("/auth/send-otp-email", { email });

      // ✅ Go to OTP screen
      router.push({
        pathname: "/(auth)/otp",
        params: { email },
      });
    } catch (e) {
      setError(e.response?.data?.message || "Erreur inscription / OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Inscription</Text>

      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { width: "70%" }]} />
      </View>

      <Text style={styles.sectionTitle}>CIN & Sécurité</Text>

      <View style={styles.card}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Numéro CIN"
          value={cin}
          onChangeText={setCin}
          keyboardType="number-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.strLabel}>Force du mot de passe</Text>
        <View style={styles.strTrack}>
          <View style={[styles.strFill, { width: `${strengthPct}%` }]} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={next}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Suivant</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Un code OTP sera envoyé à :{" "}
          <Text style={styles.hintBold}>{email}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#111",
  },

  progressRow: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBar: { height: "100%", backgroundColor: "#111827" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },

  card: { backgroundColor: "white", borderRadius: 16, padding: 16 },

  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: "#dc2626", textAlign: "center", fontSize: 14 },

  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 16,
  },

  strLabel: { fontSize: 12, color: "#111", marginBottom: 8, marginTop: 2 },
  strTrack: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  strFill: { height: "100%", backgroundColor: "#111827" },

  primaryBtn: {
    backgroundColor: "#1a3c6e",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryBtnText: { color: "white", fontWeight: "700", textAlign: "center" },

  hint: { marginTop: 10, textAlign: "center", color: "#475569", fontSize: 12 },
  hintBold: { fontWeight: "700", color: "#111" },
});

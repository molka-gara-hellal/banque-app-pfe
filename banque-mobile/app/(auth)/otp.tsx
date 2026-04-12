import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);

  const [seconds, setSeconds] = useState<number>(29);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // ✅ État "en attente" après OTP validé
  const [isPending, setIsPending] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Polling toutes les 10 secondes pour vérifier si l'agent a approuvé
  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(async () => {
      try {
        setCheckingStatus(true);
        const res = await api.post("/auth/check-status", { email });
        if (res.data.status === "active") {
          clearInterval(interval);
          router.replace("/(auth)/login");
        }
      } catch (_) {}
      finally {
        setCheckingStatus(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPending]);

  const onChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const resend = async () => {
    if (seconds > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      await api.post("/auth/send-otp-email", { email });
      setSeconds(29);
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur renvoi OTP");
    } finally {
      setResending(false);
    }
  };

  const verify = async () => {
    const otp = code.join("");
    if (otp.length !== 6) {
      setError("Veuillez saisir les 6 chiffres");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      // ✅ Si compte pending → afficher écran d'attente
      if (res.data.status === "pending") {
        setIsPending(true);
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "OTP incorrect");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Écran "En attente de validation"
  if (isPending) {
    return (
      <View style={styles.pendingContainer}>
        <View style={styles.pendingCard}>
          <Text style={styles.pendingIcon}>⏳</Text>
          <Text style={styles.pendingTitle}>Demande en cours de traitement</Text>
          <Text style={styles.pendingText}>
            Votre dossier a été transmis à un agent Wifak Bank.{"\n\n"}
            Vous recevrez une confirmation dès que votre compte sera activé.
          </Text>
          <View style={styles.pendingInfo}>
            <Text style={styles.pendingInfoText}>📧 {String(email || "")}</Text>
          </View>
          {checkingStatus && (
            <View style={styles.checkingRow}>
              <ActivityIndicator size="small" color="#1a3c6e" />
              <Text style={styles.checkingText}>Vérification en cours...</Text>
            </View>
          )}
          <Text style={styles.pendingNote}>
            Cette page vérifie automatiquement l'état de votre demande.
          </Text>
          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saisir le code</Text>
      <Text style={styles.info}>Saisissez le code OTP (6 chiffres)</Text>
      <Text style={styles.sentTo}>
        Code envoyé à{" "}
        <Text style={styles.sentToBold}>{String(email || "")}</Text>
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.otpRow}>
        {code.map((c, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputs.current[i] = r; }}
            style={[styles.otpBox, c ? styles.otpBoxActive : null]}
            value={c}
            onChangeText={(v) => onChange(i, v)}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            maxLength={1}
          />
        ))}
      </View>

      <TouchableOpacity onPress={resend} disabled={seconds > 0 || resending}>
        <Text style={[styles.resend, (seconds > 0 || resending) && { opacity: 0.5 }]}>
          {resending
            ? "Renvoi en cours..."
            : `Renvoyer le code dans 00:${String(seconds).padStart(2, "0")}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={verify} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Valider</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f7fa",
  },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 10, color: "#111" },
  info: { textAlign: "center", marginBottom: 8, color: "#334155" },
  sentTo: { textAlign: "center", marginBottom: 14, color: "#475569", fontSize: 12 },
  sentToBold: { fontWeight: "700", color: "#111" },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { color: "#dc2626", textAlign: "center", fontSize: 14 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  otpBox: {
    width: 44, height: 48, borderRadius: 12, backgroundColor: "#eef2f7",
    textAlign: "center", fontSize: 18, borderWidth: 1, borderColor: "#e2e8f0",
  },
  otpBoxActive: { borderColor: "#111827", backgroundColor: "#fff" },
  resend: { textAlign: "center", color: "#475569", marginBottom: 14 },
  button: { backgroundColor: "#1a3c6e", padding: 16, borderRadius: 12 },
  buttonText: { color: "white", fontWeight: "700", textAlign: "center" },

  // ✅ Styles écran pending
  pendingContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    justifyContent: "center",
    padding: 24,
  },
  pendingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingIcon: { fontSize: 52, marginBottom: 16 },
  pendingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a3c6e",
    textAlign: "center",
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  pendingInfo: {
    backgroundColor: "#EBF5FF",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  pendingInfoText: { color: "#1a3c6e", fontSize: 13, fontWeight: "600" },
  checkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  checkingText: { color: "#1a3c6e", fontSize: 12 },
  pendingNote: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  backToLoginBtn: {
    borderWidth: 1,
    borderColor: "#1a3c6e",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backToLoginText: { color: "#1a3c6e", fontWeight: "600", fontSize: 14 },
});
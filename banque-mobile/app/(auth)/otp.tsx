import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import api from "../../servives/api";

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode]       = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);

  const [seconds, setSeconds]   = useState<number>(59);
  const [loading, setLoading]   = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [error, setError]       = useState<string>("");

  const [isPending, setIsPending]           = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  // ─── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Polling statut compte après OTP validé ───────────────────────────────
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
      finally { setCheckingStatus(false); }
    }, 10000);
    return () => clearInterval(interval);
  }, [isPending]);

  // ─── Saisie chiffre par chiffre ───────────────────────────────────────────
  const onChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-valider quand les 6 chiffres sont remplis
    if (digit && index === 5) {
      const fullCode = [...next].join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const next = [...code];
      next[index - 1] = "";
      setCode(next);
    }
  };

  // ─── Renvoyer OTP ─────────────────────────────────────────────────────────
  const resend = async () => {
    if (seconds > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      await api.post("/auth/send-otp-email", { email });
      setSeconds(59);
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur renvoi OTP");
    } finally { setResending(false); }
  };

  // ─── Vérifier le code ─────────────────────────────────────────────────────
  const verifyCode = async (otp: string) => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      if (res.data.status === "pending") {
        setIsPending(true);
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Code OTP incorrect. Vérifiez votre email.");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    } finally { setLoading(false); }
  };

  const verify = () => {
    const otp = code.join("");
    if (otp.length !== 6) { setError("Veuillez saisir les 6 chiffres"); return; }
    verifyCode(otp);
  };

  // ─── Écran En attente de validation ──────────────────────────────────────
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
            Cette page vérifie automatiquement l état de votre demande.
          </Text>
          <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const otpFilled = code.filter(Boolean).length;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Bouton retour */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Icône 2FA */}
        <View style={styles.iconContainer}>
          <Text style={styles.lockIcon}>🔐</Text>
        </View>

        <Text style={styles.title}>Vérification en 2 étapes</Text>
        <Text style={styles.info}>
          Un code à 6 chiffres a été envoyé à votre adresse email
        </Text>
        <View style={styles.emailBadge}>
          <Text style={styles.emailBadgeText}>📧 {String(email || "")}</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Champs OTP */}
        <View style={styles.otpRow}>
          {code.map((c, i) => (
            <TextInput
              key={i}
              ref={r => { inputs.current[i] = r; }}
              style={[
                styles.otpBox,
                c ? styles.otpBoxFilled : null,
                error ? styles.otpBoxError : null,
              ]}
              value={c}
              onChangeText={v => onChange(i, v)}
              onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
              onPress={() => inputs.current[i]?.focus()}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        {/* Progression */}
        <Text style={styles.progressText}>{otpFilled}/6 chiffres saisis</Text>

        {/* Timer + renvoi */}
        <TouchableOpacity onPress={resend} disabled={seconds > 0 || resending}>
          <Text style={[styles.resend, (seconds > 0 || resending) && { opacity: 0.5 }]}>
            {resending
              ? "Renvoi en cours..."
              : seconds > 0
              ? `Renvoyer le code dans 00:${String(seconds).padStart(2, "0")}`
              : "📨 Renvoyer le code"}
          </Text>
        </TouchableOpacity>

        {/* Bouton valider */}
        <TouchableOpacity
          style={[styles.button, (loading || otpFilled < 6) && { opacity: 0.6 }]}
          onPress={verify}
          disabled={loading || otpFilled < 6}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Valider le code</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.securityNote}>
          🔒 Ce code expire dans 10 minutes
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    backgroundColor: "#f5f7fa",
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  backArrow: { fontSize: 28, color: "#1a3c6e" },
  iconContainer: { alignItems: "center", marginBottom: 16 },
  lockIcon: { fontSize: 52 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10, color: "#1a1a2e" },
  info: { textAlign: "center", marginBottom: 10, color: "#475569", fontSize: 14, lineHeight: 20 },
  emailBadge: {
    backgroundColor: "#EBF5FF", borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 8, alignSelf: "center", marginBottom: 20,
  },
  emailBadgeText: { color: "#1a3c6e", fontSize: 13, fontWeight: "600" },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 10, marginBottom: 16 },
  errorText: { color: "#dc2626", textAlign: "center", fontSize: 14 },
  otpRow: { flexDirection: "row", justifyContent: "center", marginBottom: 8, gap: 6 },
  otpBox: {
    width: 44, height: 52, borderRadius: 10, backgroundColor: "#fff",
    textAlign: "center", fontSize: 20, fontWeight: "700",
    borderWidth: 1.5, borderColor: "#dde3ed", color: "#1a1a2e",
  },
  otpBoxFilled: { borderColor: "#1a3c6e", backgroundColor: "#EBF5FF" },
  otpBoxError: { borderColor: "#FF3B30", backgroundColor: "#FFF0F0" },
  progressText: { textAlign: "center", color: "#94a3b8", fontSize: 12, marginBottom: 14 },
  resend: { textAlign: "center", color: "#1a3c6e", marginBottom: 20, fontSize: 14, fontWeight: "500" },
  button: {
    backgroundColor: "#1a3c6e", padding: 16, borderRadius: 14,
    alignItems: "center", marginBottom: 14,
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  securityNote: { textAlign: "center", color: "#94a3b8", fontSize: 12 },

  // ─── Pending ─────────────────────────────────────────────────────────────────
  pendingContainer: { flex: 1, backgroundColor: "#f5f7fa", justifyContent: "center", padding: 24 },
  pendingCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 28, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  pendingIcon: { fontSize: 52, marginBottom: 16 },
  pendingTitle: { fontSize: 20, fontWeight: "700", color: "#1a3c6e", textAlign: "center", marginBottom: 12 },
  pendingText: { fontSize: 14, color: "#475569", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  pendingInfo: { backgroundColor: "#EBF5FF", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 20 },
  pendingInfoText: { color: "#1a3c6e", fontSize: 13, fontWeight: "600" },
  checkingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  checkingText: { color: "#1a3c6e", fontSize: 12 },
  pendingNote: { fontSize: 11, color: "#94a3b8", textAlign: "center", marginBottom: 20 },
  backToLoginBtn: { borderWidth: 1, borderColor: "#1a3c6e", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  backToLoginText: { color: "#1a3c6e", fontWeight: "600", fontSize: 14 },
});
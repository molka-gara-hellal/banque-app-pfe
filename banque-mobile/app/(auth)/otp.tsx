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

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      await api.post("/auth/verify-otp", { email, otp });

      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.message || "OTP incorrect");
    } finally {
      setLoading(false);
    }
  };

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
            ref={(r) => {
              inputs.current[i] = r;
            }}
            style={[styles.otpBox, c ? styles.otpBoxActive : null]}
            value={c}
            onChangeText={(v) => onChange(i, v)}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            maxLength={1}
          />
        ))}
      </View>

      <TouchableOpacity onPress={resend} disabled={seconds > 0 || resending}>
        <Text
          style={[
            styles.resend,
            (seconds > 0 || resending) && { opacity: 0.5 },
          ]}
        >
          {resending
            ? "Renvoi en cours..."
            : `Renvoyer le code dans 00:${String(seconds).padStart(2, "0")}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={verify}
        disabled={loading}
      >
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#111",
  },
  info: { textAlign: "center", marginBottom: 8, color: "#334155" },

  sentTo: {
    textAlign: "center",
    marginBottom: 14,
    color: "#475569",
    fontSize: 12,
  },
  sentToBold: { fontWeight: "700", color: "#111" },

  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: "#dc2626", textAlign: "center", fontSize: 14 },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  otpBox: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eef2f7",
    textAlign: "center",
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  otpBoxActive: { borderColor: "#111827", backgroundColor: "#fff" },

  resend: { textAlign: "center", color: "#475569", marginBottom: 14 },

  button: { backgroundColor: "#1a3c6e", padding: 16, borderRadius: 12 },
  buttonText: { color: "white", fontWeight: "700", textAlign: "center" },
});

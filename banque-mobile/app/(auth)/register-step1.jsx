import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterStep1() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const next = () => {
    // Tu peux valider ici
    router.push({
      pathname: "/(auth)/register-step2",
      params: { fullName, email, phone },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Inscription</Text>
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { width: "35%" }]} />
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Nom complet"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={next}>
          <Text style={styles.primaryBtnText}>Suivant</Text>
        </TouchableOpacity>
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

  card: { backgroundColor: "white", borderRadius: 16, padding: 16 },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryBtn: {
    backgroundColor: "#1a3c6e",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryBtnText: { color: "white", fontWeight: "700", textAlign: "center" },
});

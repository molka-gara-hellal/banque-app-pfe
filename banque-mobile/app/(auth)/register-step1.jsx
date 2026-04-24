import { useRouter } from "expo-router";
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

// ─── Indicatifs pays les plus courants ───────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+213", flag: "🇩🇿", name: "Algérie" },
  { code: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "+49",  flag: "🇩🇪", name: "Allemagne" },
  { code: "+44",  flag: "🇬🇧", name: "Royaume-Uni" },
  { code: "+1",   flag: "🇺🇸", name: "États-Unis" },
  { code: "+39",  flag: "🇮🇹", name: "Italie" },
  { code: "+34",  flag: "🇪🇸", name: "Espagne" },
  { code: "+32",  flag: "🇧🇪", name: "Belgique" },
  { code: "+41",  flag: "🇨🇭", name: "Suisse" },
  { code: "+20",  flag: "🇪🇬", name: "Égypte" },
  { code: "+218", flag: "🇱🇾", name: "Libye" },
  { code: "+966", flag: "🇸🇦", name: "Arabie Saoudite" },
  { code: "+971", flag: "🇦🇪", name: "Émirats Arabes" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
];

// ─── Règles mot de passe ──────────────────────────────────────────────────────
function checkPassword(pwd) {
  return {
    length:    pwd.length >= 8,
    upper:     /[A-Z]/.test(pwd),
    lower:     /[a-z]/.test(pwd),
    number:    /[0-9]/.test(pwd),
    special:   /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
}

function isPasswordValid(pwd) {
  const c = checkPassword(pwd);
  return c.length && c.upper && c.lower && c.number;
}

export default function RegisterStep1() {
  const router = useRouter();

  const [prenom, setPrenom]           = useState("");
  const [nom, setNom]                 = useState("");
  const [email, setEmail]             = useState("");
  const [telephone, setTelephone]     = useState("");
  const [countryCode, setCountryCode] = useState("+216");
  const [showCodePicker, setShowCodePicker] = useState(false);

  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const pwdChecks = checkPassword(password);
  const pwdValid  = isPasswordValid(password);

  const handleCreate = async () => {
    setError("");
    if (!prenom || !nom || !email || !telephone || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Adresse email invalide");
      return;
    }
    if (!pwdValid) {
      setError("Le mot de passe ne respecte pas les critères requis");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    const fullPhone = countryCode + telephone.replace(/^0/, "");

    setLoading(true);
    try {
      // ✅ Vérifier email ET téléphone avant d'aller à l'étape OTP
      await api.post("/auth/check-availability", {
        email,
        telephone: fullPhone,
      });

      // OK → envoyer OTP et passer à l'étape OTP
      await api.post("/auth/register", {
        nom,
        prenom,
        email,
        password,
        telephone: fullPhone,
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

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.logoSection}>
        <Image source={require("../../assets/images/wifak-logo.png")} style={styles.logo} />
        <Text style={styles.subtitle}>Inscription</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.fieldsContainer}>
        {/* Prénom + Nom */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Prénom"
            value={prenom}
            onChangeText={setPrenom}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Nom"
            value={nom}
            onChangeText={setNom}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />

        {/* Téléphone avec indicatif pays */}
        <View style={styles.phoneRow}>
          <TouchableOpacity
            style={styles.codeBtn}
            onPress={() => setShowCodePicker(!showCodePicker)}
          >
            <Text style={styles.codeFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.codeText}>{countryCode}</Text>
            <Text style={styles.codeArrow}>▾</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Numéro de téléphone"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Picker indicatifs */}
        {showCodePicker && (
          <View style={styles.codePicker}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {COUNTRY_CODES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.codeOption, c.code === countryCode && styles.codeOptionActive]}
                  onPress={() => { setCountryCode(c.code); setShowCodePicker(false); }}
                >
                  <Text style={styles.codeOptionText}>{c.flag} {c.code} — {c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mot de passe */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, {
              borderColor: password.length === 0 ? "#dde3ed" : pwdValid ? "#34C759" : "#FF3B30"
            }]}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        {/* Indicateurs mot de passe */}
        {password.length > 0 && (
          <View style={styles.pwdChecks}>
            <PwdRule ok={pwdChecks.length}   label="Au moins 8 caractères" />
            <PwdRule ok={pwdChecks.upper}    label="Une lettre majuscule" />
            <PwdRule ok={pwdChecks.lower}    label="Une lettre minuscule" />
            <PwdRule ok={pwdChecks.number}   label="Un chiffre" />
            <PwdRule ok={pwdChecks.special}  label="Un caractère spécial (recommandé)" dim />
          </View>
        )}

        {/* Confirmer mot de passe */}
        <View style={[styles.passwordContainer, { marginTop: 12 }]}>
          <TextInput
            style={[styles.passwordInput, {
              borderColor: confirmPassword.length === 0 ? "#dde3ed"
                : confirmPassword === password ? "#34C759" : "#FF3B30"
            }]}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.eyeIcon}>{showConfirm ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>
        {confirmPassword.length > 0 && (
          <Text style={{ color: confirmPassword === password ? "#34C759" : "#FF3B30", fontSize: 12, marginTop: 4 }}>
            {confirmPassword === password ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.link}>Tu as déjà un compte ? Connecte-toi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PwdRule({ ok, label, dim }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
      <Text style={{ color: ok ? "#34C759" : dim ? "#aaa" : "#FF3B30", fontSize: 13, marginRight: 6 }}>
        {ok ? "✓" : "✗"}
      </Text>
      <Text style={{ color: ok ? "#34C759" : dim ? "#aaa" : "#FF3B30", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f7fa" },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 32 },
  backBtn: { alignSelf: "flex-start", marginBottom: 8 },
  backArrow: { fontSize: 28, color: "#1a3c6e" },
  logoSection: { alignItems: "center", marginBottom: 28, marginTop: 8 },
  logo: { width: 100, height: 100, resizeMode: "contain", marginBottom: 12 },
  subtitle: { fontSize: 20, fontWeight: "700", color: "#1a3c6e" },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  fieldsContainer: { marginBottom: 20 },
  row: { flexDirection: "row", marginBottom: 14 },
  input: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 15, borderWidth: 1, borderColor: "#dde3ed",
    color: "#1a1a2e", marginBottom: 14,
  },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  codeBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 13,
    borderWidth: 1, borderColor: "#dde3ed", gap: 4,
  },
  codeFlag: { fontSize: 18 },
  codeText: { fontSize: 14, fontWeight: "600", color: "#1a3c6e" },
  codeArrow: { fontSize: 10, color: "#888" },
  codePicker: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1,
    borderColor: "#dde3ed", marginBottom: 12, overflow: "hidden",
  },
  codeOption: { paddingHorizontal: 16, paddingVertical: 10 },
  codeOptionActive: { backgroundColor: "#EBF5FF" },
  codeOptionText: { fontSize: 14, color: "#1a1a2e" },
  passwordContainer: { position: "relative", marginBottom: 4 },
  passwordInput: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 13, paddingRight: 52, fontSize: 15, borderWidth: 1.5,
    color: "#1a1a2e",
  },
  eyeBtn: { position: "absolute", right: 14, top: 13 },
  eyeIcon: { fontSize: 20 },
  pwdChecks: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10, marginVertical: 8 },
  button: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { color: "#1a3c6e", textAlign: "center", fontSize: 14, marginTop: 4 },
});
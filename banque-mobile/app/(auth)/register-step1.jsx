import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";

// ─── Pays ─────────────────────────────────────────────────────────────────────
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

// ─── Mois ─────────────────────────────────────────────────────────────────────
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["L","M","M","J","V","S","D"];

function buildMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const jsDay = first.getDay();
  const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < mondayIndex; i++) cells.push({ key: `e-${i}`, empty: true });
  for (let d = 1; d <= totalDays; d++) cells.push({ key: `d-${d}`, day: d, empty: false });
  return cells;
}

// ─── Mot de passe ─────────────────────────────────────────────────────────────
function checkPassword(pwd) {
  return {
    length:  pwd.length >= 8,
    upper:   /[A-Z]/.test(pwd),
    lower:   /[a-z]/.test(pwd),
    number:  /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
}
function isPasswordValid(pwd) {
  const c = checkPassword(pwd);
  return c.length && c.upper && c.lower && c.number;
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

export default function RegisterStep1() {
  const router = useRouter();
  const today = new Date();

  // ─── Champs texte ──────────────────────────────────────────────────────────
  const [prenom, setPrenom]       = useState("");
  const [nom, setNom]             = useState("");
  const [cin, setCin]             = useState("");
  const [email, setEmail]         = useState("");
  const [telephone, setTelephone] = useState("");
  const [countryCode, setCountryCode]   = useState("+216");
  const [showCodePicker, setShowCodePicker] = useState(false);

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  // ─── Date de naissance (calendrier) ───────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calYear, setCalYear]   = useState(today.getFullYear() - 25);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay]   = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear]   = useState(null);

  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const pwdChecks = checkPassword(password);
  const pwdValid  = isPasswordValid(password);

  // ─── Formatage date affichage ──────────────────────────────────────────────
  const dateNaissanceDisplay =
    selectedDay && selectedMonth !== null && selectedYear
      ? `${String(selectedDay).padStart(2,"0")}/${String(selectedMonth+1).padStart(2,"0")}/${selectedYear}`
      : "";

  // ─── Sélection d'un jour dans le calendrier ────────────────────────────────
  function onSelectDay(day) {
    setSelectedDay(day);
    setSelectedMonth(calMonth);
    setSelectedYear(calYear);
    setShowDatePicker(false);
  }

  // ─── Validation CIN tunisienne (8 chiffres) ────────────────────────────────
  function isCinValid(cin) {
    return /^\d{8}$/.test(cin);
  }

  const handleCreate = async () => {
    setError("");
    if (!prenom || !nom || !cin || !email || !telephone || !password || !confirmPassword || !dateNaissanceDisplay) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (!isCinValid(cin)) {
      setError("Le numéro CIN doit contenir exactement 8 chiffres");
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
      await api.post("/auth/check-availability", { email, telephone: fullPhone });

      await api.post("/auth/register", {
        nom,
        prenom,
        email,
        password,
        telephone: fullPhone,
        cin,
        dateNaissance: `${selectedYear}-${String(selectedMonth+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`,
      });

      await api.post("/auth/send-otp-email", { email });

      router.push({ pathname: "/(auth)/otp", params: { email } });
    } catch (e) {
      setError(e.response?.data?.message || "Erreur inscription");
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];
  const monthDays = buildMonthDays(calYear, calMonth);

  // ─── Calendrier date de naissance ──────────────────────────────────────────
  const maxYear = today.getFullYear() - 18;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.logoSection}>
        <Image source={require("../../assets/images/wifak-logo.png")} style={styles.logo} />
        <Text style={styles.subtitle}>Inscription</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      <View style={styles.fieldsContainer}>
        {/* Prénom + Nom */}
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Prénom"
            value={prenom} onChangeText={setPrenom} placeholderTextColor="#aaa" />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nom"
            value={nom} onChangeText={setNom} placeholderTextColor="#aaa" />
        </View>

        {/* CIN */}
        <TextInput style={styles.input} placeholder="Numéro CIN (8 chiffres)"
          value={cin} onChangeText={t => setCin(t.replace(/\D/g,"").slice(0,8))}
          keyboardType="number-pad" placeholderTextColor="#aaa"
          maxLength={8}
        />
        {cin.length > 0 && (
          <Text style={{ color: isCinValid(cin) ? "#34C759" : "#FF3B30", fontSize: 12, marginTop: -10, marginBottom: 10, marginLeft: 4 }}>
            {isCinValid(cin) ? "✓ CIN valide" : `✗ ${cin.length}/8 chiffres`}
          </Text>
        )}

        {/* Date de naissance — Calendrier */}
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.datePickerText, !dateNaissanceDisplay && { color: "#aaa" }]}>
            {dateNaissanceDisplay || "Date de naissance"}
          </Text>
          <Text style={styles.datePickerIcon}>📅</Text>
        </TouchableOpacity>

        {/* Email */}
        <TextInput style={styles.input} placeholder="Email"
          value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" placeholderTextColor="#aaa" />

        {/* Téléphone */}
        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.codeBtn} onPress={() => setShowCodePicker(!showCodePicker)}>
            <Text style={styles.codeFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.codeText}>{countryCode}</Text>
            <Text style={styles.codeArrow}>▾</Text>
          </TouchableOpacity>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Numéro de téléphone"
            value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholderTextColor="#aaa" />
        </View>

        {showCodePicker && (
          <View style={styles.codePicker}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {COUNTRY_CODES.map(c => (
                <TouchableOpacity key={c.code}
                  style={[styles.codeOption, c.code === countryCode && styles.codeOptionActive]}
                  onPress={() => { setCountryCode(c.code); setShowCodePicker(false); }}>
                  <Text style={styles.codeOptionText}>{c.flag} {c.code} — {c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mot de passe */}
        <View style={styles.passwordContainer}>
          <TextInput style={[styles.passwordInput, {
            borderColor: password.length === 0 ? "#dde3ed" : pwdValid ? "#34C759" : "#FF3B30"
          }]} placeholder="Mot de passe" value={password} onChangeText={setPassword}
            secureTextEntry={!showPassword} placeholderTextColor="#aaa" />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>

        {password.length > 0 && (
          <View style={styles.pwdChecks}>
            <PwdRule ok={pwdChecks.length}  label="Au moins 8 caractères" />
            <PwdRule ok={pwdChecks.upper}   label="Une lettre majuscule" />
            <PwdRule ok={pwdChecks.lower}   label="Une lettre minuscule" />
            <PwdRule ok={pwdChecks.number}  label="Un chiffre" />
            <PwdRule ok={pwdChecks.special} label="Un caractère spécial (recommandé)" dim />
          </View>
        )}

        {/* Confirmer mot de passe */}
        <View style={[styles.passwordContainer, { marginTop: 12 }]}>
          <TextInput style={[styles.passwordInput, {
            borderColor: confirmPassword.length === 0 ? "#dde3ed" : confirmPassword === password ? "#34C759" : "#FF3B30"
          }]} placeholder="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm} placeholderTextColor="#aaa" />
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

      {/* ─── Modal Calendrier Date de Naissance ─────────────────────────── */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calCard}>
            <Text style={styles.calTitle}>Date de naissance</Text>

            {/* Navigation mois */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                else setCalMonth(m => m - 1);
              }} style={styles.calNavBtn}>
                <Text style={styles.calNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calMonthLabel}>{MONTHS_FR[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={() => {
                if (calYear > maxYear || (calYear === maxYear && calMonth >= today.getMonth())) return;
                if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                else setCalMonth(m => m + 1);
              }} style={styles.calNavBtn}>
                <Text style={styles.calNavText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Année rapide */}
            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setCalYear(y => y - 1)} style={styles.yearBtn}>
                <Text style={styles.yearBtnText}>-1 an</Text>
              </TouchableOpacity>
              <Text style={styles.yearLabel}>{calYear}</Text>
              <TouchableOpacity onPress={() => { if (calYear < maxYear) setCalYear(y => y + 1); }}
                style={[styles.yearBtn, calYear >= maxYear && { opacity: 0.4 }]}>
                <Text style={styles.yearBtnText}>+1 an</Text>
              </TouchableOpacity>
            </View>

            {/* En-têtes jours */}
            <View style={styles.calDaysHeader}>
              {DAYS_FR.map((d, i) => (
                <Text key={i} style={styles.calDayName}>{d}</Text>
              ))}
            </View>

            {/* Grille jours */}
            <View style={styles.calGrid}>
              {monthDays.map(cell => {
                if (cell.empty) return <View key={cell.key} style={styles.calCell} />;
                const isSelected = cell.day === selectedDay && calMonth === selectedMonth && calYear === selectedYear;
                const isToday    = cell.day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                const isFuture   = calYear > maxYear || (calYear === maxYear && calMonth > today.getMonth()) ||
                  (calYear === maxYear && calMonth === today.getMonth() && cell.day > today.getDate());
                return (
                  <TouchableOpacity key={cell.key}
                    style={[styles.calCell, isSelected && styles.calCellSelected, isToday && !isSelected && styles.calCellToday]}
                    onPress={() => !isFuture && onSelectDay(cell.day)}
                    disabled={isFuture}>
                    <Text style={[styles.calCellText, isSelected && styles.calCellTextSelected, isFuture && { color: "#ccc" }]}>
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {dateNaissanceDisplay ? (
              <Text style={styles.selectedDateText}>Sélectionné : {dateNaissanceDisplay}</Text>
            ) : null}

            <TouchableOpacity style={styles.calCloseBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.calCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  // ─── Date picker ────────────────────────────────────────────────────────────
  datePickerBtn: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 13, borderWidth: 1, borderColor: "#dde3ed",
    marginBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  datePickerText: { fontSize: 15, color: "#1a1a2e" },
  datePickerIcon: { fontSize: 18 },
  // ─── Téléphone ──────────────────────────────────────────────────────────────
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  codeBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 13, borderWidth: 1, borderColor: "#dde3ed", gap: 4 },
  codeFlag: { fontSize: 18 },
  codeText: { fontSize: 14, fontWeight: "600", color: "#1a3c6e" },
  codeArrow: { fontSize: 10, color: "#888" },
  codePicker: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dde3ed", marginBottom: 12, overflow: "hidden" },
  codeOption: { paddingHorizontal: 16, paddingVertical: 10 },
  codeOptionActive: { backgroundColor: "#EBF5FF" },
  codeOptionText: { fontSize: 14, color: "#1a1a2e" },
  // ─── Mot de passe ───────────────────────────────────────────────────────────
  passwordContainer: { position: "relative", marginBottom: 4 },
  passwordInput: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, paddingRight: 52, fontSize: 15, borderWidth: 1.5, color: "#1a1a2e" },
  eyeBtn: { position: "absolute", right: 14, top: 13 },
  eyeIcon: { fontSize: 20 },
  pwdChecks: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 10, marginVertical: 8 },
  button: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { color: "#1a3c6e", textAlign: "center", fontSize: 14, marginTop: 4 },
  // ─── Calendrier Modal ────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  calCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  calTitle: { fontSize: 18, fontWeight: "700", color: "#1a3c6e", textAlign: "center", marginBottom: 16 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  calNavBtn: { padding: 8 },
  calNavText: { fontSize: 24, color: "#1a3c6e", fontWeight: "300" },
  calMonthLabel: { fontSize: 16, fontWeight: "600", color: "#1a3c6e" },
  yearRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 },
  yearBtn: { backgroundColor: "#EBF5FF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  yearBtnText: { color: "#1a3c6e", fontSize: 13, fontWeight: "600" },
  yearLabel: { fontSize: 16, fontWeight: "700", color: "#1a1a2e", minWidth: 50, textAlign: "center" },
  calDaysHeader: { flexDirection: "row", marginBottom: 4 },
  calDayName: { flex: 1, textAlign: "center", fontSize: 12, color: "#888", fontWeight: "600" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 100 },
  calCellSelected: { backgroundColor: "#1a3c6e" },
  calCellToday: { borderWidth: 1.5, borderColor: "#1a3c6e" },
  calCellText: { fontSize: 14, color: "#1a1a2e" },
  calCellTextSelected: { color: "#fff", fontWeight: "700" },
  selectedDateText: { textAlign: "center", color: "#1a3c6e", fontWeight: "600", marginTop: 12, fontSize: 14 },
  calCloseBtn: { marginTop: 16, backgroundColor: "#f0f4f8", borderRadius: 12, padding: 14, alignItems: "center" },
  calCloseBtnText: { color: "#1a3c6e", fontWeight: "700", fontSize: 15 },
});

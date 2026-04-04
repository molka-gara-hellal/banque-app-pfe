import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../../servives/api";

export default function SecuriteMotDePasse() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError("");
    if (!current || !newPass || !confirm) { setError("Veuillez remplir tous les champs"); return; }
    if (newPass !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    if (newPass.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return; }
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword: current, newPassword: newPass });
      setSuccess(true);
      setCurrent(""); setNewPass(""); setConfirm("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors du changement de mot de passe");
    } finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Sécurité & Mot de passe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
        {success && <View style={s.successBox}><Text style={s.successText}>✅ Mot de passe modifié avec succès</Text></View>}

        <Text style={s.sectionTitle}>Changer le mot de passe</Text>
        <View style={s.card}>
          {[
            { label: "Mot de passe actuel", value: current, setter: setCurrent, show: showCurrent, setShow: setShowCurrent },
            { label: "Nouveau mot de passe", value: newPass, setter: setNewPass, show: showNew, setShow: setShowNew },
            { label: "Confirmer le mot de passe", value: confirm, setter: setConfirm, show: showConfirm, setShow: setShowConfirm },
          ].map((f, i) => (
            <View key={i}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.field}>
                <Text style={s.label}>{f.label}</Text>
                <View style={s.pwRow}>
                  <TextInput style={s.pwInput} value={f.value} onChangeText={f.setter} secureTextEntry={!f.show} placeholderTextColor="#aaa" />
                  <TouchableOpacity onPress={() => f.setShow(!f.show)}>
                    <Text style={s.eye}>{f.show ? "👁️" : "👁️‍🗨️"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Authentification à deux facteurs</Text>
        <View style={s.card}>
          <View style={s.twoFARow}>
            <View style={{ flex: 1 }}>
              <Text style={s.twoFATitle}>Activer 2FA</Text>
              <Text style={s.twoFASub}>Protection supplémentaire de votre compte</Text>
            </View>
            <Switch
              value={twoFA}
              onValueChange={setTwoFA}
              trackColor={{ false: "#ccc", true: "#34C759" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity style={[s.saveBtn, loading && s.btnDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Enregistrer les modifications</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  content: { padding: 20 },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  successBox: { backgroundColor: "#dcfce7", borderRadius: 10, padding: 12, marginBottom: 16 },
  successText: { color: "#16a34a", fontSize: 14, textAlign: "center", fontWeight: "600" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#1a3c6e", marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: "500" },
  pwRow: { flexDirection: "row", alignItems: "center" },
  pwInput: { flex: 1, fontSize: 15, color: "#1a1a2e", paddingVertical: 4 },
  eye: { fontSize: 18, paddingLeft: 8 },
  divider: { height: 1, backgroundColor: "#F2F4F8" },
  twoFARow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  twoFATitle: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  twoFASub: { fontSize: 12, color: "#888", marginTop: 2 },
  saveBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

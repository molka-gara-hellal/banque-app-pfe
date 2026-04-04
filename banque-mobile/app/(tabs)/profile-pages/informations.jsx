import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../../servives/api";
import { getUser } from "../../../store/authStore";

export default function InformationsPersonnelles() {
  const router = useRouter();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getUser().then(u => {
      if (u) {
        setPrenom(u.prenom || "");
        setNom(u.nom || "");
        setEmail(u.email || "");
        setTelephone(u.telephone || "");
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/auth/profile", { prenom, nom, telephone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.log(e?.response?.data);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

  return (
    <View style={s.root}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Informations personnelles</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {success && (
          <View style={s.successBox}>
            <Text style={s.successText}>✅ Modifications enregistrées</Text>
          </View>
        )}

        <View style={s.card}>
          <View style={s.field}>
            <Text style={s.label}>Prénom</Text>
            <TextInput style={s.input} value={prenom} onChangeText={setPrenom} placeholderTextColor="#aaa" />
          </View>
          <View style={s.divider} />
          <View style={s.field}>
            <Text style={s.label}>Nom</Text>
            <TextInput style={s.input} value={nom} onChangeText={setNom} placeholderTextColor="#aaa" />
          </View>
          <View style={s.divider} />
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput style={[s.input, s.inputDisabled]} value={email} editable={false} />
          </View>
          <View style={s.divider} />
          <View style={s.field}>
            <Text style={s.label}>Téléphone</Text>
            <TextInput style={s.input} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholderTextColor="#aaa" />
          </View>
        </View>

        <TouchableOpacity style={[s.saveBtn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Enregistrer les modifications</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  content: { padding: 20 },
  successBox: { backgroundColor: "#dcfce7", borderRadius: 10, padding: 12, marginBottom: 16 },
  successText: { color: "#16a34a", fontSize: 14, textAlign: "center", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontSize: 12, color: "#888", marginBottom: 4, fontWeight: "500" },
  input: { fontSize: 15, color: "#1a1a2e", fontWeight: "500", paddingVertical: 4 },
  inputDisabled: { color: "#aaa" },
  divider: { height: 1, backgroundColor: "#F2F4F8" },
  saveBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

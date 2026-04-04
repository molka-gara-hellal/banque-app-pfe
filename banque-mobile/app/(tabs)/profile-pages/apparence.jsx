import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const THEMES = [
  { key: "light", label: "Clair", icon: "☀️" },
  { key: "dark", label: "Sombre", icon: "🌙" },
  { key: "auto", label: "Automatique", icon: "⚡" },
];
const FONT_SIZES = ["Petit", "Moyen", "Grand"];

export default function ApparenceSettings() {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("Moyen");

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Apparence</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel}>Thème</Text>
        <View style={s.themeRow}>
          {THEMES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.themeCard, theme === t.key && s.themeCardActive]}
              onPress={() => setTheme(t.key)}
            >
              <Text style={s.themeIcon}>{t.icon}</Text>
              <Text style={[s.themeLabel, theme === t.key && s.themeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>Taille du texte</Text>
        <View style={s.card}>
          {FONT_SIZES.map((f, i) => (
            <View key={f}>
              {i > 0 && <View style={s.divider} />}
              <TouchableOpacity style={s.row} onPress={() => setFontSize(f)}>
                <Text style={s.rowLabel}>{f}</Text>
                <View style={[s.radio, fontSize === f && s.radioActive]}>
                  {fontSize === f && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.saveBtn}><Text style={s.saveBtnText}>Appliquer</Text></TouchableOpacity>
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
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  themeRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  themeCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  themeCardActive: { borderColor: "#1a3c6e", backgroundColor: "#EBF5FF" },
  themeIcon: { fontSize: 28, marginBottom: 8 },
  themeLabel: { fontSize: 13, fontWeight: "600", color: "#555" },
  themeLabelActive: { color: "#1a3c6e" },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#ccc", justifyContent: "center", alignItems: "center" },
  radioActive: { borderColor: "#1a3c6e" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1a3c6e" },
  divider: { height: 1, backgroundColor: "#F2F4F8" },
  saveBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

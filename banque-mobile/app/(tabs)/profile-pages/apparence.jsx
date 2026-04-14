import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../../i18n/LanguageContext";

export default function ApparenceSettings() {
  const router = useRouter();
  const { t, langue } = useLanguage();
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");

  const THEMES = [
    { key: "light",  label: t("appearance.light"),  icon: "☀️" },
    { key: "dark",   label: t("appearance.dark"),   icon: "🌙" },
    { key: "system", label: t("appearance.system"), icon: "⚡" },
  ];

  const FONT_SIZES = [
    { key: "small",  label: { fr: "Petit",  ar: "صغير",  en: "Small"  } },
    { key: "medium", label: { fr: "Moyen",  ar: "متوسط", en: "Medium" } },
    { key: "large",  label: { fr: "Grand",  ar: "كبير",  en: "Large"  } },
  ];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("appearance.title")}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel}>{t("appearance.chooseTheme")}</Text>
        <View style={s.themeRow}>
          {THEMES.map(th => (
            <TouchableOpacity
              key={th.key}
              style={[s.themeCard, theme === th.key && s.themeCardActive]}
              onPress={() => setTheme(th.key)}
            >
              <Text style={s.themeIcon}>{th.icon}</Text>
              <Text style={[s.themeLabel, theme === th.key && s.themeLabelActive]}>{th.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.card}>
          {FONT_SIZES.map((f, i) => (
              <View key={f.key}>
                {i > 0 && <View style={s.divider} />}
                <TouchableOpacity style={s.row} onPress={() => setFontSize(f.key)}>
                  <Text style={s.rowLabel}>{f.label[langue] || f.label.fr}</Text>
                  <View style={[s.radio, fontSize === f.key && s.radioActive]}>
                    {fontSize === f.key && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              </View>
          ))}
        </View>

        <TouchableOpacity style={s.saveBtn}>
          <Text style={s.saveBtnText}>{t("appearance.apply")}</Text>
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

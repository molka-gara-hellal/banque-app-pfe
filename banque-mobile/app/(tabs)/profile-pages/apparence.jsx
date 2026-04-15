import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useTheme } from "../../../i18n/ThemeContext";

export default function ApparenceSettings() {
  const router = useRouter();
  const { t, langue } = useLanguage();
  const { theme, themeKey, setThemeKey, fontSize, setFontSize, fs } = useTheme();

  const [localTheme, setLocalTheme] = useState(themeKey);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [saved, setSaved] = useState(false);

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

  const handleApply = async () => {
    await setThemeKey(localTheme);
    await setFontSize(localFontSize);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Styles dynamiques selon le thème actuel
  const d = theme;

  return (
    <View style={[s.root, { backgroundColor: d.bg }]}>
      <View style={[s.header, { backgroundColor: d.header, borderBottomColor: d.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backArrow, { color: d.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: d.primary, fontSize: fs(16) }]}>
          {t("appearance.title")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={[s.sectionLabel, { color: d.textMuted, fontSize: fs(12) }]}>
          {t("appearance.chooseTheme")}
        </Text>

        <View style={s.themeRow}>
          {THEMES.map(th => (
            <TouchableOpacity
              key={th.key}
              style={[
                s.themeCard,
                { backgroundColor: d.card, borderColor: "transparent" },
                localTheme === th.key && { borderColor: d.primary, backgroundColor: d.primaryLight },
              ]}
              onPress={() => setLocalTheme(th.key)}
            >
              <Text style={s.themeIcon}>{th.icon}</Text>
              <Text style={[
                s.themeLabel,
                { color: d.textMuted, fontSize: fs(13) },
                localTheme === th.key && { color: d.primary },
              ]}>
                {th.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectionLabel, { color: d.textMuted, fontSize: fs(12) }]}>
          {t("appearance.textSize")}
        </Text>

        <View style={[s.card, { backgroundColor: d.card }]}>
          {FONT_SIZES.map((f, i) => (
            <View key={f.key}>
              {i > 0 && <View style={[s.divider, { backgroundColor: d.divider }]} />}
              <TouchableOpacity style={s.row} onPress={() => setLocalFontSize(f.key)}>
                <Text style={[s.rowLabel, { color: d.text, fontSize: fs(15) }]}>
                  {f.label[langue] || f.label.fr}
                </Text>
                <View style={[s.radio, { borderColor: localFontSize === f.key ? d.primary : "#ccc" }]}>
                  {localFontSize === f.key && (
                    <View style={[s.radioDot, { backgroundColor: d.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {saved && (
          <View style={[s.successBox, { backgroundColor: d.success }]}>
            <Text style={[s.successText, { color: d.successText, fontSize: fs(14) }]}>
              ✅ Préférences enregistrées
            </Text>
          </View>
        )}

        <TouchableOpacity style={[s.saveBtn, { backgroundColor: d.primary }]} onPress={handleApply}>
          <Text style={[s.saveBtnText, { fontSize: fs(15) }]}>
            {t("appearance.apply")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24 },
  title: { fontWeight: "700" },
  content: { padding: 20 },
  sectionLabel: {
    fontWeight: "700", marginBottom: 12,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  themeRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  themeCard: {
    flex: 1, borderRadius: 14, padding: 16,
    alignItems: "center", borderWidth: 2,
  },
  themeIcon: { fontSize: 28, marginBottom: 8 },
  themeLabel: { fontWeight: "600" },
  card: {
    borderRadius: 16, overflow: "hidden", marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  rowLabel: { flex: 1, fontWeight: "600" },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    justifyContent: "center", alignItems: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  divider: { height: 1 },
  saveBtn: { borderRadius: 12, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  successBox: { borderRadius: 12, padding: 14, marginBottom: 12, alignItems: "center" },
  successText: { fontWeight: "600" },
});
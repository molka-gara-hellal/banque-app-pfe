import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../../i18n/LanguageContext";

const LANGUES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇹🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function LangueSettings() {
  const router = useRouter();
  const { langue, setLangue, t } = useLanguage();
  const [selected, setSelected] = useState(langue);

  const handleApply = async () => {
    await setLangue(selected);
    router.back();
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("language.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel}>{t("language.chooseLanguage")}</Text>

        <View style={s.card}>
          {LANGUES.map((l, i) => (
            <View key={l.code}>
              {i > 0 && <View style={s.divider} />}
              <TouchableOpacity style={s.row} onPress={() => setSelected(l.code)}>
                <Text style={s.flag}>{l.flag}</Text>
                <Text style={s.langLabel}>{l.label}</Text>
                <View style={[s.radio, selected === l.code && s.radioActive]}>
                  {selected === l.code && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleApply}>
          <Text style={s.saveBtnText}>{t("apply")}</Text>
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
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  flag: { fontSize: 24 },
  langLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#ccc", justifyContent: "center", alignItems: "center" },
  radioActive: { borderColor: "#1a3c6e" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1a3c6e" },
  divider: { height: 1, backgroundColor: "#F2F4F8" },
  saveBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

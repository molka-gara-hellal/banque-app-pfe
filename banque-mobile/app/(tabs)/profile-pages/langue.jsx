import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../../../i18n/LanguageContext";

const LANGUES = [
  { code: "fr", label: "Français",  flag: "🇫🇷", native: "Français" },
  { code: "ar", label: "العربية",   flag: "🇹🇳", native: "العربية" },
  { code: "en", label: "English",   flag: "🇬🇧", native: "English" },
];

export default function LangueSettings() {
  const router = useRouter();
  const { langue, setLangue, t } = useLanguage();
  const [selected, setSelected] = useState(langue);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (selected === langue) {
      router.back();
      return;
    }
    // ✅ setLangue incrémente langVersion → root layout re-monte tout avec la nouvelle langue
    await setLangue(selected);
    setApplied(true);
    // Petit délai pour montrer le feedback avant de retourner
    setTimeout(() => router.back(), 800);
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("profile.language") || "Langue"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel}>
          {t("appearance.chooseTheme") ? "Choisir la langue" : "CHOISIR LA LANGUE DE L'APPLICATION"}
        </Text>

        <View style={s.card}>
          {LANGUES.map((l, i) => (
            <View key={l.code}>
              {i > 0 && <View style={s.divider} />}
              <TouchableOpacity
                style={s.row}
                onPress={() => setSelected(l.code)}
              >
                <Text style={s.flag}>{l.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.langLabel}>{l.label}</Text>
                  {l.native !== l.label && (
                    <Text style={s.langNative}>{l.native}</Text>
                  )}
                </View>
                {langue === l.code && (
                  <View style={s.currentBadge}>
                    <Text style={s.currentText}>Actuelle</Text>
                  </View>
                )}
                <View style={[s.radio, selected === l.code && s.radioActive]}>
                  {selected === l.code && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {applied ? (
          <View style={s.successBox}>
            <Text style={s.successText}>✅ Langue appliquée à toute l application</Text>
          </View>
        ) : null}

        <TouchableOpacity style={s.saveBtn} onPress={handleApply}>
          <Text style={s.saveBtnText}>
            {applied ? "✅ Appliquée !" : "Appliquer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#eef0f5",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  content: { padding: 20 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 12,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  flag: { fontSize: 28 },
  langLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a2e" },
  langNative: { fontSize: 12, color: "#888", marginTop: 2 },
  currentBadge: {
    backgroundColor: "#EBF5FF", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginRight: 8,
  },
  currentText: { color: "#1a3c6e", fontSize: 11, fontWeight: "700" },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: "#ccc", justifyContent: "center", alignItems: "center",
  },
  radioActive: { borderColor: "#1a3c6e" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1a3c6e" },
  divider: { height: 1, backgroundColor: "#F2F4F8" },
  successBox: {
    backgroundColor: "#dcfce7", borderRadius: 12,
    padding: 14, marginBottom: 12, alignItems: "center",
  },
  successText: { color: "#16a34a", fontWeight: "600", fontSize: 14 },
  saveBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
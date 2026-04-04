import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

const NOTIF_SETTINGS = [
  { key: "transactions", label: "Transactions", desc: "Alertes pour chaque transaction" },
  { key: "virements", label: "Virements", desc: "Confirmation de virements" },
  { key: "rdv", label: "Rendez-vous", desc: "Rappels de rendez-vous" },
  { key: "promo", label: "Offres & Promotions", desc: "Nouvelles offres Wifak Bank" },
  { key: "securite", label: "Sécurité", desc: "Alertes de connexion inhabituelle" },
];

export default function NotificationsSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState({ transactions: true, virements: true, rdv: true, promo: false, securite: true });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          {NOTIF_SETTINGS.map((n, i) => (
            <View key={n.key}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{n.label}</Text>
                  <Text style={s.rowDesc}>{n.desc}</Text>
                </View>
                <Switch
                  value={settings[n.key]}
                  onValueChange={v => setSettings(prev => ({ ...prev, [n.key]: v }))}
                  trackColor={{ false: "#ccc", true: "#34C759" }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.saveBtn}><Text style={s.saveBtnText}>Enregistrer les préférences</Text></TouchableOpacity>
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
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  rowDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F2F4F8" },
  saveBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DEVICES = [
  { id: 1, name: "iPhone 14 Pro", location: "Tunis, Tunisie", lastActive: "Maintenant", current: true },
  { id: 2, name: "MacBook Pro", location: "Tunis, Tunisie", lastActive: "Il y a 2 jours", current: false },
  { id: 3, name: "iPad Air", location: "Sousse, Tunisie", lastActive: "Il y a 1 semaine", current: false },
];

export default function AppareilsConnectes() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Appareils connectés</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {DEVICES.map(d => (
          <View key={d.id} style={s.card}>
            <View style={s.deviceIcon}><Text style={{ fontSize: 24 }}>{d.current ? "📱" : "💻"}</Text></View>
            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.deviceName}>{d.name}</Text>
                {d.current && <View style={s.currentBadge}><Text style={s.currentText}>Actuel</Text></View>}
              </View>
              <Text style={s.deviceInfo}>📍 {d.location}</Text>
              <Text style={s.deviceInfo}>🕐 {d.lastActive}</Text>
            </View>
            {!d.current && (
              <TouchableOpacity><Text style={s.disconnectBtn}>Déconnecter</Text></TouchableOpacity>
            )}
          </View>
        ))}
        <View style={s.warningBox}>
          <Text style={s.warningText}>⚠️ Si vous ne reconnaissez pas un appareil, déconnectez-le immédiatement et changez votre mot de passe.</Text>
        </View>
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
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  deviceIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#EBF5FF", justifyContent: "center", alignItems: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  deviceName: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  currentBadge: { backgroundColor: "#34C759", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  currentText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  deviceInfo: { fontSize: 12, color: "#888", marginTop: 2 },
  disconnectBtn: { color: "#FF3B30", fontSize: 12, fontWeight: "700" },
  warningBox: { backgroundColor: "#fff8e1", borderWidth: 1, borderColor: "#fbbf24", borderRadius: 14, padding: 14, marginTop: 8 },
  warningText: { fontSize: 13, color: "#92400e", lineHeight: 20 },
});

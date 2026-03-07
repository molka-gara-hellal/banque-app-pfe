import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getUser, removeToken } from "../../store/authStore";

const MENU_ITEMS = [
  { section: "Mon compte", items: [
    { icon: "👤", label: "Informations personnelles" },
    { icon: "🔒", label: "Sécurité & Mot de passe" },
    { icon: "📱", label: "Appareils connectés" },
  ]},
  { section: "Préférences", items: [
    { icon: "🔔", label: "Notifications" },
    { icon: "🌍", label: "Langue" },
    { icon: "🎨", label: "Apparence" },
  ]},
  { section: "Support", items: [
    { icon: "❓", label: "Aide & FAQ" },
    { icon: "📞", label: "Contacter le support" },
    { icon: "📄", label: "Conditions d'utilisation" },
  ]},
];

export default function ProfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then(u => { setUser(u); setLoading(false); });
  }, []);

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;
  }

  const prenom = user?.prenom || user?.nom || "Client";
  const email = user?.email || "";
  const initiale = prenom.charAt(0).toUpperCase();
  const role = user?.role === "admin" ? "Administrateur" : "Client Premium";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* CARTE PROFIL */}
      <View style={styles.profileCard}>
        <View style={styles.cardCircle} />
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{initiale}</Text>
        </View>
        <Text style={styles.profileName}>{prenom}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>12</Text>
            <Text style={styles.statLbl}>Transactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>3</Text>
            <Text style={styles.statLbl}>RDV</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>2</Text>
            <Text style={styles.statLbl}>Comptes</Text>
          </View>
        </View>
      </View>

      {/* MENU */}
      {MENU_ITEMS.map((section, si) => (
        <View key={si} style={{ marginBottom: 8 }}>
          <Text style={styles.sectionLabel}>{section.section}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, ii) => (
              <View key={ii}>
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.menuIconBox}>
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
                {ii < section.items.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* BOUTON DÉCONNEXION */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>⏻</Text>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Wifak Bank v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8", paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { marginTop: 16, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a2e" },

  profileCard: { backgroundColor: "#1a3c6e", borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 24, overflow: "hidden", shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  cardCircle: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)", top: -80, right: -50 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 12, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  profileName: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  profileEmail: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 10 },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 20 },
  roleText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  statsRow: { flexDirection: "row", width: "100%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  statLbl: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#999", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginLeft: 4 },
  menuCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 8 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#F2F4F8", justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 14, color: "#1a1a2e", fontWeight: "500" },
  menuArrow: { fontSize: 20, color: "#ccc" },
  menuDivider: { height: 1, backgroundColor: "#F2F4F8", marginLeft: 66 },

  logoutBtn: { backgroundColor: "#fff", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: "#fee2e2" },
  logoutIcon: { fontSize: 18, color: "#dc2626" },
  logoutText: { color: "#dc2626", fontSize: 15, fontWeight: "700" },

  version: { textAlign: "center", color: "#bbb", fontSize: 12, marginBottom: 8 },
});

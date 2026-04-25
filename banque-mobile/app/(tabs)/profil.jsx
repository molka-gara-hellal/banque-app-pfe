import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUser, removeToken } from "../../store/authStore";

export default function ProfilScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const MENU = [
    { title: t("profile.myAccount"), items: [
      { icon: "👤", label: t("profile.personalInfo"), route: "/(tabs)/profile-pages/informations" },
      { icon: "🔒", label: t("profile.security"),     route: "/(tabs)/profile-pages/securite" },
      { icon: "📱", label: t("profile.devices"),      route: "/(tabs)/profile-pages/appareils" },
    ]},
    { title: t("profile.preferences"), items: [
      { icon: "🏦", label: "Mes comptes", route: "/(tabs)/mes-comptes" },
      { icon: "🔔", label: t("profile.notifications"), route: "/(tabs)/profile-pages/notifications" },
      { icon: "🌍", label: t("profile.language"),      route: "/(tabs)/profile-pages/langue" },
      { icon: "🎨", label: t("profile.appearance"),    route: "/(tabs)/profile-pages/apparence" },
    ]},
    { title: t("profile.support"), items: [
      { icon: "❓", label: t("profile.faq"),           route: "/(tabs)/profile-pages/faq" },
      { icon: "📞", label: t("profile.contactSupport"), route: "/(tabs)/profile-pages/support" },
      { icon: "💬", label: "Mes messages", route: "/(tabs)/mes-messages" },
      { icon: "📄", label: t("profile.terms"),         route: "/(tabs)/profile-pages/conditions" },
    ]},
  ];

  useEffect(() => {
    getUser().then(u => { setUser(u); setLoading(false); });
  }, []);

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

  const prenom = user?.prenom || user?.nom || user?.email?.split("@")[0] || "Client";
  const nom    = user?.nom || "";
  const fullName = [prenom, nom].filter(Boolean).join(" ");
  const email  = user?.email || "";
  const initiale = prenom.charAt(0).toUpperCase();

  return (
    <View style={s.root}>
      <View style={s.headerWhite}>
        <View style={s.headerLeft}>
          <Image source={require("../../assets/images/wifak-logo.png")} style={s.headerLogo} />
          <Text style={s.headerBrand}>{t("appName")}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.profileSection}>
          <View style={s.avatarLarge}><Text style={s.avatarText}>{initiale}</Text></View>
          <Text style={s.profileName}>{fullName}</Text>
          <Text style={s.profileEmail}>{email}</Text>
          <View style={s.premiumBadge}>
            <Text style={s.premiumText}>{t("profile.premiumClient")}</Text>
          </View>
        </View>

        <View style={s.menuContainer}>
          {MENU.map((section, si) => (
            <View key={si} style={s.menuSection}>
              <Text style={s.menuSectionTitle}>{section.title}</Text>
              <View style={s.menuCard}>
                {section.items.map((item, ii) => (
                  <View key={ii}>
                    <TouchableOpacity
                      style={s.menuRow}
                      onPress={() => router.push(item.route)}
                    >
                      <Text style={s.menuIcon}>{item.icon}</Text>
                      <Text style={s.menuLabel}>{item.label}</Text>
                      <Text style={s.menuArrow}>›</Text>
                    </TouchableOpacity>
                    {ii < section.items.length - 1 && <View style={s.menuDivider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutIcon}>⏻</Text>
            <Text style={s.logoutText}>{t("logout")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerWhite: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 40, height: 40, resizeMode: "contain" },
  headerBrand: { fontSize: 18, fontWeight: "bold", color: "#1a3c6e" },
  profileSection: { backgroundColor: "#1a3c6e", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingVertical: 32, alignItems: "center", marginBottom: 20 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 4, borderColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  profileName: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  profileEmail: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 12 },
  premiumBadge: { backgroundColor: "#f59e0b", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  premiumText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  menuContainer: { paddingHorizontal: 20 },
  menuSection: { marginBottom: 20 },
  menuSectionTitle: { fontSize: 12, color: "#888", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 },
  menuCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  menuArrow: { fontSize: 20, color: "#ccc" },
  menuDivider: { height: 1, backgroundColor: "#F2F4F8", marginLeft: 50 },
  logoutBtn: { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8, borderWidth: 1, borderColor: "#fee2e2" },
  logoutIcon: { fontSize: 18, color: "#FF3B30" },
  logoutText: { color: "#FF3B30", fontSize: 15, fontWeight: "700" },
});
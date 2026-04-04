import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { getUser, removeToken } from "../../store/authStore";

const CATEGORY_CONFIG = {
  Achats:       { icon: "🛍️", bg: "#FFF0F0" },
  Alimentation: { icon: "🍔", bg: "#FFF5E6" },
  Facture:      { icon: "📄", bg: "#F0EFFF" },
  Virement:     { icon: "↗",  bg: "#EDFFF2" },
  Retrait:      { icon: "💶", bg: "#EBF5FF" },
  default:      { icon: "💳", bg: "#F5F5F5" },
};
const getCat = (label = "") => {
  for (const key of Object.keys(CATEGORY_CONFIG)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return CATEGORY_CONFIG[key];
  }
  return CATEGORY_CONFIG.default;
};
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser]               = useState(null);
  const [account, setAccount]         = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const u = await getUser();
      setUser(u);
      const [accRes, txRes] = await Promise.all([
        api.get("/accounts/me"),
        api.get("/transactions").catch(() => ({ data: [] })),
      ]);
      setAccount(accRes.data);
      setTransactions(txRes.data?.slice(0, 5) || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

  const prenom = user?.prenom || user?.nom || user?.email?.split("@")[0] || "Client";
  const nom = user?.nom || "";
  const fullName = [prenom, nom].filter(Boolean).join(" ");
  const initiale = prenom.charAt(0).toUpperCase();
  const balance = parseFloat(account?.balance ?? 0);
  const accountNum = account?.iban || account?.account_number || "0000000000";
  const revenus = transactions.filter(t => parseFloat(t.amount) > 0).reduce((s, t) => s + parseFloat(t.amount), 0);
  const depenses = transactions.filter(t => parseFloat(t.amount) < 0).reduce((s, t) => s + parseFloat(t.amount), 0);

  const quickActions = [
    { icon: "↗", label: "Virement",    onPress: () => router.push("/(tabs)/virement") },
    { icon: "🕐", label: "Historique", onPress: () => router.push("/(tabs)/transactions") },
    { icon: "📅", label: "Rendez-vous",onPress: () => router.push("/(tabs)/rdv") },
    { icon: "💬", label: "Assistant",  onPress: () => router.push("/(tabs)/assistant") },
  ];

  return (
    <View style={s.root}>
      {/* ── HEADER BLANC ── */}
      <View style={s.headerWhite}>
        <View style={s.headerLeft}>
          <Image source={require("../../assets/images/wifak-logo.png")} style={s.headerLogo} />
          <Text style={s.headerBrand}>Wifak Bank</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setShowNotifs(true)}>
            <Text style={s.iconBtnText}>🔔</Text>
            <View style={s.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => setShowSettings(true)}>
            <Text style={s.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SECTION UTILISATEUR ── */}
      <View style={s.userSection}>
        <View style={s.avatar}><Text style={s.avatarText}>{initiale}</Text></View>
        <View>
          <Text style={s.greetSmall}>Bonjour,</Text>
          <Text style={s.greetName}>{fullName}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* ── CARTE BANCAIRE ── */}
        <View style={s.card}>
          <View style={s.cardCircle1} /><View style={s.cardCircle2} />
          <View style={s.cardTopRow}>
            <Text style={s.cardType}>{(account?.account_type || "COMPTE COURANT").toUpperCase()}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>◎</Text>
          </View>
          <Text style={s.cardNum}>**** **** **** {accountNum.slice(-4)}</Text>
          <Text style={s.cardBalLabel}>SOLDE DISPONIBLE</Text>
          <Text style={s.cardBal}>
            {balance.toLocaleString("fr-TN", { minimumFractionDigits: 2 })}
            <Text style={s.cardCur}> TND</Text>
          </Text>
          <View style={s.cardBottom}>
            <Text style={s.cardIban}>TN59 ******* ******* {accountNum.slice(-4)}</Text>
            <Text style={s.cardExpire}>EXPIRE 12/28</Text>
          </View>
        </View>

        {/* ── ACTIONS RAPIDES ── */}
        <View style={s.actionsRow}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={s.actionBtn} onPress={a.onPress}>
              <View style={s.actionCircle}><Text style={{ fontSize: 20 }}>{a.icon}</Text></View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── RÉSUMÉ FINANCIER ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Résumé Financier</Text>
          <TouchableOpacity><Text style={s.sectionLink}>Détails</Text></TouchableOpacity>
        </View>
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { marginRight: 6 }]}>
            <Text style={s.summaryLabel}>Revenus</Text>
            <Text style={[s.summaryAmt, { color: "#34C759" }]}>+{revenus.toLocaleString("fr-TN", { minimumFractionDigits: 2 })} TND</Text>
            <Text style={[s.summaryTrend, { color: "#34C759" }]}>↗ 12% ce mois</Text>
            <View style={s.miniBarRow}>
              {[40,55,45,60,70].map((h,i) => (
                <View key={i} style={[s.miniBar, { height: h * 0.32, backgroundColor: i===4 ? "#34C759" : "#e5e7eb" }]} />
              ))}
            </View>
          </View>
          <View style={[s.summaryCard, { marginLeft: 6 }]}>
            <Text style={s.summaryLabel}>Dépenses</Text>
            <Text style={[s.summaryAmt, { color: "#FF3B30" }]}>{depenses.toLocaleString("fr-TN", { minimumFractionDigits: 2 })} TND</Text>
            <Text style={[s.summaryTrend, { color: "#FF3B30" }]}>↘ 8% vs hier</Text>
            <View style={s.miniBarRow}>
              {[50,70,45,85,60].map((h,i) => (
                <View key={i} style={[s.miniBar, { height: h * 0.32, backgroundColor: i===3 ? "#FF3B30" : "#e5e7eb" }]} />
              ))}
            </View>
          </View>
        </View>

        {/* ── TRANSACTIONS RÉCENTES ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Transactions Récentes</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={s.sectionLink}>Tout voir</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <View style={s.emptyBox}><Text style={s.emptyText}>Aucune transaction récente</Text></View>
        ) : transactions.map((tx, i) => {
          const label = tx.label || tx.description || tx.type || "Transaction";
          const cat = getCat(label);
          const amt = parseFloat(tx.amount);
          return (
            <View key={tx.id || i} style={s.txRow}>
              <View style={[s.txIcon, { backgroundColor: cat.bg }]}>
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
              </View>
              <View style={s.txInfo}>
                <Text style={s.txLabel}>{label}</Text>
                <Text style={s.txCat}>{tx.description || label}</Text>
                <Text style={s.txDate}>{fmtDate(tx.created_at || tx.date)}</Text>
              </View>
              <Text style={[s.txAmt, { color: amt >= 0 ? "#34C759" : "#FF3B30" }]}>
                {amt >= 0 ? "+" : ""}{amt.toFixed(2)} TND
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* ── MODAL NOTIFICATIONS ── */}
      <Modal transparent visible={showNotifs} animationType="fade" onRequestClose={() => setShowNotifs(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowNotifs(false)}>
          <View style={s.notifPanel}>
            <View style={s.panelHeader}>
              <Text style={s.panelTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifs(false)}><Text style={s.panelClose}>✕</Text></TouchableOpacity>
            </View>
            {[
              { icon: "✅", text: "Virement de 100 TND effectué avec succès", time: "Il y a 2h", bg: "#EDFFF2" },
              { icon: "🔔", text: "Votre rendez-vous est confirmé pour demain", time: "Il y a 5h", bg: "#EBF5FF" },
              { icon: "⚠️", text: "Dépenses élevées ce mois (+18%)", time: "Hier", bg: "#FFF5E6" },
            ].map((n, i) => (
              <View key={i} style={[s.notifItem, { backgroundColor: n.bg }]}>
                <Text style={{ fontSize: 22 }}>{n.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.notifText}>{n.text}</Text>
                  <Text style={s.notifTime}>{n.time}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.notifClear} onPress={() => setShowNotifs(false)}>
              <Text style={s.notifClearText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL SETTINGS ── */}
      <Modal transparent visible={showSettings} animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={s.settingsMenu}>
            {[
              { icon: "👤", label: "Mon Profil",   onPress: () => { setShowSettings(false); router.push("/(tabs)/profil"); } },
              { icon: "💳", label: "Mes Comptes",  onPress: () => { setShowSettings(false); router.push("/(tabs)/comptes"); } },
              { icon: "⏻",  label: "Déconnexion", onPress: () => { setShowSettings(false); handleLogout(); }, red: true },
            ].map((item, i, arr) => (
              <View key={i}>
                <TouchableOpacity style={s.settingsItem} onPress={item.onPress}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  <Text style={[s.settingsLabel, item.red && { color: "#FF3B30" }]}>{item.label}</Text>
                  <Text style={s.settingsArrow}>›</Text>
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={s.settingsDivider} />}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // HEADER
  headerWhite: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 40, height: 40, resizeMode: "contain" },
  headerBrand: { fontSize: 18, fontWeight: "bold", color: "#1a3c6e" },
  headerRight: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F2F4F8", justifyContent: "center", alignItems: "center" },
  iconBtnText: { fontSize: 18 },
  notifDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", borderWidth: 1.5, borderColor: "#fff" },

  // USER SECTION
  userSection: { flexDirection: "row", alignItems: "center", backgroundColor: "#F2F4F8", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a3c6e", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  greetSmall: { fontSize: 12, color: "#888" },
  greetName: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },

  // CARD
  card: { backgroundColor: "#1a3c6e", borderRadius: 24, padding: 24, marginTop: 4, marginBottom: 28, overflow: "hidden", shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  cardCircle1: { position: "absolute", width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,255,255,0.1)", top: -40, right: -30 },
  cardCircle2: { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.1)", bottom: -30, left: -20 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  cardType: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600", letterSpacing: 1.5 },
  cardNum: { color: "rgba(255,255,255,0.6)", fontSize: 13, letterSpacing: 2, marginBottom: 8 },
  cardBalLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600", letterSpacing: 1.2, marginBottom: 4 },
  cardBal: { color: "#fff", fontSize: 30, fontWeight: "bold", marginBottom: 16 },
  cardCur: { fontSize: 16, fontWeight: "400", color: "rgba(255,255,255,0.8)" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardIban: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  cardExpire: { color: "rgba(255,255,255,0.5)", fontSize: 11 },

  // ACTIONS
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  actionBtn: { alignItems: "center", flex: 1 },
  actionCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  actionLabel: { fontSize: 11, color: "#555", fontWeight: "500" },

  // SUMMARY
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#1a1a2e" },
  sectionLink: { fontSize: 13, color: "#1a3c6e", fontWeight: "600" },
  summaryRow: { flexDirection: "row", marginBottom: 28 },
  summaryCard: { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  summaryLabel: { fontSize: 12, color: "#888", marginBottom: 3 },
  summaryAmt: { fontSize: 17, fontWeight: "bold", marginBottom: 2 },
  summaryTrend: { fontSize: 10, marginBottom: 8 },
  miniBarRow: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 28 },
  miniBar: { flex: 1, borderRadius: 2 },

  // TX
  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  txCat: { fontSize: 12, color: "#888" },
  txDate: { fontSize: 11, color: "#aaa", marginTop: 1 },
  txAmt: { fontSize: 14, fontWeight: "bold" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" },
  emptyText: { color: "#aaa", fontSize: 14 },

  // MODALS
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  notifPanel: { position: "absolute", top: 65, right: 16, width: 320, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F2F4F8" },
  panelTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },
  panelClose: { fontSize: 16, color: "#888" },
  notifItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: "#F2F4F8" },
  notifText: { fontSize: 13, color: "#1a1a2e", fontWeight: "500", lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#888", marginTop: 3 },
  notifClear: { padding: 14, alignItems: "center" },
  notifClearText: { fontSize: 13, color: "#1a3c6e", fontWeight: "600" },
  settingsMenu: { position: "absolute", top: 65, right: 16, width: 220, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 10 },
  settingsItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  settingsArrow: { fontSize: 20, color: "#ccc" },
  settingsDivider: { height: 1, backgroundColor: "#F2F4F8", marginLeft: 46 },
});

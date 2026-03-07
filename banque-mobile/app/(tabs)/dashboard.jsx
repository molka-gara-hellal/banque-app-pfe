import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { getUser, removeToken } from "../../store/authStore";

const formatAmount = (amount) => {
  const num = parseFloat(amount);
  return (num >= 0 ? "+" : "") + num.toLocaleString("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const CATEGORY_CONFIG = {
  Achats: { icon: "🛍️", color: "#FF6B6B", bg: "#FFF0F0" },
  Alimentation: { icon: "🍔", color: "#FF9500", bg: "#FFF5E6" },
  Facture: { icon: "📄", color: "#5856D6", bg: "#F0EFFF" },
  Virement: { icon: "↗", color: "#34C759", bg: "#EDFFF2" },
  Retrait: { icon: "💶", color: "#007AFF", bg: "#EBF5FF" },
  default: { icon: "💳", color: "#8E8E93", bg: "#F5F5F5" },
};

const getCategoryConfig = (label = "") => {
  for (const key of Object.keys(CATEGORY_CONFIG)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return CATEGORY_CONFIG[key];
  }
  return CATEGORY_CONFIG.default;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setTransactions(txRes.data?.slice(0, 4) || []);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: async () => { await removeToken(); router.replace("/(auth)/login"); } },
    ]);
  };

  const revenus = transactions.filter(t => parseFloat(t.amount) > 0).reduce((s, t) => s + parseFloat(t.amount), 0);
  const depenses = transactions.filter(t => parseFloat(t.amount) < 0).reduce((s, t) => s + parseFloat(t.amount), 0);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;
  }

  const prenom = user?.prenom || user?.nom || user?.email?.split("@")[0] || "Client";
  const initiale = prenom.charAt(0).toUpperCase();
  const accountNum = account?.account_number || account?.iban || "0000000000";
  const maskedNum = "**** **** **** " + accountNum.slice(-4);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initiale}</Text></View>
          <View>
            <Text style={styles.greetingSmall}>Bonjour,</Text>
            <Text style={styles.greetingName}>{prenom}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}><Text style={{ fontSize: 18 }}>🔔</Text></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}><Text style={{ fontSize: 18 }}>⚙️</Text></TouchableOpacity>
        </View>
      </View>

      {/* CARTE BANCAIRE */}
      <View style={styles.bankCard}>
        <View style={styles.cardCircle1} />
        <View style={styles.cardCircle2} />

        <View style={styles.cardTopRow}>
          <Text style={styles.cardType}>PREMIUM INFINITE</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 20 }}>◎</Text>
        </View>

        <Text style={styles.cardAccountNum}>{maskedNum}</Text>
        <Text style={styles.cardBalanceLabel}>SOLDE DISPONIBLE</Text>
        <Text style={styles.cardBalance}>
          {parseFloat(account?.balance ?? 0).toLocaleString("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <Text style={styles.cardCurrency}>  {account?.currency ?? "TND"}</Text>
        </Text>

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardIban}>IBAN TN59 •••• •••• {accountNum.slice(-4)}</Text>
          <View>
            <Text style={styles.cardExpireLabel}>EXPIRE</Text>
            <Text style={styles.cardExpireValue}>12/28</Text>
          </View>
        </View>
      </View>

      {/* ACTIONS RAPIDES */}
      <View style={styles.actionsRow}>
        {[
          { icon: "↗", label: "Virement", onPress: () => router.push("/(tabs)/virement") },
          { icon: "🕐", label: "Historique", onPress: () => router.push("/(tabs)/transactions") },
          { icon: "📅", label: "Rendez-vous", onPress: () => router.push("/(tabs)/rdv") },
          { icon: "💬", label: "Assistant", onPress: () => {} },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.actionBtn} onPress={item.onPress}>
            <View style={styles.actionIconCircle}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
            <Text style={styles.actionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* RÉSUMÉ FINANCIER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Résumé Financier</Text>
        <TouchableOpacity><Text style={styles.sectionLink}>Détails</Text></TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { marginRight: 8 }]}>
          <Text style={styles.summaryLabel}>Revenus</Text>
          <Text style={[styles.summaryAmount, { color: "#34C759" }]}>
            +{revenus.toLocaleString("fr-TN", { minimumFractionDigits: 2 })} <Text style={styles.summaryCurrency}>TND</Text>
          </Text>
          <Text style={[styles.summaryTrend, { color: "#34C759" }]}>↗ 12% ce mois</Text>
          <View style={styles.miniBarRow}>
            {[40, 55, 35, 65, 80].map((h, i) => (
              <View key={i} style={[styles.miniBar, { height: h * 0.4, backgroundColor: i === 4 ? "#34C759" : "#e8f5e9" }]} />
            ))}
          </View>
        </View>

        <View style={[styles.summaryCard, { marginLeft: 8 }]}>
          <Text style={styles.summaryLabel}>Dépenses</Text>
          <Text style={[styles.summaryAmount, { color: "#FF3B30" }]}>
            {depenses.toLocaleString("fr-TN", { minimumFractionDigits: 2 })} <Text style={styles.summaryCurrency}>TND</Text>
          </Text>
          <Text style={[styles.summaryTrend, { color: "#FF3B30" }]}>↘ 8% vs hier</Text>
          <View style={styles.miniBarRow}>
            {[60, 45, 70, 50, 40].map((h, i) => (
              <View key={i} style={[styles.miniBar, { height: h * 0.4, backgroundColor: i === 2 ? "#FF3B30" : "#fdecea" }]} />
            ))}
          </View>
        </View>
      </View>

      {/* TRANSACTIONS RÉCENTES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions Récentes</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
          <Text style={styles.sectionLink}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyText}>Aucune transaction récente</Text></View>
      ) : (
        transactions.map((tx, index) => {
          const label = tx.label || tx.description || tx.type || "Transaction";
          const cat = getCategoryConfig(label);
          const amount = parseFloat(tx.amount);
          return (
            <View key={tx.id || index} style={styles.txRow}>
              <View style={[styles.txIconBox, { backgroundColor: cat.bg }]}>
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{label}</Text>
                <Text style={styles.txSub}>{tx.merchant || tx.compte_destination || ""}</Text>
                <Text style={styles.txDate}>{formatDate(tx.created_at || tx.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: amount >= 0 ? "#34C759" : "#FF3B30" }]}>
                {formatAmount(amount)} TND
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8", paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F2F4F8" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a3c6e", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  greetingSmall: { fontSize: 12, color: "#888" },
  greetingName: { fontSize: 17, fontWeight: "bold", color: "#1a1a2e" },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },

  bankCard: { backgroundColor: "#1a3c6e", borderRadius: 24, padding: 24, marginBottom: 24, overflow: "hidden", shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  cardCircle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -60, right: -40 },
  cardCircle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.04)", bottom: -30, left: 20 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardType: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600", letterSpacing: 1.5 },
  cardAccountNum: { color: "rgba(255,255,255,0.6)", fontSize: 13, letterSpacing: 2, marginBottom: 12 },
  cardBalanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600", letterSpacing: 1.2, marginBottom: 4 },
  cardBalance: { color: "#fff", fontSize: 30, fontWeight: "bold", marginBottom: 16 },
  cardCurrency: { fontSize: 16, fontWeight: "400", color: "rgba(255,255,255,0.8)" },
  cardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardIban: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  cardExpireLabel: { color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 1, textAlign: "right" },
  cardExpireValue: { color: "#fff", fontSize: 13, fontWeight: "600" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  actionBtn: { alignItems: "center", flex: 1 },
  actionIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  actionLabel: { fontSize: 11, color: "#444", fontWeight: "500", textAlign: "center" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },
  sectionLink: { fontSize: 13, color: "#1a3c6e", fontWeight: "600" },

  summaryRow: { flexDirection: "row", marginBottom: 28 },
  summaryCard: { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  summaryLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  summaryAmount: { fontSize: 20, fontWeight: "bold", marginBottom: 2 },
  summaryCurrency: { fontSize: 12, fontWeight: "400" },
  summaryTrend: { fontSize: 11, marginBottom: 10 },
  miniBarRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 32 },
  miniBar: { flex: 1, borderRadius: 3, minHeight: 4 },

  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  txIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e", marginBottom: 2 },
  txSub: { fontSize: 12, color: "#888", marginBottom: 1 },
  txDate: { fontSize: 11, color: "#aaa" },
  txAmount: { fontSize: 14, fontWeight: "bold" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { color: "#aaa", fontSize: 14 },
});

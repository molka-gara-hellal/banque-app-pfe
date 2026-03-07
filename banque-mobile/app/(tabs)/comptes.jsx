import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { getUser } from "../../store/authStore";

// ── Graphe en donut SVG-like avec des arcs View ──
const DEPENSES_CATEGORIES = [
  { label: "Achats", pct: 35, color: "#1a3c6e" },
  { label: "Transport", pct: 24, color: "#4A90D9" },
  { label: "Factures", pct: 41, color: "#A8C4E0" },
];

const ALERTES = [
  { icon: "▲", color: "#FF3B30", bg: "#FFF0F0", text: "Dépenses élevées ce mois (+18%)", sub: "Votre budget achats dépasse la moyenne." },
  { icon: "✓", color: "#34C759", bg: "#EDFFF2", text: "Facture payée avec succès le 14/10", sub: "Règlement effectué avec succès le 14/10." },
  { icon: "📅", color: "#007AFF", bg: "#EBF5FF", text: "Rendez-vous votre agence demain", sub: "À 10:00 avec votre conseiller personnel." },
];

const CATEGORY_CONFIG = {
  Achats: { icon: "🛍️", color: "#FF3B30" },
  Transport: { icon: "🚗", color: "#FF9500" },
  Alimentation: { icon: "🍔", color: "#FF9500" },
  Facture: { icon: "📄", color: "#5856D6" },
  Virement: { icon: "↗", color: "#34C759" },
  default: { icon: "💳", color: "#8E8E93" },
};

const getCat = (label = "") => {
  for (const key of Object.keys(CATEGORY_CONFIG)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return CATEGORY_CONFIG[key];
  }
  return CATEGORY_CONFIG.default;
};

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export default function ComptesScreen() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("7");

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
      setTransactions(txRes.data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const filterTx = () => {
    const days = parseInt(activeTab);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter(t => new Date(t.created_at || t.date) >= cutoff).slice(0, 5);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;
  }

  const prenom = user?.prenom || user?.nom || user?.email?.split("@")[0] || "Client";
  const balance = parseFloat(account?.balance ?? 0);
  const filteredTx = filterTx();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comptes</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreDots}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* ── BIENVENUE ── */}
      <Text style={styles.welcomeText}>Bienvenue {prenom} !</Text>
      <Text style={styles.welcomeSub}>Voici l'état actuel de vos comptes.</Text>

      {/* ── CARTE SOLDE ── */}
      <View style={styles.balanceCard}>
        <View style={styles.cardCircle1} />
        <View style={styles.cardCircle2} />
        <Text style={styles.balanceCardLabel}>SOLDE TOTAL</Text>
        <Text style={styles.balanceCardAmount}>
          {balance.toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND
        </Text>
        <Text style={styles.balanceCardUpdate}>Dernière mise à jour : 10h13</Text>

        {/* Actions inline */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => router.push("/(tabs)/virement")}>
            <Text style={styles.cardActionIcon}>↑</Text>
            <Text style={styles.cardActionLabel}>Virer</Text>
          </TouchableOpacity>
          <View style={styles.cardActionDivider} />
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={styles.cardActionIcon}>≡</Text>
            <Text style={styles.cardActionLabel}>Historique</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── ANALYSE PROFIL ── */}
      <View style={styles.profilCard}>
        <View style={styles.profilLeft}>
          <Text style={styles.profilBadge}>CLIENT WIFAK</Text>
          <Text style={styles.profilTitle}>Analyse de Profil</Text>
          <Text style={styles.profilSub}>Notre algorithme vous donne accès à des top 1% préférences.</Text>
          <TouchableOpacity style={styles.profilBtn}>
            <Text style={styles.profilBtnText}>Accéder →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profilRight}>
          <View style={styles.profilIconBox}>
            <Text style={{ fontSize: 32 }}>🏆</Text>
          </View>
        </View>
      </View>

      {/* ── RÉPARTITION DÉPENSES ── */}
      <Text style={styles.sectionTitle}>Répartition des dépenses</Text>
      <View style={styles.depensesCard}>
        {/* Donut simple */}
        <View style={styles.donutContainer}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner}>
              <Text style={styles.donutPct}>100%</Text>
              <Text style={styles.donutLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Légende */}
        <View style={styles.legendContainer}>
          {DEPENSES_CATEGORIES.map((cat, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
              <Text style={styles.legendLabel}>{cat.label}</Text>
              <View style={styles.legendBarBg}>
                <View style={[styles.legendBarFill, { width: `${cat.pct}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={styles.legendPct}>{cat.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── ALERTES ── */}
      <Text style={styles.sectionTitle}>Alertes</Text>
      {ALERTES.map((a, i) => (
        <View key={i} style={[styles.alerteRow, { backgroundColor: a.bg }]}>
          <View style={[styles.alerteIconBox, { backgroundColor: a.color }]}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>{a.icon}</Text>
          </View>
          <View style={styles.alerteInfo}>
            <Text style={styles.alerteTitle}>{a.text}</Text>
            <Text style={styles.alerteSub}>{a.sub}</Text>
          </View>
        </View>
      ))}

      {/* ── TRANSACTIONS RÉCENTES ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions{"\n"}Récentes</Text>
        <View style={styles.tabsRow}>
          {["7", "30", "90"].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === "7" ? "7 JOURS" : t === "30" ? "1 MOIS" : "3 MOIS"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredTx.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyText}>Aucune transaction sur cette période</Text></View>
      ) : (
        filteredTx.map((tx, i) => {
          const label = tx.label || tx.description || tx.type || "Transaction";
          const cat = getCat(label);
          const amount = parseFloat(tx.amount);
          return (
            <View key={tx.id || i} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: cat.color + "20" }]}>
                <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{label}</Text>
                <Text style={styles.txDate}>{tx.merchant || formatDate(tx.created_at || tx.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: amount >= 0 ? "#34C759" : "#FF3B30" }]}>
                {amount >= 0 ? "+" : ""}{amount.toFixed(2)} TND
              </Text>
            </View>
          );
        })
      )}

      {/* ── BOUTON PDF ── */}
      <TouchableOpacity style={styles.pdfBtn}>
        <Text style={styles.pdfBtnIcon}>⬇</Text>
        <Text style={styles.pdfBtnText}>Télécharger Reçu PDF</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8", paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // HEADER
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  backArrow: { fontSize: 20, color: "#1a3c6e" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e" },
  moreBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2 },
  moreDots: { fontSize: 16, color: "#1a3c6e", letterSpacing: 1 },

  // BIENVENUE
  welcomeText: { fontSize: 22, fontWeight: "bold", color: "#1a1a2e", marginBottom: 4 },
  welcomeSub: { fontSize: 13, color: "#888", marginBottom: 20 },

  // CARTE SOLDE
  balanceCard: { backgroundColor: "#1a3c6e", borderRadius: 24, padding: 24, marginBottom: 20, overflow: "hidden", shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  cardCircle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)", top: -80, right: -50 },
  cardCircle2: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.04)", bottom: -40, left: 10 },
  balanceCardLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  balanceCardAmount: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 4 },
  balanceCardUpdate: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 20 },
  cardActions: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden" },
  cardActionBtn: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  cardActionDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  cardActionIcon: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  cardActionLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },

  // PROFIL
  profilCard: { backgroundColor: "#EBF5FF", borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: "#cce0f5" },
  profilLeft: { flex: 1 },
  profilBadge: { fontSize: 10, fontWeight: "700", color: "#1a3c6e", letterSpacing: 1, marginBottom: 4 },
  profilTitle: { fontSize: 15, fontWeight: "bold", color: "#1a1a2e", marginBottom: 4 },
  profilSub: { fontSize: 12, color: "#555", lineHeight: 17, marginBottom: 10 },
  profilBtn: { backgroundColor: "#1a3c6e", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: "flex-start" },
  profilBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  profilRight: { marginLeft: 12 },
  profilIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },

  // DÉPENSES
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e", marginBottom: 12 },
  depensesCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  donutContainer: { marginRight: 20 },
  donutOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 12, borderColor: "#1a3c6e", justifyContent: "center", alignItems: "center", backgroundColor: "#A8C4E0" },
  donutInner: { alignItems: "center" },
  donutPct: { fontSize: 14, fontWeight: "bold", color: "#1a3c6e" },
  donutLabel: { fontSize: 10, color: "#888" },
  legendContainer: { flex: 1, gap: 10 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: "#333", width: 70 },
  legendBarBg: { flex: 1, height: 5, backgroundColor: "#F2F4F8", borderRadius: 3, overflow: "hidden" },
  legendBarFill: { height: 5, borderRadius: 3 },
  legendPct: { fontSize: 11, fontWeight: "700", color: "#555", width: 30, textAlign: "right" },

  // ALERTES
  alerteRow: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  alerteIconBox: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  alerteInfo: { flex: 1 },
  alerteTitle: { fontSize: 13, fontWeight: "600", color: "#1a1a2e", marginBottom: 2 },
  alerteSub: { fontSize: 12, color: "#666", lineHeight: 17 },

  // TRANSACTIONS
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, marginTop: 8 },
  tabsRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb" },
  tabBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  tabBtnActive: { backgroundColor: "#1a3c6e" },
  tabText: { fontSize: 10, fontWeight: "700", color: "#888" },
  tabTextActive: { color: "#fff" },

  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  txIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  txDate: { fontSize: 12, color: "#888", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "bold" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 10 },
  emptyText: { color: "#aaa", fontSize: 14 },

  // PDF
  pdfBtn: { backgroundColor: "#1a3c6e", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  pdfBtnIcon: { color: "#fff", fontSize: 16 },
  pdfBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});

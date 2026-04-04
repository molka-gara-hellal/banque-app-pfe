import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { getUser, removeToken } from "../../store/authStore";

const PERIODS = ["7J", "1M", "3M", "6M", "1A"];

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

export default function ComptesScreen() {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [account, setAccount]     = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState("1M");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showMenu, setShowMenu]   = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

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

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const baseURL = Platform.OS === "web" ? "http://localhost:5000/api" : "http://192.168.1.68:5000/api";
      const token = Platform.OS === "web" ? localStorage.getItem("token") : null;
      if (Platform.OS === "web") {
        const response = await fetch(`${baseURL}/accounts/releve-pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        await Linking.openURL(`${baseURL}/accounts/releve-pdf`);
      }
    } catch (e) {
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

  const prenom = user?.prenom || user?.nom || user?.email?.split("@")[0] || "Client";
  const balance = parseFloat(account?.balance ?? 0);
  const accountNum = account?.iban || account?.account_number || "0000";
  const initiale = prenom.charAt(0).toUpperCase();

  const clientProfile = {
    type: "Client Fidèle",
    score: 850,
    maxScore: 1000,
    risk: "Faible",
    insights: [
      { label: "Comportement de paiement", value: "Excellent" },
      { label: "Stabilité financière", value: "Élevée" },
      { label: "Historique crédit", value: "Très bon" },
    ],
  };

  const alerts = [
    { icon: "▲", text: "Dépenses élevées ce mois", detail: "+18%", color: "#FF3B30", bg: "#fee2e2" },
    { icon: "✓", text: "Facture payée avec succès", detail: "le 14/10", color: "#34C759", bg: "#dcfce7" },
    { icon: "📅", text: "Rendez-vous votre agence", detail: "demain", color: "#007AFF", bg: "#dbeafe" },
  ];

  const donutSegments = [
    { label: "Achats", pct: 35, color: "#1a3c6e" },
    { label: "Transport", pct: 24, color: "#4A90D9" },
    { label: "Factures", pct: 41, color: "#A8C4E0" },
  ];

  return (
    <View style={s.root}>
      {/* HEADER BLANC */}
      <View style={s.headerWhite}>
        <View style={s.headerLeft}>
          <Image source={require("../../assets/images/wifak-logo.png")} style={s.headerLogo} />
          <Text style={s.headerBrand}>Wifak Bank</Text>
        </View>
        <TouchableOpacity style={s.moreBtn} onPress={() => setShowMenu(true)}>
          <Text style={s.moreDots}>•••</Text>
        </TouchableOpacity>

        {/* MENU ••• */}
        <Modal transparent visible={showMenu} animationType="fade" onRequestClose={() => setShowMenu(false)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={s.menuDropdown}>
              <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); handleLogout(); }}>
                <Text style={{ fontSize: 18 }}>⏻</Text>
                <Text style={[s.menuItemText, { color: "#FF3B30" }]}>Se déconnecter</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* USER SECTION */}
      <View style={s.userSection}>
        <View style={s.avatar}><Text style={s.avatarText}>{initiale}</Text></View>
        <View>
          <Text style={s.greetSmall}>Bonjour,</Text>
          <Text style={s.greetName}>{prenom}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

        {/* CARTE BANCAIRE */}
        <View style={s.card}>
          <View style={s.cardCircle1} /><View style={s.cardCircle2} />
          <View style={s.cardTopRow}>
            <Text style={s.cardType}>{(account?.account_type || "COMPTE COURANT").toUpperCase()}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>◎</Text>
          </View>
          <Text style={s.cardNum}>**** **** **** {accountNum.slice(-4)}</Text>
          <Text style={s.cardBalLabel}>SOLDE TOTAL</Text>
          <Text style={s.cardBal}>
            {balance.toLocaleString("fr-TN", { minimumFractionDigits: 2 })}
            <Text style={s.cardCur}> TND</Text>
          </Text>
          <View style={s.cardBottom}>
            <Text style={s.cardIban}>TN59 ******* ******* {accountNum.slice(-4)}</Text>
            <Text style={s.cardExpire}>EXPIRE 12/28</Text>
          </View>
        </View>

        {/* PÉRIODES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8 }}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} style={[s.periodBtn, period === p && s.periodBtnActive]} onPress={() => setPeriod(p)}>
              <Text style={[s.periodText, period === p && s.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ANALYSE DE PROFIL CLIENT */}
        <Text style={s.sectionTitle}>Analyse de Profil Client</Text>
        <View style={s.profileCard}>
          <View style={s.profileCardTop}>
            <View>
              <Text style={s.profileCardSubtitle}>Statut Client</Text>
              <Text style={s.profileCardType}>{clientProfile.type}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.profileCardScore}>{clientProfile.score}</Text>
              <Text style={s.profileCardMax}>/ {clientProfile.maxScore}</Text>
            </View>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${(clientProfile.score / clientProfile.maxScore) * 100}%` }]} />
          </View>
          {clientProfile.insights.map((ins, i) => (
            <View key={i} style={s.insightRow}>
              <Text style={s.insightLabel}>{ins.label}</Text>
              <Text style={s.insightValue}>{ins.value}</Text>
            </View>
          ))}
          <View style={s.riskRow}>
            <Text style={s.riskLabel}>Niveau de risque</Text>
            <View style={s.riskBadge}><Text style={s.riskBadgeText}>{clientProfile.risk}</Text></View>
          </View>
        </View>

        {/* TRANSACTIONS */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Transactions</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={s.sectionLink}>Tout voir</Text>
          </TouchableOpacity>
        </View>
        {transactions.slice(0, 4).map((tx, i) => {
          const label = tx.label || tx.description || tx.type || "Transaction";
          const cat = getCat(label);
          const amt = parseFloat(tx.amount);
          return (
            <View key={tx.id || i} style={s.txRow}>
              <View style={[s.txIcon, { backgroundColor: cat.bg }]}><Text style={{ fontSize: 20 }}>{cat.icon}</Text></View>
              <View style={s.txInfo}>
                <Text style={s.txLabel}>{label}</Text>
                <Text style={s.txDate}>{fmtDate(tx.created_at || tx.date)}</Text>
              </View>
              <Text style={[s.txAmt, { color: amt >= 0 ? "#34C759" : "#FF3B30" }]}>
                {amt >= 0 ? "+" : ""}{amt.toFixed(2)} TND
              </Text>
            </View>
          );
        })}

        {/* ALERTES */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Alertes</Text>
        {alerts.map((a, i) => (
          <View key={i} style={[s.alertRow, { backgroundColor: a.bg }]}>
            <View style={[s.alertIconBox, { backgroundColor: a.color }]}>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>{a.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertText}>{a.text}</Text>
              <Text style={s.alertDetail}>{a.detail}</Text>
            </View>
          </View>
        ))}

        {/* RÉPARTITION DES DÉPENSES */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>Répartition des Dépenses</Text>
        <View style={s.donutCard}>
          {/* Donut visuel simplifié */}
          <View style={s.donutOuter}>
            <View style={[s.donutRing, { borderColor: "#1a3c6e" }]}>
              <View style={s.donutCenter}>
                <Text style={s.donutCenterText}>100%</Text>
              </View>
            </View>
          </View>
          <View style={s.legendContainer}>
            {donutSegments.map((seg, i) => (
              <View key={i} style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: seg.color }]} />
                <Text style={s.legendLabel}>{seg.label}</Text>
                <Text style={s.legendPct}>{seg.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BOUTON PDF */}
        <TouchableOpacity
          style={[s.pdfBtn, pdfLoading && { opacity: 0.7 }]}
          onPress={handleDownloadPDF}
          disabled={pdfLoading}
        >
          <Text style={s.pdfBtnIcon}>⬇</Text>
          <Text style={s.pdfBtnText}>Télécharger Reçu PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1, paddingHorizontal: 20 },

  headerWhite: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 40, height: 40, resizeMode: "contain" },
  headerBrand: { fontSize: 18, fontWeight: "bold", color: "#1a3c6e" },
  moreBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F2F4F8", justifyContent: "center", alignItems: "center" },
  moreDots: { fontSize: 16, color: "#1a3c6e", letterSpacing: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)" },
  menuDropdown: { position: "absolute", top: 60, right: 20, backgroundColor: "#fff", borderRadius: 14, paddingVertical: 6, minWidth: 200, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  menuItemText: { fontSize: 15, fontWeight: "600" },

  userSection: { flexDirection: "row", alignItems: "center", backgroundColor: "#F2F4F8", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a3c6e", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  greetSmall: { fontSize: 12, color: "#888" },
  greetName: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },

  card: { backgroundColor: "#1a3c6e", borderRadius: 24, padding: 24, marginTop: 4, marginBottom: 20, overflow: "hidden", shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
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

  periodBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff" },
  periodBtnActive: { backgroundColor: "#1a3c6e" },
  periodText: { fontSize: 13, fontWeight: "600", color: "#555" },
  periodTextActive: { color: "#fff" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#1a1a2e", marginBottom: 10 },
  sectionLink: { fontSize: 13, color: "#1a3c6e", fontWeight: "600" },

  profileCard: { background: "linear-gradient(135deg, #1a3c6e, #2a5a9e)", backgroundColor: "#1a3c6e", borderRadius: 18, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  profileCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  profileCardSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 4 },
  profileCardType: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  profileCardScore: { color: "#fff", fontSize: 30, fontWeight: "bold" },
  profileCardMax: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  progressBg: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, marginBottom: 16, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#fff", borderRadius: 4 },
  insightRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  insightLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  insightValue: { color: "#fff", fontSize: 13, fontWeight: "600" },
  riskRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  riskLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  riskBadge: { backgroundColor: "#34C759", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  riskBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  txDate: { fontSize: 11, color: "#aaa", marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "bold" },

  alertRow: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, padding: 14, marginBottom: 8, gap: 12 },
  alertIconBox: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  alertText: { fontSize: 13, fontWeight: "600", color: "#1a1a2e" },
  alertDetail: { fontSize: 12, color: "#666", marginTop: 2 },

  donutCard: { backgroundColor: "#fff", borderRadius: 18, padding: 20, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  donutOuter: { alignItems: "center", justifyContent: "center" },
  donutRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 16, borderColor: "#1a3c6e", justifyContent: "center", alignItems: "center" },
  donutCenter: { alignItems: "center" },
  donutCenterText: { fontSize: 13, fontWeight: "bold", color: "#1a3c6e" },
  legendContainer: { flex: 1, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { flex: 1, fontSize: 13, color: "#333" },
  legendPct: { fontSize: 13, fontWeight: "bold", color: "#333" },

  pdfBtn: { backgroundColor: "#1a3c6e", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  pdfBtnIcon: { color: "#fff", fontSize: 16 },
  pdfBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLanguage } from "../../i18n/LanguageContext";
import api from "../../servives/api";
import {
  getSelectedAccountId,
  getUser,
  removeToken,
  saveSelectedAccountId,
} from "../../store/authStore";

const ACCOUNT_COLORS = {
  courant:           { bg: "#1a3c6e", label: "Compte Courant",           icon: "💳" },
  epargne:           { bg: "#16a34a", label: "Compte Épargne",           icon: "🏦" },
  wadiaa:            { bg: "#7c3aed", label: "Compte Wadiaa",            icon: "☪️" },
  wadiaa_specifique: { bg: "#9333ea", label: "Compte Wadiaa Spécifique", icon: "⭐" },
  ithmar:            { bg: "#d97706", label: "Compte Ithmar",            icon: "🌱" },
};
function getAccountStyle(type) {
  if (!type) return { bg: "#1a3c6e", label: "Compte", icon: "💳" };
  const key = type.toLowerCase().replace(/ /g, "_");
  return ACCOUNT_COLORS[key] || { bg: "#1a3c6e", label: type, icon: "💳" };
}

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

const computeStats = (allTransactions) => {
  const now = new Date();
  const curYear = now.getFullYear(), curMonth = now.getMonth();
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevYear = prevDate.getFullYear(), prevMonth = prevDate.getMonth();
  let rC = 0, rP = 0, dC = 0, dP = 0;
  allTransactions.forEach((tx) => {
    const d = new Date(tx.created_at || tx.date);
    const y = d.getFullYear(), m = d.getMonth();
    const amt = parseFloat(tx.amount ?? 0);
    const isCredit = tx.type === "credit" || (tx.type == null && amt > 0);
    const isDebit  = tx.type === "debit"  || (tx.type == null && amt < 0);
    const abs = Math.abs(amt);
    if (y === curYear && m === curMonth)   { if (isCredit) rC += abs; if (isDebit) dC += abs; }
    if (y === prevYear && m === prevMonth) { if (isCredit) rP += abs; if (isDebit) dP += abs; }
  });
  const pct = (cur, prev) => prev === 0 ? null : ((cur - prev) / prev) * 100;
  const fmtPct = (p, positiveGood) => {
    if (p === null) return null;
    const up = p >= 0;
    return { text: `${up ? "↗" : "↘"} ${Math.abs(p).toFixed(1)}%`, up, good: positiveGood ? up : !up };
  };
  const barData = (isCredit) => {
    const months = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(curYear, curMonth - (4 - i), 1);
      return { y: d.getFullYear(), m: d.getMonth(), total: 0 };
    });
    allTransactions.forEach((tx) => {
      const d = new Date(tx.created_at || tx.date);
      const amt = parseFloat(tx.amount ?? 0);
      const ok = isCredit ? tx.type === "credit" || (tx.type == null && amt > 0)
                          : tx.type === "debit"  || (tx.type == null && amt < 0);
      const bar = months.find(b => b.y === d.getFullYear() && b.m === d.getMonth());
      if (bar && ok) bar.total += Math.abs(amt);
    });
    const max = Math.max(...months.map(b => b.total), 1);
    return months.map(b => Math.round((b.total / max) * 22) + 2);
  };
  return {
    revenusCurMois: rC, depensesCurMois: dC,
    revPct: fmtPct(pct(rC, rP), true), depPct: fmtPct(pct(dC, dP), false),
    revBars: barData(true), depBars: barData(false),
  };
};

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [user, setUser]               = useState(null);
  const [accounts, setAccounts]       = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // Rechargement à chaque fois que l'écran est focalisé
  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    try {
      const u = await getUser();
      setUser(u);

      // Charger tous les comptes
      const accRes = await api.get("/accounts/all");
      const list = accRes.data || [];
      setAccounts(list);

      // Déterminer le compte actif (depuis store ou premier)
      const savedId = await getSelectedAccountId();
      const savedNum = savedId ? parseInt(savedId, 10) : null;
      const exists = savedNum && list.some(a => a.id === savedNum);
      const activeId = exists ? savedNum : (list[0]?.id ?? null);
      setSelectedId(activeId);

      // Charger les transactions du compte actif
      if (activeId) await loadTransactions(activeId);
    } catch (e) {
      console.log("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (accountId) => {
    try {
      const txRes = await api.get(`/transactions?account_id=${accountId}`).catch(() => ({ data: [] }));
      const all = txRes.data || [];
      setAllTransactions(all);
      setTransactions(all.slice(0, 5));
      setStats(computeStats(all));
    } catch (_) {}
  };

  // Changer de compte → persisté + rechargement des transactions
  const handleSelectAccount = async (acc) => {
    setSelectedId(acc.id);
    await saveSelectedAccountId(acc.id);
    setShowAccountPicker(false);
    setLoading(true);
    await loadTransactions(acc.id);
    setLoading(false);
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

  const selectedAccount = accounts.find(a => a.id === selectedId) || accounts[0];
  const accStyle  = getAccountStyle(selectedAccount?.account_type);
  const prenom    = user?.prenom || user?.nom || user?.email?.split("@")[0] || "Client";
  const nom       = user?.nom || "";
  const fullName  = [prenom, nom].filter(Boolean).join(" ");
  const initiale  = prenom.charAt(0).toUpperCase();
  const balance   = parseFloat(selectedAccount?.balance ?? 0);
  const accountNum = selectedAccount?.iban || selectedAccount?.account_number || "0000000000";

  const quickActions = [
    { icon: "↗", label: t("actions.transfer"),     onPress: () => router.push("/(tabs)/virement") },
    { icon: "🕐", label: t("actions.history"),      onPress: () => router.push("/(tabs)/transactions") },
    { icon: "📅", label: t("actions.appointments"), onPress: () => router.push("/(tabs)/rdv") },
    { icon: "💬", label: t("actions.assistant"),    onPress: () => router.push("/(tabs)/assistant") },
  ];

  const NOTIFS = [
    { icon: "✅", text: t("dashboard.notif1"), time: t("dashboard.notif1time"), bg: "#EDFFF2" },
    { icon: "🔔", text: t("dashboard.notif2"), time: t("dashboard.notif2time"), bg: "#EBF5FF" },
    { icon: "⚠️", text: t("dashboard.notif3"), time: t("dashboard.notif3time"), bg: "#FFF5E6" },
  ];
  const SETTINGS_ITEMS = [
    { icon: "👤", label: t("dashboard.myProfile"),  onPress: () => { setShowSettings(false); router.push("/(tabs)/profil"); } },
    { icon: "💳", label: t("dashboard.myAccounts"), onPress: () => { setShowSettings(false); router.push("/(tabs)/comptes"); } },
    { icon: "⏻",  label: t("logout"),               onPress: () => { setShowSettings(false); handleLogout(); }, red: true },
  ];

  return (
    <View style={s.root}>
      {/* HEADER */}
      <View style={s.headerWhite}>
        <View style={s.headerLeft}>
          <Image source={require("../../assets/images/wifak-logo.png")} style={s.headerLogo} />
          <Text style={s.headerBrand}>{t("appName")}</Text>
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

      {/* UTILISATEUR */}
      <View style={s.userSection}>
        <View style={s.avatar}><Text style={s.avatarText}>{initiale}</Text></View>
        <View>
          <Text style={s.greetSmall}>{t("dashboard.hello")}</Text>
          <Text style={s.greetName}>{fullName}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

        {/* CARTE — cliquable pour changer de compte */}
        <TouchableOpacity activeOpacity={0.92} onPress={() => accounts.length > 1 && setShowAccountPicker(true)}>
          <View style={[s.card, { backgroundColor: accStyle.bg }]}>
            <View style={s.cardCircle1} /><View style={s.cardCircle2} />
            <View style={s.cardTopRow}>
              <Text style={s.cardType}>{(selectedAccount?.account_type || t("dashboard.currentAccount")).toUpperCase()}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {accounts.length > 1 && (
                  <View style={s.switchHint}>
                    <Text style={s.switchHintText}>Changer ▾</Text>
                  </View>
                )}
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>◎</Text>
              </View>
            </View>
            <Text style={s.cardNum}>**** **** **** {accountNum.slice(-4)}</Text>
            <Text style={s.cardBalLabel}>{t("dashboard.availableBalance")}</Text>
            <Text style={s.cardBal}>
              {balance.toLocaleString("fr-TN", { minimumFractionDigits: 2 })}
              <Text style={s.cardCur}> TND</Text>
            </Text>
            <View style={s.cardBottom}>
              <Text style={s.cardIban}>TN59 ******* ******* {accountNum.slice(-4)}</Text>
              <Text style={s.cardExpire}>{t("dashboard.expires")}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ACTIONS RAPIDES */}
        <View style={s.actionsRow}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} style={s.actionBtn} onPress={a.onPress}>
              <View style={s.actionCircle}><Text style={{ fontSize: 20 }}>{a.icon}</Text></View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RÉSUMÉ FINANCIER */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{t("dashboard.financialSummary")}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={s.sectionLink}>{t("dashboard.details")}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { marginRight: 6 }]}>
            <Text style={s.summaryLabel}>{t("dashboard.income")}</Text>
            <Text style={[s.summaryAmt, { color: "#34C759" }]}>
              +{(stats?.revenusCurMois ?? 0).toLocaleString("fr-TN", { minimumFractionDigits: 2 })} TND
            </Text>
            {stats?.revPct ? (
              <Text style={[s.summaryTrend, { color: stats.revPct.good ? "#34C759" : "#FF3B30" }]}>{stats.revPct.text} vs mois dernier</Text>
            ) : <Text style={[s.summaryTrend, { color: "#aaa" }]}>— pas de données</Text>}
            <View style={s.miniBarRow}>
              {(stats?.revBars ?? [4,4,4,4,4]).map((h, i, arr) => (
                <View key={i} style={[s.miniBar, { height: h, backgroundColor: i === arr.length - 1 ? "#34C759" : "#e5e7eb" }]} />
              ))}
            </View>
          </View>
          <View style={[s.summaryCard, { marginLeft: 6 }]}>
            <Text style={s.summaryLabel}>{t("dashboard.expenses")}</Text>
            <Text style={[s.summaryAmt, { color: "#FF3B30" }]}>
              -{(stats?.depensesCurMois ?? 0).toLocaleString("fr-TN", { minimumFractionDigits: 2 })} TND
            </Text>
            {stats?.depPct ? (
              <Text style={[s.summaryTrend, { color: stats.depPct.good ? "#34C759" : "#FF3B30" }]}>{stats.depPct.text} vs mois dernier</Text>
            ) : <Text style={[s.summaryTrend, { color: "#aaa" }]}>— pas de données</Text>}
            <View style={s.miniBarRow}>
              {(stats?.depBars ?? [4,4,4,4,4]).map((h, i, arr) => (
                <View key={i} style={[s.miniBar, { height: h, backgroundColor: i === arr.length - 1 ? "#FF3B30" : "#e5e7eb" }]} />
              ))}
            </View>
          </View>
        </View>

        {/* TRANSACTIONS */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{t("dashboard.recentTransactions")}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={s.sectionLink}>{t("dashboard.viewAll")}</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <View style={s.emptyBox}><Text style={s.emptyText}>{t("dashboard.noTransactions")}</Text></View>
        ) : transactions.map((tx, i) => {
          const label = tx.label || tx.description || tx.type || t("dashboard.transaction");
          const cat   = getCat(label);
          const amt   = tx.type === "credit" ? Math.abs(parseFloat(tx.amount))
                      : tx.type === "debit"  ? -Math.abs(parseFloat(tx.amount))
                      : parseFloat(tx.amount);
          return (
            <View key={tx.id || i} style={s.txRow}>
              <View style={[s.txIcon, { backgroundColor: cat.bg }]}><Text style={{ fontSize: 20 }}>{cat.icon}</Text></View>
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

      {/* MODAL SÉLECTEUR DE COMPTE */}
      <Modal transparent visible={showAccountPicker} animationType="slide" onRequestClose={() => setShowAccountPicker(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAccountPicker(false)}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHandle} />
            <Text style={s.pickerTitle}>Choisir un compte</Text>
            {accounts.map((acc) => {
              const style  = getAccountStyle(acc.account_type);
              const isSel  = acc.id === selectedId;
              const bal    = parseFloat(acc.balance || 0);
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[s.pickerRow, isSel && s.pickerRowActive]}
                  onPress={() => handleSelectAccount(acc)}
                >
                  <View style={[s.pickerIcon, { backgroundColor: style.bg + "25" }]}>
                    <Text style={{ fontSize: 22 }}>{style.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pickerLabel}>{style.label}</Text>
                    <Text style={s.pickerIban} numberOfLines={1}>{acc.iban?.slice(0, 18)}...</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.pickerBal, { color: style.bg }]}>
                      {bal.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND
                    </Text>
                    {isSel && <Text style={[s.pickerCheck, { color: style.bg }]}>✓ Actif</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL NOTIFICATIONS */}
      <Modal transparent visible={showNotifs} animationType="fade" onRequestClose={() => setShowNotifs(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowNotifs(false)}>
          <View style={s.notifPanel}>
            <View style={s.panelHeader}>
              <Text style={s.panelTitle}>{t("dashboard.notifications")}</Text>
              <TouchableOpacity onPress={() => setShowNotifs(false)}><Text style={s.panelClose}>✕</Text></TouchableOpacity>
            </View>
            {NOTIFS.map((n, i) => (
              <View key={i} style={[s.notifItem, { backgroundColor: n.bg }]}>
                <Text style={{ fontSize: 22 }}>{n.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.notifText}>{n.text}</Text>
                  <Text style={s.notifTime}>{n.time}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.notifClear} onPress={() => setShowNotifs(false)}>
              <Text style={s.notifClearText}>{t("dashboard.markAllRead")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL SETTINGS */}
      <Modal transparent visible={showSettings} animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <View style={s.settingsMenu}>
            {SETTINGS_ITEMS.map((item, i, arr) => (
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
  root:           { flex: 1, backgroundColor: "#F2F4F8" },
  centered:       { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll:         { flex: 1, paddingHorizontal: 20 },
  headerWhite:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  headerLeft:     { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo:     { width: 40, height: 40, resizeMode: "contain" },
  headerBrand:    { fontSize: 18, fontWeight: "bold", color: "#1a3c6e" },
  headerRight:    { flexDirection: "row", gap: 8 },
  iconBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F2F4F8", justifyContent: "center", alignItems: "center" },
  iconBtnText:    { fontSize: 18 },
  notifDot:       { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", borderWidth: 1.5, borderColor: "#fff" },
  userSection:    { flexDirection: "row", alignItems: "center", backgroundColor: "#F2F4F8", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a3c6e", justifyContent: "center", alignItems: "center" },
  avatarText:     { color: "#fff", fontSize: 18, fontWeight: "bold" },
  greetSmall:     { fontSize: 12, color: "#888" },
  greetName:      { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },
  card:           { borderRadius: 24, padding: 24, marginTop: 4, marginBottom: 28, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  cardCircle1:    { position: "absolute", width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,255,255,0.1)", top: -40, right: -30 },
  cardCircle2:    { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.1)", bottom: -30, left: -20 },
  cardTopRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  cardType:       { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600", letterSpacing: 1.5 },
  switchHint:     { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  switchHintText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardNum:        { color: "rgba(255,255,255,0.6)", fontSize: 13, letterSpacing: 2, marginBottom: 8 },
  cardBalLabel:   { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600", letterSpacing: 1.2, marginBottom: 4 },
  cardBal:        { color: "#fff", fontSize: 30, fontWeight: "bold", marginBottom: 16 },
  cardCur:        { fontSize: 16, fontWeight: "400", color: "rgba(255,255,255,0.8)" },
  cardBottom:     { flexDirection: "row", justifyContent: "space-between" },
  cardIban:       { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  cardExpire:     { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  actionsRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  actionBtn:      { alignItems: "center", flex: 1 },
  actionCircle:   { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  actionLabel:    { fontSize: 11, color: "#555", fontWeight: "500" },
  sectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:   { fontSize: 15, fontWeight: "bold", color: "#1a1a2e" },
  sectionLink:    { fontSize: 13, color: "#1a3c6e", fontWeight: "600" },
  summaryRow:     { flexDirection: "row", marginBottom: 28 },
  summaryCard:    { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  summaryLabel:   { fontSize: 12, color: "#888", marginBottom: 3 },
  summaryAmt:     { fontSize: 17, fontWeight: "bold", marginBottom: 2 },
  summaryTrend:   { fontSize: 10, marginBottom: 8 },
  miniBarRow:     { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 28 },
  miniBar:        { flex: 1, borderRadius: 2 },
  txRow:          { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  txIcon:         { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  txInfo:         { flex: 1 },
  txLabel:        { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  txCat:          { fontSize: 12, color: "#888" },
  txDate:         { fontSize: 11, color: "#aaa", marginTop: 1 },
  txAmt:          { fontSize: 14, fontWeight: "bold" },
  emptyBox:       { backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" },
  emptyText:      { color: "#aaa", fontSize: 14 },
  overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  // Picker de compte
  pickerSheet:    { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  pickerHandle:   { width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  pickerTitle:    { fontSize: 18, fontWeight: "700", color: "#1a1a2e", marginBottom: 16 },
  pickerRow:      { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, marginBottom: 8, backgroundColor: "#F8FAFC" },
  pickerRowActive:{ borderWidth: 2, borderColor: "#1a3c6e", backgroundColor: "#EBF5FF" },
  pickerIcon:     { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  pickerLabel:    { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  pickerIban:     { fontSize: 11, color: "#888", fontFamily: "monospace", marginTop: 2 },
  pickerBal:      { fontSize: 14, fontWeight: "700" },
  pickerCheck:    { fontSize: 11, fontWeight: "700", marginTop: 2 },
  // Notifs
  notifPanel:     { position: "absolute", top: 65, right: 16, width: 320, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 12 },
  panelHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F2F4F8" },
  panelTitle:     { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },
  panelClose:     { fontSize: 16, color: "#888" },
  notifItem:      { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: "#F2F4F8" },
  notifText:      { fontSize: 13, color: "#1a1a2e", fontWeight: "500", lineHeight: 18 },
  notifTime:      { fontSize: 11, color: "#888", marginTop: 3 },
  notifClear:     { padding: 14, alignItems: "center" },
  notifClearText: { fontSize: 13, color: "#1a3c6e", fontWeight: "600" },
  // Settings
  settingsMenu:   { position: "absolute", top: 65, right: 16, width: 220, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 10 },
  settingsItem:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  settingsLabel:  { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  settingsArrow:  { fontSize: 20, color: "#ccc" },
  settingsDivider:{ height: 1, backgroundColor: "#F2F4F8", marginLeft: 46 },
});
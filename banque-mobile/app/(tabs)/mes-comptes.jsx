import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";

const ACCOUNT_COLORS = {
  courant:          { bg: "#1a3c6e", label: "Compte Courant",          icon: "💳" },
  epargne:          { bg: "#16a34a", label: "Compte Épargne",           icon: "🏦" },
  wadiaa:           { bg: "#7c3aed", label: "Compte Wadiaa",            icon: "☪️" },
  wadiaa_specifique:{ bg: "#9333ea", label: "Compte Wadiaa Spécifique", icon: "⭐" },
  ithmar:           { bg: "#d97706", label: "Compte Ithmar",            icon: "🌱" },
};

function getAccountStyle(type) {
  if (!type) return { bg: "#1a3c6e", label: "Compte", icon: "💳" };
  const key = type.toLowerCase().replace(/ /g, "_");
  return ACCOUNT_COLORS[key] || { bg: "#1a3c6e", label: type, icon: "💳" };
}

export default function MesComptesScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get("/accounts/all");
      setAccounts(res.data || []);
      if (res.data?.length > 0) setSelectedId(res.data[0].id);
    } catch (e) {
      console.log("Erreur comptes:", e?.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const selectedAccount = accounts.find(a => a.id === selectedId);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#1a3c6e" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mes Comptes</Text>
        <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
          <Text style={s.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a3c6e"]} />}
      >
        {accounts.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🏦</Text>
            <Text style={s.emptyTitle}>Aucun compte</Text>
            <Text style={s.emptyText}>Vous n avez pas encore de compte bancaire.</Text>
          </View>
        ) : (
          <>
            {/* SELECTOR */}
            <Text style={s.sectionLabel}>Sélectionner un compte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {accounts.map(acc => {
                  const style = getAccountStyle(acc.account_type);
                  const isSelected = acc.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[s.accountTab, isSelected && { backgroundColor: style.bg, borderColor: style.bg }]}
                      onPress={() => setSelectedId(acc.id)}
                    >
                      <Text style={{ fontSize: 16 }}>{style.icon}</Text>
                      <Text style={[s.accountTabLabel, isSelected && { color: "#fff" }]}>
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* SELECTED ACCOUNT CARD */}
            {selectedAccount && (() => {
              const style = getAccountStyle(selectedAccount.account_type);
              const balance = parseFloat(selectedAccount.balance || 0);
              return (
                <View style={[s.mainCard, { backgroundColor: style.bg }]}>
                  <View style={s.cardCircle1} /><View style={s.cardCircle2} />
                  <View style={s.cardTop}>
                    <Text style={s.cardTypeLabel}>{style.label.toUpperCase()}</Text>
                    <Text style={{ fontSize: 24 }}>{style.icon}</Text>
                  </View>
                  <Text style={s.cardIban}>{selectedAccount.iban || "—"}</Text>
                  <Text style={s.cardBalLabel}>SOLDE</Text>
                  <Text style={s.cardBalance}>
                    {balance.toLocaleString("fr-TN", { minimumFractionDigits: 3 })}
                    <Text style={{ fontSize: 16, fontWeight: "400" }}> TND</Text>
                  </Text>
                  <View style={s.cardFooter}>
                    <Text style={s.cardCurrency}>{selectedAccount.currency || "TND"}</Text>
                    <Text style={s.cardDate}>
                      Ouvert le {new Date(selectedAccount.created_at).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* ALL ACCOUNTS LIST */}
            <Text style={[s.sectionLabel, { marginTop: 8 }]}>Tous mes comptes ({accounts.length})</Text>
            {accounts.map(acc => {
              const style = getAccountStyle(acc.account_type);
              const balance = parseFloat(acc.balance || 0);
              const isSelected = acc.id === selectedId;
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[s.accountRow, isSelected && s.accountRowSelected]}
                  onPress={() => setSelectedId(acc.id)}
                >
                  <View style={[s.accountRowIcon, { backgroundColor: style.bg + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{style.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.accountRowType}>{style.label}</Text>
                    <Text style={s.accountRowIban} numberOfLines={1}>
                      {selectedAccount?.iban?.slice(0, 16)}...
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.accountRowBalance, { color: style.bg }]}>
                      {balance.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND
                    </Text>
                    {isSelected && (
                      <View style={[s.activeBadge, { backgroundColor: style.bg }]}>
                        <Text style={s.activeBadgeText}>Actif</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* SYNC BUTTON */}
            <TouchableOpacity style={s.syncBtn} onPress={onRefresh} disabled={refreshing}>
              {refreshing
                ? <ActivityIndicator color="#1a3c6e" size="small" />
                : <>
                    <Text style={s.syncIcon}>↻</Text>
                    <Text style={s.syncText}>Synchroniser mes comptes</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  refreshBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-end" },
  refreshIcon: { fontSize: 22, color: "#1a3c6e" },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#888", textAlign: "center" },
  accountTab: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: "#dde3ed" },
  accountTabLabel: { fontSize: 12, fontWeight: "600", color: "#555" },
  mainCard: { borderRadius: 24, padding: 24, marginBottom: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  cardCircle1: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.1)", top: -40, right: -30 },
  cardCircle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.08)", bottom: -30, left: -20 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  cardTypeLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  cardIban: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace", marginBottom: 12, letterSpacing: 1 },
  cardBalLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 4 },
  cardBalance: { color: "#fff", fontSize: 30, fontWeight: "bold", marginBottom: 16 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardCurrency: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  cardDate: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  accountRow: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  accountRowSelected: { borderWidth: 2, borderColor: "#1a3c6e" },
  accountRowIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  accountRowType: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  accountRowIban: { fontSize: 11, color: "#888", fontFamily: "monospace", marginTop: 2 },
  accountRowBalance: { fontSize: 14, fontWeight: "700" },
  activeBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  activeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  syncBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginTop: 8, borderWidth: 1, borderColor: "#1a3c6e" },
  syncIcon: { fontSize: 18, color: "#1a3c6e" },
  syncText: { color: "#1a3c6e", fontWeight: "700", fontSize: 14 },
});
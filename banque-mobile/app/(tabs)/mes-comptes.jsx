import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { saveToken, saveUser, saveSelectedAccountId, getSelectedAccountId } from "../../store/authStore";

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

export default function MesComptesScreen() {
  const router = useRouter();
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Modal synchronisation
  const [syncVisible, setSyncVisible] = useState(false);
  const [syncEmail, setSyncEmail]     = useState("");
  const [syncPwd, setSyncPwd]         = useState("");
  const [syncShowPwd, setSyncShowPwd] = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [syncError, setSyncError]     = useState("");

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get("/accounts/all");
      const list = res.data || [];
      setAccounts(list);
      if (list.length > 0) {
        // Restaurer le compte sélectionné depuis le store
        const savedId = await getSelectedAccountId();
        const savedNum = savedId ? parseInt(savedId, 10) : null;
        const exists = savedNum && list.some(a => a.id === savedNum);
        const idToUse = exists ? savedNum : list[0].id;
        setSelectedId(idToUse);
      }
    } catch (e) {
      console.log("Erreur comptes:", e?.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Persister le compte sélectionné à chaque changement
  const handleSelectAccount = async (id) => {
    setSelectedId(id);
    await saveSelectedAccountId(id);
  };

  const onRefresh = () => { setRefreshing(true); loadAccounts(); };

  // ─── Synchronisation vers un autre compte ────────────────────────────────
  const handleOpenSync = () => {
    setSyncEmail(""); setSyncPwd(""); setSyncError(""); setSyncShowPwd(false);
    setSyncVisible(true);
  };

  const handleSync = async () => {
    if (!syncEmail.trim() || !syncPwd.trim()) { setSyncError("Veuillez remplir tous les champs."); return; }
    setSyncing(true); setSyncError("");
    try {
      const res = await api.post("/auth/login", { email: syncEmail.trim(), password: syncPwd });
      await saveToken(res.data.token);
      await saveUser(res.data.user);
      await removeSelectedAccountId?.();
      setSyncVisible(false);
      Alert.alert("Compte synchronisé ✅", `Connecté en tant que ${res.data.user.email}.`, [
        { text: "OK", onPress: () => router.replace("/(tabs)/dashboard") },
      ]);
    } catch (err) {
      const status = err?.response?.data?.status;
      if (status === "pending") setSyncError("Ce compte est en attente de validation.");
      else if (status === "rejected") setSyncError("Ce compte a été refusé.");
      else setSyncError(err?.response?.data?.message || "Email ou mot de passe incorrect.");
    } finally { setSyncing(false); }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

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
            <Text style={s.emptyText}>Vous n'avez pas encore de compte bancaire.</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionLabel}>Sélectionner un compte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {accounts.map((acc) => {
                  const style = getAccountStyle(acc.account_type);
                  const isSel = acc.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[s.accountTab, isSel && { backgroundColor: style.bg, borderColor: style.bg }]}
                      onPress={() => handleSelectAccount(acc.id)}
                    >
                      <Text style={{ fontSize: 16 }}>{style.icon}</Text>
                      <Text style={[s.accountTabLabel, isSel && { color: "#fff" }]}>{style.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {selectedAccount && (() => {
              const style   = getAccountStyle(selectedAccount.account_type);
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
                    <Text style={s.cardDate}>Ouvert le {new Date(selectedAccount.created_at).toLocaleDateString("fr-FR")}</Text>
                  </View>
                </View>
              );
            })()}

            <Text style={[s.sectionLabel, { marginTop: 8 }]}>Tous mes comptes ({accounts.length})</Text>
            {accounts.map((acc) => {
              const style   = getAccountStyle(acc.account_type);
              const balance = parseFloat(acc.balance || 0);
              const isSel   = acc.id === selectedId;
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[s.accountRow, isSel && s.accountRowSelected]}
                  onPress={() => handleSelectAccount(acc.id)}
                >
                  <View style={[s.accountRowIcon, { backgroundColor: style.bg + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{style.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.accountRowType}>{style.label}</Text>
                    <Text style={s.accountRowIban} numberOfLines={1}>{acc.iban?.slice(0, 20)}...</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.accountRowBalance, { color: style.bg }]}>
                      {balance.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND
                    </Text>
                    {isSel && (
                      <View style={[s.activeBadge, { backgroundColor: style.bg }]}>
                        <Text style={s.activeBadgeText}>Actif</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={s.syncBtn} onPress={onRefresh} disabled={refreshing}>
              {refreshing ? <ActivityIndicator color="#1a3c6e" size="small" /> : (
                <><Text style={s.syncIcon}>↻</Text><Text style={s.syncText}>Actualiser mes comptes</Text></>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={s.switchBtn} onPress={handleOpenSync}>
          <Text style={s.switchIcon}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>Synchroniser avec un autre compte</Text>
            <Text style={s.switchSub}>Basculer vers un autre compte Wifak Bank</Text>
          </View>
          <Text style={s.switchArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL SYNCHRONISATION */}
      <Modal visible={syncVisible} animationType="slide" transparent onRequestClose={() => setSyncVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>🔄 Changer de compte</Text>
            <Text style={s.modalSub}>Entrez les identifiants du compte cible. Toutes les pages seront rechargées avec ce compte.</Text>
            {syncError ? <View style={s.errorBox}><Text style={s.errorText}>{syncError}</Text></View> : null}
            <TextInput style={s.input} placeholder="Email du compte" placeholderTextColor="#aaa" value={syncEmail} onChangeText={setSyncEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <View style={s.pwdRow}>
              <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Mot de passe" placeholderTextColor="#aaa" value={syncPwd} onChangeText={setSyncPwd} secureTextEntry={!syncShowPwd} autoCapitalize="none" />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setSyncShowPwd(!syncShowPwd)}>
                <Text style={{ fontSize: 20 }}>{syncShowPwd ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.confirmBtn, syncing && { opacity: 0.7 }]} onPress={handleSync} disabled={syncing}>
              {syncing ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>Synchroniser ce compte</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setSyncVisible(false)} disabled={syncing}>
              <Text style={s.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: "#F2F4F8" },
  centered:           { flex: 1, justifyContent: "center", alignItems: "center" },
  header:             { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  backBtn:            { width: 40, height: 40, justifyContent: "center" },
  backArrow:          { fontSize: 24, color: "#1a3c6e" },
  title:              { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  refreshBtn:         { width: 40, height: 40, justifyContent: "center", alignItems: "flex-end" },
  refreshIcon:        { fontSize: 22, color: "#1a3c6e" },
  content:            { padding: 20, paddingBottom: 40 },
  sectionLabel:       { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  emptyBox:           { alignItems: "center", paddingVertical: 60 },
  emptyTitle:         { fontSize: 18, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  emptyText:          { fontSize: 14, color: "#888", textAlign: "center" },
  accountTab:         { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: "#dde3ed" },
  accountTabLabel:    { fontSize: 12, fontWeight: "600", color: "#555" },
  mainCard:           { borderRadius: 24, padding: 24, marginBottom: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  cardCircle1:        { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.1)", top: -40, right: -30 },
  cardCircle2:        { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.08)", bottom: -30, left: -20 },
  cardTop:            { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  cardTypeLabel:      { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  cardIban:           { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace", marginBottom: 12, letterSpacing: 1 },
  cardBalLabel:       { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 4 },
  cardBalance:        { color: "#fff", fontSize: 30, fontWeight: "bold", marginBottom: 16 },
  cardFooter:         { flexDirection: "row", justifyContent: "space-between" },
  cardCurrency:       { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  cardDate:           { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  accountRow:         { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  accountRowSelected: { borderWidth: 2, borderColor: "#1a3c6e" },
  accountRowIcon:     { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  accountRowType:     { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  accountRowIban:     { fontSize: 11, color: "#888", fontFamily: "monospace", marginTop: 2 },
  accountRowBalance:  { fontSize: 14, fontWeight: "700" },
  activeBadge:        { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  activeBadgeText:    { color: "#fff", fontSize: 10, fontWeight: "700" },
  syncBtn:            { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginTop: 8, borderWidth: 1, borderColor: "#1a3c6e" },
  syncIcon:           { fontSize: 18, color: "#1a3c6e" },
  syncText:           { color: "#1a3c6e", fontWeight: "700", fontSize: 14 },
  switchBtn:          { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: "#e8ecf4" },
  switchIcon:         { fontSize: 26 },
  switchTitle:        { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 2 },
  switchSub:          { fontSize: 12, color: "#888" },
  switchArrow:        { fontSize: 22, color: "#ccc" },
  modalOverlay:       { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet:         { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle:        { width: 40, height: 4, backgroundColor: "#ddd", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle:         { fontSize: 20, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  modalSub:           { fontSize: 13, color: "#888", lineHeight: 20, marginBottom: 20 },
  errorBox:           { backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText:          { color: "#dc2626", fontSize: 13, textAlign: "center" },
  input:              { backgroundColor: "#F2F4F8", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1a1a2e", marginBottom: 12 },
  pwdRow:             { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eyeBtn:             { padding: 10 },
  confirmBtn:         { backgroundColor: "#1a3c6e", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  confirmBtnText:     { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelBtn:          { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelBtnText:      { color: "#888", fontSize: 15, fontWeight: "600" },
});
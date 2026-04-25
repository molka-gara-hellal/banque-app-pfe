import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { getSelectedAccountId } from "../../store/authStore";

const NO_VIREMENT_TYPES = ["wadiaa", "wadiaa_specifique", "wadiaa spécifique", "wadiaa specifique", "ithmar", "epargne", "épargne"];

export default function VirementScreen() {
  const router = useRouter();
  const [iban, setIban] = useState("");
  const [nom, setNom] = useState("");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const accId = await getSelectedAccountId();
      const url = accId ? `/accounts/all` : "/accounts/me";
      const res = await api.get(url);
      // Si /all → trouver le compte sélectionné, sinon utiliser /me
      if (Array.isArray(res.data)) {
        const accIdNum = accId ? parseInt(accId, 10) : null;
        const found = accIdNum ? res.data.find(a => a.id === accIdNum) : res.data[0];
        setAccount(found || res.data[0] || null);
      } else {
        setAccount(res.data);
      }
    } catch (_) {}
    finally { setLoadingAccount(false); }
  };

  const accountType = account?.account_type || "";
  const canVirement = !NO_VIREMENT_TYPES.some(typ => accountType.toLowerCase().includes(typ));

  const isFormValid = iban.trim() && nom.trim() && montant.trim() && motif.trim();

  const handlePreview = () => {
    setError("");
    if (!canVirement) return;
    if (!iban) { setError("L'IBAN est obligatoire"); return; }
    if (!nom) { setError("Le nom du destinataire est obligatoire"); return; }
    if (!montant) { setError("Le montant est obligatoire"); return; }
    if (!motif) { setError("Le motif est obligatoire"); return; }
    const montantNum = parseFloat(montant.replace(",", "."));
    if (isNaN(montantNum) || montantNum <= 0) { setError("Montant invalide"); return; }
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const montantNum = parseFloat(montant.replace(",", "."));
      await api.post("/transactions/virement", {
        iban_destinataire: iban,
        nom_destinataire: nom,
        montant: montantNum,
        motif,
      });
      setConfirming(false);
      setSuccess(true);
    } catch (err) {
      setConfirming(false);
      setError(err.response?.data?.message || "Erreur lors du virement");
    } finally {
      setLoading(false);
    }
  };

  if (loadingAccount) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;
  }

  // ─── COMPTE NE PEUT PAS VIRER ─────────────────────────────────────────────
  if (!canVirement) {
    return (
      <View style={s.blockedContainer}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtnTop}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.blockedCard}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🚫</Text>
          <Text style={s.blockedTitle}>Virement non disponible</Text>
          <Text style={s.blockedText}>
            Le compte <Text style={{ fontWeight: "700" }}>{accountType}</Text> ne permet pas les virements.{"\n\n"}
            Seul le <Text style={{ fontWeight: "700" }}>Compte Courant</Text> peut effectuer des virements.
          </Text>
          <View style={s.accountTypeList}>
            <Text style={s.accountTypeTitle}>Types de comptes :</Text>
            {[
              { type: "Compte Courant", can: true },
              { type: "Compte Épargne", can: false },
              { type: "Compte Wadiaa", can: false },
              { type: "Compte Wadiaa Spécifique", can: false },
              { type: "Compte Ithmar", can: false },
            ].map((item, i) => (
              <View key={i} style={s.accountTypeRow}>
                <Text style={{ color: item.can ? "#34C759" : "#FF3B30", fontSize: 14 }}>
                  {item.can ? "✓" : "✗"}
                </Text>
                <Text style={[s.accountTypeText, { color: item.can ? "#1a1a2e" : "#888" }]}>
                  {item.type}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.backBtn2} onPress={() => router.back()}>
            <Text style={s.backBtn2Text}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── SUCCÈS ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={s.successContainer}>
        <View style={s.successIconBox}>
          <Text style={{ fontSize: 52 }}>✅</Text>
        </View>
        <Text style={s.successTitle}>Virement effectué !</Text>
        <View style={s.successCard}>
          <Text style={s.successAmtLabel}>Montant transféré</Text>
          <Text style={s.successAmt}>{parseFloat(montant).toFixed(3)} TND</Text>
          <Text style={s.successTo}>à <Text style={{ fontWeight: "700" }}>{nom}</Text></Text>
        </View>
        <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace("/(tabs)/dashboard")}>
          <Text style={s.primaryBtnText}>Retour à l accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setSuccess(false); setIban(""); setNom(""); setMontant(""); setMotif(""); }}>
          <Text style={s.secondaryLink}>Nouveau virement</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── CONFIRMATION ─────────────────────────────────────────────────────────
  if (confirming) {
    const montantNum = parseFloat(montant.replace(",", "."));
    return (
      <View style={s.confirmContainer}>
        <View style={s.confirmCard}>
          <Text style={s.confirmTitle}>Confirmer le virement</Text>
          {[
            { label: "Destinataire", value: nom },
            { label: "IBAN", value: iban },
            { label: "Motif", value: motif },
          ].map((row, i) => (
            <View key={i}>
              <View style={s.confirmRow}>
                <Text style={s.confirmLabel}>{row.label}</Text>
                <Text style={s.confirmValue} numberOfLines={1}>{row.value}</Text>
              </View>
              <View style={s.confirmDivider} />
            </View>
          ))}
          <View style={s.confirmAmtRow}>
            <Text style={s.confirmAmtLabel}>Montant</Text>
            <Text style={s.confirmAmt}>{montantNum.toFixed(3)} TND</Text>
          </View>
        </View>
        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
        <TouchableOpacity style={[s.primaryBtn, loading && s.btnDisabled]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>✅ Confirmer le virement</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirming(false)} disabled={loading}>
          <Text style={s.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── FORMULAIRE ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtnTop}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nouveau Virement</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Info compte */}
        <View style={s.accountInfoBanner}>
          <Text style={s.accountInfoText}>
            💳 Compte : <Text style={{ fontWeight: "700", color: "#1a3c6e" }}>{accountType || "Compte Courant"}</Text>
            {"  "}|{"  "}
            Solde : <Text style={{ fontWeight: "700", color: "#1a3c6e" }}>
              {parseFloat(account?.balance || 0).toFixed(3)} TND
            </Text>
          </Text>
        </View>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        <View style={s.card}>
          <Text style={s.cardTitle}>Destinataire</Text>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>IBAN <Text style={s.required}>*</Text></Text>
            <TextInput style={s.fieldInput} placeholder="TN59 XXXX XXXX XXXX XXXX" value={iban} onChangeText={setIban} autoCapitalize="characters" placeholderTextColor="#bbb" />
          </View>
          <View style={s.fieldDivider} />
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Nom du destinataire <Text style={s.required}>*</Text></Text>
            <TextInput style={s.fieldInput} placeholder="Prénom Nom" value={nom} onChangeText={setNom} autoCapitalize="words" placeholderTextColor="#bbb" />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Montant <Text style={s.required}>*</Text></Text>
          <View style={s.amtRow}>
            <TextInput style={s.amtInput} placeholder="0.000" value={montant} onChangeText={setMontant} keyboardType="decimal-pad" placeholderTextColor="#ccc" />
            <View style={s.currencyBadge}><Text style={s.currencyText}>TND</Text></View>
          </View>
          <View style={s.quickRow}>
            {["50", "100", "200", "500"].map(v => (
              <TouchableOpacity key={v} style={[s.quickBtn, montant === v && s.quickBtnActive]} onPress={() => setMontant(v)}>
                <Text style={[s.quickBtnText, montant === v && s.quickBtnTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Motif <Text style={s.required}>*</Text></Text>
          <TextInput style={s.motifInput} placeholder="Ex: Loyer, Prêt, Remboursement..." value={motif} onChangeText={setMotif} placeholderTextColor="#bbb" />
        </View>

        <Text style={s.requiredNote}>* Tous les champs sont obligatoires</Text>

        <TouchableOpacity style={[s.sendBtn, !isFormValid && s.btnDisabled]} onPress={handlePreview} disabled={!isFormValid}>
          <Text style={s.sendBtnIcon}>↗</Text>
          <Text style={s.sendBtnText}>Vérifier le virement{montant ? ` (${parseFloat(montant || 0).toFixed(3)} TND)` : ""}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8", paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 16 },
  backBtnTop: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  backArrow: { fontSize: 20, color: "#1a3c6e" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e" },
  accountInfoBanner: { backgroundColor: "#EBF5FF", borderRadius: 12, padding: 12, marginBottom: 14 },
  accountInfoText: { fontSize: 13, color: "#475569" },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  fieldGroup: { paddingVertical: 4 },
  fieldLabel: { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: "500" },
  required: { color: "#FF3B30" },
  fieldInput: { fontSize: 15, color: "#1a1a2e", fontWeight: "500", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#F2F4F8" },
  fieldDivider: { height: 12 },
  amtRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  amtInput: { flex: 1, fontSize: 36, fontWeight: "bold", color: "#1a3c6e" },
  currencyBadge: { backgroundColor: "#EBF5FF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  currencyText: { fontSize: 14, fontWeight: "700", color: "#1a3c6e" },
  quickRow: { flexDirection: "row", gap: 8 },
  quickBtn: { flex: 1, backgroundColor: "#F2F4F8", borderRadius: 10, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: "transparent" },
  quickBtnActive: { backgroundColor: "#EBF5FF", borderColor: "#1a3c6e" },
  quickBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  quickBtnTextActive: { color: "#1a3c6e" },
  motifInput: { fontSize: 14, color: "#333", minHeight: 50 },
  requiredNote: { fontSize: 12, color: "#888", marginBottom: 12, textAlign: "center" },
  sendBtn: { backgroundColor: "#1a3c6e", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  btnDisabled: { opacity: 0.45 },
  sendBtnIcon: { fontSize: 18, color: "#fff" },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  // Blocked
  blockedContainer: { flex: 1, backgroundColor: "#F2F4F8", padding: 24 },
  blockedCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", marginTop: 60, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  blockedTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  blockedText: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  accountTypeList: { width: "100%", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14, marginBottom: 20 },
  accountTypeTitle: { fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 8 },
  accountTypeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  accountTypeText: { fontSize: 14 },
  backBtn2: { backgroundColor: "#1a3c6e", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  backBtn2Text: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // Confirmation
  confirmContainer: { flex: 1, backgroundColor: "#F2F4F8", padding: 24, justifyContent: "center" },
  confirmCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  confirmTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginBottom: 20, textAlign: "center" },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  confirmLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
  confirmValue: { fontSize: 14, color: "#1a1a2e", fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  confirmDivider: { height: 1, backgroundColor: "#F2F4F8" },
  confirmAmtRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 16, marginTop: 4 },
  confirmAmtLabel: { fontSize: 15, color: "#333", fontWeight: "600" },
  confirmAmt: { fontSize: 26, fontWeight: "bold", color: "#1a3c6e" },
  primaryBtn: { backgroundColor: "#1a3c6e", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelBtn: { backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#dde3ed" },
  cancelBtnText: { color: "#555", fontSize: 15, fontWeight: "600" },
  // Succès
  successContainer: { flex: 1, backgroundColor: "#F2F4F8", justifyContent: "center", alignItems: "center", padding: 32 },
  successIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#EDFFF2", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: "bold", color: "#1a1a2e", marginBottom: 16 },
  successCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, width: "100%", alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  successAmtLabel: { fontSize: 13, color: "#888", marginBottom: 6 },
  successAmt: { fontSize: 28, fontWeight: "bold", color: "#1a3c6e", marginBottom: 6 },
  successTo: { fontSize: 14, color: "#555" },
  secondaryLink: { color: "#1a3c6e", fontSize: 14, fontWeight: "600", textDecorationLine: "underline", marginTop: 12 },
});
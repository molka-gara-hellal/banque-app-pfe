import { useRouter } from "expo-router";
import { useState } from "react";
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

  const handlePreview = () => {
    setError("");
    if (!iban || !nom || !montant) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const montantNum = parseFloat(montant.replace(",", "."));
    if (isNaN(montantNum) || montantNum <= 0) {
      setError("Montant invalide");
      return;
    }
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
        motif: motif || "Virement",
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

  // ── ÉCRAN SUCCÈS ──
  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconBox}>
          <Text style={{ fontSize: 52 }}>✅</Text>
        </View>
        <Text style={styles.successTitle}>Virement effectué !</Text>
        <Text style={styles.successSub}>
          {parseFloat(montant).toFixed(2)} TND envoyés à {nom}
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => router.replace("/(tabs)/dashboard")}
        >
          <Text style={styles.successBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setSuccess(false);
            setIban(""); setNom(""); setMontant(""); setMotif("");
          }}
        >
          <Text style={styles.newVirementLink}>Nouveau virement</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── MODAL CONFIRMATION ──
  if (confirming) {
    const montantNum = parseFloat(montant.replace(",", "."));
    return (
      <View style={styles.confirmContainer}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Confirmer le virement</Text>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Destinataire</Text>
            <Text style={styles.confirmValue}>{nom}</Text>
          </View>
          <View style={styles.confirmDivider} />
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>IBAN</Text>
            <Text style={styles.confirmValue} numberOfLines={1}>{iban}</Text>
          </View>
          <View style={styles.confirmDivider} />
          {motif ? (
            <>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Motif</Text>
                <Text style={styles.confirmValue}>{motif}</Text>
              </View>
              <View style={styles.confirmDivider} />
            </>
          ) : null}
          <View style={styles.confirmAmountRow}>
            <Text style={styles.confirmAmountLabel}>Montant</Text>
            <Text style={styles.confirmAmount}>{montantNum.toFixed(2)} TND</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.sendBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>✅  Confirmer le virement</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => setConfirming(false)}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── FORMULAIRE ──
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Virement</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* BANNIÈRE INFO */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>ℹ️</Text>
          <Text style={styles.infoBannerText}>
            Les virements sont traités en temps réel vers tous les comptes Wifak Bank.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* DESTINATAIRE */}
        <Text style={styles.sectionLabel}>Destinataire</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>IBAN *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="TN59 XXXX XXXX XXXX XXXX"
              value={iban}
              onChangeText={setIban}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor="#bbb"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nom *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Nom du bénéficiaire"
              value={nom}
              onChangeText={setNom}
              autoCapitalize="words"
              placeholderTextColor="#bbb"
            />
          </View>
        </View>

        {/* MONTANT */}
        <Text style={styles.sectionLabel}>Montant</Text>
        <View style={styles.card}>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={montant}
              onChangeText={setMontant}
              keyboardType="decimal-pad"
              placeholderTextColor="#ccc"
            />
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>TND</Text>
            </View>
          </View>
          <View style={styles.quickAmountsRow}>
            {["50", "100", "200", "500"].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.quickBtn, montant === v && styles.quickBtnActive]}
                onPress={() => setMontant(v)}
              >
                <Text style={[styles.quickBtnText, montant === v && styles.quickBtnTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* MOTIF */}
        <Text style={styles.sectionLabel}>Motif (optionnel)</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.motifInput}
            placeholder="Ex: Remboursement, Loyer, Facture..."
            value={motif}
            onChangeText={setMotif}
            multiline
            numberOfLines={2}
            placeholderTextColor="#bbb"
          />
        </View>

        {/* BOUTON */}
        <TouchableOpacity style={styles.sendBtn} onPress={handlePreview}>
          <Text style={styles.sendBtnIcon}>↗</Text>
          <Text style={styles.sendBtnText}>
            Envoyer{montant ? ` ${parseFloat(montant || 0).toFixed(2)} TND` : ""}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8", paddingHorizontal: 20 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  backArrow: { fontSize: 20, color: "#1a3c6e" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e" },

  infoBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#EBF5FF", borderRadius: 12, padding: 12, marginBottom: 20, gap: 8 },
  infoBannerIcon: { fontSize: 16 },
  infoBannerText: { flex: 1, fontSize: 12, color: "#1a3c6e", lineHeight: 17 },

  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center" },

  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  fieldRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  fieldLabel: { fontSize: 13, color: "#888", width: 55, fontWeight: "500" },
  fieldInput: { flex: 1, fontSize: 15, color: "#1a1a2e", fontWeight: "500", paddingVertical: 4 },
  divider: { height: 1, backgroundColor: "#F2F4F8", marginVertical: 6 },

  amountRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: "bold", color: "#1a3c6e" },
  currencyBadge: { backgroundColor: "#EBF5FF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  currencyText: { fontSize: 14, fontWeight: "700", color: "#1a3c6e" },
  quickAmountsRow: { flexDirection: "row", gap: 8 },
  quickBtn: { flex: 1, backgroundColor: "#F2F4F8", borderRadius: 10, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: "transparent" },
  quickBtnActive: { backgroundColor: "#EBF5FF", borderColor: "#1a3c6e" },
  quickBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  quickBtnTextActive: { color: "#1a3c6e" },

  motifInput: { fontSize: 14, color: "#333", minHeight: 50, textAlignVertical: "top" },

  sendBtn: { backgroundColor: "#1a3c6e", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6, marginTop: 4 },
  sendBtnIcon: { fontSize: 18, color: "#fff" },
  sendBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },

  // CONFIRMATION
  confirmContainer: { flex: 1, backgroundColor: "#F2F4F8", padding: 24, justifyContent: "center" },
  confirmCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  confirmTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginBottom: 20, textAlign: "center" },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  confirmLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
  confirmValue: { fontSize: 14, color: "#1a1a2e", fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  confirmDivider: { height: 1, backgroundColor: "#F2F4F8" },
  confirmAmountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 16, marginTop: 4 },
  confirmAmountLabel: { fontSize: 15, color: "#333", fontWeight: "600" },
  confirmAmount: { fontSize: 26, fontWeight: "bold", color: "#1a3c6e" },

  cancelBtn: { backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "#dde3ed" },
  cancelBtnText: { color: "#555", fontSize: 15, fontWeight: "600" },

  // SUCCÈS
  successContainer: { flex: 1, backgroundColor: "#F2F4F8", justifyContent: "center", alignItems: "center", padding: 32 },
  successIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#EDFFF2", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  successTitle: { fontSize: 26, fontWeight: "bold", color: "#1a1a2e", marginBottom: 8 },
  successSub: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 36, lineHeight: 22 },
  successBtn: { backgroundColor: "#1a3c6e", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginBottom: 16, width: "100%", alignItems: "center" },
  successBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  newVirementLink: { color: "#1a3c6e", fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});

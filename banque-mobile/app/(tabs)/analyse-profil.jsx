import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";
import { getUser } from "../../store/authStore";

const SEGMENTS = [
  { label: "Épargne", pct: 68, color: "#34C759", icon: "💰", desc: "Bon comportement d'épargne" },
  { label: "Dépenses", pct: 45, color: "#FF9500", icon: "🛍️", desc: "Dépenses maîtrisées" },
  { label: "Virements", pct: 82, color: "#007AFF", icon: "↗", desc: "Activité régulière" },
  { label: "Ponctualité", pct: 95, color: "#34C759", icon: "✓", desc: "Excellent historique" },
];

const RECOMMANDATIONS = [
  { icon: "📈", title: "Compte Épargne Plus", desc: "Profitez d'un taux de 4.5% sur votre épargne annuelle.", badge: "Recommandé", badgeColor: "#34C759" },
  { icon: "💳", title: "Carte Platinum", desc: "Accédez à des avantages exclusifs avec la carte Platinum.", badge: "Nouveau", badgeColor: "#007AFF" },
  { icon: "🏠", title: "Crédit Immobilier", desc: "Taux préférentiel de 6.2% pour votre premier achat.", badge: "Offre", badgeColor: "#FF9500" },
];

const SCORE_COLOR = (s) => s >= 80 ? "#34C759" : s >= 60 ? "#FF9500" : "#FF3B30";
const SCORE_LABEL = (s) => s >= 80 ? "Excellent" : s >= 60 ? "Bon" : "À améliorer";

export default function AnalyseProfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score] = useState(78);

  useEffect(() => {
    Promise.all([
      getUser(),
      api.get("/accounts/me").catch(() => ({ data: null })),
    ]).then(([u, accRes]) => {
      setUser(u);
      setAccount(accRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a3c6e" />
      </View>
    );
  }

  const prenom = user?.prenom || user?.nom || user?.email?.split("@")[0] || "Client";
  const scoreColor = SCORE_COLOR(score);
  const scoreLabel = SCORE_LABEL(score);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyse de Profil</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* SCORE GLOBAL */}
      <View style={styles.scoreCard}>
        <View style={styles.cardCircle1} />
        <View style={styles.cardCircle2} />

        <Text style={styles.scoreBadge}>CLIENT WIFAK</Text>
        <Text style={styles.scoreGreeting}>Bonjour, {prenom} 👋</Text>
        <Text style={styles.scoreSubtitle}>Voici votre analyse financière personnalisée</Text>

        {/* Cercle score */}
        <View style={styles.scoreCircleWrap}>
          <View style={[styles.scoreCircleOuter, { borderColor: scoreColor }]}>
            <View style={styles.scoreCircleInner}>
              <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
              <Text style={styles.scoreMax}>/100</Text>
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.scoreDesc}>
          Votre profil financier est dans le top 22% des clients Wifak Bank.
        </Text>
      </View>

      {/* SEGMENTS */}
      <Text style={styles.sectionTitle}>Détail par catégorie</Text>
      <View style={styles.segmentsCard}>
        {SEGMENTS.map((seg, i) => (
          <View key={i}>
            <View style={styles.segRow}>
              <View style={[styles.segIconBox, { backgroundColor: seg.color + "20" }]}>
                <Text style={{ fontSize: 18 }}>{seg.icon}</Text>
              </View>
              <View style={styles.segInfo}>
                <View style={styles.segTopRow}>
                  <Text style={styles.segLabel}>{seg.label}</Text>
                  <Text style={[styles.segPct, { color: seg.color }]}>{seg.pct}%</Text>
                </View>
                <View style={styles.segBarBg}>
                  <View style={[styles.segBarFill, { width: `${seg.pct}%`, backgroundColor: seg.color }]} />
                </View>
                <Text style={styles.segDesc}>{seg.desc}</Text>
              </View>
            </View>
            {i < SEGMENTS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* RECOMMANDATIONS */}
      <Text style={styles.sectionTitle}>Recommandations pour vous</Text>
      {RECOMMANDATIONS.map((rec, i) => (
        <TouchableOpacity key={i} style={styles.recCard}>
          <View style={styles.recIconBox}>
            <Text style={{ fontSize: 26 }}>{rec.icon}</Text>
          </View>
          <View style={styles.recInfo}>
            <View style={styles.recTopRow}>
              <Text style={styles.recTitle}>{rec.title}</Text>
              <View style={[styles.recBadge, { backgroundColor: rec.badgeColor + "20" }]}>
                <Text style={[styles.recBadgeText, { color: rec.badgeColor }]}>{rec.badge}</Text>
              </View>
            </View>
            <Text style={styles.recDesc}>{rec.desc}</Text>
          </View>
          <Text style={styles.recArrow}>›</Text>
        </TouchableOpacity>
      ))}

      {/* CONSEILLER */}
      <View style={styles.conseillerCard}>
        <Text style={styles.conseillerIcon}>🧑‍💼</Text>
        <View style={styles.conseillerInfo}>
          <Text style={styles.conseillerTitle}>Parler à un conseiller</Text>
          <Text style={styles.conseillerSub}>Obtenez des conseils personnalisés gratuits</Text>
        </View>
        <TouchableOpacity
          style={styles.conseillerBtn}
          onPress={() => router.push("/(tabs)/rdv")}
        >
          <Text style={styles.conseillerBtnText}>RDV</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8", paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // HEADER
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: 16, marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  backArrow: { fontSize: 20, color: "#1a3c6e" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e" },

  // SCORE CARD
  scoreCard: {
    backgroundColor: "#1a3c6e", borderRadius: 24, padding: 24,
    marginBottom: 24, alignItems: "center", overflow: "hidden",
    shadowColor: "#1a3c6e", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  cardCircle1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)", top: -80, right: -50,
  },
  cardCircle2: {
    position: "absolute", width: 130, height: 130, borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: -40, left: 10,
  },
  scoreBadge: {
    color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "700",
    letterSpacing: 1.5, marginBottom: 6,
  },
  scoreGreeting: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  scoreSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 24, textAlign: "center" },

  scoreCircleWrap: { marginBottom: 16 },
  scoreCircleOuter: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 8, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  scoreCircleInner: { alignItems: "center" },
  scoreNum: { fontSize: 36, fontWeight: "bold" },
  scoreMax: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  scoreLabel: { fontSize: 13, fontWeight: "700", marginTop: 2 },

  scoreDesc: {
    color: "rgba(255,255,255,0.7)", fontSize: 12,
    textAlign: "center", lineHeight: 18,
  },

  // SECTIONS
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e", marginBottom: 12 },

  // SEGMENTS
  segmentsCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  segRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  segIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  segInfo: { flex: 1 },
  segTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  segLabel: { fontSize: 13, fontWeight: "600", color: "#1a1a2e" },
  segPct: { fontSize: 13, fontWeight: "700" },
  segBarBg: { height: 6, backgroundColor: "#F2F4F8", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  segBarFill: { height: 6, borderRadius: 3 },
  segDesc: { fontSize: 11, color: "#888" },
  divider: { height: 1, backgroundColor: "#F2F4F8" },

  // RECOMMANDATIONS
  recCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 16, padding: 16, marginBottom: 10, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
  },
  recIconBox: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: "#F2F4F8",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  recInfo: { flex: 1 },
  recTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  recTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", flex: 1 },
  recBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  recBadgeText: { fontSize: 10, fontWeight: "700" },
  recDesc: { fontSize: 12, color: "#666", lineHeight: 17 },
  recArrow: { fontSize: 22, color: "#ccc" },

  // CONSEILLER
  conseillerCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#EBF5FF",
    borderRadius: 16, padding: 16, marginTop: 4, gap: 12,
    borderWidth: 1, borderColor: "#cce0f5",
  },
  conseillerIcon: { fontSize: 30 },
  conseillerInfo: { flex: 1 },
  conseillerTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 2 },
  conseillerSub: { fontSize: 12, color: "#555" },
  conseillerBtn: {
    backgroundColor: "#1a3c6e", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  conseillerBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});

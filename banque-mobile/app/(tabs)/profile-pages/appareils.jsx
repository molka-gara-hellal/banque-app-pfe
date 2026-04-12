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
import api from "../../../servives/api";

function getDeviceIcon(deviceType) {
  if (deviceType === "mobile") return "📱";
  if (deviceType === "tablet") return "📟";
  if (deviceType === "desktop") return "💻";
  return "📱";
}

function formatLastActive(dateStr) {
  if (!dateStr) return "—";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 2) return "Maintenant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return date.toLocaleDateString("fr-FR");
}

export default function AppareilsConnectes() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await api.get("/auth/sessions");
      setSessions(res.data || []);
    } catch (e) {
      console.log("Erreur chargement sessions:", e?.response?.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(session) {
    Alert.alert(
      "Déconnecter l'appareil",
      `Voulez-vous déconnecter "${session.device_name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: async () => {
            setDisconnecting(session.id);
            try {
              await api.delete(`/auth/sessions/${session.id}`);
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
            } catch (e) {
              Alert.alert("Erreur", "Impossible de déconnecter cet appareil");
            } finally {
              setDisconnecting(null);
            }
          },
        },
      ],
    );
  }

  async function handleDisconnectAll() {
    Alert.alert(
      "Déconnecter tous les appareils",
      "Voulez-vous déconnecter tous les autres appareils ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout déconnecter",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/auth/sessions");
              setSessions((prev) => prev.filter((s) => s.current));
            } catch (e) {
              Alert.alert("Erreur", "Impossible de déconnecter les appareils");
            }
          },
        },
      ],
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Appareils connectés</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color="#1a3c6e" />
            <Text style={s.loadingText}>Chargement...</Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Aucune session active</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionLabel}>
              {sessions.length} appareil{sessions.length > 1 ? "s" : ""}{" "}
              connecté{sessions.length > 1 ? "s" : ""}
            </Text>

            {sessions.map((session) => (
              <View key={session.id} style={s.card}>
                <View style={s.deviceIcon}>
                  <Text style={{ fontSize: 24 }}>
                    {getDeviceIcon(session.device_type)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={s.deviceName}>{session.device_name}</Text>
                    {session.current && (
                      <View style={s.currentBadge}>
                        <Text style={s.currentText}>Actuel</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.deviceInfo}>📍 {session.location}</Text>
                  <Text style={s.deviceInfo}>
                    🕐 {formatLastActive(session.last_active)}
                  </Text>
                  <Text style={s.deviceInfo}>🌐 {session.ip_address}</Text>
                </View>
                {!session.current && (
                  <TouchableOpacity
                    onPress={() => handleDisconnect(session)}
                    disabled={disconnecting === session.id}
                  >
                    {disconnecting === session.id ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <Text style={s.disconnectBtn}>Déconnecter</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {sessions.filter((s) => !s.current).length > 1 && (
              <TouchableOpacity
                style={s.disconnectAllBtn}
                onPress={handleDisconnectAll}
              >
                <Text style={s.disconnectAllText}>
                  Déconnecter tous les autres appareils
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={s.warningBox}>
          <Text style={s.warningText}>
            ⚠️ Si vous ne reconnaissez pas un appareil, déconnectez-le
            immédiatement et changez votre mot de passe.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f5",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  content: { padding: 20 },
  loadingBox: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { color: "#888", fontSize: 14 },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#888", fontSize: 14 },
  sectionLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  deviceName: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  currentBadge: {
    backgroundColor: "#34C759",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  currentText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  deviceInfo: { fontSize: 12, color: "#888", marginTop: 2 },
  disconnectBtn: { color: "#FF3B30", fontSize: 12, fontWeight: "700" },
  disconnectAllBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  disconnectAllText: { color: "#FF3B30", fontWeight: "700", fontSize: 14 },
  warningBox: {
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#fbbf24",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  warningText: { fontSize: 13, color: "#92400e", lineHeight: 20 },
});

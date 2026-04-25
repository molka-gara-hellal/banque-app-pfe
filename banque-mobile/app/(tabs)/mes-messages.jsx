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

export default function MesMessagesSupport() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    try {
      const res = await api.get("/support/my-messages");
      setMessages(res.data || []);
    } catch (e) {
      console.log("Erreur messages:", e?.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fmtDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mes messages</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMessages(); }} colors={["#1a3c6e"]} />
        }
      >
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color="#1a3c6e" />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
            <Text style={s.emptyTitle}>Aucun message</Text>
            <Text style={s.emptyText}>
              Vous n'avez pas encore envoyé de message au support.
            </Text>
            <TouchableOpacity
              style={s.newMsgBtn}
              onPress={() => router.push("/(tabs)/profile-pages/support")}
            >
              <Text style={s.newMsgBtnText}>Contacter le support</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.sectionLabel}>{messages.length} message{messages.length > 1 ? "s" : ""}</Text>
            {messages.map((msg) => (
              <View key={msg.id} style={s.messageCard}>
                {/* En-tête */}
                <View style={s.messageHeader}>
                  <View style={s.messageIconBox}>
                    <Text style={{ fontSize: 18 }}>📩</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.messageSubject}>{msg.sujet}</Text>
                    <Text style={s.messageDate}>{fmtDate(msg.created_at)}</Text>
                  </View>
                  <View style={[
                    s.statusBadge,
                    { backgroundColor: msg.statut === "traité" ? "#dcfce7" : "#fef3c7" }
                  ]}>
                    <Text style={[
                      s.statusText,
                      { color: msg.statut === "traité" ? "#16a34a" : "#d97706" }
                    ]}>
                      {msg.statut === "traité" ? "✅ Traité" : "⏳ En attente"}
                    </Text>
                  </View>
                </View>

                {/* Message client */}
                <View style={s.messageBubble}>
                  <Text style={s.messageBubbleLabel}>Votre message</Text>
                  <Text style={s.messageBubbleText}>{msg.message}</Text>
                </View>

                {/* Réponse agent */}
                {msg.reponse ? (
                  <View style={s.replyBubble}>
                    <View style={s.replyHeader}>
                      <View style={s.replyAgentIcon}>
                        <Text style={{ fontSize: 14 }}>🏦</Text>
                      </View>
                      <Text style={s.replyAgentLabel}>Réponse Wifak Bank</Text>
                      <Text style={s.replyDate}>{fmtDate(msg.updated_at)}</Text>
                    </View>
                    <Text style={s.replyText}>{msg.reponse}</Text>
                  </View>
                ) : (
                  <View style={s.waitingBox}>
                    <Text style={s.waitingText}>
                      ⏳ Votre message est en cours de traitement. Un agent vous répondra dans les 24h.
                    </Text>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={s.newMsgBtn}
              onPress={() => router.push("/(tabs)/profile-pages/support")}
            >
              <Text style={s.newMsgBtnText}>+ Nouveau message</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  messageCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  messageHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 14 },
  messageIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EBF5FF", justifyContent: "center", alignItems: "center" },
  messageSubject: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", flex: 1 },
  messageDate: { fontSize: 11, color: "#888", marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  messageBubble: { backgroundColor: "#F2F4F8", borderRadius: 12, padding: 12, marginBottom: 10 },
  messageBubbleLabel: { fontSize: 11, fontWeight: "600", color: "#888", marginBottom: 4 },
  messageBubbleText: { fontSize: 14, color: "#333", lineHeight: 20 },
  replyBubble: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: "#16a34a" },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  replyAgentIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center" },
  replyAgentLabel: { fontSize: 12, fontWeight: "700", color: "#16a34a", flex: 1 },
  replyDate: { fontSize: 10, color: "#888" },
  replyText: { fontSize: 14, color: "#166534", lineHeight: 20 },
  waitingBox: { backgroundColor: "#fef3c7", borderRadius: 12, padding: 12 },
  waitingText: { fontSize: 13, color: "#92400e", lineHeight: 20 },
  newMsgBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 },
  newMsgBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
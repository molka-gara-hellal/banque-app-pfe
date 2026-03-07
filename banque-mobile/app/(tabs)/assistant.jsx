import { useState, useRef } from "react";
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

const SUGGESTIONS = [
  "Quel est mon solde ?",
  "Mes dernières transactions",
  "Comment faire un virement ?",
  "Prendre un rendez-vous",
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Bonjour ! Je suis votre assistant Wifak Bank. Comment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    const newMessages = [...messages, { role: "user", text: msg }];
    setMessages(newMessages);
    setLoading(true);

    // Réponses automatiques simples basées sur des mots-clés
    setTimeout(() => {
      let reply = "Je suis en train d'analyser votre demande. Pour toute question urgente, contactez le 71 000 000.";
      const lower = msg.toLowerCase();
      if (lower.includes("solde") || lower.includes("balance")) {
        reply = "Vous pouvez consulter votre solde en temps réel sur la page Accueil ou Comptes de votre application.";
      } else if (lower.includes("virement")) {
        reply = "Pour effectuer un virement, allez sur Accueil → Virement. Saisissez l'IBAN du bénéficiaire, le montant et confirmez.";
      } else if (lower.includes("rendez-vous") || lower.includes("rdv")) {
        reply = "Pour prendre un rendez-vous, accédez à l'onglet Rendez-vous. Vous pouvez choisir la date, l'heure et l'agence de votre choix.";
      } else if (lower.includes("transaction") || lower.includes("historique")) {
        reply = "Votre historique complet est disponible dans l'onglet Comptes → Transactions Récentes, ou directement via Accueil → Historique.";
      } else if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("bonsoir")) {
        reply = "Bonjour ! Je suis votre assistant Wifak Bank. En quoi puis-je vous aider aujourd'hui ?";
      } else if (lower.includes("merci")) {
        reply = "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. 😊";
      }
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerAvatar}>
            <Text style={{ fontSize: 22 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Assistant Wifak</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>En ligne</Text>
            </View>
          </View>
        </View>

        {/* MESSAGES */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.msgRow, m.role === "user" && styles.msgRowUser]}>
              {m.role === "assistant" && (
                <View style={styles.msgAvatar}>
                  <Text style={{ fontSize: 14 }}>🤖</Text>
                </View>
              )}
              <View style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, m.role === "user" && styles.bubbleTextUser]}>
                  {m.text}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.msgRow}>
              <View style={styles.msgAvatar}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
              </View>
              <View style={styles.bubbleBot}>
                <ActivityIndicator size="small" color="#1a3c6e" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* SUGGESTIONS */}
        {messages.length <= 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity key={i} style={styles.suggestionBtn} onPress={() => send(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* INPUT */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Posez votre question..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            placeholderTextColor="#bbb"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8" },

  header: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eef0f5", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EBF5FF", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a2e" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#34C759" },
  onlineText: { fontSize: 12, color: "#34C759", fontWeight: "500" },

  messagesArea: { flex: 1 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, gap: 8 },
  msgRowUser: { flexDirection: "row-reverse" },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#EBF5FF", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  bubble: { maxWidth: "75%", borderRadius: 18, padding: 12 },
  bubbleBot: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  bubbleUser: { backgroundColor: "#1a3c6e" },
  bubbleText: { fontSize: 14, color: "#1a1a2e", lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },

  suggestionsScroll: { maxHeight: 50, marginBottom: 4 },
  suggestionBtn: { backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#dde3ed" },
  suggestionText: { fontSize: 12, color: "#1a3c6e", fontWeight: "500" },

  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#eef0f5", gap: 10 },
  input: { flex: 1, backgroundColor: "#F2F4F8", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#1a1a2e" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1a3c6e", justifyContent: "center", alignItems: "center" },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

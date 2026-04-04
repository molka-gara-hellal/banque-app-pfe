import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

const QUICK_REPLIES = [
  { label: "💰 Mon solde", text: "Comment consulter mon solde ?" },
  { label: "💸 Faire un virement", text: "Comment faire un virement ?" },
  { label: "📅 Prendre un RDV", text: "Comment prendre un rendez-vous en agence ?" },
  { label: "📋 Mes transactions", text: "Comment voir mes dernières transactions ?" },
  { label: "📞 Contacter le support", text: "Je voudrais contacter un conseiller humain." },
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Bonjour ! Je suis votre assistant Wifak Bank. Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");

    const userMsg = { id: Date.now(), role: "user", text: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    scrollToBottom();
    setIsLoading(true);

    try {
      // Construire l'historique pour l'API (exclure le message de bienvenue)
      const apiHistory = updatedMessages
        .filter((m) => m.id !== 1)
        .map((m) => ({ role: m.role, content: m.text }));

      const res = await api.post("/assistant/chat", { messages: apiHistory });
      const reply = res.data.reply;

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: reply },
      ]);
    } catch (e) {
      // Fallback si le backend est inaccessible
      const lower = msg.toLowerCase();
      let fallback = "Je suis désolé, je ne peux pas répondre pour le moment. Veuillez réessayer.";
      if (lower.includes("solde")) fallback = "Vous pouvez consulter votre solde sur la page Accueil ou dans l'onglet Comptes.";
      else if (lower.includes("virement")) fallback = "Pour effectuer un virement, accédez à l'onglet Comptes puis appuyez sur Virement.";
      else if (lower.includes("rendez-vous") || lower.includes("rdv")) fallback = "Pour prendre un rendez-vous, accédez à l'onglet Rendez-vous et choisissez un créneau disponible.";
      else if (lower.includes("transaction") || lower.includes("historique")) fallback = "Vos transactions sont disponibles dans l'onglet Comptes → Historique.";
      else if (lower.includes("support") || lower.includes("conseiller")) fallback = "Pour contacter un conseiller, rendez-vous dans Profil → Contacter le support.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: fallback },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const isUser = (msg) => msg.role === "user";
  const showQuickReplies = messages.length <= 1 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={s.root}>

        {/* HEADER */}
        <View style={s.header}>
          <Image
            source={require("../../assets/images/wifak-logo.png")}
            style={s.headerLogo}
          />
          <Text style={s.headerBrand}>Wifak Bank</Text>
        </View>

        {/* BARRE ASSISTANT */}
        <View style={s.assistantBar}>
          <View style={s.assistantAvatar}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={s.assistantName}>Assistant Wifak</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>En ligne • Répond instantanément</Text>
            </View>
          </View>
        </View>

        {/* ZONE MESSAGES */}
        <ScrollView
          ref={scrollRef}
          style={s.messagesArea}
          contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[s.msgRow, isUser(msg) && s.msgRowUser]}
            >
              {!isUser(msg) && (
                <View style={s.botAvatar}>
                  <Text style={{ fontSize: 14 }}>🤖</Text>
                </View>
              )}
              <View style={[s.bubble, isUser(msg) ? s.bubbleUser : s.bubbleBot]}>
                <Text style={[s.bubbleText, isUser(msg) && s.bubbleTextUser]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {/* TYPING INDICATOR */}
          {isLoading && (
            <View style={s.msgRow}>
              <View style={s.botAvatar}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
              </View>
              <View style={[s.bubbleBot, s.typingBubble]}>
                <View style={s.typingDots}>
                  <View style={[s.dot, s.dot1]} />
                  <View style={[s.dot, s.dot2]} />
                  <View style={[s.dot, s.dot3]} />
                </View>
              </View>
            </View>
          )}

          {/* QUICK REPLIES */}
          {showQuickReplies && (
            <View style={s.quickRepliesContainer}>
              <Text style={s.quickRepliesTitle}>Questions fréquentes :</Text>
              <View style={s.quickRepliesGrid}>
                {QUICK_REPLIES.map((r) => (
                  <TouchableOpacity
                    key={r.text}
                    style={s.quickBtn}
                    onPress={() => send(r.text)}
                  >
                    <Text style={s.quickBtnText}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* INPUT */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Posez votre question..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            editable={!isLoading}
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || isLoading) && s.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLogo: { width: 40, height: 40, resizeMode: "contain" },
  headerBrand: { fontSize: 18, fontWeight: "bold", color: "#1a3c6e" },

  // ASSISTANT BAR
  assistantBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f5",
  },
  assistantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a3c6e",
    justifyContent: "center",
    alignItems: "center",
  },
  assistantName: { fontSize: 14, fontWeight: "bold", color: "#1a1a2e" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#34C759" },
  onlineText: { fontSize: 11, color: "#34C759", fontWeight: "500" },

  // MESSAGES
  messagesArea: { flex: 1 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  msgRowUser: { flexDirection: "row-reverse" },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  bubble: { maxWidth: "78%", borderRadius: 18, padding: 12 },
  bubbleBot: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: { backgroundColor: "#1a3c6e" },
  bubbleText: { fontSize: 14, color: "#1a1a2e", lineHeight: 21 },
  bubbleTextUser: { color: "#fff" },

  // TYPING
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#1a3c6e", opacity: 0.3,
  },
  dot1: { opacity: 0.8 },
  dot2: { opacity: 0.5 },
  dot3: { opacity: 0.2 },

  // QUICK REPLIES
  quickRepliesContainer: { marginTop: 8 },
  quickRepliesTitle: { fontSize: 12, color: "#aaa", marginBottom: 10, fontWeight: "500" },
  quickRepliesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#dde3ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  quickBtnText: { fontSize: 12, color: "#1a3c6e", fontWeight: "600" },

  // INPUT
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef0f5",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F4F8",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1a1a2e",
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1a3c6e",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

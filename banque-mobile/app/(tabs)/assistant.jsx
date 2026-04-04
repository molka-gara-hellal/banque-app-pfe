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

const QUICK_REPLIES = [
  "Mon solde",
  "Dernières transactions",
  "Faire un virement",
  "Prendre un rendez-vous",
  "Contacter le support",
];

const ANTHROPIC_API_KEY = "votre-cle-api-ici"; // Remplacer par votre clé API Claude

export default function AssistantScreen() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant Wifak Bank. Comment puis-je vous aider aujourd'hui ?",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const getBankingContext = () => {
    return `Tu es l'assistant virtuel de Wifak Bank, une banque tunisienne. 
Tu dois:
- Répondre en français uniquement
- Aider les clients avec leurs questions bancaires
- Expliquer les services: virements, comptes, rendez-vous, transactions
- Être poli, professionnel et concis (réponses courtes de 2-3 phrases max)
- Ne pas divulguer d'informations sensibles
- Pour les actions spécifiques (virement, rdv), guider l'utilisateur vers la bonne section de l'app
Services disponibles dans l'app: Tableau de bord, Comptes, Virement, Historique, Rendez-vous, Profil`;
  };

  const sendToClaudeAPI = async (userMessage, conversationHistory) => {
    const apiMessages = conversationHistory
      .filter(m => m.id > 1)
      .map(m => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text,
      }));

    apiMessages.push({ role: "user", content: userMessage });

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: getBankingContext(),
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0]?.text || "Je suis désolé, je n'ai pas pu traiter votre demande.";
    } catch (error) {
      // Fallback responses if API fails
      const lower = userMessage.toLowerCase();
      if (lower.includes("solde")) return "Vous pouvez consulter votre solde en temps réel sur la page Accueil ou Comptes de votre application.";
      if (lower.includes("transaction") || lower.includes("historique")) return "Vos transactions sont disponibles dans l'onglet Historique de votre application.";
      if (lower.includes("virement")) return "Pour effectuer un virement, accédez à l'onglet Virement depuis votre tableau de bord.";
      if (lower.includes("rendez-vous") || lower.includes("rdv")) return "Pour prendre un rendez-vous, accédez à l'onglet Rendez-vous et choisissez un créneau disponible.";
      if (lower.includes("support") || lower.includes("aide")) return "Pour contacter notre support, rendez-vous dans Profil → Contacter le support. Un conseiller vous répondra rapidement.";
      return "Merci pour votre message. Pour une assistance personnalisée, n'hésitez pas à contacter notre support via Profil → Contacter le support.";
    }
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setInput("");

    const userMsg = { id: Date.now(), text: msg, isUser: true };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    setIsLoading(true);
    try {
      const reply = await sendToClaudeAPI(msg, newMessages);
      const botMsg = { id: Date.now() + 1, text: reply, isUser: false };
      setMessages(prev => [...prev, botMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      const botMsg = { id: Date.now() + 1, text: "Désolé, une erreur s'est produite. Veuillez réessayer.", isUser: false };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.root}>
        {/* HEADER BLANC avec logo */}
        <View style={s.headerWhite}>
          <View style={s.headerLeft}>
            <Image source={require("../../assets/images/wifak-logo.png")} style={s.headerLogo} />
            <Text style={s.headerBrand}>Wifak Bank</Text>
          </View>
        </View>

        {/* SOUS-HEADER ASSISTANT */}
        <View style={s.assistantBar}>
          <View style={s.assistantAvatar}>
            <Text style={{ fontSize: 20 }}>💬</Text>
          </View>
          <View>
            <Text style={s.assistantName}>Assistant Wifak</Text>
            <Text style={s.onlineText}>● En ligne</Text>
          </View>
        </View>

        {/* MESSAGES */}
        <ScrollView
          ref={scrollRef}
          style={s.messagesArea}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[s.msgRow, msg.isUser && s.msgRowUser]}>
              {!msg.isUser && (
                <View style={s.botAvatar}><Text style={{ fontSize: 14 }}>💬</Text></View>
              )}
              <View style={[s.bubble, msg.isUser ? s.bubbleUser : s.bubbleBot]}>
                <Text style={[s.bubbleText, msg.isUser && s.bubbleTextUser]}>{msg.text}</Text>
              </View>
            </View>
          ))}

          {/* INDICATEUR TYPING */}
          {isLoading && (
            <View style={s.msgRow}>
              <View style={s.botAvatar}><Text style={{ fontSize: 14 }}>💬</Text></View>
              <View style={s.bubbleBot}>
                <ActivityIndicator size="small" color="#1a3c6e" />
              </View>
            </View>
          )}

          {/* QUICK REPLIES - uniquement au début */}
          {messages.length <= 1 && !isLoading && (
            <View style={s.quickRepliesRow}>
              {QUICK_REPLIES.map(r => (
                <TouchableOpacity key={r} style={s.quickBtn} onPress={() => send(r)}>
                  <Text style={s.quickBtnText}>{r}</Text>
                </TouchableOpacity>
              ))}
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
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || isLoading) && { opacity: 0.4 }]}
            onPress={() => send()}
            disabled={!input.trim() || isLoading}
          >
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  headerWhite: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 40, height: 40, resizeMode: "contain" },
  headerBrand: { fontSize: 18, fontWeight: "bold", color: "#1a3c6e" },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a3c6e",
    justifyContent: "center",
    alignItems: "center",
  },
  assistantName: { fontSize: 14, fontWeight: "bold", color: "#1a1a2e" },
  onlineText: { fontSize: 12, color: "#34C759", fontWeight: "500" },
  messagesArea: { flex: 1 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  msgRowUser: { flexDirection: "row-reverse" },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  bubble: { maxWidth: "75%", borderRadius: 18, padding: 12 },
  bubbleBot: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderRadius: 18,
    padding: 12,
  },
  bubbleUser: { backgroundColor: "#1a3c6e" },
  bubbleText: { fontSize: 14, color: "#1a1a2e", lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  quickRepliesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  quickBtn: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#dde3ed",
  },
  quickBtnText: { fontSize: 12, color: "#1a3c6e", fontWeight: "500" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a3c6e",
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

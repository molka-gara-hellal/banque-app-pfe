import { useRouter } from "expo-router";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../../servives/api";

export default function ContacterSupport() {
  const router = useRouter();
  const { t } = useLanguage();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const channels = [
    { icon: "📞", label: t("support.phone") || "Téléphone", value: "+216 73 487 123", action: () => Linking.openURL("tel:+21673487123") },
    { icon: "📧", label: t("support.email") || "Email", value: "support@wifakbank.tn", action: () => Linking.openURL("mailto:support@wifakbank.tn") },
    { icon: "💬", label: t("support.chat") || "Chat en ligne", value: t("support.chatHours") || "Lundi - Samedi, 8h - 20h", action: null },
  ];

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/support/messages", {
        sujet: subject.trim(),
        message: message.trim(),
      });
      setSent(true);
    } catch (e) {
      setError(e.response?.data?.message || t("support.error") || "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("support.title") || "Contacter le support"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel}>{t("support.contactUs") || "Nous contacter"}</Text>
        {channels.map((c, i) => (
          <TouchableOpacity
            key={i}
            style={s.channelCard}
            onPress={c.action}
            disabled={!c.action}
          >
            <Text style={s.channelIcon}>{c.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.channelLabel}>{c.label}</Text>
              <Text style={s.channelValue}>{c.value}</Text>
            </View>
            {c.action && <Text style={s.channelArrow}>›</Text>}
          </TouchableOpacity>
        ))}

        <Text style={[s.sectionLabel, { marginTop: 8 }]}>{t("support.sendMessage") || "Envoyer un message"}</Text>

        {sent ? (
          <View style={s.successBox}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
            <Text style={s.successTitle}>{t("support.sent") || "Message envoyé !"}</Text>
            <Text style={s.successText}>
              {t("support.sentDesc") || "Votre message a été transmis. Nous vous répondrons dans les 24h."}
            </Text>
            <TouchableOpacity
              style={s.newMsgBtn}
              onPress={() => { setSent(false); setSubject(""); setMessage(""); }}
            >
              <Text style={s.newMsgBtnText}>{t("support.sendAnother") || "Envoyer un autre message"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.formCard}>
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={s.fieldLabel}>{t("support.subject") || "Sujet"}</Text>
            <TextInput
              style={s.input}
              value={subject}
              onChangeText={setSubject}
              placeholder={t("support.subjectPlaceholder") || "Ex: Problème de connexion"}
              placeholderTextColor="#aaa"
            />

            <Text style={s.fieldLabel}>{t("support.message") || "Message"}</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={message}
              onChangeText={setMessage}
              placeholder={t("support.messagePlaceholder") || "Décrivez votre problème..."}
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[s.sendBtn, (!subject.trim() || !message.trim() || loading) && s.btnDisabled]}
              onPress={handleSend}
              disabled={!subject.trim() || !message.trim() || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.sendBtnText}>{t("support.send") || "Envoyer le message"}</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  content: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  channelCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  channelIcon: { fontSize: 24 },
  channelLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  channelValue: { fontSize: 13, color: "#888", marginTop: 2 },
  channelArrow: { fontSize: 20, color: "#ccc" },
  formCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  errorBox: { backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  fieldLabel: { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: "#F2F4F8", borderRadius: 10, padding: 12, fontSize: 14, color: "#1a1a2e", marginBottom: 14 },
  textarea: { minHeight: 110 },
  sendBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  successBox: { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  successTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  successText: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  newMsgBtn: { borderWidth: 1, borderColor: "#1a3c6e", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  newMsgBtnText: { color: "#1a3c6e", fontWeight: "600", fontSize: 14 },
});
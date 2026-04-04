import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ContacterSupport() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!subject || !message) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1500);
  };

  const channels = [
    { icon: "📞", label: "Téléphone", value: "+216 73 487 123", action: () => Linking.openURL("tel:+21673487123") },
    { icon: "📧", label: "Email", value: "support@wifakbank.tn", action: () => Linking.openURL("mailto:support@wifakbank.tn") },
    { icon: "💬", label: "Chat en ligne", value: "Lundi - Samedi, 8h - 20h", action: null },
  ];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Contacter le support</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {/* Canaux de contact */}
        <Text style={s.sectionLabel}>Nous contacter</Text>
        {channels.map((c, i) => (
          <TouchableOpacity key={i} style={s.channelCard} onPress={c.action} disabled={!c.action}>
            <Text style={s.channelIcon}>{c.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.channelLabel}>{c.label}</Text>
              <Text style={s.channelValue}>{c.value}</Text>
            </View>
            {c.action && <Text style={s.channelArrow}>›</Text>}
          </TouchableOpacity>
        ))}

        {/* Formulaire */}
        <Text style={s.sectionLabel}>Envoyer un message</Text>
        {sent ? (
          <View style={s.successBox}>
            <Text style={s.successText}>✅ Message envoyé ! Nous vous répondrons sous 24h.</Text>
          </View>
        ) : (
          <View style={s.formCard}>
            <Text style={s.fieldLabel}>Sujet</Text>
            <TextInput style={s.input} value={subject} onChangeText={setSubject} placeholder="Ex: Problème de connexion" placeholderTextColor="#aaa" />
            <Text style={s.fieldLabel}>Message</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Décrivez votre problème..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[s.sendBtn, (!subject || !message || loading) && s.btnDisabled]}
              onPress={handleSend}
              disabled={!subject || !message || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.sendBtnText}>Envoyer le message</Text>}
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
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  channelCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  channelIcon: { fontSize: 24 },
  channelLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  channelValue: { fontSize: 13, color: "#888", marginTop: 2 },
  channelArrow: { fontSize: 20, color: "#ccc" },
  formCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  fieldLabel: { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: "#F2F4F8", borderRadius: 10, padding: 12, fontSize: 14, color: "#1a1a2e", marginBottom: 14 },
  textarea: { minHeight: 110 },
  sendBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, padding: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  successBox: { backgroundColor: "#dcfce7", borderRadius: 14, padding: 20, alignItems: "center" },
  successText: { color: "#16a34a", fontSize: 14, fontWeight: "600", textAlign: "center" },
});

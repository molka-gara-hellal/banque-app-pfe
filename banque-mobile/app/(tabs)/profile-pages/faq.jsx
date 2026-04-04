import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FAQ_DATA = [
  { q: "Comment effectuer un virement ?", a: "Accédez à votre Tableau de bord, appuyez sur 'Virement', saisissez l'IBAN du destinataire, le montant et le motif, puis confirmez." },
  { q: "Comment prendre un rendez-vous ?", a: "Allez dans l'onglet 'Rendez-vous', choisissez une date et un créneau disponible, sélectionnez le motif et confirmez." },
  { q: "Comment modifier mon mot de passe ?", a: "Rendez-vous dans Profil → Sécurité & Mot de passe. Saisissez votre mot de passe actuel puis choisissez un nouveau." },
  { q: "Que faire si je perd ma carte ?", a: "Contactez immédiatement notre support au +216 XX XXX XXX ou via l'option 'Contacter le support' dans votre profil." },
  { q: "Comment consulter mon historique ?", a: "Depuis le Tableau de bord, appuyez sur 'Historique' ou naviguez via la barre du bas vers 'Transactions'." },
  { q: "Comment activer la double authentification ?", a: "Allez dans Profil → Sécurité & Mot de passe, puis activez l'option 'Authentification à deux facteurs'." },
];

export default function AideFAQ() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Aide & FAQ</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.searchNote}>
          <Text style={s.searchNoteText}>💡 Questions fréquemment posées</Text>
        </View>
        {FAQ_DATA.map((item, i) => (
          <View key={i} style={s.faqCard}>
            <TouchableOpacity style={s.faqQ} onPress={() => setOpenIndex(openIndex === i ? null : i)}>
              <Text style={s.faqQText}>{item.q}</Text>
              <Text style={s.faqArrow}>{openIndex === i ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {openIndex === i && (
              <View style={s.faqA}>
                <Text style={s.faqAText}>{item.a}</Text>
              </View>
            )}
          </View>
        ))}
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
  searchNote: { backgroundColor: "#EBF5FF", borderRadius: 12, padding: 12, marginBottom: 16 },
  searchNoteText: { fontSize: 13, color: "#1a3c6e", fontWeight: "600" },
  faqCard: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 10, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  faqQ: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  faqQText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1a1a2e", paddingRight: 12, lineHeight: 20 },
  faqArrow: { fontSize: 12, color: "#888" },
  faqA: { backgroundColor: "#F8FAFB", padding: 16, borderTopWidth: 1, borderTopColor: "#eef0f5" },
  faqAText: { fontSize: 13, color: "#555", lineHeight: 20 },
});

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SECTIONS = [
  { title: "1. Acceptation des conditions", content: "En utilisant l'application Wifak Bank, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application." },
  { title: "2. Services proposés", content: "Wifak Bank vous offre un accès à vos comptes bancaires, la possibilité d'effectuer des virements, de consulter vos transactions, de prendre des rendez-vous et d'utiliser notre assistant virtuel." },
  { title: "3. Sécurité et confidentialité", content: "Vos données personnelles sont protégées conformément à la loi tunisienne sur la protection des données. Nous utilisons des protocoles de chiffrement SSL/TLS pour sécuriser toutes les communications." },
  { title: "4. Responsabilité", content: "Wifak Bank décline toute responsabilité pour les dommages résultant d'une utilisation non autorisée de votre compte. Vous êtes responsable de la confidentialité de vos identifiants de connexion." },
  { title: "5. Modification des conditions", content: "Wifak Bank se réserve le droit de modifier ces conditions à tout moment. Les modifications seront notifiées via l'application. L'utilisation continue de l'application vaut acceptation des nouvelles conditions." },
  { title: "6. Contact", content: "Pour toute question concernant ces conditions, contactez-nous à legal@wifakbank.tn ou au +216 73 487 123." },
];

export default function ConditionsUtilisation() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backArrow}>←</Text></TouchableOpacity>
        <Text style={s.title}>Conditions d'utilisation</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.lastUpdate}>Dernière mise à jour : 1er Janvier 2026</Text>
        {SECTIONS.map((sec, i) => (
          <View key={i} style={s.section}>
            <Text style={s.secTitle}>{sec.title}</Text>
            <Text style={s.secContent}>{sec.content}</Text>
          </View>
        ))}
        <View style={s.footer}>
          <Text style={s.footerText}>© 2026 Wifak Bank. Tous droits réservés.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eef0f5" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 15, fontWeight: "700", color: "#1a3c6e" },
  content: { padding: 20 },
  lastUpdate: { fontSize: 12, color: "#888", marginBottom: 20, textAlign: "center" },
  section: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  secTitle: { fontSize: 14, fontWeight: "700", color: "#1a3c6e", marginBottom: 8 },
  secContent: { fontSize: 13, color: "#555", lineHeight: 22 },
  footer: { alignItems: "center", marginTop: 12, marginBottom: 8 },
  footerText: { fontSize: 12, color: "#888" },
});

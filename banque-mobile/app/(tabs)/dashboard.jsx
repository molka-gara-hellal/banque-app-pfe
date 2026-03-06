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
import api from "../../servives/api";
import { getUser, removeToken } from "../../store/authStore";

export default function DashboardScreen() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await getUser();
      setUser(u);
      const res = await api.get("/accounts/me");
      setAccount(res.data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a3c6e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.userName}>{user?.email || "Client"}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Carte solde */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Solde disponible</Text>
        <Text style={styles.cardBalance}>
          {account?.balance ?? "—"} {account?.currency ?? "TND"}
        </Text>
        <Text style={styles.cardIban}>IBAN : {account?.iban ?? "—"}</Text>
      </View>

      {/* Actions rapides */}
      <Text style={styles.sectionTitle}>Accès rapide</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push("/(tabs)/transactions")}
        >
          <Text style={styles.actionIcon}>💳</Text>
          <Text style={styles.actionLabel}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push("/(tabs)/rdv")}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionLabel}>Rendez-vous</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: "#888",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a3c6e",
  },
  logoutBtn: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1a3c6e",
    borderRadius: 20,
    padding: 28,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardLabel: {
    color: "#a8c0e8",
    fontSize: 14,
    marginBottom: 8,
  },
  cardBalance: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 12,
  },
  cardIban: {
    color: "#a8c0e8",
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a3c6e",
  },
});

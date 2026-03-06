import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../../servives/api";

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemIcon}>
          {item.type === "credit" ? "⬆️" : "⬇️"}
        </Text>
        <View>
          <Text style={styles.itemDesc}>
            {item.description || (item.type === "credit" ? "Crédit" : "Débit")}
          </Text>
          <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.itemAmount,
          { color: item.type === "credit" ? "#16a34a" : "#dc2626" },
        ]}
      >
        {item.type === "credit" ? "+" : "-"}
        {item.amount} TND
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a3c6e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Stats rapides */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#dcfce7" }]}>
          <Text style={styles.statLabel}>Crédits</Text>
          <Text style={[styles.statValue, { color: "#16a34a" }]}>
            {transactions.filter((t) => t.type === "credit").length}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#fee2e2" }]}>
          <Text style={styles.statLabel}>Débits</Text>
          <Text style={[styles.statValue, { color: "#dc2626" }]}>
            {transactions.filter((t) => t.type === "debit").length}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#e0f2fe" }]}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={[styles.statValue, { color: "#0284c7" }]}>
            {transactions.length}
          </Text>
        </View>
      </View>

      {/* Liste */}
      {transactions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aucune transaction trouvée</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    marginBottom: 20,
  },
  backBtn: {
    color: "#1a3c6e",
    fontSize: 15,
    fontWeight: "600",
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a3c6e",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  itemDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
});

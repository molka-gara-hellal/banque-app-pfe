import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";

const CATEGORIES = ["Tous", "Achats", "Alimentation", "Factures", "Virements"];

const CATEGORY_CONFIG = {
  Achats:       { icon: "🛍️", bg: "#FFF0F0" },
  Alimentation: { icon: "🍔", bg: "#FFF5E6" },
  Facture:      { icon: "📄", bg: "#F0EFFF" },
  Factures:     { icon: "📄", bg: "#F0EFFF" },
  Virement:     { icon: "↗",  bg: "#EDFFF2" },
  Virements:    { icon: "↗",  bg: "#EDFFF2" },
  Retrait:      { icon: "💶", bg: "#EBF5FF" },
  default:      { icon: "💳", bg: "#F5F5F5" },
};

const getCat = (label = "") => {
  for (const key of Object.keys(CATEGORY_CONFIG)) {
    if (label.toLowerCase().includes(key.toLowerCase())) return CATEGORY_CONFIG[key];
  }
  return CATEGORY_CONFIG.default;
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");

  useEffect(() => {
    api.get("/transactions")
      .then(r => setTransactions(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(tx => {
    const label = tx.label || tx.description || tx.type || "";
    const matchSearch = label.toLowerCase().includes(search.toLowerCase());
    if (activeCategory === "Tous") return matchSearch;
    return matchSearch && label.toLowerCase().includes(activeCategory.toLowerCase().slice(0, -1));
  });

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Historique</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* SEARCH */}
      <View style={s.searchWrapper}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Rechercher une transaction..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* CATÉGORIES - scrollable horizontal */}
      <View style={s.catsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.catBtn, activeCategory === item && s.catBtnActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[s.catText, activeCategory === item && s.catTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 8 }}
        />
      </View>

      {/* LISTE */}
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => item.id?.toString() || i.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Aucune transaction trouvée</Text>
          </View>
        }
        renderItem={({ item }) => {
          const label = item.label || item.description || item.type || "Transaction";
          const cat = getCat(label);
          const amt = parseFloat(item.amount);
          return (
            <View style={s.txRow}>
              <View style={[s.txIcon, { backgroundColor: cat.bg }]}>
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
              </View>
              <View style={s.txInfo}>
                <Text style={s.txLabel}>{label}</Text>
                <Text style={s.txCat}>{activeCategory !== "Tous" ? activeCategory : "Transaction"}</Text>
                <Text style={s.txDate}>{fmtDate(item.created_at || item.date)}</Text>
              </View>
              <Text style={[s.txAmt, { color: amt >= 0 ? "#34C759" : "#FF3B30" }]}>
                {amt >= 0 ? "+" : ""}{amt.toFixed(2)} TND
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F2F4F8",
  },
  backArrow: { fontSize: 24, color: "#1a3c6e" },
  title: { fontSize: 20, fontWeight: "bold", color: "#1a3c6e" },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dde3ed",
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#1a1a2e" },
  catsWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  catBtnActive: { backgroundColor: "#1a3c6e" },
  catText: { fontSize: 13, fontWeight: "600", color: "#555" },
  catTextActive: { color: "#fff" },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  txCat: { fontSize: 12, color: "#888", marginTop: 1 },
  txDate: { fontSize: 11, color: "#aaa", marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "bold" },
  emptyBox: { padding: 24, alignItems: "center" },
  emptyText: { color: "#aaa", fontSize: 14 },
});

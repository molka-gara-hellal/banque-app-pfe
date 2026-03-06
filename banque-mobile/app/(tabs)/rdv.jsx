import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import api from "../../servives/api";

export default function RdvScreen() {
  const router = useRouter();
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [form, setForm] = useState({
    datetime: "",
    reason: "",
  });

  useEffect(() => {
    loadRdvs();
  }, []);

  const loadRdvs = async () => {
    try {
      const res = await api.get("/appointments");
      setRdvs(res.data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setForm({ datetime: "", reason: "" });
    setModalVisible(true);
  };

  const openEditModal = (rdv) => {
    setEditMode(true);
    setSelectedRdv(rdv);
    setForm({
      datetime: rdv.datetime?.slice(0, 16) || "",
      reason: rdv.reason || "",
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.datetime || !form.reason) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    try {
      if (editMode) {
        await api.put(`/appointments/${selectedRdv.id}`, form);
        Alert.alert("Succès", "Rendez-vous modifié");
      } else {
        await api.post("/appointments", form);
        Alert.alert("Succès", "Rendez-vous créé");
      }
      setModalVisible(false);
      loadRdvs();
    } catch (err) {
      Alert.alert("Erreur", err.response?.data?.message || "Opération échouée");
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Confirmer", "Voulez-vous annuler ce rendez-vous ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui, annuler",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/appointments/${id}`);
            loadRdvs();
          } catch (err) {
            Alert.alert("Erreur", "Suppression échouée");
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "confirmed":
        return { bg: "#dcfce7", color: "#16a34a", label: "✅ Confirmé" };
      case "cancelled":
        return { bg: "#fee2e2", color: "#dc2626", label: "❌ Annulé" };
      default:
        return { bg: "#fef9c3", color: "#ca8a04", label: "⏳ En attente" };
    }
  };

  const renderItem = ({ item }) => {
    const status = getStatusStyle(item.status);
    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemDate}>📅 {formatDate(item.datetime)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text style={styles.itemReason}>Motif : {item.reason}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editBtnText}>✏️ Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteBtnText}>🗑️ Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={styles.title}>Rendez-vous</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
          <Text style={styles.addBtnText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      {rdvs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aucun rendez-vous</Text>
          <TouchableOpacity
            style={styles.createFirstBtn}
            onPress={openCreateModal}
          >
            <Text style={styles.createFirstText}>Prendre un rendez-vous</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rdvs}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal Créer / Modifier */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editMode ? "✏️ Modifier le RDV" : "📅 Nouveau RDV"}
            </Text>

            <Text style={styles.inputLabel}>
              Date et heure (YYYY-MM-DDTHH:MM)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 2025-03-15T10:00"
              value={form.datetime}
              onChangeText={(v) => setForm({ ...form, datetime: v })}
            />

            <Text style={styles.inputLabel}>Motif</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="ex: Demande de crédit, conseil..."
              value={form.reason}
              onChangeText={(v) => setForm({ ...form, reason: v })}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>
                  {editMode ? "Modifier" : "Créer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    backgroundColor: "#1a3c6e",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemReason: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: "row",
    gap: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editBtnText: {
    color: "#1a3c6e",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    marginBottom: 16,
  },
  createFirstBtn: {
    backgroundColor: "#1a3c6e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createFirstText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a3c6e",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f5f7fa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#dde3ed",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelModalText: {
    color: "#555",
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1,
    backgroundColor: "#1a3c6e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

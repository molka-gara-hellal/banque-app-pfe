import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../servives/api";

const RAISONS_ANNULATION = ["Empêchement", "Changement de plan", "Problème résolu", "Autre"];
const MOTIFS_RDV = ["Demande de conseil", "Ouverture de compte", "Crédit immobilier", "Autre"];

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR = ["L","M","M","J","V","S","D"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function formatHeure(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function formatDateChip(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function isPast(dateStr) { return new Date(dateStr) < new Date(); }

function getStatusLabel(status) {
  if (status === "cancelled") return "Annulé";
  if (status === "completed") return "Terminé";
  if (status === "pending") return "En attente";
  return "Confirmé";
}
function getStatusColor(status) {
  if (status === "cancelled") return "#FF3B30";
  if (status === "completed") return "#888";
  if (status === "pending") return "#FF9500";
  return "#34C759";
}
function toDisplayTime(heure) {
  if (!heure) return "—";
  return String(heure).slice(0, 5);
}

function buildMonthDays(dateStr) {
  const current = dateStr ? new Date(dateStr) : new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  const first = new Date(year, month, 1);
  const jsDay = first.getDay();
  const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < mondayIndex; i++) cells.push({ key: `e-${i}`, empty: true });
  for (let d = 1; d <= totalDays; d++) cells.push({ key: `d-${d}`, day: d, empty: false });
  return { monthLabel: `${MONTHS_FR[month]} ${year}`, cells };
}

export default function RdvScreen() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("avenir");
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRaison, setSelectedRaison] = useState("Empêchement");
  const [createReason, setCreateReason] = useState("Demande de conseil");
  const [selectedCreateDispoId, setSelectedCreateDispoId] = useState(null);
  const [createDateObj, setCreateDateObj] = useState(null);
  const [disponibilites, setDisponibilites] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    setLoading(true);
    try { await Promise.all([loadRdvs(), loadDispos()]); }
    finally { setLoading(false); }
  }
  async function loadRdvs() {
    try { const r = await api.get("/appointments"); setRdvs(r.data || []); }
    catch { setRdvs([]); }
  }
  async function loadDispos() {
    try {
      const r = await api.get("/appointments/disponibilites");
      const data = r.data || [];
      setDisponibilites(data);
      setCreateDateObj(data[0] || null);
    } catch { setDisponibilites([]); setCreateDateObj(null); }
  }

  const rdvsAvenir = useMemo(() => rdvs.filter(r => !isPast(r.datetime) && r.status !== "cancelled"), [rdvs]);
  const rdvsPasses = useMemo(() => rdvs.filter(r => isPast(r.datetime) || r.status === "cancelled"), [rdvs]);
  const displayed = activeTab === "avenir" ? rdvsAvenir : rdvsPasses;

  async function handleCreate() {
    if (!selectedCreateDispoId || !createReason) return;
    setCreateLoading(true);
    try {
      await api.post("/appointments", {
        disponibilite_id: selectedCreateDispoId,
        reason: createReason,
        agence: "Wifak Bank",
        conseiller: "Conseiller Clientèle",
      });
      setShowCreate(false);
      await Promise.all([loadRdvs(), loadDispos()]);
    } catch (e) { console.log(e?.response?.data); }
    finally { setCreateLoading(false); }
  }

  async function handleConfirmCancel() {
    if (!selectedRdv) return;
    setActionLoading(true);
    try {
      await api.delete(`/appointments/${selectedRdv.id}`, { data: { raison_annulation: selectedRaison } });
      setShowCancel(false);
      await loadRdvs();
    } catch (e) { console.log(e?.response?.data); }
    finally { setActionLoading(false); }
  }

  const calendarData = buildMonthDays(selectedRdv?.datetime);
  const selectedDayNum = selectedRdv ? new Date(selectedRdv.datetime).getDate() : null;

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#1a3c6e" /></View>;

  return (
    <View style={s.root}>
      {/* HEADER WIFAK */}
      <View style={s.headerWhite}>
        <View style={s.headerLeft}>
          <Image source={require("../../assets/images/wifak-logo.png")} style={s.headerLogo} />
          <Text style={s.headerBrand}>Wifak Bank</Text>
        </View>
      </View>

      <View style={s.container}>
        <View style={s.topRow}>
          <Text style={s.pageTitle}>Mes Rendez-vous</Text>
          <TouchableOpacity
            style={s.newBtn}
            onPress={() => {
              setSelectedCreateDispoId(null);
              setCreateReason("Demande de conseil");
              setCreateDateObj(disponibilites[0] || null);
              setShowCreate(true);
            }}
          >
            <Text style={s.newBtnText}>+ Nouveau</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={s.tabsRow}>
          {["avenir", "passes"].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === "avenir" ? "À venir" : "Passés"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {displayed.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>
                {activeTab === "avenir" ? "Aucun rendez-vous à venir" : "Aucun rendez-vous passé"}
              </Text>
              {activeTab === "avenir" && (
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => {
                    setSelectedCreateDispoId(null);
                    setCreateReason("Demande de conseil");
                    setCreateDateObj(disponibilites[0] || null);
                    setShowCreate(true);
                  }}
                >
                  <Text style={s.emptyBtnText}>Prendre un rendez-vous</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            displayed.map(rdv => (
              <TouchableOpacity key={rdv.id} style={s.rdvCard} onPress={() => { setSelectedRdv(rdv); setShowDetail(true); }}>
                <View style={s.rdvLeft}>
                  <Text style={s.rdvAgence}>{rdv.agence || "Wifak Bank"}</Text>
                  <Text style={s.rdvDate}>{formatDate(rdv.datetime)} • {formatHeure(rdv.datetime)}</Text>
                  <Text style={s.rdvMotif}>{rdv.reason}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: getStatusColor(rdv.status) + "20" }]}>
                  <Text style={[s.statusText, { color: getStatusColor(rdv.status) }]}>
                    {getStatusLabel(rdv.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* MODAL DETAIL */}
      <Modal transparent visible={showDetail} animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Text style={s.modalBack}>←</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Rendez-vous</Text>
              <View style={{ width: 32 }} />
            </View>
            {selectedRdv && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* CALENDRIER */}
                <View style={s.calCard}>
                  <Text style={s.calMonth}>{calendarData.monthLabel}</Text>
                  <View style={s.weekRow}>
                    {DAYS_FR.map((d, i) => <Text key={i} style={s.weekDay}>{d}</Text>)}
                  </View>
                  <View style={s.daysGrid}>
                    {calendarData.cells.map(cell => (
                      <View key={cell.key} style={s.dayCell}>
                        {!cell.empty && (
                          <View style={[s.dayCircle, cell.day === selectedDayNum && s.dayCircleActive]}>
                            <Text style={[s.dayText, cell.day === selectedDayNum && s.dayTextActive]}>
                              {cell.day}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                  {/* STATUS */}
                  <View style={[s.statusBadge, { backgroundColor: getStatusColor(selectedRdv.status) + "20", alignSelf: "flex-start", marginBottom: 8 }]}>
                    <Text style={[s.statusText, { color: getStatusColor(selectedRdv.status) }]}>
                      {getStatusLabel(selectedRdv.status)}
                    </Text>
                  </View>
                  <Text style={s.detailDate}>
                    {formatDate(selectedRdv.datetime)} • {formatHeure(selectedRdv.datetime)}
                  </Text>
                </View>

                {/* AGENCE */}
                <View style={s.infoCard}>
                  <Text style={s.infoIcon}>🏦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.infoTitle}>{selectedRdv.agence || "Wifak Bank"}</Text>
                    <Text style={s.infoSub}>123 Rue Principale, Tunis</Text>
                  </View>
                </View>

                {/* MOTIF */}
                <View style={s.motifBox}>
                  <Text style={s.motifLabel}>Motif</Text>
                  <Text style={s.motifValue}>{selectedRdv.reason}</Text>
                </View>

                {/* ACTIONS */}
                {selectedRdv.status !== "cancelled" && !isPast(selectedRdv.datetime) && (
                  <TouchableOpacity
                    style={s.cancelRdvBtn}
                    onPress={() => { setShowDetail(false); setTimeout(() => setShowCancel(true), 300); }}
                  >
                    <Text style={s.cancelRdvText}>Annuler le rendez-vous</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL ANNULATION */}
      <Modal transparent visible={showCancel} animationType="slide" onRequestClose={() => setShowCancel(false)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { maxHeight: "60%" }]}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Raison d annulation</Text>
            <View style={{ marginTop: 16, marginBottom: 24 }}>
              {RAISONS_ANNULATION.map(r => (
                <TouchableOpacity key={r} style={s.raisonRow} onPress={() => setSelectedRaison(r)}>
                  <Text style={s.raisonText}>{r}</Text>
                  <View style={[s.radio, selectedRaison === r && s.radioActive]}>
                    {selectedRaison === r && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={s.btnSecondary} onPress={() => setShowCancel(false)}>
                <Text style={s.btnSecondaryText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnDanger, actionLoading && s.btnDisabled]} onPress={handleConfirmCancel} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnDangerText}>Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CRÉATION */}
      <Modal transparent visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={s.modalBack}>←</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Nouveau rendez-vous</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {disponibilites.length === 0 ? (
                <Text style={s.noSlot}>Aucun créneau disponible pour le moment</Text>
              ) : (
                <>
                  <Text style={s.sectionLabel}>Choisir une date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {disponibilites.map(item => (
                      <TouchableOpacity
                        key={item.date}
                        style={[s.dateChip, createDateObj?.date === item.date && s.dateChipActive]}
                        onPress={() => { setCreateDateObj(item); setSelectedCreateDispoId(null); }}
                      >
                        <Text style={[s.dateChipText, createDateObj?.date === item.date && s.dateChipTextActive]}>
                          {formatDateChip(item.date)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={s.sectionLabel}>Heure</Text>
                  {createDateObj?.creneaux?.length ? (
                    createDateObj.creneaux.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[s.creneauRow, selectedCreateDispoId === c.id && s.creneauRowActive]}
                        onPress={() => setSelectedCreateDispoId(c.id)}
                      >
                        <Text style={[s.creneauText, selectedCreateDispoId === c.id && s.creneauTextActive]}>
                          {toDisplayTime(c.heure)}
                        </Text>
                        <View style={[s.radio, selectedCreateDispoId === c.id && s.radioActive]}>
                          {selectedCreateDispoId === c.id && <View style={s.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : <Text style={s.noSlot}>Aucun créneau disponible</Text>}

                  <Text style={s.sectionLabel}>Motif</Text>
                  {MOTIFS_RDV.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.creneauRow, createReason === m && s.creneauRowActive]}
                      onPress={() => setCreateReason(m)}
                    >
                      <Text style={[s.creneauText, createReason === m && s.creneauTextActive]}>{m}</Text>
                      <View style={[s.radio, createReason === m && s.radioActive]}>
                        {createReason === m && <View style={s.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={[s.confirmBtn, (!selectedCreateDispoId || createLoading) && s.btnDisabled]}
                    onPress={handleCreate}
                    disabled={!selectedCreateDispoId || createLoading}
                  >
                    {createLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmBtnText}>Confirmer le rendez-vous</Text>}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerWhite: {
    flexDirection: "row",
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#1a3c6e" },
  newBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  newBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  tabsRow: {
    backgroundColor: "#E9EEF5",
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
    marginBottom: 16,
  },
  tabBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff" },
  tabText: { color: "#888", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#1a3c6e", fontWeight: "700" },
  list: { paddingBottom: 100 },
  emptyBox: { backgroundColor: "#fff", borderRadius: 18, padding: 28, alignItems: "center" },
  emptyText: { color: "#888", fontSize: 14, textAlign: "center" },
  emptyBtn: { backgroundColor: "#1a3c6e", borderRadius: 12, marginTop: 14, paddingHorizontal: 16, paddingVertical: 12 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  rdvCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  rdvLeft: { flex: 1, paddingRight: 12 },
  rdvAgence: { fontSize: 14, fontWeight: "700", color: "#1a3c6e", marginBottom: 4 },
  rdvDate: { fontSize: 12, color: "#555", marginBottom: 2 },
  rdvMotif: { fontSize: 12, color: "#888" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#f8fafc", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, maxHeight: "92%" },
  handle: { width: 64, height: 6, borderRadius: 999, backgroundColor: "#D7DEE8", alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalBack: { fontSize: 22, color: "#1a3c6e", fontWeight: "700" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  calCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#eef0f5", marginBottom: 14 },
  calMonth: { textAlign: "center", fontSize: 15, fontWeight: "700", color: "#1a3c6e", marginBottom: 12 },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekDay: { width: "14.28%", textAlign: "center", fontSize: 11, color: "#888", fontWeight: "700" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  dayCell: { width: "14.28%", height: 34, justifyContent: "center", alignItems: "center" },
  dayCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  dayCircleActive: { backgroundColor: "#1a3c6e" },
  dayText: { fontSize: 12, color: "#333", fontWeight: "500" },
  dayTextActive: { color: "#fff", fontWeight: "700" },
  detailDate: { fontSize: 13, color: "#555", fontWeight: "500" },
  infoCard: { backgroundColor: "#f0f8ee", borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 },
  infoIcon: { fontSize: 28 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: "#1a3c6e", marginBottom: 2 },
  infoSub: { fontSize: 12, color: "#666" },
  motifBox: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: "#eef0f5" },
  motifLabel: { fontSize: 12, color: "#888", fontWeight: "700", marginBottom: 6 },
  motifValue: { fontSize: 14, color: "#333" },
  cancelRdvBtn: { alignItems: "center", paddingVertical: 14 },
  cancelRdvText: { color: "#FF3B30", fontSize: 14, fontWeight: "700" },
  raisonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  raisonText: { fontSize: 14, color: "#333" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#ccc", justifyContent: "center", alignItems: "center" },
  radioActive: { borderColor: "#1a3c6e" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1a3c6e" },
  actionRow: { flexDirection: "row", gap: 12 },
  btnSecondary: { flex: 1, backgroundColor: "#e5e7eb", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText: { color: "#555", fontWeight: "700" },
  btnDanger: { flex: 1, backgroundColor: "#FF3B30", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnDangerText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#1a3c6e", marginBottom: 10, marginTop: 8 },
  dateChip: { backgroundColor: "#f3f6fa", borderWidth: 1, borderColor: "#e4eaf2", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10 },
  dateChipActive: { backgroundColor: "#1a3c6e", borderColor: "#1a3c6e" },
  dateChipText: { color: "#333", fontSize: 13, fontWeight: "700" },
  dateChipTextActive: { color: "#fff" },
  creneauRow: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: "#eef0f5", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  creneauRowActive: { backgroundColor: "#EBF5FF", borderColor: "#1a3c6e" },
  creneauText: { color: "#333", fontSize: 13, fontWeight: "600" },
  creneauTextActive: { color: "#1a3c6e" },
  noSlot: { color: "#888", fontSize: 13, marginBottom: 14 },
  confirmBtn: { backgroundColor: "#1a3c6e", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  confirmBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

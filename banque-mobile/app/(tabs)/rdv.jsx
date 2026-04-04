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

function buildMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const jsDay = first.getDay();
  const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < mondayIndex; i++) cells.push({ key: `e-${i}`, empty: true });
  for (let d = 1; d <= totalDays; d++) cells.push({ key: `d-${d}`, day: d, empty: false });
  return cells;
}

export default function RdvScreen() {
  const today = new Date();
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("avenir");

  // Calendar state
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  // Time & motif selection
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedMotif, setSelectedMotif] = useState("Demande de conseil");

  // Modals
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [selectedRaison, setSelectedRaison] = useState("Empêchement");

  // Disponibilités
  const [disponibilites, setDisponibilites] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

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
      setDisponibilites(r.data || []);
    } catch { setDisponibilites([]); }
  }

  const rdvsAvenir = useMemo(() => rdvs.filter(r => !isPast(r.datetime) && r.status !== "cancelled"), [rdvs]);
  const rdvsPasses = useMemo(() => rdvs.filter(r => isPast(r.datetime) || r.status === "cancelled"), [rdvs]);
  const displayed = activeTab === "avenir" ? rdvsAvenir : rdvsPasses;

  // Build calendar cells for current view
  const calCells = buildMonthDays(calYear, calMonth);
  const monthLabel = `${MONTHS_FR[calMonth]} ${calYear}`;

  // Find disponibilites for selected date
  const selectedDateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const dispoForDate = disponibilites.find(d => d.date === selectedDateStr);
  const availableTimes = dispoForDate?.creneaux || [];

  // Days that have availability
  const availableDays = new Set(
    disponibilites.map(d => {
      const [y, m, day] = d.date.split("-");
      if (parseInt(y) === calYear && parseInt(m) === calMonth + 1) return parseInt(day);
      return null;
    }).filter(Boolean)
  );

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
    setSelectedTime(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
    setSelectedTime(null);
  }

  async function handleCreate() {
    if (!selectedTime || !selectedMotif) return;
    const creneau = availableTimes.find(c => toDisplayTime(c.heure) === selectedTime);
    if (!creneau) return;
    setCreateLoading(true);
    try {
      await api.post("/appointments", {
        disponibilite_id: creneau.id,
        reason: selectedMotif,
        agence: "Wifak Bank",
        conseiller: "Conseiller Clientèle",
      });
      setCreateSuccess(true);
      setSelectedTime(null);
      await Promise.all([loadRdvs(), loadDispos()]);
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (e) { console.log(e?.response?.data); }
    finally { setCreateLoading(false); }
  }

  async function handleConfirmCancel() {
    if (!selectedRdv) return;
    setActionLoading(true);
    try {
      await api.delete(`/appointments/${selectedRdv.id}`, { data: { raison_annulation: selectedRaison } });
      setShowCancel(false);
      setShowDetail(false);
      await loadRdvs();
    } catch (e) { console.log(e?.response?.data); }
    finally { setActionLoading(false); }
  }

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#1a3c6e" />
    </View>
  );

  return (
    <View style={s.root}>
      {/* HEADER */}
      <View style={s.header}>
        <Image source={require("../../assets/images/wifak-logo.png")} style={s.headerLogo} />
        <Text style={s.headerBrand}>Wifak Bank</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Text style={s.pageTitle}>Mes Rendez-vous</Text>

        {/* CALENDRIER */}
        <View style={s.calCard}>
          <View style={s.calNav}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
              <Text style={s.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={s.calMonthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
              <Text style={s.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Jours de semaine */}
          <View style={s.weekRow}>
            {DAYS_FR.map((d, i) => (
              <Text key={i} style={s.weekDay}>{d}</Text>
            ))}
          </View>

          {/* Grille jours */}
          <View style={s.daysGrid}>
            {calCells.map(cell => (
              <View key={cell.key} style={s.dayCell}>
                {!cell.empty && (
                  <TouchableOpacity
                    style={[
                      s.dayCircle,
                      selectedDay === cell.day && s.dayCircleActive,
                      availableDays.has(cell.day) && selectedDay !== cell.day && s.dayCircleAvailable,
                    ]}
                    onPress={() => { setSelectedDay(cell.day); setSelectedTime(null); }}
                  >
                    <Text style={[
                      s.dayText,
                      selectedDay === cell.day && s.dayTextActive,
                    ]}>
                      {cell.day}
                    </Text>
                    {availableDays.has(cell.day) && selectedDay !== cell.day && (
                      <View style={s.availableDot} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* CRÉNEAUX HORAIRES */}
        <Text style={s.sectionTitle}>Heure</Text>
        {availableTimes.length === 0 ? (
          <Text style={s.noSlot}>Aucun créneau disponible pour cette date</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.timesRow}>
            {availableTimes.map(c => {
              const t = toDisplayTime(c.heure);
              const active = selectedTime === t;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[s.timeChip, active && s.timeChipActive]}
                  onPress={() => setSelectedTime(t)}
                >
                  <Text style={[s.timeChipText, active && s.timeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* MOTIF */}
        <Text style={s.sectionTitle}>Motif</Text>
        <View style={s.motifsList}>
          {MOTIFS_RDV.map(m => (
            <TouchableOpacity
              key={m}
              style={[s.motifRow, selectedMotif === m && s.motifRowActive]}
              onPress={() => setSelectedMotif(m)}
            >
              <Text style={[s.motifText, selectedMotif === m && s.motifTextActive]}>{m}</Text>
              <View style={[s.radio, selectedMotif === m && s.radioActive]}>
                {selectedMotif === m && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUCCESS MESSAGE */}
        {createSuccess && (
          <View style={s.successBox}>
            <Text style={s.successText}>✅ Rendez-vous confirmé !</Text>
          </View>
        )}

        {/* BOUTON PRENDRE RDV */}
        <TouchableOpacity
          style={[s.confirmBtn, (!selectedTime || createLoading) && s.btnDisabled]}
          onPress={handleCreate}
          disabled={!selectedTime || createLoading}
        >
          {createLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.confirmBtnText}>Prendre rendez-vous</Text>
          }
        </TouchableOpacity>

        {/* LISTE RDV À VENIR */}
        <Text style={s.sectionTitle}>Rendez-vous à venir</Text>

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

        {displayed.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>
              {activeTab === "avenir" ? "Aucun rendez-vous à venir" : "Aucun rendez-vous passé"}
            </Text>
          </View>
        ) : (
          displayed.map(rdv => (
            <TouchableOpacity
              key={rdv.id}
              style={s.rdvCard}
              onPress={() => { setSelectedRdv(rdv); setShowDetail(true); }}
            >
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

      {/* MODAL DÉTAIL */}
      <Modal transparent visible={showDetail} animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Text style={s.modalBack}>←</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Détail du rendez-vous</Text>
              <View style={{ width: 32 }} />
            </View>
            {selectedRdv && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.detailCard}>
                  <View style={[s.statusBadge, { backgroundColor: getStatusColor(selectedRdv.status) + "20", marginBottom: 10 }]}>
                    <Text style={[s.statusText, { color: getStatusColor(selectedRdv.status) }]}>
                      {getStatusLabel(selectedRdv.status)}
                    </Text>
                  </View>
                  <Text style={s.detailDate}>{formatDate(selectedRdv.datetime)}</Text>
                  <Text style={s.detailTime}>{formatHeure(selectedRdv.datetime)}</Text>
                </View>

                <View style={s.infoCard}>
                  <Text style={s.infoIcon}>🏦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.infoTitle}>{selectedRdv.agence || "Wifak Bank"}</Text>
                    <Text style={s.infoSub}>Ksar Hellal, Monastir</Text>
                  </View>
                </View>

                <View style={s.motifDetailBox}>
                  <Text style={s.motifDetailLabel}>Motif</Text>
                  <Text style={s.motifDetailValue}>{selectedRdv.reason}</Text>
                </View>

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
          <View style={[s.sheet, { maxHeight: "55%" }]}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Raison d'annulation</Text>
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
              <TouchableOpacity
                style={[s.btnDanger, actionLoading && s.btnDisabled]}
                onPress={handleConfirmCancel}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnDangerText}>Confirmer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F4F8" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLogo: { width: 40, height: 40, resizeMode: "contain" },
  headerBrand: { fontSize: 18, fontWeight: "bold", color: "#1a3c6e" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#1a3c6e", marginBottom: 16 },

  // CALENDAR
  calCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  navBtn: { padding: 6 },
  navArrow: { fontSize: 24, color: "#1a3c6e", fontWeight: "600" },
  calMonthLabel: { fontSize: 15, fontWeight: "700", color: "#1a3c6e" },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekDay: { width: "14.28%", textAlign: "center", fontSize: 11, color: "#aaa", fontWeight: "700" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", height: 38, justifyContent: "center", alignItems: "center" },
  dayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  dayCircleActive: { backgroundColor: "#1a3c6e" },
  dayCircleAvailable: { backgroundColor: "#EBF5FF" },
  dayText: { fontSize: 13, color: "#333", fontWeight: "500" },
  dayTextActive: { color: "#fff", fontWeight: "700" },
  availableDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#1a3c6e", position: "absolute", bottom: 3 },

  // TIMES
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 10, marginTop: 4 },
  timesRow: { marginBottom: 18 },
  timeChip: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  timeChipActive: { backgroundColor: "#1a3c6e" },
  timeChipText: { fontSize: 13, fontWeight: "600", color: "#555" },
  timeChipTextActive: { color: "#fff" },
  noSlot: { color: "#aaa", fontSize: 13, marginBottom: 18, fontStyle: "italic" },

  // MOTIFS
  motifsList: { marginBottom: 20 },
  motifRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eef0f5",
  },
  motifRowActive: { backgroundColor: "#EBF5FF", borderColor: "#1a3c6e" },
  motifText: { fontSize: 14, color: "#444" },
  motifTextActive: { color: "#1a3c6e", fontWeight: "600" },

  // RADIO
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#ccc", justifyContent: "center", alignItems: "center" },
  radioActive: { borderColor: "#1a3c6e" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1a3c6e" },

  // CONFIRM BTN
  confirmBtn: {
    backgroundColor: "#1a3c6e",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnDisabled: { opacity: 0.45 },

  successBox: {
    backgroundColor: "#d1fae5",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  successText: { color: "#065f46", fontSize: 14, fontWeight: "600" },

  // TABS
  tabsRow: {
    backgroundColor: "#E9EEF5",
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
    marginBottom: 14,
  },
  tabBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff" },
  tabText: { color: "#888", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#1a3c6e", fontWeight: "700" },

  // RDV CARDS
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

  emptyBox: { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { color: "#aaa", fontSize: 14 },

  // MODALS
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
    maxHeight: "90%",
  },
  handle: { width: 64, height: 6, borderRadius: 999, backgroundColor: "#D7DEE8", alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalBack: { fontSize: 22, color: "#1a3c6e", fontWeight: "700" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },

  detailCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#eef0f5" },
  detailDate: { fontSize: 16, fontWeight: "700", color: "#1a3c6e" },
  detailTime: { fontSize: 13, color: "#666", marginTop: 4 },

  infoCard: { backgroundColor: "#f0f8ee", borderRadius: 16, padding: 14, flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 },
  infoIcon: { fontSize: 28 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: "#1a3c6e", marginBottom: 2 },
  infoSub: { fontSize: 12, color: "#666" },

  motifDetailBox: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: "#eef0f5" },
  motifDetailLabel: { fontSize: 12, color: "#888", fontWeight: "700", marginBottom: 6 },
  motifDetailValue: { fontSize: 14, color: "#333" },

  cancelRdvBtn: { alignItems: "center", paddingVertical: 14 },
  cancelRdvText: { color: "#FF3B30", fontSize: 14, fontWeight: "700" },

  raisonRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  raisonText: { fontSize: 14, color: "#333" },

  actionRow: { flexDirection: "row", gap: 12 },
  btnSecondary: { flex: 1, backgroundColor: "#e5e7eb", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText: { color: "#555", fontWeight: "700" },
  btnDanger: { flex: 1, backgroundColor: "#FF3B30", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnDangerText: { color: "#fff", fontWeight: "700" },
});

import { Slot, useRouter, useSegments } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TABS = [
  { name: "dashboard", label: "Accueil",      icon: "🏠" },
  { name: "comptes",   label: "Comptes",       icon: "💳" },
  { name: "rdv",       label: "Rendez-vous",   icon: "📅" },
  { name: "assistant", label: "Assistant",     icon: "💬" },
  { name: "profil",    label: "Profil",        icon: "👤" },
];

// Pages sans barre de navigation
const HIDDEN_TABS = [
  "virement",
  "transactions",
  "analyse-profil",
  "login",
  "forgot-password",
  "register-step1",
  "register-step2",
  "otp",
  "reset-password",
];

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];
  const showBar = !HIDDEN_TABS.includes(currentTab);

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F4F8" }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      {showBar && (
        <View style={s.tabBar}>
          {TABS.map((tab) => {
            const isActive = currentTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={[s.tabItem, isActive && s.tabItemActive]}
                onPress={() => router.push(`/(tabs)/${tab.name}`)}
              >
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eef0f5",
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    gap: 3,
  },
  tabItemActive: { backgroundColor: "#EBF5FF" },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: "#888", fontWeight: "500" },
  tabLabelActive: { color: "#1a3c6e", fontWeight: "700" },
});

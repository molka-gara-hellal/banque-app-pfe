import { useRouter, useSegments } from "expo-router";
import { Slot } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TABS = [
  { name: "dashboard", label: "Accueil",     icon: "🏠" },
  { name: "comptes",   label: "Comptes",     icon: "💳" },
  { name: "rdv",       label: "Rendez-vous", icon: "📅" },
  { name: "assistant", label: "Assistant",   icon: "💬" },
  { name: "profil",    label: "Profil",      icon: "👤" },
];

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];

  // Cacher la barre sur virement et transactions
  const hiddenTabs = ["virement", "transactions"];
  const showBar = !hiddenTabs.includes(currentTab);

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F4F8" }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      {showBar && (
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = currentTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => router.push(`/(tabs)/${tab.name}`)}
              >
                <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eef0f5",
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabIconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconWrapActive: {
    backgroundColor: "#EBF5FF",
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: "#1a3c6e",
    fontWeight: "700",
  },
});

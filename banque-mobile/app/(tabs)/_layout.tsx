import { Slot, useRouter, useSegments } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../i18n/ThemeContext";

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
  const { t, langue } = useLanguage();
  const { theme, themeKey } = useTheme();
  const currentTab = segments[segments.length - 1];
  const showBar = !HIDDEN_TABS.includes(currentTab);

  const TABS = [
    { name: "dashboard", label: t("tabs.home"),         icon: "🏠" },
    { name: "comptes",   label: t("tabs.accounts"),     icon: "💳" },
    { name: "rdv",       label: t("tabs.appointments"), icon: "📅" },
    { name: "assistant", label: t("tabs.assistant"),    icon: "💬" },
    { name: "profil",    label: t("tabs.profile"),      icon: "👤" },
  ];

  const d = theme;

  return (
    // ✅ key={langue + themeKey} force un remount complet quand langue ou thème change
    <View key={`${langue}-${themeKey}`} style={{ flex: 1, backgroundColor: d.bg }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      {showBar && (
        <View style={[s.tabBar, { backgroundColor: d.tabBar, borderTopColor: d.tabBarBorder }]}>
          {TABS.map((tab) => {
            const isActive = currentTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={[s.tabItem, isActive && { backgroundColor: d.primaryLight }]}
                onPress={() => router.push(`/(tabs)/${tab.name}`)}
              >
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text style={[s.tabLabel, { color: isActive ? d.primary : d.textMuted }, isActive && s.tabLabelActive]}>
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
    borderTopWidth: 1,
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
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, fontWeight: "500" },
  tabLabelActive: { fontWeight: "700" },
});
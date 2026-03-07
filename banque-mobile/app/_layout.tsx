import { Slot, useSegments } from "expo-router";
import { Image, View } from "react-native";

export default function RootLayout() {
  const segments = useSegments();
  const isAuthScreen = segments[0] === "(auth)";

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Logo uniquement sur les pages auth */}
      {isAuthScreen && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 50,
            paddingBottom: 15,
            paddingLeft: 20,
            backgroundColor: "white",
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
        >
          <Image
            source={require("../assets/images/wifak-logo.png")}
            style={{ width: 200, height: 80, resizeMode: "contain" }}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}

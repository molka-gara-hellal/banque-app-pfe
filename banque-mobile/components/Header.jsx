import { Image, StyleSheet, View } from "react-native";

export default function Header() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/wifak-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logo: {
    width: 120,
    height: 60,
  },
});

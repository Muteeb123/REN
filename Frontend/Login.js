import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const colors = {
  background: "#FFFFFF",
  primary: "#52ACD7",
  secondary: "#333333",
  buttonText: "#FFFFFF",
};

const LoginScreen = () => {
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.replace("MainTabs"); // Go to main app after login
  };

  const handleSignup = () => {
    navigation.navigate("Personalization"); // Go to persnalization setup
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Image source={require("./assets/logo.png")} style={styles.logo} />
        <Text style={styles.heading}>Let's get started</Text>
        <Text style={styles.subheading}>Let's dive into your account</Text>

        <TouchableOpacity style={styles.pbutton} onPress={handleLogin}>
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Login with Reddit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sbutton} onPress={handleSignup}>
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            Signup with Reddit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 25,
    resizeMode: "contain",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.secondary,
    textAlign: "center",
  },
  subheading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
  },
  pbutton: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: colors.primary,
  },
  sbutton: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginScreen;

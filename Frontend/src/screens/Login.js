// src/screens/LoginScreen.js
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { NODE_BACKEND_URL } from "../config/urls";

// Colors
const colors = {
    background: "#FFFFFF",
    primary: "#52ACD7",
    secondary: "#333333",
    buttonText: "#FFFFFF",
};

const LoginScreen = () => {
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);

    // Handle OAuth login
    const handleAuth = async () => {
        setIsLoading(true);
        try {
            // Create deep link redirect URI for Expo app
            const redirectUrl = Linking.createURL("auth-success");
            const authStartUrl =
                `${NODE_BACKEND_URL}/api/auth/reddit` +
                `?appRedirect=${encodeURIComponent(redirectUrl)}`;

            // Open AuthSession (handles OAuth flow in-app)
            const result = await WebBrowser.openAuthSessionAsync(
                authStartUrl,
                redirectUrl
            );

            console.log("Auth session result:", result);

            // If user cancels, stop loading
            if (result.type === "dismiss") setIsLoading(false);
        } catch (err) {
            console.log("Auth error:", err);
            setIsLoading(false);
        }
    };

    // Listen for deep link events
    useEffect(() => {
        const handleDeepLink = async (event) => {
            const data = Linking.parse(event.url);

            // Check for userId and personalized flag
            const userId = data.queryParams?.userId;
            const personalized = data.queryParams?.personalized === "true";

            if (userId) {
                // Save userId in AsyncStorage
                await AsyncStorage.setItem("userId", userId);

                // Navigate to the correct screen
                if (personalized) {
                    navigation.replace("MainTabs");
                } else {
                    navigation.replace("Personalization");
                }
            }

            setIsLoading(false);
        };

        const subscription = Linking.addEventListener("url", handleDeepLink);

        return () => subscription.remove();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.centerContent}>
                <Image
                    source={require("../../assets/logo.png")}
                    style={styles.logo}
                />
                <Text style={styles.heading}>Let's get started</Text>
                <Text style={styles.subheading}>
                    Log in or sign up using Reddit
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <TouchableOpacity
                        style={styles.pbutton}
                        onPress={handleAuth}
                    >
                        <Text style={styles.buttonText}>
                            Get Started With Reddit
                        </Text>
                    </TouchableOpacity>
                )}
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
        backgroundColor: colors.primary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});

export default LoginScreen;
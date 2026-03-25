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
import { useAuthRequest } from "expo-auth-session";
import {
    NODE_BACKEND_URL,
    REDDIT_API_ME,
    REDDIT_AUTH_ENDPOINT,
    REDDIT_TOKEN_ENDPOINT,
    REDIRECT_URI,
    REDDIT_CLIENT_ID,

} from "../config/urls";

WebBrowser.maybeCompleteAuthSession();

const BACKEND_SIGNUP_URL = `${NODE_BACKEND_URL}/api/auth/signup`;

const discovery = {
    authorizationEndpoint: REDDIT_AUTH_ENDPOINT,
    tokenEndpoint: REDDIT_TOKEN_ENDPOINT,
};

const colors = {
    background: "#FFFFFF",
    primary: "#52ACD7",
    secondary: "#333333",
    buttonText: "#FFFFFF",
};



const LoginScreen = () => {
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);

    const [, response, promptAsync] = useAuthRequest(
        {
            clientId: REDDIT_CLIENT_ID,
            redirectUri: REDIRECT_URI,
            scopes: ["identity", "read"],
            extraParams: { duration: "permanent" },
        },
        discovery
    );

    // Exchange Reddit code for token
    const exchangeCodeForToken = async (code) => {
        setIsLoading(true);

        const basicAuth = typeof btoa === "function" ? btoa(`${REDDIT_CLIENT_ID}:`) : `${REDDIT_CLIENT_ID}:`;
        const formData = new URLSearchParams();
        formData.append("grant_type", "authorization_code");
        formData.append("code", code);
        formData.append("redirect_uri", REDIRECT_URI);

        try {
            const res = await fetch(REDDIT_TOKEN_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${basicAuth}`,
                },
                body: formData.toString(),
            });

            const tokenData = await res.json();


            if (res.ok && tokenData.access_token) {
                await fetchRedditProfileAndSend(tokenData);
            } else {
                alert(tokenData.error_description || "Failed to get Reddit token.");
            }
        } catch (err) {

        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Reddit profile → send to backend
    const fetchRedditProfileAndSend = async (tokenData) => {

        try {
            const profileRes = await fetch(REDDIT_API_ME, {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    "User-Agent": "ExpoApp/1.0",
                },
            });

            const profile = await profileRes.json();

            if (!profile?.name) {
                alert("Failed to fetch Reddit profile username.");
                return;
            }

            const payload = {
                email: `${profile.name}@gmail.com`,
                name: profile.name,
                token: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                age: null,
            };


            const backendRes = await fetch(BACKEND_SIGNUP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const backendData = await backendRes.json();
            if (backendRes.ok) {
                // Save user ID globally
                await AsyncStorage.setItem("userId", backendData.user._id);

                // Cache user data with timestamp (1 minute validity)
                await AsyncStorage.setItem(
                    "cachedUser",
                    JSON.stringify({
                        user: backendData.user,
                        timestamp: Date.now(),
                    })
                );

                // Check if user is personalized
                if (backendData.user.personalized) {
                    navigation.replace("MainTabs");
                } else {
                    navigation.replace("Personalization");
                }
            } else {
                alert(backendData.message || "Backend authentication failed.");
            }
        } catch (err) {
            alert("Error sending data to backend.");
        }
    };

    // Check for cached user data on mount
    useEffect(() => {
        const checkCachedUser = async () => {
            try {
                const cachedData = await AsyncStorage.getItem("cachedUser");
                if (cachedData) {
                    const { user, timestamp } = JSON.parse(cachedData);
                    const now = Date.now();
                    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

                    // Check if cache is still valid (within 1 month)
                    if (now - timestamp < oneMonth) {
                        await AsyncStorage.setItem("userId", user._id);

                        // Navigate based on personalization status
                        if (user.personalized) {
                            navigation.replace("MainTabs");
                        } else {
                            navigation.replace("Personalization");
                        }
                        return;
                    } else {
                        // Cache expired, remove it
                        await AsyncStorage.removeItem("cachedUser");
                    }
                }
            } catch (err) {
            }
        };

        checkCachedUser();
    }, [navigation]);

    // Listen for OAuth response
    useEffect(() => {
        if (response?.type === "success") {
            const { code } = response.params;
            exchangeCodeForToken(code);
        } else if (response?.type === "dismiss") {
            setIsLoading(false);
        } else if (response?.type === "error") {
            setIsLoading(false);
        }
    }, [response]);

    const handleAuth = async () => {
        setIsLoading(true);

        try {
            await promptAsync();
        } catch (err) {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.centerContent}>
                <Image source={require("../../assets/logo.png")} style={styles.logo} />
                <Text style={styles.heading}>Let's get started</Text>
                <Text style={styles.subheading}>Log in or sign up using Reddit</Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <TouchableOpacity
                        style={styles.pbutton}
                        onPress={() => handleAuth()}
                    >
                        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                            Get Started With Reddit
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
    centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
    logo: { width: 180, height: 180, marginBottom: 25, resizeMode: "contain" },
    heading: { fontSize: 26, fontWeight: "bold", marginBottom: 8, color: colors.secondary, textAlign: "center" },
    subheading: { fontSize: 16, color: "#666", marginBottom: 25, textAlign: "center" },
    pbutton: { width: "90%", paddingVertical: 14, borderRadius: 25, alignItems: "center", marginVertical: 8, backgroundColor: colors.primary },
    buttonText: { fontSize: 16, fontWeight: "600" },
});

export default LoginScreen;

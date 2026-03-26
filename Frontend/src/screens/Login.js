// src/screens/LoginScreen.js
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
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
    error: "#E74C3C",
    textPlaceholder: "#BDBDBD",
    border: "#DCDCDC",
    borderFocus: "#52ACD7",
};

const LoginScreen = () => {
    const navigation = useNavigation();

    // ============ STATE MANAGEMENT ============
    const [isLoading, setIsLoading] = useState(false);
    const [loginMode, setLoginMode] = useState("default"); // default | helpProvider | passwordChange

    // Form inputs
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Error and user tracking
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);

    // ============ OAUTH LOGIN ============
    const handleAuth = async () => {
        setIsLoading(true);
        setError("");
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
            setError("OAuth login failed. Please try again.");
            setIsLoading(false);
        }
    };

    // ============ HELP PROVIDER LOGIN ============
    const handleHelpProviderLogin = async () => {
        setError("");

        // Validation
        if (!email.trim() || !password.trim()) {
            setError("Please enter both email and password");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `${NODE_BACKEND_URL}/api/helpprovider/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed. Please try again.");
                setIsLoading(false);
                return;
            }

            // Store user data
            const cachedData = {
                user: data.helpProvider || data,
                timestamp: Date.now(),
            };

            await AsyncStorage.setItem("userId", data.helpProvider?.id || data.id);
            await AsyncStorage.setItem("cachedUser", JSON.stringify(cachedData));

            // Check if password change is required
            if (data.helpProvider?.passwordChanged === false || data.passwordChanged === false) {
                setCurrentUserId(data.helpProvider?.id || data.id);
                setLoginMode("passwordChange");
                setIsLoading(false);
                setEmail("");
                setPassword("");
            } else {
                // Navigate to appropriate screen
                setIsLoading(false);
                navigation.replace("HelpProviderDashboard");
            }
        } catch (err) {
            console.log("Login error:", err);
            setError("Connection error. Please try again.");
            setIsLoading(false);
        }
    };

    // ============ PASSWORD UPDATE ============
    const handlePasswordUpdate = async () => {
        setError("");

        // Validation
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setError("Please enter new password in both fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `${NODE_BACKEND_URL}/api/auth/update-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: currentUserId,
                        newPassword,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Password update failed. Please try again.");
                setIsLoading(false);
                return;
            }

            // Update cached user data
            const cachedUser = await AsyncStorage.getItem("cachedUser");
            if (cachedUser) {
                const userData = JSON.parse(cachedUser);
                userData.user.passwordChanged = true;
                await AsyncStorage.setItem("cachedUser", JSON.stringify(userData));
            }

            setIsLoading(false);
            navigation.replace("HelpProviderDashboard");
        } catch (err) {
            console.log("Password update error:", err);
            setError("Connection error. Please try again.");
            setIsLoading(false);
        }
    };

    // ============ MODE TOGGLES ============
    const toggleToHelpProvider = () => {
        setLoginMode("helpProvider");
        setEmail("");
        setPassword("");
        setError("");
    };

    const toggleToDefault = () => {
        setLoginMode("default");
        setEmail("");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setCurrentUserId(null);
    };

    // ============ DEEP LINK HANDLER ============
    useEffect(() => {
        const handleDeepLink = async (event) => {
            const data = Linking.parse(event.url);

            // Check for userId and personalized flag
            const userId = data.queryParams?.userId;
            const personalized = data.queryParams?.personalized === "true";

            if (userId) {
                // Save userId in AsyncStorage
                await AsyncStorage.setItem("userId", userId);

                try {
                    const userRes = await fetch(`${NODE_BACKEND_URL}/api/user/${userId}`);

                    if (userRes.ok) {
                        const userData = await userRes.json();
                        await AsyncStorage.setItem(
                            "cachedUser",
                            JSON.stringify({
                                user: userData.user,
                                timestamp: Date.now(),
                            })
                        );
                    }
                } catch (error) {
                    console.log("Failed to cache full user data:", error);
                }

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

    // ============ RENDER METHODS FOR DIFFERENT STATES ============

    // 1. DEFAULT STATE - OAuth + Help Provider link
    const renderDefaultState = () => (
        <>
            <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
            />
            <Text style={styles.heading}>Let's get started</Text>
            <Text style={styles.subheading}>Log in or sign up using Reddit</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.pbutton}
                        onPress={handleAuth}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Get Started With Reddit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ marginTop: 20 }}
                        onPress={toggleToHelpProvider}
                        disabled={isLoading}
                    >
                        <Text style={styles.underlinedText}>Login as Help Provider</Text>
                    </TouchableOpacity>
                </>
            )}
        </>
    );

    // 2. HELP PROVIDER LOGIN STATE
    const renderHelpProviderState = () => (
        <>
            <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
            />
            <Text style={styles.heading}>Help Provider Login</Text>
            <Text style={styles.subheading}>Sign in with your credentials</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={[styles.input, error ? { borderColor: colors.error } : {}]}
                placeholder="Email"
                placeholderTextColor={colors.textPlaceholder}
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={[styles.input, error ? { borderColor: colors.error } : {}]}
                placeholder="Password"
                placeholderTextColor={colors.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                secureTextEntry={true}
            />

            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.pbutton}
                        onPress={handleHelpProviderLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ marginTop: 20 }}
                        onPress={toggleToDefault}
                        disabled={isLoading}
                    >
                        <Text style={styles.underlinedText}>Login as Help Seeker</Text>
                    </TouchableOpacity>
                </>
            )}
        </>
    );

    // 3. PASSWORD CHANGE STATE
    const renderPasswordChangeState = () => (
        <>
            <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
            />
            <Text style={styles.heading}>Update Your Password</Text>
            <Text style={styles.subheading}>First-time login requires password change</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={[styles.input, error ? { borderColor: colors.error } : {}]}
                placeholder="New Password (min 6 characters)"
                placeholderTextColor={colors.textPlaceholder}
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!isLoading}
                secureTextEntry={true}
            />

            <TextInput
                style={[styles.input, error ? { borderColor: colors.error } : {}]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textPlaceholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
                secureTextEntry={true}
            />

            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <TouchableOpacity
                    style={styles.pbutton}
                    onPress={handlePasswordUpdate}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Update Password</Text>
                </TouchableOpacity>
            )}
        </>
    );

    // ============ MAIN RENDER ============
    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View style={styles.container}>
                    <View style={styles.centerContent}>
                        {loginMode === "default" && renderDefaultState()}
                        {loginMode === "helpProvider" && renderHelpProviderState()}
                        {loginMode === "passwordChange" && renderPasswordChangeState()}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
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
        paddingVertical: 40,
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
    input: {
        width: "90%",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        fontSize: 14,
        color: colors.secondary,
        backgroundColor: "#F9F9F9",
    },
    pbutton: {
        width: "90%",
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: "center",
        backgroundColor: colors.primary,
        marginTop: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.buttonText,
    },
    underlinedText: {
        fontSize: 14,
        color: colors.primary,
        textDecorationLine: "underline",
        fontWeight: "500",
    },
    errorText: {
        color: colors.error,
        fontSize: 13,
        marginBottom: 15,
        textAlign: "center",
        width: "90%",
    },
});

export default LoginScreen;
import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ToastAndroid,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Edit, Icon, Pencil } from "lucide-react-native";
import { NODE_BACKEND_URL } from "../config/urls";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) => Math.round(size + (scale(size) - size) * factor);

const colors = {
    background: "#F8FAFC",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    borderLight: "#E8E8E8",
    inputBackground: "#FFFFFF",
    primary: "#52ACD7",
    dangerText: "#D94A4A",
    dangerBackground: "#FDECEC",
};

export default function Settings() {
    const navigation = useNavigation();
    const nameInputRef = useRef(null);
    const redditnameInputRef = useRef(null);
    const emailInputRef = useRef(null);
    const insets = useSafeAreaInsets();
    const [name, setName] = useState("");
    const [helpEmail, setHelpEmail] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [RedditUsername, setRedditUsername] = useState("");
    const [isEditingRedditUsername, setIsEditingRedditUsername] = useState(false);
    const [prevName, setPrevName] = useState("");
    const [prevEmail, setPrevEmail] = useState("");
    const [prevRedditUsername, setPrevRedditUsername] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const cachedUser = await AsyncStorage.getItem("cachedUser");
                if (cachedUser) {
                    const parsed = JSON.parse(cachedUser);
                    if (parsed?.user?.preferredName) {
                        setName(parsed.user.preferredName);
                    }
                    if (parsed?.user?.name) {
                        setRedditUsername(parsed.user.name);
                    }
                    if (parsed?.user?.helpContactEmail) {
                        setHelpEmail(parsed.user.helpContactEmail);
                    }
                }
                // Fallback to AsyncStorage for backward compatibility
                const storedHelpEmail = await AsyncStorage.getItem("helpContactEmail");
                if (storedHelpEmail && !helpEmail) {
                    setHelpEmail(storedHelpEmail);
                }
            } catch (error) {
                console.error("Settings load error:", error);
            }
        };

        loadProfile();
    }, []);

    const saveCachedUserName = async (nextName) => {
        try {
            const cachedUser = await AsyncStorage.getItem("cachedUser");
            if (!cachedUser) return;
            const parsed = JSON.parse(cachedUser);
            const updated = {
                ...parsed,
                user: {
                    ...parsed.user,
                    preferredName: nextName,
                },
            };
            await AsyncStorage.setItem("cachedUser", JSON.stringify(updated));
        } catch (error) {
            console.error("Settings save name error:", error);
        }
    };
    const updateUserProfile = async (updates) => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found");
            }

            const response = await fetch(`${NODE_BACKEND_URL}/api/user/personalize`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    ...updates,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            const data = await response.json();

            // Update cached user with new data
            const cachedUser = await AsyncStorage.getItem("cachedUser");
            if (cachedUser) {
                const parsed = JSON.parse(cachedUser);
                const updated = {
                    ...parsed,
                    user: {
                        ...parsed.user,
                        ...data.user,
                    },
                };
                await AsyncStorage.setItem("cachedUser", JSON.stringify(updated));
            }

            return data;
        } catch (error) {
            console.error("Update profile error:", error);
            throw error;
        }
    };
    const toggleNameEditing = async () => {
        if (isEditingName) {
            // Saving - validate before saving
            const trimmedName = name.trim();
            if (!trimmedName) {
                Alert.alert(
                    "Validation Error",
                    "Name field cannot be empty. Please enter a valid name.",
                    [{ text: "OK" }]
                );
                setName(prevName); // Revert to previous value
                setIsEditingName(false);
                return;
            }
            setIsEditingName(false);

            try {
                await updateUserProfile({ name: trimmedName });
                ToastAndroid.show("Name updated successfully", ToastAndroid.SHORT);
            } catch (error) {
                ToastAndroid.show("Failed to update name. Please try again.", ToastAndroid.SHORT);
                setName(prevName); // Revert on error
            }
            return;
        }
        // Entering edit mode - save current value
        setPrevName(name);
        setIsEditingName(true);
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    const toggleEmailEditing = async () => {
        if (isEditingEmail) {
            // Saving - validate before saving
            const trimmedEmail = helpEmail.trim();
            if (!trimmedEmail) {
                Alert.alert(
                    "Validation Error",
                    "Help contact email field cannot be empty. Please enter an email.",
                    [{ text: "OK" }]
                );
                setHelpEmail(prevEmail); // Revert to previous value
                setIsEditingEmail(false);
                return;
            }
            if (!isValidEmail(trimmedEmail)) {
                Alert.alert(
                    "Invalid Email",
                    "Please enter a valid email address (e.g., user@example.com).",
                    [{ text: "OK" }]
                );
                setHelpEmail(prevEmail); // Revert to previous value
                setIsEditingEmail(false);
                return;
            }
            setIsEditingEmail(false);

            try {
                await updateUserProfile({ helpContactEmail: trimmedEmail });
                // Also save to AsyncStorage for backward compatibility
                await AsyncStorage.setItem("helpContactEmail", trimmedEmail);
                ToastAndroid.show("Help contact email updated successfully", ToastAndroid.SHORT);
            } catch (error) {
                ToastAndroid.show("Failed to update help contact email. Please try again.", ToastAndroid.SHORT);
                setHelpEmail(prevEmail); // Revert on error
            }
            return;
        }
        // Entering edit mode - save current value
        setPrevEmail(helpEmail);
        setIsEditingEmail(true);
        setTimeout(() => emailInputRef.current?.focus(), 50);
    };

    const toggleRedditUsernameEditing = async () => {
        if (isEditingRedditUsername) {
            // Saving - validate before saving
            const trimmedUsername = RedditUsername.trim();
            if (!trimmedUsername) {
                Alert.alert(
                    "Validation Error",
                    "Reddit username field cannot be empty. Please enter a valid username.",
                    [{ text: "OK" }]
                );
                setRedditUsername(prevRedditUsername); // Revert to previous value
                setIsEditingRedditUsername(false);
                return;
            }
            setIsEditingRedditUsername(false);
            await saveCachedUserName(trimmedUsername);
            return;
        }
        // Entering edit mode - save current value
        setPrevRedditUsername(RedditUsername);
        setIsEditingRedditUsername(true);
        setTimeout(() => redditnameInputRef.current?.focus(), 50);
    };

    // Email validation function
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleLogout = async () => {
        // Show confirmation dialog
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to log out?",
            [
                {
                    text: "Cancel",

                    style: "cancel",
                },
                {
                    text: "Log Out",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem("cachedUser");
                            await AsyncStorage.removeItem("userId");
                            await AsyncStorage.removeItem("helpContactEmail");
                        } catch (error) {

                            Alert.alert("Error", "Failed to logout. Please try again.");
                        } finally {
                            navigation.replace("Login");
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>

            <Header
                title="User Settings"
                titleAlignment="center"

                subtitleColor="#52ACD7"
                showLeftIcon={false}
                leftIconName="arrow-back"
                onLeftIconPress={() => { }}

                rightIconName="settings-outline"
                onRightIconPress={() => { }}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
                rightIconSize={30}
                textSize={22}
            />

            <KeyboardAvoidingView
                style={[styles.container, { paddingTop: insets.top }]}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>Settings</Text>

                    <View style={styles.section}>
                        <Text style={styles.label}>Reddit Username</Text>
                        <View style={[styles.inputRow, styles.inputRowDisabled]}>
                            <TextInput
                                ref={redditnameInputRef}
                                value={RedditUsername}
                                onChangeText={setRedditUsername}
                                editable={false}
                                placeholder="Your Reddit username"
                                placeholderTextColor={colors.textLight}
                                style={[styles.input, styles.inputDisabled]}
                            />

                        </View>
                    </View>
                    <View style={styles.section}>
                        <Text style={styles.label}>Name</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                ref={nameInputRef}
                                value={name}
                                onChangeText={setName}
                                editable={isEditingName}
                                placeholder="Your name"
                                placeholderTextColor={colors.textLight}
                                style={[styles.input, !isEditingName && styles.inputDisabled]}
                            />
                            <TouchableOpacity
                                onPress={toggleNameEditing}
                                style={styles.iconButton}
                                accessibilityLabel={isEditingName ? "Save name" : "Edit name"}
                            >
                                {
                                    isEditingName ? (
                                        <Ionicons
                                            name="checkmark"
                                            size={scale(20)}
                                            color={colors.primary}
                                        />
                                    ) : <Pencil size={scale(20)} color={colors.primary} />
                                }

                            </TouchableOpacity >
                        </View >
                    </View >

                    <View style={styles.section}>
                        <Text style={styles.label}>Help Contact Email</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                ref={emailInputRef}
                                value={helpEmail}
                                onChangeText={setHelpEmail}
                                editable={isEditingEmail}
                                placeholder="Add help contact email"
                                placeholderTextColor={colors.textLight}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={[styles.input, !isEditingEmail && styles.inputDisabled]}
                            />
                            <TouchableOpacity
                                onPress={toggleEmailEditing}
                                style={styles.iconButton}
                                accessibilityLabel={isEditingEmail ? "Save help contact" : "Edit help contact"}
                            >
                                {
                                    isEditingEmail ? (
                                        <Ionicons
                                            name="checkmark"
                                            size={scale(20)}
                                            color={colors.primary}
                                        />
                                    ) : <Pencil size={scale(20)} color={colors.primary} />
                                }

                            </TouchableOpacity >
                        </View >
                    </View >
                </View >

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,

    },
    container: {
        flex: 1,
        paddingHorizontal: moderateScale(20),

        paddingBottom: verticalScale(10),
        justifyContent: "space-between",
    },
    content: {
        flexGrow: 1,
    },
    title: {
        fontSize: scale(22),
        fontWeight: "700",
        color: colors.textDark,
        marginBottom: verticalScale(18),
    },
    section: {
        marginBottom: verticalScale(18),
    },
    label: {
        fontSize: scale(14),
        color: colors.textLight,
        marginBottom: verticalScale(8),
        fontWeight: "600",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.inputBackground,
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: colors.borderLight,
        paddingHorizontal: moderateScale(12),
        paddingVertical: verticalScale(8),
    },
    input: {
        flex: 1,
        fontSize: scale(14),
        color: colors.textDark,
        paddingRight: moderateScale(8),
    },
    inputDisabled: {
        color: colors.textLight,
    },
    inputRowDisabled: {
        backgroundColor: "#F0F0F0",
    },
    iconButton: {
        padding: moderateScale(6),
    },
    logoutButton: {
        backgroundColor: colors.dangerBackground,
        borderRadius: moderateScale(12),
        paddingVertical: verticalScale(12),
        alignItems: "center",
        marginBottom: verticalScale(6),
    },
    logoutButtonText: {
        color: colors.dangerText,
        fontSize: scale(14),
        fontWeight: "600",
    },
});

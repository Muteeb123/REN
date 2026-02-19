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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";

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
    const emailInputRef = useRef(null);

    const [name, setName] = useState("");
    const [helpEmail, setHelpEmail] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const cachedUser = await AsyncStorage.getItem("cachedUser");
                if (cachedUser) {
                    const parsed = JSON.parse(cachedUser);
                    if (parsed?.user?.name) {
                        setName(parsed.user.name);
                    }
                }
                const storedHelpEmail = await AsyncStorage.getItem("helpContactEmail");
                if (storedHelpEmail) {
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
                    name: nextName,
                },
            };
            await AsyncStorage.setItem("cachedUser", JSON.stringify(updated));
        } catch (error) {
            console.error("Settings save name error:", error);
        }
    };

    const toggleNameEditing = async () => {
        if (isEditingName) {
            setIsEditingName(false);
            await saveCachedUserName(name.trim());
            return;
        }
        setIsEditingName(true);
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    const toggleEmailEditing = async () => {
        if (isEditingEmail) {
            setIsEditingEmail(false);
            await AsyncStorage.setItem("helpContactEmail", helpEmail.trim());
            return;
        }
        setIsEditingEmail(true);
        setTimeout(() => emailInputRef.current?.focus(), 50);
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("cachedUser");
            await AsyncStorage.removeItem("userId");
            await AsyncStorage.removeItem("helpContactEmail");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            navigation.replace("Login");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>

            <Header
                title="Chat with REN"
                titleAlignment="center"

                subtitleColor="#52ACD7"
                showLeftIcon={false}
                leftIconName="arrow-back"
                onLeftIconPress={() => { }}
                showRightIcon={true}
                rightIconName="settings-outline"
                onRightIconPress={() => { }}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
                rightIconSize={30}
                textSize={22}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>Settings</Text>

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
                                <Ionicons
                                    name={isEditingName ? "checkmark" : "create-outline"}
                                    size={scale(20)}
                                    color={colors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

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
                                <Ionicons
                                    name={isEditingEmail ? "checkmark" : "create-outline"}
                                    size={scale(20)}
                                    color={colors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        paddingTop: 0,
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
        fontWeight: "700",
    },
});

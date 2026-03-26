import React from "react";
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Alert,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) => Math.round(size + (scale(size) - size) * factor);

const colors = {
    background: "#F8FAFC",
    card: "#FFFFFF",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    borderLight: "#E8E8E8",
    primary: "#52ACD7",
};

const HARD_CODED_HELP_SEEKERS = [
    { id: "hs-1", name: "Midind", image: require("../../assets/Happy.png") },
    { id: "hs-2", name: "adjiqin", image: require("../../assets/Anxious.png") },
    { id: "hs-3", name: "idiajdin", image: require("../../assets/Neutral.png") },
    { id: "hs-4", name: "sadjida", image: require("../../assets/Sad.png") },
];

export default function HelpProviderDashboard({ navigation }) {
    const insets = useSafeAreaInsets();

    // Helper function to chunk array into groups of 2
    const chunkArray = (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    };

    const handleLogout = async () => {
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
                            return;
                        }
                        navigation.replace("Login");
                    },
                    style: "destructive",
                },
            ]
        );
    };

    const renderCard = (item) => (
        <View style={styles.cardWrapper}>
            <View style={styles.listItem}>
                <View style={styles.avatarContainer}>
                    <Image source={item.image} style={styles.avatarImage} />
                </View>

                <Text style={styles.seekerName}>{item.name}</Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                            navigation.navigate("HelpProviderStatistics", {
                                seekerId: item.id,
                                seekerName: item.name,
                            })
                        }
                        accessibilityLabel={`View statistics for ${item.name}`}
                    >
                        <Ionicons name="stats-chart-outline" size={scale(20)} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                            navigation.navigate("HelpProviderChat", {
                                seekerId: item.id,
                                seekerName: item.name,
                            })
                        }
                        accessibilityLabel={`Open chat for ${item.name}`}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={scale(20)} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderRow = ({ item: row }) => (
        <View style={styles.row}>
            {row.map((seeker) => (
                <View key={seeker.id} style={styles.gridCell}>
                    {renderCard(seeker)}
                </View>
            ))}
            {row.length === 1 && <View style={styles.gridCell} />}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={scale(60)} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No help seeker</Text>
        </View>
    );

    const CustomLogoutIcon = () => (
        <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out" size={scale(20)} color={colors.primary} />
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
            <Header
                title="Dashboard"
                titleAlignment="center"
                showLeftIcon={false}
                showRightIcon={true}
                rightIcon={<CustomLogoutIcon />}
                onRightIconPress={handleLogout}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
                textSize={22}
            />

            <View style={styles.container}>
                {HARD_CODED_HELP_SEEKERS.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={chunkArray(HARD_CODED_HELP_SEEKERS, 2)}
                        keyExtractor={(item, index) => `row-${index}`}
                        renderItem={renderRow}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={true}
                    />
                )}
            </View>
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
        paddingHorizontal: moderateScale(16),
        paddingTop: verticalScale(12),
    },
    listContent: {
        paddingBottom: verticalScale(16),
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: verticalScale(12),
    },
    gridCell: {
        flex: 1,
        marginHorizontal: moderateScale(6),
    },
    cardWrapper: {
        flex: 1,
    },
    listItem: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(20),
    },
    avatarContainer: {
        width: moderateScale(90),
        height: moderateScale(90),
        borderRadius: moderateScale(45),
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: verticalScale(12),
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: moderateScale(45),
    },
    seekerName: {
        color: colors.textDark,
        fontSize: scale(16),
        fontWeight: "700",
        marginBottom: verticalScale(12),
        textAlign: "center",
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 0,
    },
    iconButton: {
        padding: moderateScale(8),
        marginLeft: moderateScale(8),
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: moderateScale(8),
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: verticalScale(80),
    },
    emptyStateText: {
        marginTop: verticalScale(16),
        fontSize: scale(16),
        color: colors.textLight,
        fontWeight: "500",
    },
    logoutIconContainer: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: moderateScale(8),
        padding: moderateScale(6),
        alignItems: "center",
        justifyContent: "center",
    },
});

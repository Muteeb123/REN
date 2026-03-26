import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Platform,
    Image,
    useWindowDimensions,
    BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import { meditationData } from "../config/meditationData";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Enhanced responsive scaling functions
const scale = (size) => {
    const baseWidth = 375;
    const scaleFactor = Math.min(SCREEN_WIDTH / baseWidth, 1.3);
    return Math.round(size * scaleFactor);
};

const verticalScale = (size) => {
    const baseHeight = 812;
    const scaleFactor = Math.min(SCREEN_HEIGHT / baseHeight, 1.3);
    return Math.round(size * scaleFactor);
};

const moderateScale = (size, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
};

// Dynamic font sizing
const getFontSize = (size) => {
    const scaleFactor = Math.min(SCREEN_WIDTH / 375, 1.2);
    return Math.round(size * scaleFactor);
};

const colors = {
    primary: "#FFFFFF",
    secondary: "#52ACD7",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    borderLight: "#E8E8E8",
    background: "#F5F9F3",
    shadow: "rgba(0, 0, 0, 0.1)",
    accent: "#DCEEF7",
    card: "#FFFFFF",
};

const images = {
    calm_focus: require("../../assets/yoga.png"),
    severe_breath: require("../../assets/meditation (1).png"),
    inner_pet: require("../../assets/yoga-pose.png"),
    stress_relief: require("../../assets/meditation.png"),
    deep_relax: require("../../assets/yoga(1).png"),
    calm_rein: require("../../assets/aerobic.png"),
    last_one: require("../../assets/yoga (2).png"),
};

export default function Meditation({ currentScreen, onNavigate }) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = useState(null);

    const featuredCardHeight = verticalScale(180);

    // Hardware back: if inside a category, go back to categories list
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (selectedCategory) {
                    setSelectedCategory(null);
                    return true;
                }
                return false;
            };
            const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
            return () => sub.remove();
        }, [selectedCategory])
    );

    const handleNavigateToSession = (session) => {
        navigation.navigate("MeditationSession", {
            session,
            durationOptions: [1, 2, 5, 10],
        });
    };

    // ---------- Category Cards View ----------
    const renderCategoryCard = ({ item }) => {
        const imageKey = item.items[0]?.image;
        const categoryImage = imageKey ? images[imageKey] : null;
        return (
            <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.8}
            >
                {categoryImage && (
                    <Image source={categoryImage} style={styles.categoryCardImage} />
                )}
                <Text style={styles.categoryCardTitle}>{item.title}</Text>
            </TouchableOpacity>
        );
    };

    // ---------- Meditation List Item (inside category) ----------
    const renderMeditationListItem = ({ item }) => (
        <TouchableOpacity
            style={styles.meditationListItem}
            onPress={() => handleNavigateToSession(item)}
            activeOpacity={0.7}
        >
            <View style={styles.meditationListPlayCircle}>
                <Ionicons style={{ paddingLeft: 4 }} name="play" size={moderateScale(18)} color={colors.primary} />
            </View>
            <View style={styles.meditationListInfo}>
                <Text style={styles.meditationListTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.meditationListDuration}>{item.duration}</Text>
            </View>
            <Ionicons name="chevron-forward" size={moderateScale(18)} color={colors.textLight} />
        </TouchableOpacity>
    );

    // ---------- Category Detail View ----------
    if (selectedCategory) {
        return (
            <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
                <Header
                    title={selectedCategory.title}
                    titleAlignment="center"
                    showLeftIcon={true}
                    leftIconName="arrow-back"
                    onLeftIconPress={() => setSelectedCategory(null)}
                    showRightIcon={false}
                    backgroundColor="#FFFFFF"
                    borderBottomColor="rgba(82, 172, 215, 0.1)"
                />
                <FlatList
                    data={selectedCategory.items}
                    renderItem={renderMeditationListItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.meditationListContainer}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                />
            </SafeAreaView>
        );
    }

    // ---------- Categories Home View ----------
    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <Header
                title="Meditations"
                titleAlignment="center"
                showLeftIcon={false}
                showRightIcon={false}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
            />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Featured Meditation */}
                <View style={[styles.featuredCard, { height: featuredCardHeight }]}>
                    <View style={styles.featuredContent}>
                        <Text style={styles.featuredTitle}>
                            {meditationData.featured.title}
                        </Text>
                        <Text style={styles.featuredDuration}>
                            {meditationData.featured.duration}
                        </Text>

                        <View style={styles.featuredDividerRow}>
                            <View style={[styles.featuredDividerPart, styles.featuredDividerSmall, styles.featuredDividerBlue]} />
                            <View style={[styles.featuredDividerPart, styles.featuredDividerMedium, styles.featuredDividerWhite]} />
                            <View style={[styles.featuredDividerPart, styles.featuredDividerLarge, styles.featuredDividerWhite]} />
                        </View>

                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => handleNavigateToSession(meditationData.featured)}
                        >
                            <Text style={styles.startButtonText}>Start Meditation</Text>
                            <Ionicons
                                name="play"
                                size={moderateScale(16)}
                                color={colors.primary}
                                style={styles.playIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Category Cards */}
                <View style={styles.categoriesGridHeader}>
                    <Text style={styles.categoriesGridTitle}>Categories</Text>
                </View>
                <FlatList
                    data={meditationData.categories}
                    renderItem={renderCategoryCard}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.categoriesGrid}
                    columnWrapperStyle={styles.categoriesRow}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    scrollContainer: {
        paddingBottom: verticalScale(40),
    },

    // Featured Card
    featuredCard: {
        margin: moderateScale(20),
        borderRadius: moderateScale(16),
        overflow: "hidden",
        backgroundColor: colors.accent,
        justifyContent: "center",
        padding: moderateScale(20),
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
                shadowColor: colors.shadow,
            },
        }),
    },
    featuredContent: {
        flex: 1,
        justifyContent: "center"
    },
    featuredTitle: {
        fontSize: getFontSize(22),
        fontWeight: "700",
        color: colors.textDark,
        marginBottom: verticalScale(4),
    },
    featuredDuration: {
        fontSize: getFontSize(14),
        color: colors.textDark,
        marginBottom: verticalScale(12)
    },
    featuredDividerRow: {
        flexDirection: "row",
        alignItems: "center",
        height: scale(5),
        marginBottom: verticalScale(2),
        gap: moderateScale(4),
    },
    featuredDividerPart: {
        height: scale(12),
        borderRadius: scale(8),
    },
    featuredDividerSmall: { flex: 1.5 },
    featuredDividerMedium: { flex: 2.5 },
    featuredDividerLarge: { flex: 3 },
    featuredDividerBlue: { backgroundColor: colors.secondary },
    featuredDividerWhite: { backgroundColor: colors.primary },

    startButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: colors.secondary,
        paddingVertical: verticalScale(10),
        paddingHorizontal: moderateScale(20),
        borderRadius: moderateScale(10),
        marginTop: verticalScale(14),
        minHeight: verticalScale(44),
    },
    startButtonText: {
        color: colors.primary,
        fontSize: getFontSize(14),
        fontWeight: "600",
        marginRight: moderateScale(6),
    },
    playIcon: {
        marginLeft: moderateScale(2)
    },

    // Category Cards Grid
    categoriesGridHeader: {
        paddingHorizontal: moderateScale(20),
        marginBottom: verticalScale(12),
    },
    categoriesGridTitle: {
        fontSize: getFontSize(20),
        fontWeight: "700",
        color: colors.textDark,
    },
    categoriesGrid: {
        paddingHorizontal: moderateScale(16),
    },
    categoriesRow: {
        justifyContent: "space-between",
        marginBottom: moderateScale(14),
    },
    categoryCard: {
        width: (SCREEN_WIDTH - moderateScale(16) * 2 - moderateScale(14)) / 2,
        backgroundColor: colors.card,
        borderRadius: moderateScale(16),
        alignItems: "center",
        paddingVertical: moderateScale(20),
        paddingHorizontal: moderateScale(12),
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
            },
            android: {
                elevation: 4,
                shadowColor: colors.shadow,
            },
        }),
    },
    categoryCardImage: {
        width: moderateScale(70),
        height: moderateScale(70),
        resizeMode: "contain",
        marginBottom: verticalScale(12),
    },
    categoryCardTitle: {
        fontSize: getFontSize(16),
        fontWeight: "700",
        color: colors.textDark,
        textAlign: "center",
    },

    // Meditation List (inside category detail)
    meditationListContainer: {
        paddingHorizontal: moderateScale(16),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(40),
    },
    meditationListItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: moderateScale(14),
        paddingVertical: moderateScale(14),
        paddingHorizontal: moderateScale(14),
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
                shadowColor: colors.shadow,
            },
        }),
    },
    meditationListPlayCircle: {
        width: moderateScale(42),
        height: moderateScale(42),
        borderRadius: moderateScale(21),
        backgroundColor: colors.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: moderateScale(14),
    },
    meditationListInfo: {
        flex: 1,
    },
    meditationListTitle: {
        fontSize: getFontSize(16),
        fontWeight: "600",
        color: colors.textDark,
    },
    meditationListDuration: {
        fontSize: getFontSize(13),
        color: colors.textLight,
        marginTop: verticalScale(2),
    },
    listSeparator: {
        height: moderateScale(10),
    },
});

import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";

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
    severe_breath: require("../../assets/aerobic.png"),
    inner_pet: require("../../assets/yoga-pose.png"),
    stress_relief: require("../../assets/meditation.png"),
    deep_relax: require("../../assets/yoga(1).png"),
    calm_rein: require("../../assets/aerobic.png"),
};

const meditationData = {
    featured: {
        id: "1",
        title: "Intro to Meditation",
        duration: "8 mins",
        categories: ["All", "Mindfulness", "Stress Reduction"],
        script: [
            "Welcome to your first meditation. Find a comfortable position and gently close your eyes.",
            "Take a deep breath in through your nose, and slowly exhale through your mouth.",
            "Let your shoulders drop and release any tension you are holding.",
            "Notice the rhythm of your breathing. There is no need to change it, just observe.",
            "With each breath, allow yourself to settle deeper into stillness.",
            "If your mind wanders, that is perfectly okay. Gently guide your attention back to your breath.",
            "You are doing beautifully. Stay here in this calm space for a moment.",
            "When you are ready, slowly open your eyes. Carry this peace with you.",
        ],
    },
    categories: [
        {
            id: "1",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "2",
            title: "Stress Reduction",
            items: [
                {
                    id: "4",
                    title: "Stress Relief",
                    duration: "15 mins",
                    image: images.stress_relief,
                    script: [
                        "Welcome to Stress Relief. Let us release the weight you have been carrying.",
                        "Find a comfortable position. Close your eyes and take a slow, deep breath.",
                        "Scan your body from head to toe. Notice where you hold tension.",
                        "Starting with your forehead, consciously relax those muscles. Let them soften.",
                        "Move to your jaw. Unclench it. Let your mouth relax slightly open.",
                        "Drop your shoulders away from your ears. Feel the tension melting away.",
                        "Relax your hands. Unclench your fists. Let your fingers rest gently.",
                        "Now breathe into any remaining tight spots. Send warmth and relief there.",
                        "With each exhale, imagine stress leaving your body as dark smoke dissolving into light.",
                        "You are safe. You are supported. You can let go.",
                    ],
                },
                {
                    id: "5",
                    title: "Deep Relax",
                    duration: "20 mins",
                    image: images.deep_relax,
                    script: [
                        "Welcome to Deep Relax. Allow yourself to completely surrender to this moment.",
                        "Lie down or sit in the most comfortable position you can find.",
                        "Close your eyes. Take three slow, deep breaths.",
                        "Feel your body becoming heavy, sinking into the surface beneath you.",
                        "Starting with your toes, send a wave of relaxation upward through your body.",
                        "Feel it moving through your feet, your ankles, your calves.",
                        "The warm wave rises through your knees, your thighs, your hips.",
                        "It flows through your belly, your chest, softening everything it touches.",
                        "The relaxation spreads through your arms, your neck, your face.",
                        "Your entire body is now deeply relaxed. You are floating in calm.",
                        "Rest here. There is nothing to do, nowhere to be. Just breathe and be.",
                    ],
                },
                {
                    id: "6",
                    title: "Calm Rein",
                    duration: "35 mins",
                    image: images.calm_rein,
                    script: [
                        "Welcome to Calm Rein. This session will help you regain control over your inner world.",
                        "Sit comfortably and close your eyes. Take a moment to arrive fully in this space.",
                        "Breathe in deeply and whisper to yourself: I am in control.",
                        "Imagine you are holding the reins of a gentle horse. This horse is your mind.",
                        "Sometimes it races ahead. Sometimes it wanders off the path.",
                        "But you hold the reins with steady, gentle hands. You guide it back with patience.",
                        "Breathe in calm. Breathe out chaos. You are the rider, not the storm.",
                        "Feel the rhythm of your breathing becoming steady like hoofbeats on soft earth.",
                        "With each breath, you are more centered, more grounded, more at peace.",
                        "You have the power to choose calm. You always have.",
                        "Take a deep breath and open your eyes. You are in control.",
                    ],
                },
            ],
        },
    ],
};

export default function Meditation({ currentScreen, onNavigate }) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Calculate dynamic dimensions based on screen size
    const meditationItemWidth = moderateScale(160);
    const meditationItemHeight = verticalScale(210);
    const featuredCardHeight = verticalScale(180);

    const handleNavigateToSession = (session) => {
        navigation.navigate("MeditationSession", {
            session,
            durationOptions: [1, 2, 5, 10],
        });
    };

    const renderCategoryPill = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryPill,
                selectedCategory === item && styles.categoryPillSelected,
            ]}
            onPress={() => setSelectedCategory(item)}
        >
            <Text
                style={[
                    styles.categoryPillText,
                    selectedCategory === item && styles.categoryPillTextSelected,
                ]}
                numberOfLines={1}
            >
                {item}
            </Text>
        </TouchableOpacity>
    );

    const renderMeditationItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.meditationItem,
                {
                    width: meditationItemWidth,
                    height: meditationItemHeight
                }
            ]}
            onPress={() => handleNavigateToSession(item)}
        >
            <Image
                source={item.image}
                style={[
                    styles.meditationImage,
                    { height: verticalScale(100) }
                ]}
            />
            <View style={styles.meditationInfo}>
                <Text style={styles.meditationTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.meditationDuration}>{item.duration}</Text>
                <View style={styles.playCircle}>
                    <Ionicons
                        name="play"
                        size={moderateScale(16)}
                        color={colors.primary}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCategorySection = ({ item }) => (
        <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAllText}>View All →</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={item.items}
                renderItem={renderMeditationItem}
                keyExtractor={(i) => i.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.meditationList}
            />
        </View>
    );

    return (

        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <Header
                title="Meditations"
                titleAlignment="center"
                showLeftIcon={false}
                showRightIcon={true}
                rightIconName="search-outline"

                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
                rightIconSize={32}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Featured Meditation */}
                <View
                    style={[
                        styles.featuredCard,
                        { height: featuredCardHeight }
                    ]}

                >
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

                {/* Category Sections */}
                <FlatList
                    data={meditationData.categories}
                    renderItem={renderCategorySection}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.categoriesContainer}
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
    header: { display: "none" },
    headerButton: { display: "none" },
    headerTitle: { display: "none" },

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
    featuredDividerSmall: {
        flex: 1.5,
    },
    featuredDividerMedium: {
        flex: 2.5,
    },
    featuredDividerLarge: {
        flex: 3,
    },
    featuredDividerBlue: {
        backgroundColor: colors.secondary,
    },
    featuredDividerWhite: {
        backgroundColor: colors.primary,
    },

    categoriesContainer: {
        paddingHorizontal: moderateScale(20)
    },
    categorySection: {
        marginBottom: verticalScale(30)
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: verticalScale(14),
    },
    sectionTitle: {
        fontSize: getFontSize(18),
        fontWeight: "700",
        color: colors.textDark,
        flex: 1,
    },
    viewAllText: {
        fontSize: getFontSize(14),
        color: colors.secondary,
        fontWeight: "600"
    },
    meditationList: {
        paddingRight: moderateScale(20)
    },

    // Meditation Item
    meditationItem: {
        marginRight: moderateScale(14),
        borderRadius: moderateScale(14),
        overflow: "hidden",
        backgroundColor: colors.card,
        alignItems: "center",
        padding: moderateScale(12),
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 5,
            },
            android: {
                elevation: 3,
                shadowColor: colors.shadow,
            },
        }),
    },
    meditationImage: {
        width: "100%",
        resizeMode: "contain",
        marginBottom: verticalScale(10),
    },
    meditationInfo: {
        alignItems: "center",
        flex: 1,
        justifyContent: "space-between",
    },
    meditationTitle: {
        fontSize: getFontSize(14),
        fontWeight: "600",
        color: colors.textDark,
        textAlign: "center",
        lineHeight: getFontSize(18),
    },
    meditationDuration: {
        fontSize: getFontSize(12),
        color: colors.textLight,
        textAlign: "center",
        marginVertical: verticalScale(4),
    },

    playCircle: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        backgroundColor: colors.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginTop: verticalScale(8),
    },

    categoriesList: {
        paddingVertical: verticalScale(8),
    },
    categoryPill: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        paddingHorizontal: moderateScale(14),
        paddingVertical: verticalScale(6),
        borderRadius: moderateScale(20),
        marginRight: moderateScale(8),
        minWidth: moderateScale(80),
        alignItems: "center",
    },
    categoryPillSelected: {
        backgroundColor: colors.secondary
    },
    categoryPillText: {
        fontSize: getFontSize(13),
        color: colors.textDark,
        fontWeight: "500",
    },
    categoryPillTextSelected: {
        color: colors.primary,
        fontWeight: "700"
    },

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
});

import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import EmotionBreakdownChart from "../components/EmotionBreakdownChart";
import PolarityDonutChart from "../components/PolarityDonutChart";
import DailyMoodTrendChart from "../components/DailyMoodTrendChart";
import VolatilityGauge from "../components/VolatilityGauge";
import DistressCalendarHeatmap from "../components/DistressCalendarHeatmap";
import ConsecutiveDistressCard from "../components/ConsecutiveDistressCard";
import WeeklySnapshotCard from "../components/WeeklySnapshotCard";
import { adaptMoodStats } from "../utils/moodStatsAdapter";
import { NODE_BACKEND_URL } from "../config/urls";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) =>
    Math.round(size + (scale(size) - size) * factor);

const colors = {
    background: "#F8FAFC",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    primary: "#52ACD7",
    primaryLight: "#E8F5FC",
    danger: "#FF6B6B",
    success: "#51CF66",
    warning: "#FFD93D",
    neutral: "#A0AEC0",
    white: "#FFFFFF",
    borderLight: "#E8E8E8",
};

// Dummy data matching the moodStats service output
const DUMMY_MOOD_STATS = {
    seeker: {
        id: "6575f5c7f5f5f5f5f5f5f5f5",
        name: "John Doe",
    },
    stats: {
        userId: "6575f5c7f5f5f5f5f5f5f5f5",
        windowDays: 30,
        generatedAt: new Date().toISOString(),
        summary: {
            totalContentAnalyzed: 42,
            dominantEmotion: "sadness",
            volatility: { score: 0.58, label: "moderate" },
            distressDaysCount: 12,
            longestConsecutiveDistress: 4,
        },
        polaritySplit: {
            positive: { count: 18, percentage: 43 },
            negative: { count: 16, percentage: 38 },
            neutral: { count: 8, percentage: 19 },
        },
        emotionBreakdown: [
            { emotion: "sadness", count: 12, percentage: 29, avgScore: 0.87 },
            { emotion: "anger", count: 8, percentage: 19, avgScore: 0.76 },
            { emotion: "fear", count: 6, percentage: 14, avgScore: 0.69 },
            { emotion: "joy", count: 10, percentage: 24, avgScore: 0.82 },
            { emotion: "love", count: 6, percentage: 14, avgScore: 0.78 },
        ],
        dailyTrend: [
            {
                date: "2026-03-20",
                dominant: "positive",
                positive: 60,
                negative: 20,
                neutral: 20,
            },
            {
                date: "2026-03-21",
                dominant: "neutral",
                positive: 40,
                negative: 30,
                neutral: 30,
            },
            {
                date: "2026-03-22",
                dominant: "negative",
                positive: 25,
                negative: 55,
                neutral: 20,
            },
            {
                date: "2026-03-23",
                dominant: "negative",
                positive: 30,
                negative: 50,
                neutral: 20,
            },
            {
                date: "2026-03-24",
                dominant: "negative",
                positive: 20,
                negative: 60,
                neutral: 20,
            },
            {
                date: "2026-03-25",
                dominant: "positive",
                positive: 55,
                negative: 25,
                neutral: 20,
            },
            {
                date: "2026-03-26",
                dominant: "positive",
                positive: 65,
                negative: 15,
                neutral: 20,
            },
        ],
        weekSnapshot: {
            totalPosts: 12,
            positivePercentage: 50,
            negativePercentage: 33,
        },
        distressDays: [
            "2026-03-22",
            "2026-03-23",
            "2026-03-24",
        ],
        currentAggregation: {
            dominantEmotion: "sadness",
            topEmotions: ["sadness", "anger", "fear"],
            llmContext: "John is experiencing significant emotional challenges with a persistent negative sentiment trend. Recent patterns suggest ongoing stress related to personal circumstances. Recommend regular check-ins.",
            lastComputedAt: new Date().toISOString(),
        },
    },
};

const getEmotionEmoji = (emotion) => {
    const emojiMap = {
        joy: "😊",
        love: "❤️",
        surprise: "😲",
        optimism: "🌟",
        admiration: "👏",
        excitement: "🎉",
        amusement: "😄",
        gratitude: "🙏",
        pride: "💪",
        relief: "😌",
        sadness: "😢",
        anger: "😠",
        fear: "😨",
        disgust: "🤢",
        grief: "💔",
        annoyance: "😤",
        disapproval: "👎",
        embarrassment: "😳",
        remorse: "😞",
        nervousness: "😰",
        neutral: "😐",
    };
    return emojiMap[emotion] || "😐";
};

const getEmotionColor = (emotion) => {
    const positiveEmotions = [
        "joy",
        "love",
        "surprise",
        "optimism",
        "admiration",
        "excitement",
        "amusement",
        "gratitude",
        "pride",
        "relief",
    ];
    const negativeEmotions = [
        "sadness",
        "anger",
        "fear",
        "disgust",
        "grief",
        "annoyance",
        "disapproval",
        "embarrassment",
        "remorse",
        "nervousness",
    ];

    if (positiveEmotions.includes(emotion)) return colors.success;
    if (negativeEmotions.includes(emotion)) return colors.danger;
    return colors.neutral;
};

const getVolatilityLabel = (score) => {
    if (score >= 0.66) return "high";
    if (score >= 0.33) return "moderate";
    return "low";
};

const LoadingCard = ({ height = 120 }) => (
    <View style={[styles.loadingCard, { height }]}>
        <ActivityIndicator size="small" color={colors.primary} />
    </View>
);

// ===== CURRENT AGGREGATION CARD =====
const AggregationCard = ({ data }) => (
    <LinearGradient
        colors={["#FFF9F5", colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aggregationCard}
    >
        <View style={styles.aggregationHeader}>
            <MaterialIcons name="insights" size={scale(24)} color={colors.primary} />
            <Text style={styles.aggregationTitle}>AI Assessment</Text>
        </View>

        <View style={styles.aggregationContent}>
            <View style={styles.dominantEmotionSection}>
                <Text style={styles.dominantLabel}>Primary Emotion</Text>
                <View style={styles.dominantEmotionDisplay}>
                    <Text style={styles.dominantEmoji}>
                        {getEmotionEmoji(data.dominantEmotion)}
                    </Text>
                    <Text style={styles.dominantEmotionText}>{data.dominantEmotion}</Text>
                </View>
            </View>

            <View style={styles.topEmotionsSection}>
                <Text style={styles.topLabel}>Contributing Emotions</Text>
                <View style={styles.emotionChips}>
                    {data.topEmotions.map((emotion, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.emotionChip,
                                { backgroundColor: getEmotionColor(emotion) + "25" },
                            ]}
                        >
                            <Text style={styles.emotionChipEmoji}>
                                {getEmotionEmoji(emotion)}
                            </Text>
                            <Text style={styles.emotionChipText}>{emotion}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.llmContextSection}>
                <Text style={styles.llmLabel}>Insights</Text>
                <Text style={styles.llmText}>{data.llmContext}</Text>
            </View>
        </View>
    </LinearGradient>
);

export default function HelpProviderStatistics({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [windowDays, setWindowDays] = useState(30);

    // Extract providerId from route params or use fallback
    const providerId = route?.params?.providerId || "69fa159dd25168d71224fb14";

    useEffect(() => {
        const fetchMoodStats = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const url = `${NODE_BACKEND_URL}/api/helpprovider/mood-stats/${providerId}`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (!data.stats || data.stats.length === 0) {
                    throw new Error("No stats data available");
                }

                // Extract first seeker's stats and adapt them
                const firstSeekerStat = data.stats[0];
                const adaptedStats = adaptMoodStats(firstSeekerStat);

                setStats(adaptedStats);
                setWindowDays(data.windowDays || 30);
                setError(null);
            } catch (err) {
                console.error("Mood Stats Fetch Error:", err.message);
                setError(err.message || "Failed to load mood statistics");
                setStats(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMoodStats();
    }, [providerId]);

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
            <Header
                title="Statistics"
                titleAlignment="center"
                showLeftIcon
                leftIconName="arrow-back"
                onLeftIconPress={() => navigation.goBack()}
                showRightIcon={false}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
                textSize={22}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={40} color={colors.danger} />
                        <Text style={styles.errorTitle}>Unable to Load Statistics</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                    </View>
                ) : stats ? (
                    <View style={styles.headerSection}>
                        <Text style={styles.seekerName}>{stats.displayName}</Text>
                        <Text style={styles.period}>
                            Last {windowDays} days analysis
                        </Text>
                    </View>
                ) : (
                    <View style={styles.headerSection}>
                        <View style={styles.loadingPlaceholder} />
                        <View style={[styles.loadingPlaceholder, { width: "60%", marginTop: 8 }]} />
                    </View>
                )}

                {/* Top: Metric Cards */}
                {!error && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Key Metrics</Text>
                        {isLoading || !stats ? (
                            <View style={styles.metricGrid}>
                                <View style={styles.metricCardWrap}>
                                    <LoadingCard height={130} />
                                </View>
                                <View style={styles.metricCardWrap}>
                                    <LoadingCard height={130} />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.metricGrid}>
                                <View style={styles.metricCardWrap}>
                                    <ConsecutiveDistressCard
                                        longestConsecutiveDistress={stats.longestConsecutiveDistress}
                                    />
                                </View>
                                <View style={styles.metricCardWrap}>
                                    <WeeklySnapshotCard
                                        totalPosts={stats.weekSnapshot.totalPosts}
                                        positivePercentage={stats.weekSnapshot.positivePercentage}
                                        negativePercentage={stats.weekSnapshot.negativePercentage}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Middle: Emotion + Polarity */}
                {!error && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Emotion Distribution</Text>
                            <LinearGradient
                                colors={["#FAFAFA", colors.background]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.chartCard}
                            >
                                {isLoading || !stats ? (
                                    <LoadingCard height={190} />
                                ) : (
                                    <EmotionBreakdownChart emotionBreakdown={stats.emotionBreakdown} />
                                )}
                            </LinearGradient>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mood Composition</Text>
                            <LinearGradient
                                colors={["#FAFAFA", colors.background]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.chartCard}
                            >
                                {isLoading || !stats ? (
                                    <LoadingCard height={210} />
                                ) : (
                                    <PolarityDonutChart polaritySplit={stats.polaritySplit} />
                                )}
                            </LinearGradient>
                        </View>
                    </>
                )}

                {/* Bottom: Trend + Calendar + Gauge */}
                {!error && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Daily Mood Trend</Text>
                            <LinearGradient
                                colors={["#FAFAFA", colors.background]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.chartCard}
                            >
                                {isLoading || !stats ? (
                                    <LoadingCard height={220} />
                                ) : (
                                    <DailyMoodTrendChart dailyTrend={stats.dailyTrend} />
                                )}
                            </LinearGradient>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Distress Calendar</Text>
                            <LinearGradient
                                colors={["#FAFAFA", colors.background]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.chartCard}
                            >
                                {isLoading || !stats ? (
                                    <LoadingCard height={190} />
                                ) : (
                                    <DistressCalendarHeatmap distressDays={stats.distressDays} />
                                )}
                            </LinearGradient>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mood Volatility</Text>
                            <LinearGradient
                                colors={["#FAFAFA", colors.background]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.chartCard}
                            >
                                {isLoading || !stats ? (
                                    <LoadingCard height={180} />
                                ) : (
                                    <VolatilityGauge
                                        score={stats.volatilityScore}
                                        label={getVolatilityLabel(stats.volatilityScore)}
                                    />
                                )}
                            </LinearGradient>
                        </View>
                    </>
                )}

                {/* Current Aggregation */}
                {!error && stats?.currentAggregation && (
                    <View style={styles.section}>
                        <AggregationCard data={stats.currentAggregation} />
                    </View>
                )}

                <View style={{ height: verticalScale(20) }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: scale(16),
        paddingTop: verticalScale(16),
    },
    headerSection: {
        marginBottom: verticalScale(20),
    },
    seekerName: {
        fontSize: scale(28),
        fontWeight: "700",
        color: colors.textDark,
        marginBottom: verticalScale(4),
    },
    period: {
        fontSize: scale(14),
        color: colors.textLight,
        fontWeight: "500",
    },
    section: {
        marginBottom: verticalScale(24),
    },
    sectionTitle: {
        fontSize: scale(18),
        fontWeight: "700",
        color: colors.textDark,
        marginBottom: verticalScale(12),
    },
    chartCard: {
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    metricGrid: {
        flexDirection: "row",
        gap: scale(12),
    },
    metricCardWrap: {
        flex: 1,
    },
    loadingCard: {
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    errorContainer: {
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(40),
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginVertical: verticalScale(16),
    },
    errorTitle: {
        fontSize: scale(16),
        fontWeight: "700",
        color: colors.textDark,
        marginTop: verticalScale(12),
    },
    errorMessage: {
        fontSize: scale(13),
        color: colors.textLight,
        marginTop: verticalScale(6),
        textAlign: "center",
    },
    loadingPlaceholder: {
        height: verticalScale(24),
        backgroundColor: colors.borderLight,
        borderRadius: scale(6),
        width: "80%",
    },

    // ===== AGGREGATION CARD =====
    aggregationCard: {
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    aggregationHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(12),
        marginBottom: verticalScale(16),
    },
    aggregationTitle: {
        fontSize: scale(16),
        fontWeight: "700",
        color: colors.textDark,
    },
    aggregationContent: {
        gap: verticalScale(12),
    },
    dominantEmotionSection: {
        backgroundColor: colors.white,
        borderRadius: moderateScale(10),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(12),
    },
    dominantLabel: {
        fontSize: scale(11),
        color: colors.textLight,
        fontWeight: "600",
        marginBottom: verticalScale(8),
    },
    dominantEmotionDisplay: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(12),
    },
    dominantEmoji: {
        fontSize: scale(36),
    },
    dominantEmotionText: {
        fontSize: scale(18),
        fontWeight: "700",
        color: colors.textDark,
        textTransform: "capitalize",
    },
    topEmotionsSection: {
        backgroundColor: colors.white,
        borderRadius: moderateScale(10),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(12),
    },
    topLabel: {
        fontSize: scale(11),
        color: colors.textLight,
        fontWeight: "600",
        marginBottom: verticalScale(10),
    },
    emotionChips: {
        flexDirection: "row",
        gap: scale(8),
        flexWrap: "wrap",
    },
    emotionChip: {
        borderRadius: moderateScale(16),
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(6),
        flexDirection: "row",
        alignItems: "center",
        gap: scale(6),
    },
    emotionChipEmoji: {
        fontSize: scale(14),
    },
    emotionChipText: {
        fontSize: scale(12),
        fontWeight: "600",
        color: colors.textDark,
        textTransform: "capitalize",
    },
    llmContextSection: {
        backgroundColor: colors.white,
        borderRadius: moderateScale(10),
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(12),
    },
    llmLabel: {
        fontSize: scale(11),
        color: colors.textLight,
        fontWeight: "600",
        marginBottom: verticalScale(8),
    },
    llmText: {
        fontSize: scale(13),
        color: colors.textDark,
        lineHeight: verticalScale(18),
        fontWeight: "500",
    },

    // ===== TREND GRID =====
    trendGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: verticalScale(12),
    },
    trendColumn: {
        alignItems: "center",
        gap: verticalScale(8),
    },
    trendDot: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(20),
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
    },
    trendDotInner: {
        width: scale(18),
        height: scale(18),
        borderRadius: scale(9),
    },
    trendDate: {
        fontSize: scale(11),
        fontWeight: "600",
        color: colors.textLight,
    },
});

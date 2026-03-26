import React, { useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

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

// ===== HORIZONTAL BAR CHART =====
const HorizontalBarChart = ({ data }) => {
    const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
    const maxPercentage = Math.max(...sortedData.map((d) => d.percentage));

    return (
        <View style={styles.chartContainer}>
            {sortedData.map((item, idx) => (
                <View key={idx} style={styles.barRow}>
                    <View style={styles.emotionLabel}>
                        <Text style={styles.barEmoji}>{getEmotionEmoji(item.emotion)}</Text>
                        <Text style={styles.barEmotionName}>{item.emotion}</Text>
                    </View>
                    <View style={styles.barWrapper}>
                        <LinearGradient
                            colors={[
                                getEmotionColor(item.emotion),
                                getEmotionColor(item.emotion) + "80",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.emotionBar,
                                {
                                    width: `${(item.percentage / maxPercentage) * 100}%`,
                                    opacity: 0.3 + item.avgScore * 0.7,
                                },
                            ]}
                        />
                    </View>
                    <View style={styles.barStats}>
                        <Text style={styles.barPercentage}>{item.percentage}%</Text>
                        <Text style={styles.barConfidence}>{item.count}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

// ===== DONUT CHART =====
const DonutChart = ({ positive, negative, neutral }) => {
    const total = positive + negative + neutral;
    const positivePercent = (positive / total) * 100;
    const negativePercent = (negative / total) * 100;
    const neutralPercent = (neutral / total) * 100;

    const donutSize = scale(160);
    const donutThickness = scale(20);
    const innerRadius = (donutSize - donutThickness) / 2;
    const outerRadius = donutSize / 2;

    return (
        <View style={styles.donutContainer}>
            <View style={styles.donutChart}>
                {/* Circular Donut Background */}
                <View style={[styles.donutCircle, { width: donutSize, height: donutSize }]}>
                    {/* Positive Segment */}
                    <View
                        style={[
                            styles.donutSegmentCircle,
                            {
                                width: donutSize,
                                height: donutSize,
                                borderRadius: donutSize / 2,
                                borderWidth: donutThickness,
                                borderColor: colors.success,
                                borderRightColor: "transparent",
                                borderBottomColor: "transparent",
                                transform: [{ rotate: "0deg" }],
                            },
                        ]}
                    />
                    {/* Negative Segment */}
                    <View
                        style={[
                            styles.donutSegmentCircle,
                            {
                                width: donutSize,
                                height: donutSize,
                                borderRadius: donutSize / 2,
                                borderWidth: donutThickness,
                                borderColor: colors.danger,
                                borderRightColor: "transparent",
                                borderBottomColor: "transparent",
                                transform: [{ rotate: `${positivePercent * 3.6}deg` }],
                            },
                        ]}
                    />
                    {/* Neutral Segment */}
                    <View
                        style={[
                            styles.donutSegmentCircle,
                            {
                                width: donutSize,
                                height: donutSize,
                                borderRadius: donutSize / 2,
                                borderWidth: donutThickness,
                                borderColor: colors.neutral,
                                borderRightColor: "transparent",
                                borderBottomColor: "transparent",
                                transform: [
                                    { rotate: `${(positivePercent + negativePercent) * 3.6}deg` },
                                ],
                            },
                        ]}
                    />

                    {/* Center Circle */}
                    <View
                        style={[
                            styles.donutCenter,
                            {
                                width: donutSize - donutThickness * 2,
                                height: donutSize - donutThickness * 2,
                            },
                        ]}
                    >
                        <Text style={styles.donutCenterValue}>{total}</Text>
                        <Text style={styles.donutCenterLabel}>Posts</Text>
                    </View>
                </View>
            </View>

            {/* Legend */}
            <View style={styles.donutLegend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.legendLabel}>Positive</Text>
                        <Text style={styles.legendValue}>{positive} ({positivePercent.toFixed(0)}%)</Text>
                    </View>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.legendLabel}>Negative</Text>
                        <Text style={styles.legendValue}>{negative} ({negativePercent.toFixed(0)}%)</Text>
                    </View>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.neutral }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.legendLabel}>Neutral</Text>
                        <Text style={styles.legendValue}>{neutral} ({neutralPercent.toFixed(0)}%)</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// ===== GAUGE CHART =====
const GaugeChart = ({ score, label }) => {
    const getGaugeColor = () => {
        if (label === "high") return colors.danger;
        if (label === "moderate") return colors.warning;
        return colors.success;
    };

    return (
        <View style={styles.gaugeContainer}>
            <LinearGradient
                colors={[colors.success, colors.warning, colors.danger]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gaugeBar}
            />
            <View style={styles.gaugeLabels}>
                <Text style={styles.gaugeLabel}>Low</Text>
                <Text style={styles.gaugeLabel}>High</Text>
            </View>
            <View style={[styles.gaugePointer, { left: `${score * 100}%` }]}>
                <Ionicons name="caret-down" size={scale(20)} color={getGaugeColor()} />
            </View>
            <View style={styles.gaugeValue}>
                <Text style={[styles.gaugeValueText, { color: getGaugeColor() }]}>
                    {score.toFixed(2)}
                </Text>
                <Text style={styles.gaugeLabelText}>{label}</Text>
            </View>
        </View>
    );
};

// ===== CALENDAR HEATMAP =====
const CalendarHeatmap = ({ distressDays, allDays }) => {
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
    }

    return (
        <View style={styles.heatmapContainer}>
            {weeks.map((week, weekIdx) => (
                <View key={weekIdx} style={styles.heatmapWeek}>
                    {week.map((day, dayIdx) => {
                        const isDistress = distressDays.includes(day.dateStr);

                        return (
                            <View
                                key={dayIdx}
                                style={[
                                    styles.heatmapDay,
                                    {
                                        backgroundColor: isDistress ? colors.danger : "#E8E8E8",
                                    },
                                ]}
                            >
                                <Text style={styles.heatmapDayText}>{day.date}</Text>
                            </View>
                        );
                    })}
                </View>
            ))}
            <View style={styles.heatmapLegend}>
                <View style={styles.heatmapLegendItem}>
                    <View
                        style={[styles.heatmapLegendDot, { backgroundColor: "#E8E8E8" }]}
                    />
                    <Text style={styles.heatmapLegendText}>Normal</Text>
                </View>
                <View style={styles.heatmapLegendItem}>
                    <View
                        style={[styles.heatmapLegendDot, { backgroundColor: colors.danger }]}
                    />
                    <Text style={styles.heatmapLegendText}>Distress</Text>
                </View>
            </View>
        </View>
    );
};

// ===== HIGHLIGHTED METRIC CARD =====
const HighlightedMetricCard = ({ icon, label, value, color, subtitle }) => (
    <LinearGradient
        colors={[color + "15", color + "08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.highlightedCard}
    >
        <View style={styles.highlightedHeader}>
            <View style={[styles.highlightedIconBg, { backgroundColor: color + "25" }]}>
                <MaterialIcons name={icon} size={scale(24)} color={color} />
            </View>
            <Text style={styles.highlightedLabel}>{label}</Text>
        </View>
        <Text style={[styles.highlightedValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.highlightedSubtitle}>{subtitle}</Text>}
    </LinearGradient>
);

// ===== 7-DAY SNAPSHOT CARD =====
const SnapshotCard = ({ total, positive, negative }) => (
    <LinearGradient
        colors={[colors.primaryLight, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.snapshotCardStyle}
    >
        <View style={styles.snapshotHeader}>
            <Text style={styles.snapshotTitle}>Weekly Summary</Text>
            <Ionicons name="trending-up" size={scale(20)} color={colors.success} />
        </View>
        <View style={styles.snapshotContent}>
            <View style={styles.snapshotMini}>
                <Text style={styles.snapshotMiniValue}>{total}</Text>
                <Text style={styles.snapshotMiniLabel}>Posts</Text>
            </View>
            <View style={styles.snapshotMini}>
                <Text style={[styles.snapshotMiniValue, { color: colors.success }]}>
                    {positive}%
                </Text>
                <Text style={styles.snapshotMiniLabel}>Positive</Text>
            </View>
            <View style={styles.snapshotMini}>
                <Text style={[styles.snapshotMiniValue, { color: colors.danger }]}>
                    {negative}%
                </Text>
                <Text style={styles.snapshotMiniLabel}>Negative</Text>
            </View>
        </View>
    </LinearGradient>
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

export default function HelpProviderStatistics({ navigation }) {
    const insets = useSafeAreaInsets();
    const stats = DUMMY_MOOD_STATS.stats;
    const seeker = DUMMY_MOOD_STATS.seeker;

    // Generate calendar days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allDays = [];
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        allDays.push({
            date: d.getDate(),
            dateStr: dateStr,
        });
    }

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
                <View style={styles.headerSection}>
                    <Text style={styles.seekerName}>{seeker.name}</Text>
                    <Text style={styles.period}>Last {stats.windowDays} days analysis</Text>
                </View>

                {/* Longest Consecutive Distress - Highlighted */}
                <HighlightedMetricCard
                    icon="warning"
                    label="Crisis Signal"
                    value={`${stats.summary.longestConsecutiveDistress} days`}
                    color={colors.danger}
                    subtitle="Consecutive distress streak"
                />

                {/* Emotion Breakdown - Horizontal Bar Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emotion Distribution</Text>
                    <LinearGradient
                        colors={["#FAFAFA", colors.background]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chartCard}
                    >
                        <HorizontalBarChart data={stats.emotionBreakdown} />
                    </LinearGradient>
                </View>

                {/* Polarity Split - Donut Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mood Composition</Text>
                    <LinearGradient
                        colors={["#FAFAFA", colors.background]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chartCard}
                    >
                        <DonutChart
                            positive={stats.polaritySplit.positive.count}
                            negative={stats.polaritySplit.negative.count}
                            neutral={stats.polaritySplit.neutral.count}
                        />
                    </LinearGradient>
                </View>

                {/* Daily Mood Trend */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Daily Mood Trend</Text>
                    <LinearGradient
                        colors={["#FAFAFA", colors.background]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chartCard}
                    >
                        <View style={styles.trendGrid}>
                            {stats.dailyTrend.map((day, idx) => {
                                const isDistress = day.dominant === "negative";
                                return (
                                    <View key={idx} style={styles.trendColumn}>
                                        <View style={styles.trendDot}>
                                            <View
                                                style={[
                                                    styles.trendDotInner,
                                                    {
                                                        backgroundColor: isDistress
                                                            ? colors.danger
                                                            : day.dominant === "positive"
                                                                ? colors.success
                                                                : colors.neutral,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.trendDate}>
                                            {new Date(day.date).getDate()}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </LinearGradient>
                </View>

                {/* Volatility Score - Gauge */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mood Volatility</Text>
                    <LinearGradient
                        colors={["#FAFAFA", colors.background]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chartCard}
                    >
                        <GaugeChart
                            score={stats.summary.volatility.score}
                            label={stats.summary.volatility.label}
                        />
                    </LinearGradient>
                </View>

                {/* Distress Days Calendar Heatmap */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distress Calendar</Text>
                    <LinearGradient
                        colors={["#FAFAFA", colors.background]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chartCard}
                    >
                        <CalendarHeatmap
                            distressDays={stats.distressDays}
                            allDays={allDays}
                        />
                    </LinearGradient>
                </View>

                {/* 7-Day Snapshot */}
                <View style={styles.section}>
                    <SnapshotCard
                        total={stats.weekSnapshot.totalPosts}
                        positive={stats.weekSnapshot.positivePercentage}
                        negative={stats.weekSnapshot.negativePercentage}
                    />
                </View>

                {/* Current Aggregation */}
                {stats.currentAggregation && (
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

    // ===== HORIZONTAL BAR CHART =====
    chartContainer: {
        gap: verticalScale(12),
    },
    barRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(10),
    },
    emotionLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(8),
        width: scale(80),
    },
    barEmoji: {
        fontSize: scale(18),
    },
    barEmotionName: {
        fontSize: scale(12),
        fontWeight: "600",
        color: colors.textDark,
        textTransform: "capitalize",
    },
    barWrapper: {
        flex: 1,
        height: verticalScale(28),
        backgroundColor: "#F0F0F0",
        borderRadius: scale(6),
        overflow: "hidden",
    },
    emotionBar: {
        height: "100%",
        borderRadius: scale(6),
    },
    barStats: {
        width: scale(50),
        alignItems: "flex-end",
    },
    barPercentage: {
        fontSize: scale(13),
        fontWeight: "700",
        color: colors.textDark,
    },
    barConfidence: {
        fontSize: scale(11),
        color: colors.textLight,
        marginTop: verticalScale(2),
    },

    // ===== DONUT CHART =====
    donutContainer: {
        alignItems: "center",
        paddingVertical: verticalScale(8),
    },
    donutChart: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: verticalScale(20),
    },
    donutCircle: {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    donutSegmentCircle: {
        position: "absolute",
    },
    donutCenter: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: scale(80),
    },
    donutCenterValue: {
        fontSize: scale(24),
        fontWeight: "700",
        color: colors.textDark,
    },
    donutCenterLabel: {
        fontSize: scale(11),
        color: colors.textLight,
        marginTop: verticalScale(2),
    },
    donutLegend: {
        width: "100%",
        gap: verticalScale(12),
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(12),
    },
    legendDot: {
        width: scale(14),
        height: scale(14),
        borderRadius: scale(7),
    },
    legendLabel: {
        fontSize: scale(12),
        fontWeight: "600",
        color: colors.textDark,
    },
    legendValue: {
        fontSize: scale(11),
        color: colors.textLight,
        marginTop: verticalScale(1),
    },

    // ===== GAUGE CHART =====
    gaugeContainer: {
        alignItems: "center",
        paddingVertical: verticalScale(16),
    },
    gaugeBar: {
        height: scale(12),
        width: "100%",
        borderRadius: scale(6),
        marginBottom: verticalScale(8),
    },
    gaugeLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: verticalScale(16),
    },
    gaugeLabel: {
        fontSize: scale(11),
        fontWeight: "600",
        color: colors.textLight,
    },
    gaugePointer: {
        position: "absolute",
        top: scale(25),
        marginLeft: scale(-10),
    },
    gaugeValue: {
        alignItems: "center",
        marginTop: verticalScale(12),
    },
    gaugeValueText: {
        fontSize: scale(24),
        fontWeight: "700",
    },
    gaugeLabelText: {
        fontSize: scale(12),
        color: colors.textLight,
        marginTop: verticalScale(2),
        textTransform: "capitalize",
    },

    // ===== HEATMAP =====
    heatmapContainer: {
        gap: verticalScale(8),
    },
    heatmapWeek: {
        flexDirection: "row",
        gap: scale(6),
    },
    heatmapDay: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: scale(6),
        justifyContent: "center",
        alignItems: "center",
    },
    heatmapDayText: {
        fontSize: scale(10),
        fontWeight: "600",
        color: colors.white,
    },
    heatmapLegend: {
        flexDirection: "row",
        gap: scale(16),
        justifyContent: "center",
        marginTop: verticalScale(12),
        paddingTop: verticalScale(12),
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    heatmapLegendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(6),
    },
    heatmapLegendDot: {
        width: scale(10),
        height: scale(10),
        borderRadius: scale(5),
    },
    heatmapLegendText: {
        fontSize: scale(11),
        fontWeight: "600",
        color: colors.textLight,
    },

    // ===== HIGHLIGHTED METRIC CARD =====
    highlightedCard: {
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: verticalScale(24),
    },
    highlightedHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(12),
        marginBottom: verticalScale(8),
    },
    highlightedIconBg: {
        width: scale(44),
        height: scale(44),
        borderRadius: scale(10),
        justifyContent: "center",
        alignItems: "center",
    },
    highlightedLabel: {
        fontSize: scale(13),
        fontWeight: "600",
        color: colors.textLight,
    },
    highlightedValue: {
        fontSize: scale(32),
        fontWeight: "700",
        marginBottom: verticalScale(4),
    },
    highlightedSubtitle: {
        fontSize: scale(12),
        color: colors.textLight,
        fontWeight: "500",
    },

    // ===== SNAPSHOT CARD =====
    snapshotCardStyle: {
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    snapshotHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: verticalScale(16),
    },
    snapshotTitle: {
        fontSize: scale(16),
        fontWeight: "700",
        color: colors.textDark,
    },
    snapshotContent: {
        flexDirection: "row",
        justifyContent: "space-around",
        gap: scale(12),
    },
    snapshotMini: {
        flex: 1,
        alignItems: "center",
    },
    snapshotMiniValue: {
        fontSize: scale(20),
        fontWeight: "700",
        color: colors.textDark,
    },
    snapshotMiniLabel: {
        fontSize: scale(11),
        color: colors.textLight,
        marginTop: verticalScale(4),
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

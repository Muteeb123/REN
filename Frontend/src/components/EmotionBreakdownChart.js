import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercentage = (value) => {
    const percent = toNumber(value, 0);
    if (percent < 0) return 0;
    if (percent > 100) return 100;
    return percent;
};

const getEmotionColor = (emotion) => {
    const positiveEmotions = new Set([
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
    ]);
    const negativeEmotions = new Set([
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
    ]);

    if (positiveEmotions.has(emotion)) return "#51CF66";
    if (negativeEmotions.has(emotion)) return "#FF6B6B";
    return "#A0AEC0";
};

export default function EmotionBreakdownChart({ emotionBreakdown = [] }) {
    const [activeTooltipIndex, setActiveTooltipIndex] = useState(null);

    const sortedData = useMemo(() => {
        const normalized = Array.isArray(emotionBreakdown)
            ? emotionBreakdown.map((item) => ({
                  emotion: item?.emotion || "neutral",
                  percentage: clampPercentage(item?.percentage),
                  avgScore: toNumber(item?.avgScore, 0),
                  count: toNumber(item?.count, 0),
              }))
            : [];

        return normalized.sort((a, b) => b.percentage - a.percentage);
    }, [emotionBreakdown]);

    if (!sortedData.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No emotion data available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {sortedData.map((item, index) => {
                const isTooltipVisible = activeTooltipIndex === index;

                return (
                    <Pressable
                        key={`${item.emotion}-${index}`}
                        onPress={() =>
                            setActiveTooltipIndex(isTooltipVisible ? null : index)
                        }
                        style={styles.row}
                    >
                        <View style={styles.rowHeader}>
                            <Text style={styles.emotionName}>{item.emotion}</Text>
                            <Text style={styles.percentageText}>{item.percentage}%</Text>
                        </View>

                        <View style={styles.track}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        width: `${item.percentage}%`,
                                        backgroundColor: getEmotionColor(item.emotion),
                                    },
                                ]}
                            />
                        </View>

                        {isTooltipVisible ? (
                            <View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>
                                    Avg score: {item.avgScore.toFixed(2)}
                                </Text>
                            </View>
                        ) : null}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    row: {
        gap: 6,
    },
    rowHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    emotionName: {
        color: "#1A1B1E",
        fontSize: 14,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    percentageText: {
        color: "#4A5568",
        fontSize: 13,
        fontWeight: "600",
    },
    track: {
        height: 12,
        backgroundColor: "#EDF2F7",
        borderRadius: 999,
        overflow: "hidden",
    },
    bar: {
        height: "100%",
        borderRadius: 999,
    },
    tooltip: {
        alignSelf: "flex-start",
        backgroundColor: "#1A1B1E",
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
    },
    tooltipText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
    },
    emptyContainer: {
        paddingVertical: 10,
    },
    emptyText: {
        color: "#6E6E6E",
        fontSize: 14,
    },
});
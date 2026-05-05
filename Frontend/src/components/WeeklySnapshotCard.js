import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercent = (value) => {
    const n = toNumber(value, 0);
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
};

export default function WeeklySnapshotCard({ totalPosts = 0, positivePercentage = 0, negativePercentage = 0 }) {
    const stats = useMemo(() => {
        const total = toNumber(totalPosts, 0);
        const positive = clampPercent(positivePercentage);
        const negative = clampPercent(negativePercentage);

        const sum = positive + negative;
        const normalizedPositive = sum > 0 ? Math.round((positive / sum) * 100) : 0;
        const normalizedNegative = sum > 0 ? 100 - normalizedPositive : 0;
        const isPositiveTrend = normalizedPositive >= normalizedNegative;

        return {
            total,
            positive,
            negative,
            normalizedPositive,
            normalizedNegative,
            isPositiveTrend,
        };
    }, [totalPosts, positivePercentage, negativePercentage]);

    const size = 66;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const positiveLength = (stats.normalizedPositive / 100) * circumference;

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <Text style={styles.title}>Weekly Snapshot</Text>
                <View style={styles.trendRow}>
                    <Ionicons
                        name={stats.isPositiveTrend ? "trending-up" : "trending-down"}
                        size={16}
                        color={stats.isPositiveTrend ? "#51CF66" : "#FF6B6B"}
                    />
                    <Text
                        style={[
                            styles.trendText,
                            { color: stats.isPositiveTrend ? "#51CF66" : "#FF6B6B" },
                        ]}
                    >
                        {stats.isPositiveTrend ? "up" : "down"}
                    </Text>
                </View>
            </View>

            <View style={styles.contentRow}>
                <View style={styles.metricBlock}>
                    <Text style={styles.metricValue}>{stats.total}</Text>
                    <Text style={styles.metricLabel}>Total Posts</Text>
                </View>

                <View style={styles.donutWrap}>
                    <Svg width={size} height={size}>
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#EDF2F7"
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#51CF66"
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={`${positiveLength} ${circumference - positiveLength}`}
                            strokeDashoffset={0}
                            rotation={-90}
                            originX={center}
                            originY={center}
                            strokeLinecap="round"
                        />
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#FF6B6B"
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={`${circumference - positiveLength} ${positiveLength}`}
                            strokeDashoffset={-positiveLength}
                            rotation={-90}
                            originX={center}
                            originY={center}
                            strokeLinecap="round"
                        />
                    </Svg>
                    <View style={styles.centerTextWrap}>
                        <Text style={styles.centerText}>{stats.positive}%</Text>
                        <Text style={styles.centerCaption}>Pos</Text>
                    </View>
                </View>
            </View>

            <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: "#51CF66" }]} />
                    <Text style={styles.legendText}>Positive {stats.positive}%</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: "#FF6B6B" }]} />
                    <Text style={styles.legendText}>Negative {stats.negative}%</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: "#E8E8E8",
        backgroundColor: "#FFFFFF",
        gap: 14,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1B1E",
    },
    trendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    trendText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    contentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    metricBlock: {
        gap: 4,
    },
    metricValue: {
        fontSize: 34,
        lineHeight: 36,
        fontWeight: "700",
        color: "#1A1B1E",
    },
    metricLabel: {
        fontSize: 12,
        color: "#6E6E6E",
        fontWeight: "600",
    },
    donutWrap: {
        width: 66,
        height: 66,
        justifyContent: "center",
        alignItems: "center",
    },
    centerTextWrap: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    centerText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1A1B1E",
    },
    centerCaption: {
        fontSize: 10,
        color: "#6E6E6E",
        fontWeight: "600",
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: "#6E6E6E",
        fontWeight: "600",
    },
});

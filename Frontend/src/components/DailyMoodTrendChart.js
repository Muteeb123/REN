import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Svg, { Polyline, Circle, Line } from "react-native-svg";

const COLORS = {
    positive: "#51CF66",
    neutral: "#A0AEC0",
    negative: "#FF6B6B",
    axis: "#E2E8F0",
    text: "#1A1B1E",
    subtle: "#6E6E6E",
};

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

const dominantColor = (dominant) => {
    if (dominant === "positive") return COLORS.positive;
    if (dominant === "negative") return COLORS.negative;
    return COLORS.neutral;
};

export default function DailyMoodTrendChart({ dailyTrend = [] }) {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [width, setWidth] = useState(320);

    const points = useMemo(() => {
        if (!Array.isArray(dailyTrend) || dailyTrend.length === 0) return [];

        return dailyTrend.map((item) => ({
            date: item?.date || "",
            dominant: item?.dominant || "neutral",
            positive: clampPercent(item?.positive),
            neutral: clampPercent(item?.neutral),
            negative: clampPercent(item?.negative),
        }));
    }, [dailyTrend]);

    if (!points.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No daily trend data available.</Text>
            </View>
        );
    }

    const chartHeight = 180;
    const leftPadding = 24;
    const rightPadding = 8;
    const topPadding = 12;
    const bottomPadding = 26;

    const drawableWidth = Math.max(width - leftPadding - rightPadding, 1);
    const drawableHeight = chartHeight - topPadding - bottomPadding;
    const stepX = points.length > 1 ? drawableWidth / (points.length - 1) : 0;

    const xAt = (index) => leftPadding + index * stepX;
    const yAt = (value) => topPadding + ((100 - value) / 100) * drawableHeight;

    const toPolyline = (key) =>
        points
            .map((p, i) => `${xAt(i)},${yAt(p[key])}`)
            .join(" ");

    const selected = selectedIndex !== null ? points[selectedIndex] : null;

    return (
        <View style={styles.container}>
            <View
                style={styles.chartShell}
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            >
                <Svg width={width} height={chartHeight}>
                    {[0, 25, 50, 75, 100].map((value) => (
                        <Line
                            key={value}
                            x1={leftPadding}
                            y1={yAt(value)}
                            x2={leftPadding + drawableWidth}
                            y2={yAt(value)}
                            stroke={COLORS.axis}
                            strokeWidth={1}
                        />
                    ))}

                    <Polyline
                        points={toPolyline("positive")}
                        fill="none"
                        stroke={COLORS.positive}
                        strokeWidth={2.5}
                    />
                    <Polyline
                        points={toPolyline("neutral")}
                        fill="none"
                        stroke={COLORS.neutral}
                        strokeWidth={2.5}
                    />
                    <Polyline
                        points={toPolyline("negative")}
                        fill="none"
                        stroke={COLORS.negative}
                        strokeWidth={2.5}
                    />

                    {points.map((p, i) => (
                        <Circle
                            key={`dominant-${i}`}
                            cx={xAt(i)}
                            cy={
                                p.dominant === "positive"
                                    ? yAt(p.positive)
                                    : p.dominant === "negative"
                                    ? yAt(p.negative)
                                    : yAt(p.neutral)
                            }
                            r={4}
                            fill={dominantColor(p.dominant)}
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                        />
                    ))}
                </Svg>

                <View style={styles.pressRow}>
                    {points.map((_, i) => (
                        <Pressable
                            key={`press-${i}`}
                            style={[
                                styles.pressTarget,
                                { left: xAt(i) - 16, width: 32, height: chartHeight },
                            ]}
                            onPress={() => setSelectedIndex(selectedIndex === i ? null : i)}
                            onHoverIn={() => setSelectedIndex(i)}
                            onHoverOut={() => setSelectedIndex(null)}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.positive }]} />
                    <Text style={styles.legendText}>Positive</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.neutral }]} />
                    <Text style={styles.legendText}>Neutral</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.negative }]} />
                    <Text style={styles.legendText}>Negative</Text>
                </View>
            </View>

            {selected ? (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipDate}>{selected.date}</Text>
                    <Text style={styles.tooltipText}>Positive: {selected.positive}%</Text>
                    <Text style={styles.tooltipText}>Neutral: {selected.neutral}%</Text>
                    <Text style={styles.tooltipText}>Negative: {selected.negative}%</Text>
                    <Text style={styles.tooltipDominant}>
                        Dominant: {selected.dominant}
                    </Text>
                </View>
            ) : (
                <Text style={styles.hint}>Tap a day marker to view full breakdown.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 10,
    },
    chartShell: {
        width: "100%",
        position: "relative",
    },
    pressRow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    pressTarget: {
        position: "absolute",
    },
    legend: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 14,
        marginTop: 2,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
    },
    legendText: {
        fontSize: 12,
        color: COLORS.subtle,
        fontWeight: "600",
    },
    tooltip: {
        backgroundColor: "#1A1B1E",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignSelf: "flex-start",
    },
    tooltipDate: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 4,
    },
    tooltipText: {
        color: "#FFFFFF",
        fontSize: 12,
        lineHeight: 17,
    },
    tooltipDominant: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 4,
        textTransform: "capitalize",
    },
    hint: {
        fontSize: 12,
        color: COLORS.subtle,
    },
    emptyContainer: {
        paddingVertical: 10,
    },
    emptyText: {
        color: COLORS.subtle,
        fontSize: 14,
    },
});

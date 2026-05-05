import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

const COLORS = {
    positive: "#51CF66",
    neutral: "#A0AEC0",
    negative: "#FF6B6B",
    track: "#EDF2F7",
    text: "#1A1B1E",
    subtle: "#6E6E6E",
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function PolarityDonutChart({ polaritySplit = {} }) {
    const segments = useMemo(() => {
        const positive = clamp(toNumber(polaritySplit?.positive?.percentage), 0, 100);
        const neutral = clamp(toNumber(polaritySplit?.neutral?.percentage), 0, 100);
        const negative = clamp(toNumber(polaritySplit?.negative?.percentage), 0, 100);

        const sum = positive + neutral + negative;

        if (sum === 0) {
            return {
                positive: 0,
                neutral: 0,
                negative: 0,
                total: 0,
            };
        }

        return {
            positive: Math.round((positive / sum) * 100),
            neutral: Math.round((neutral / sum) * 100),
            negative: Math.round((negative / sum) * 100),
            total:
                toNumber(polaritySplit?.positive?.count) +
                toNumber(polaritySplit?.neutral?.count) +
                toNumber(polaritySplit?.negative?.count),
        };
    }, [polaritySplit]);

    const size = 180;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    const positiveLength = (segments.positive / 100) * circumference;
    const neutralLength = (segments.neutral / 100) * circumference;
    const negativeLength = (segments.negative / 100) * circumference;

    return (
        <View style={styles.wrapper}>
            <View style={styles.chartWrap}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={COLORS.track}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={COLORS.positive}
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
                        stroke={COLORS.neutral}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${neutralLength} ${circumference - neutralLength}`}
                        strokeDashoffset={-positiveLength}
                        rotation={-90}
                        originX={center}
                        originY={center}
                        strokeLinecap="round"
                    />

                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={COLORS.negative}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${negativeLength} ${circumference - negativeLength}`}
                        strokeDashoffset={-(positiveLength + neutralLength)}
                        rotation={-90}
                        originX={center}
                        originY={center}
                        strokeLinecap="round"
                    />
                </Svg>

                <View style={styles.centerLabel}>
                    <Text style={styles.centerValue}>{segments.total}</Text>
                    <Text style={styles.centerText}>Entries</Text>
                </View>
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.positive }]} />
                    <Text style={styles.legendText}>Positive: {segments.positive}%</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.neutral }]} />
                    <Text style={styles.legendText}>Neutral: {segments.neutral}%</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.negative }]} />
                    <Text style={styles.legendText}>Negative: {segments.negative}%</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        gap: 14,
    },
    chartWrap: {
        width: 180,
        height: 180,
        justifyContent: "center",
        alignItems: "center",
    },
    centerLabel: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    centerValue: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.text,
    },
    centerText: {
        fontSize: 12,
        color: COLORS.subtle,
    },
    legend: {
        width: "100%",
        gap: 8,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: "600",
    },
});

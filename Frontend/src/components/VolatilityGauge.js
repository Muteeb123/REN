import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp01 = (value) => {
    const n = toNumber(value, 0);
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
};

const normalizeLabel = (label, score) => {
    const safeLabel = String(label || "").toLowerCase();

    if (safeLabel === "moderate") return "medium";
    if (safeLabel === "medium" || safeLabel === "low" || safeLabel === "high") {
        return safeLabel;
    }

    if (score >= 0.66) return "high";
    if (score >= 0.33) return "medium";
    return "low";
};

const polarToCartesian = (cx, cy, radius, angleDegrees) => {
    const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angleRadians),
        y: cy + radius * Math.sin(angleRadians),
    };
};

const describeArc = (cx, cy, radius, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const getNeedleColor = (label) => {
    if (label === "high") return "#FF6B6B";
    if (label === "medium") return "#FFD93D";
    return "#51CF66";
};

export default function VolatilityGauge({ score = 0, label = "" }) {
    const safeScore = clamp01(score);
    const safeLabel = normalizeLabel(label, safeScore);

    const { size, cx, cy, radius, gaugePath, pointer } = useMemo(() => {
        const size = 220;
        const cx = size / 2;
        const cy = size / 2;
        const radius = 84;

        const gaugePath = describeArc(cx, cy, radius, -90, 90);

        const angle = -90 + safeScore * 180;
        const outer = polarToCartesian(cx, cy, radius - 3, angle);
        const inner = polarToCartesian(cx, cy, radius - 36, angle);

        return {
            size,
            cx,
            cy,
            radius,
            gaugePath,
            pointer: { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y },
        };
    }, [safeScore]);

    return (
        <View style={styles.container}>
            <Svg width={size} height={size * 0.62}>
                <Path d={gaugePath} stroke="#E2E8F0" strokeWidth={16} fill="none" />

                <Path
                    d={describeArc(cx, cy, radius, -90, -30)}
                    stroke="#51CF66"
                    strokeWidth={16}
                    fill="none"
                />
                <Path
                    d={describeArc(cx, cy, radius, -30, 30)}
                    stroke="#FFD93D"
                    strokeWidth={16}
                    fill="none"
                />
                <Path
                    d={describeArc(cx, cy, radius, 30, 90)}
                    stroke="#FF6B6B"
                    strokeWidth={16}
                    fill="none"
                />

                <Path
                    d={`M ${pointer.x1} ${pointer.y1} L ${pointer.x2} ${pointer.y2}`}
                    stroke={getNeedleColor(safeLabel)}
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                />
                <Circle cx={cx} cy={cy} r={7} fill={getNeedleColor(safeLabel)} />
            </Svg>

            <View style={styles.labelWrap}>
                <Text style={styles.valueText}>{safeScore.toFixed(2)}</Text>
                <Text style={styles.labelText}>{safeLabel}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingVertical: 8,
    },
    labelWrap: {
        marginTop: -12,
        alignItems: "center",
    },
    valueText: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1A1B1E",
    },
    labelText: {
        marginTop: 2,
        fontSize: 14,
        fontWeight: "700",
        color: "#6E6E6E",
        textTransform: "capitalize",
    },
});

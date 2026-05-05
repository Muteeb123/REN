import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

const WINDOW_DAYS = 35;

const toISODate = (input) => {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
};

const getCellColor = (count, maxCount) => {
    if (count <= 0 || maxCount <= 0) return "#EDF2F7";

    const intensity = count / maxCount;

    if (intensity < 0.34) return "#FECACA";
    if (intensity < 0.67) return "#F87171";
    return "#DC2626";
};

export default function DistressCalendarHeatmap({ distressDays = [] }) {
    const { weeks, hasData, maxCount } = useMemo(() => {
        const countByDate = {};

        if (Array.isArray(distressDays)) {
            distressDays.forEach((dateValue) => {
                const key = toISODate(dateValue);
                if (!key) return;
                countByDate[key] = (countByDate[key] || 0) + 1;
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allDays = [];
        for (let i = WINDOW_DAYS - 1; i >= 0; i -= 1) {
            const day = new Date(today);
            day.setDate(today.getDate() - i);
            const key = toISODate(day);

            allDays.push({
                key,
                day: day.getDate(),
                count: key ? countByDate[key] || 0 : 0,
            });
        }

        const weeks = [];
        for (let i = 0; i < allDays.length; i += 7) {
            weeks.push(allDays.slice(i, i + 7));
        }

        const counts = Object.values(countByDate);
        const maxCount = counts.length ? Math.max(...counts) : 0;

        return {
            weeks,
            hasData: counts.length > 0,
            maxCount,
        };
    }, [distressDays]);

    if (!hasData) {
        return (
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No distress data yet</Text>
                <Text style={styles.emptyText}>
                    Distress patterns will appear here once data is available.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {weeks.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={styles.weekRow}>
                    {week.map((day, dayIndex) => (
                        <View
                            key={`${day.key || "day"}-${dayIndex}`}
                            style={[
                                styles.dayCell,
                                { backgroundColor: getCellColor(day.count, maxCount) },
                            ]}
                        >
                            <Text style={styles.dayText}>{day.day}</Text>
                        </View>
                    ))}
                </View>
            ))}

            <View style={styles.legendRow}>
                <Text style={styles.legendLabel}>Low</Text>
                <View style={[styles.legendColor, { backgroundColor: "#FECACA" }]} />
                <View style={[styles.legendColor, { backgroundColor: "#F87171" }]} />
                <View style={[styles.legendColor, { backgroundColor: "#DC2626" }]} />
                <Text style={styles.legendLabel}>High</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    weekRow: {
        flexDirection: "row",
        gap: 6,
    },
    dayCell: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    dayText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 10,
    },
    legendColor: {
        width: 14,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: {
        fontSize: 11,
        color: "#6E6E6E",
        fontWeight: "600",
    },
    emptyWrap: {
        paddingVertical: 12,
        alignItems: "center",
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1B1E",
        marginBottom: 4,
    },
    emptyText: {
        fontSize: 13,
        color: "#6E6E6E",
        textAlign: "center",
    },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function ConsecutiveDistressCard({ longestConsecutiveDistress = 0 }) {
    const streak = Number.isFinite(Number(longestConsecutiveDistress))
        ? Number(longestConsecutiveDistress)
        : 0;

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.iconWrap}>
                    <MaterialIcons name="warning" size={20} color="#FF6B6B" />
                </View>
                <Text style={styles.label}>Longest Distress Streak</Text>
            </View>

            <View style={styles.valueRow}>
                <Text style={styles.value}>{streak}</Text>
                <Text style={styles.unit}>days</Text>
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
        borderColor: "#FFD2D2",
        backgroundColor: "#FFF5F5",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFE3E3",
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6E6E6E",
    },
    valueRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 6,
    },
    value: {
        fontSize: 38,
        lineHeight: 42,
        fontWeight: "700",
        color: "#FF6B6B",
    },
    unit: {
        fontSize: 13,
        marginBottom: 6,
        color: "#6E6E6E",
        fontWeight: "600",
    },
});

import React from "react";
import { SafeAreaView, View, Text, StyleSheet, Dimensions } from "react-native";
import Header from "../components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);

const colors = {
    background: "#F8FAFC",
    textDark: "#1A1B1E",
};

export default function HelpProviderStatistics({ navigation }) {
    const insets = useSafeAreaInsets();

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

            <View style={styles.container}>
                <Text style={styles.title}>Statistics</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: scale(16),
    },
    title: {
        fontSize: scale(24),
        fontWeight: "700",
        color: colors.textDark,
        textAlign: "center",
        marginTop: verticalScale(8),
    },
});

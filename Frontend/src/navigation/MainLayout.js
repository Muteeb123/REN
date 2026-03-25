import React, { useState } from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import NavigationBar from "../components/NavigationBar";

const MainLayout = ({ navigation, currentScreenComponent: CurrentScreen, initialScreen = "Chat" }) => {
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const isSmallScreen = height < 600;
    const isLargeScreen = width > 400;
    const [currentScreen, setCurrentScreen] = useState(initialScreen);

    const handleNavigateToScreen = (screenName) => {
        setCurrentScreen(screenName);
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                <CurrentScreen
                    currentScreen={currentScreen}
                    onNavigate={handleNavigateToScreen}
                />
            </View>

            {/* Persistent Navigation Bar */}
            <NavigationBar
                currentScreen={currentScreen}
                onNavigate={handleNavigateToScreen}
                backgroundColor="#FFFFFF"
                activeColor="#52ACD7"
                inactiveColor="#6E6E6E"
                isSmallScreen={isSmallScreen}
                isLargeScreen={isLargeScreen}
                bottomInset={insets.bottom}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    content: {
        flex: 1,
    },
});

export default MainLayout;

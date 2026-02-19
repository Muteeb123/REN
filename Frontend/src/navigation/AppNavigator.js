import React, { useState } from "react";
import {
    View,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    StatusBar,
    useWindowDimensions,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import Login from "../screens/Login";
import Personalization from "../screens/Personalization";
import ChatPage from "../screens/Chat";
import Journal from "../screens/Journal";
import Meditation from "../screens/Meditation";
import MeditationSession from "../screens/MeditationSession";
import SettingsScreen from "../screens/Settings";
import NavigationBar from "../components/NavigationBar";

const Stack = createStackNavigator();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const scale = (size) => {
    const baseWidth = 375;
    const scaleFactor = SCREEN_WIDTH / baseWidth;
    const normalizedSize = size * scaleFactor;
    return Math.round(normalizedSize);
};

const verticalScale = (size) => {
    const baseHeight = 812;
    const scaleFactor = SCREEN_HEIGHT / baseHeight;
    const normalizedSize = size * scaleFactor;
    return Math.round(normalizedSize);
};

const moderateScale = (size, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
};

const colors = {
    primary: "#FFFFFF",
    secondary: "#52ACD7",
    statusbar: "#3093C2",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    background: "#F8FAFC",
    focused: "#fff3b0",
};

// MainTabsLayout: Persistent Navigation with Dynamic Screen Content
function MainTabsLayout({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { height, width } = useWindowDimensions();
    const isSmallScreen = height < 600;
    const isLargeScreen = width > 400;
    const [currentScreen, setCurrentScreen] = useState(route.params?.screen || "Chat");

    const screensMap = {
        Chat: ChatPage,
        Journal: Journal,
        Meditation: Meditation,
        Settings: SettingsScreen,
    };

    const CurrentScreenComponent = screensMap[currentScreen] || ChatPage;

    const handleNavigateToScreen = (screenName) => {
        setCurrentScreen(screenName);
    };

    return (
        <View style={styles.mainTabsContainer}>
            <View style={styles.screenContent}>
                <CurrentScreenComponent
                    currentScreen={currentScreen}
                    onNavigate={handleNavigateToScreen}
                />
            </View>

            {/* Persistent Navigation Bar (rendered once) */}
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
        </View>
    );
}

export default function AppNavigator() {
    const { height } = useWindowDimensions();

    return (
        <SafeAreaProvider>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.primary}
                translucent
            />
            <NavigationContainer>
                <SafeAreaView style={[styles.safeArea, { minHeight: height }]}>
                    <Stack.Navigator
                        screenOptions={{
                            headerShown: false,
                            cardStyle: { backgroundColor: colors.background },
                        }}
                    >
                        <Stack.Screen name="Login" component={Login} />
                        <Stack.Screen name="Personalization" component={Personalization} />
                        <Stack.Screen name="MainTabs" component={MainTabsLayout} initialParams={{ screen: "Chat" }} />
                        <Stack.Screen name="MeditationSession" component={MeditationSession} />
                    </Stack.Navigator>
                </SafeAreaView>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mainTabsContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    screenContent: {
        flex: 1,
    },
});

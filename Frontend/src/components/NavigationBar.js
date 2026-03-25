import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BotMessageSquare, LibraryBig, SparklesIcon, HeartHandshake, Settings } from "lucide-react-native";

const { width, height } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((width / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((height / BASE_HEIGHT) * size);

const NavigationBar = ({
    currentScreen,
    onNavigate,
    screens = [
        { name: "Journal", icon: LibraryBig, label: "Journal" },
        { name: "Meditation", icon: SparklesIcon, label: "Meditation" },
        { name: "Chat", icon: BotMessageSquare, label: "Chat" },
        { name: "Support", icon: HeartHandshake, label: "Support" },
        { name: "Settings", icon: Settings, label: "Settings" },
    ],
    backgroundColor = "#FFFFFF",
    activeColor = "#52ACD7",
    inactiveColor = "#6E6E6E",
    borderTopColor = "rgba(82, 172, 215, 0.1)",
    borderTopWidth = 1,
    isSmallScreen = false,
    isLargeScreen = false,
    bottomInset = 0,
}) => {
    const getTabBarHeight = () => {
        if (isSmallScreen) {
            return verticalScale(50) + bottomInset;
        } else if (isLargeScreen) {
            return verticalScale(70) + bottomInset;
        }
        return verticalScale(60) + bottomInset;
    };

    const getIconSize = () => {
        if (isSmallScreen) {
            return scale(28);
        } else if (isLargeScreen) {
            return scale(34);
        }
        return scale(30);
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor,
                    borderTopColor,
                    borderTopWidth,
                    height: getTabBarHeight(),
                    paddingBottom: bottomInset,
                },
            ]}
        >
            {screens.map((screen) => {
                const isFocused = currentScreen === screen.name;
                const iconSize = getIconSize();
                const iconColor = isFocused ? activeColor : inactiveColor;

                return (
                    <TouchableOpacity
                        key={screen.name}
                        style={styles.navItem}
                        onPress={() => onNavigate(screen.name)}
                        activeOpacity={0.7}
                    >
                        <screen.icon size={iconSize} color={iconColor} strokeWidth={2.3} />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingTop: verticalScale(8),
    },
    navItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: scale(8),
    },
});

export default NavigationBar;

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const BASE_WIDTH = 375;
const scale = (size) => Math.round((width / BASE_WIDTH) * size);

const Header = ({
    title,
    leftIcon = null,
    leftIconName = "arrow-back",
    leftIconColor = "#1A1B1E",
    onLeftIconPress = null,
    rightIcon = null,
    rightIconName = "menu",
    rightIconColor = "#1A1B1E",
    onRightIconPress = null,
    titleAlignment = "center",
    showLeftIcon = false,
    showRightIcon = false,
    backgroundColor = "#FFFFFF",
    borderBottomColor = "rgba(82, 172, 215, 0.1)",
    borderBottomWidth = 1,
    subtitleText = null,
    subtitleColor = "#52ACD7",
    textSize = 25,
    rightIconSize = 22,
}) => {
    const rightIconBoxSize = Math.max(scale(40), scale(rightIconSize) + scale(16));
    const getContainerAlignment = () => {
        switch (titleAlignment) {
            case "center":
                return styles.centerTitle;
            case "right":
                return styles.rightTitle;
            default:
                return styles.leftTitle;
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor,
                    borderBottomColor,
                    borderBottomWidth,
                },
            ]}
        >
            {/* Left Icon */}
            <View style={styles.iconContainer}>
                {showLeftIcon && onLeftIconPress ? (
                    <TouchableOpacity onPress={onLeftIconPress} style={styles.iconButton}>
                        {leftIcon ? (
                            leftIcon
                        ) : (
                            <Ionicons name={leftIconName} size={scale(22)} color={leftIconColor} />
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: scale(40) }} />
                )}
            </View>

            {/* Title and Subtitle */}
            <View style={[styles.titleContainer, getContainerAlignment()]}>
                <Text style={[styles.title, { fontSize: scale(textSize) }]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitleText && (
                    <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
                        {subtitleText}
                    </Text>
                )}
            </View>

            {/* Right Icon */}
            <View style={[styles.iconContainer, { width: rightIconBoxSize }]}>
                {showRightIcon && onRightIconPress ? (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.iconButton}>
                        {rightIcon ? (
                            rightIcon
                        ) : (
                            <Ionicons name={rightIconName} size={scale(rightIconSize)} color={rightIconColor} />
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: rightIconBoxSize }} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: scale(16),
        paddingVertical: scale(12),
        minHeight: scale(56),
    },
    iconContainer: {
        width: scale(40),
        alignItems: "center",
        justifyContent: "center",
    },
    iconButton: {
        padding: scale(4),
    },
    titleContainer: {
        flex: 1,
        paddingHorizontal: scale(8),
    },
    leftTitle: {
        alignItems: "flex-start",
    },
    centerTitle: {
        alignItems: "center",
    },
    rightTitle: {
        alignItems: "flex-end",
    },
    title: {
        fontSize: scale(18),
        fontWeight: "500",
        color: "#1A1B1E",
    },
    subtitle: {
        fontSize: scale(13),
        marginTop: scale(2),
    },
});

export default Header;

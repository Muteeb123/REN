import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Animated,
    Dimensions,
    Modal,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/Header";
import { NODE_BACKEND_URL } from "../config/urls";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) =>
    Math.round(size + (scale(size) - size) * factor);

const colors = {
    primary: "#FFFFFF",
    secondary: "#52ACD7",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    bubbleLight: "#F2F2F2",
    borderLight: "#E8E8E8",
};

const EMOJI_OPTIONS = ["❤️", "👍", "😊", "🙏", "😢", "😮"];

const getDateKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
};

const getDateLabel = (dateKey) => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, "0")}-${yesterday.getDate().toString().padStart(2, "0")}`;
    if (dateKey === todayKey) return "Today";
    if (dateKey === yesterdayKey) return "Yesterday";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [y, m, d] = dateKey.split("-");
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
};

const addDateSeparators = (messages) => {
    const result = [];
    let lastDateKey = null;
    for (const msg of messages) {
        const dateKey = getDateKey(msg.createdAt);
        if (dateKey !== lastDateKey) {
            if (lastDateKey !== null) {
                result.push({ id: `sep-${lastDateKey}`, type: "separator", label: getDateLabel(lastDateKey) });
            }
            lastDateKey = dateKey;
        }
        result.push(msg);
    }
    if (lastDateKey !== null) {
        result.push({ id: `sep-${lastDateKey}`, type: "separator", label: getDateLabel(lastDateKey) });
    }
    return result;
};

const MessageBubble = React.memo(({ message, onLongPress }) => (
    <TouchableOpacity
        style={styles.messageRow}
        onLongPress={() => onLongPress(message._id)}
        delayLongPress={300}
        activeOpacity={0.5}
    >
        <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.timestamp}>{formatTime(message.createdAt)}</Text>
            {message.reactions && message.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                    {message.reactions.map((reaction, idx) => (
                        <View key={idx} style={styles.reactionBadge}>
                            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    </TouchableOpacity>
));

const DateSeparator = ({ label }) => (
    <View style={styles.dateSeparatorContainer}>
        <View style={styles.dateSeparatorLine} />
        <Text style={styles.dateSeparatorText}>{label}</Text>
        <View style={styles.dateSeparatorLine} />
    </View>
);

export default function Support({ currentScreen, onNavigate }) {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [helpEmail, setHelpEmail] = useState("");
    const [helpProviderName, setHelpProviderName] = useState("");
    const [emailLoaded, setEmailLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pickerMessageId, setPickerMessageId] = useState(null);
    const [reacting, setReacting] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const userId = useRef(null);

    useEffect(() => {
        const initializeSupport = async () => {
            try {
                const cachedUser = await AsyncStorage.getItem("cachedUser");
                const id = await AsyncStorage.getItem("userId");
                userId.current = id;

                if (cachedUser) {
                    const parsed = JSON.parse(cachedUser);
                    if (parsed?.user?.helpContactEmail) {
                        setHelpEmail(parsed.user.helpContactEmail);
                        setHelpProviderName(parsed.user.helpContactName || "Help Provider");

                        if (id) {
                            fetchMessages(id, parsed.user.helpContactEmail);
                        }
                    }
                }

                setEmailLoaded(true);
            } catch (e) {
                console.error("Support initialization error:", e);
                setEmailLoaded(true);
            }
        };

        initializeSupport();
    }, []);

    const fetchMessages = async (seekerId, helpProviderEmail) => {
        setLoading(true);
        try {
            if (!helpProviderEmail) {
                console.warn("Help provider email not available");
                return;
            }

            const response = await fetch(
                `${NODE_BACKEND_URL}/api/chat/messages?helpSeekerUserId=${seekerId}&helpProvider=${encodeURIComponent(helpProviderEmail)}&page=1`
            );

            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            } else {
                console.error("Error fetching messages:", response.status);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const openEmojiPicker = (messageId) => {
        setPickerMessageId(messageId);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const selectEmoji = async (emoji) => {
        if (reacting) return;
        setReacting(true);

        try {
            const cachedUser = await AsyncStorage.getItem("cachedUser");
            const parsed = JSON.parse(cachedUser);
            const helpProviderEmail = parsed?.user?.helpContactEmail;

            if (!helpProviderEmail) {
                console.error("Help provider email not found");
                return;
            }

            // Get the chatId first
            const messagesResponse = await fetch(
                `${NODE_BACKEND_URL}/api/chat/messages?helpSeekerUserId=${userId.current}&helpProvider=${encodeURIComponent(helpProviderEmail)}&page=1`
            );
            const messagesData = await messagesResponse.json();
            const chatId = messagesData.chatId;

            // Add the reaction
            const response = await fetch(
                `${NODE_BACKEND_URL}/api/chat/${chatId}/${pickerMessageId}/react`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        helpSeekerId: userId.current,
                        emoji: emoji,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                // Update the message in the list
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === pickerMessageId ? data.data : msg
                    )
                );
            } else {
                console.error("Error adding reaction:", response.status);
            }
        } catch (error) {
            console.error("Error selecting emoji:", error);
        } finally {
            setReacting(false);
            closePicker();
        }
    };

    const closePicker = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => setPickerMessageId(null));
    };

    const renderItem = ({ item }) => {
        if (item.type === "separator") {
            return <DateSeparator label={item.label} />;
        }
        return (
            <MessageBubble
                message={item}
                onLongPress={openEmojiPicker}
            />
        );
    };

    const processedMessages = addDateSeparators([...messages].reverse());

    return (
        <SafeAreaView style={[styles.safeContainer, { paddingTop: insets.top }]}>
            <Header
                title="Help Provider"
                titleAlignment="center"
                subtitleText={helpEmail || helpProviderName}
                subtitleColor="#52ACD7"
                showLeftIcon={false}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
                textSize={21}
            />

            <LinearGradient
                colors={["#F9FBFD", "#EAF6FC", "#FFFFFF"]}
                style={{ flex: 1 }}
            >
                {!emailLoaded ? (
                    <View style={styles.emptyStateContainer}>
                        <ActivityIndicator size="large" color={colors.secondary} />
                    </View>
                ) : !helpEmail ? (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="heart-outline" size={scale(56)} color={colors.borderLight} />
                        <Text style={styles.emptyStateTitle}>No Help Provider</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            Add your help provider's email in Settings to receive support messages.
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyStateButton}
                            onPress={() => onNavigate("Settings")}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.emptyStateButtonText}>Add Help Provider</Text>
                        </TouchableOpacity>
                    </View>
                ) : loading ? (
                    <View style={styles.emptyStateContainer}>
                        <ActivityIndicator size="large" color={colors.secondary} />
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="chatbubble-outline" size={scale(56)} color={colors.borderLight} />
                        <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            Your help provider will send you messages here. Check back soon!
                        </Text>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={processedMessages}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id || item._id}
                            inverted
                            contentContainerStyle={{
                                padding: scale(12),
                                paddingTop: verticalScale(10),
                            }}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* Read-only notice */}
                        <View style={styles.readOnlyBar}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={scale(14)}
                                color={colors.textLight}
                            />
                            <Text style={styles.readOnlyText}>
                                Only your help provider can send messages
                            </Text>
                        </View>
                    </>
                )}
            </LinearGradient>

            {/* Emoji Picker Modal */}
            <Modal
                visible={pickerMessageId !== null}
                transparent
                animationType="fade"
                onRequestClose={closePicker}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={closePicker}
                >
                    <Animated.View
                        style={[styles.emojiPicker, { opacity: fadeAnim }]}
                    >
                        {EMOJI_OPTIONS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.emojiOption}
                                onPress={() => selectEmoji(emoji)}
                                disabled={reacting}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: "#F5F9F3",
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: moderateScale(20),
        maxWidth: "85%",
    },
    messageBubble: {
        backgroundColor: colors.bubbleLight,
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(10),
        paddingBottom: moderateScale(14),
        borderRadius: moderateScale(20),
        borderBottomLeftRadius: moderateScale(6),
        flex: 1,
        overflow: "visible",
    },
    messageText: {
        fontSize: moderateScale(15),
        lineHeight: moderateScale(20),
        color: colors.textDark,
    },
    timestamp: {
        fontSize: moderateScale(11),
        color: colors.textLight,
        marginTop: moderateScale(4),
        textAlign: "right",
    },
    reactionsContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -moderateScale(13),
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: moderateScale(4),
    },
    reactionBadge: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(7),
        paddingVertical: moderateScale(2),
    },
    reactionEmoji: {
        fontSize: moderateScale(16),
    },
    dateSeparatorContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: moderateScale(12),
        paddingHorizontal: moderateScale(16),
    },
    dateSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderLight,
    },
    dateSeparatorText: {
        fontSize: moderateScale(12),
        color: colors.textLight,
        fontWeight: "500",
        paddingHorizontal: moderateScale(10),
        backgroundColor: "transparent",
    },

    readOnlyBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: verticalScale(12),
        borderTopWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: "#F8F8F8",
    },
    readOnlyText: {
        fontSize: moderateScale(13),
        color: colors.textLight,
        marginLeft: moderateScale(6),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    emojiPicker: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: moderateScale(16),
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(10),
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    emojiOption: {
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(10),
    },
    emojiText: {
        fontSize: moderateScale(24),
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: moderateScale(32),
    },
    emptyStateTitle: {
        fontSize: moderateScale(20),
        fontWeight: "600",
        color: colors.textDark,
        marginTop: moderateScale(16),
    },
    emptyStateSubtitle: {
        fontSize: moderateScale(14),
        color: colors.textLight,
        textAlign: "center",
        marginTop: moderateScale(8),
        lineHeight: moderateScale(20),
    },
    emptyStateButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.secondary,
        paddingHorizontal: moderateScale(24),
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(12),
        marginTop: moderateScale(24),
    },
    emptyStateButtonText: {
        color: "#FFFFFF",
        fontSize: moderateScale(15),
        fontWeight: "600",
    },
});

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
        const dateKey = getDateKey(msg.date);
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

const DUMMY_MESSAGES = [
    {
        id: "1",
        text: "Hi there! Welcome to your support space. I'm here to share resources and encouragement with you.",
        date: "2026-03-01T09:00:00",
    },
    {
        id: "2",
        text: "A gentle reminder: drink some water and take a few deep breaths. Small acts of self-care matter.",
        date: "2026-03-01T09:30:00",
    },
    {
        id: "3",
        text: "You don't have to have everything figured out. Progress isn't always a straight line, and that's perfectly okay.",
        date: "2026-03-02T08:45:00",
    },
    {
        id: "4",
        text: "Try writing down three things you're grateful for today. It can shift your perspective in a meaningful way.",
        date: "2026-03-02T10:15:00",
    },
    {
        id: "5",
        text: "It's okay to set boundaries. Protecting your energy is not selfish — it's necessary.",
        date: "2026-03-03T07:50:00",
    },
    {
        id: "6",
        text: "Here's a quick grounding exercise: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
        date: "2026-03-03T11:00:00",
    },
    {
        id: "7",
        text: "Remember, asking for help is a sign of strength, not weakness. You deserve support.",
        date: "2026-03-03T15:20:00",
    },
    {
        id: "8",
        text: "Take a moment to check in with yourself: How are you really feeling right now? There's no wrong answer.",
        date: "2026-03-04T08:00:00",
    },
    {
        id: "9",
        text: "If today feels heavy, know that it's okay to rest. You don't always have to be productive to be worthy.",
        date: "2026-03-04T12:30:00",
    },
    {
        id: "10",
        text: "Try stepping outside for a few minutes today. Fresh air and sunlight can do wonders for your mood.",
        date: "2026-03-04T16:45:00",
    },
    {
        id: "11",
        text: "You've made it through every difficult day so far. That's a 100% success rate. Keep going.",
        date: "2026-03-05T09:00:00",
    },
    {
        id: "12",
        text: "Consider listening to some calming music or nature sounds today. It can help quiet a busy mind.",
        date: "2026-03-05T13:10:00",
    },
    {
        id: "13",
        text: "Your feelings are valid, even the uncomfortable ones. Let yourself feel without judgment.",
        date: "2026-03-05T17:00:00",
    },
    {
        id: "14",
        text: "A good night's sleep can change everything. Try putting away screens 30 minutes before bed tonight.",
        date: "2026-03-06T08:30:00",
    },
    {
        id: "15",
        text: "You are more resilient than you think. Look how far you've already come.",
        date: "2026-03-06T10:30:00",
    },
    {
        id: "16",
        text: "Today's affirmation: I am enough, exactly as I am right now.",
        date: "2026-03-06T14:00:00",
    },
    {
        id: "17",
        text: "Try the 4-7-8 breathing technique: breathe in for 4 seconds, hold for 7, exhale for 8. Repeat 3 times.",
        date: "2026-03-06T18:15:00",
    },
    {
        id: "18",
        text: "Good morning! Remember that every new day is a fresh start. Be gentle with yourself today.",
        date: "2026-03-07T07:00:00",
    },
    {
        id: "19",
        text: "If you ever need someone to talk to, please don't hesitate to reach out to a trusted person in your life. You are not alone. 💙",
        date: "2026-03-07T08:15:00",
    },
    {
        id: "20",
        text: "I'm always here in this space for you. Take things at your own pace — there's no rush.",
        date: "2026-03-07T10:45:00",
    },
];

const MessageBubble = React.memo(({ message, reaction, onLongPress }) => (
    <TouchableOpacity
        style={styles.messageRow}
        onLongPress={() => onLongPress(message.id)}
        delayLongPress={300}
        activeOpacity={0.5}
    >
        <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.timestamp}>{formatTime(message.date)}</Text>
            {reaction && (
                <TouchableOpacity
                    style={styles.reactionBadge}
                    onPress={() => onLongPress(message.id)}
                    activeOpacity={0.6}
                >
                    <Text style={styles.reactionEmoji}>{reaction}</Text>
                </TouchableOpacity>
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
    const [reactions, setReactions] = useState({});
    const [pickerMessageId, setPickerMessageId] = useState(null);
    const [helpEmail, setHelpEmail] = useState("");
    const [emailLoaded, setEmailLoaded] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loadEmail = async () => {
            try {
                const cachedUser = await AsyncStorage.getItem("cachedUser");
                if (cachedUser) {
                    const parsed = JSON.parse(cachedUser);
                    if (parsed?.user?.helpContactEmail) {
                        setHelpEmail(parsed.user.helpContactEmail);
                    }
                }
            } catch (e) {
                console.error("Support loadEmail error:", e);
            } finally {
                setEmailLoaded(true);
            }
        };
        loadEmail();
    }, []);

    const openEmojiPicker = (messageId) => {
        setPickerMessageId(messageId);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const selectEmoji = (emoji) => {
        setReactions((prev) => {
            const current = prev[pickerMessageId];
            if (current === emoji) {
                const updated = { ...prev };
                delete updated[pickerMessageId];
                return updated;
            }
            return { ...prev, [pickerMessageId]: emoji };
        });
        closePicker();
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
                reaction={reactions[item.id]}
                onLongPress={openEmojiPicker}
            />
        );
    };

    const processedMessages = addDateSeparators([...DUMMY_MESSAGES].reverse());

    return (
        <SafeAreaView style={[styles.safeContainer, { paddingTop: insets.top }]}>
            <Header
                title="Help Provider"
                titleAlignment="center"
                subtitleText={helpEmail || ""}
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
                            {/* <Ionicons name="settings-outline" size={scale(18)} color="#FFFFFF" style={{ marginRight: moderateScale(6) }} /> */}
                            <Text style={styles.emptyStateButtonText}>Add Help Provider</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={processedMessages}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
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
                                style={[
                                    styles.emojiOption,
                                    reactions[pickerMessageId] === emoji &&
                                    styles.emojiOptionSelected,
                                ]}
                                onPress={() => selectEmoji(emoji)}
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
        marginBottom: moderateScale(10),
        maxWidth: "85%",
    },
    messageBubble: {
        backgroundColor: colors.bubbleLight,
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(20),
        borderBottomLeftRadius: moderateScale(6),
        flex: 1,
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
    reactionBadge: {
        position: "absolute",
        bottom: -moderateScale(14),
        right: moderateScale(12),
        backgroundColor: "transparent",
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(6),
        paddingVertical: moderateScale(2),


    },
    reactionEmoji: {
        fontSize: moderateScale(20),
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
    emojiOptionSelected: {
        backgroundColor: "rgba(82, 172, 215, 0.15)",
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

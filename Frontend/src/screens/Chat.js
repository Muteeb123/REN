import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ActivityIndicator,
    Image,
    Dimensions,
    useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { useNavigation } from "@react-navigation/native";
import Markdown from 'react-native-markdown-display';

// local asset
import BotIcon from "../../assets/ren.png";
import { PYTHON_BACKEND_URL } from "../config/urls";
import Header from "../components/Header";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) => Math.round(size + (scale(size) - size) * factor);

const colors = {
    primary: "#FFFFFF",
    secondary: "#52ACD7",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    bubbleLight: "#F2F2F2",
    inputBackground: "#F8F8F8",
    borderLight: "#E8E8E8",
};

// ======== Date Helpers ========
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

const addDateSeparators = (messages) => {
    const result = [];
    let lastDateKey = null;
    for (const msg of messages) {
        if (!msg.rawDate) { result.push(msg); continue; }
        const dateKey = getDateKey(msg.rawDate);
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

const DateSeparator = ({ label }) => (
    <View style={styles.dateSeparatorContainer}>
        <View style={styles.dateSeparatorLine} />
        <Text style={styles.dateSeparatorText}>{label}</Text>
        <View style={styles.dateSeparatorLine} />
    </View>
);

// ======== Typing Indicator ========
const AnimatedDot = ({ delay }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return <Animated.View style={[styles.dot, { opacity }]} />;
};

const TypingIndicator = ({ size = 22 }) => (
    <View style={[styles.messageBubble, styles.botBubble, { flexDirection: "row", alignItems: "center" }]}>
        <Image source={BotIcon} style={{ width: size, height: size, marginRight: moderateScale(8), borderRadius: 50 }} />
        <View style={{ flexDirection: "row" }}>
            <AnimatedDot delay={0} />
            <AnimatedDot delay={300} />
            <AnimatedDot delay={400} />
        </View>
    </View>
);

// ======== Message Bubble ========
const markdownBotStyles = StyleSheet.create({
    body: { fontSize: moderateScale(15), lineHeight: moderateScale(22), color: colors.textDark },
    paragraph: { marginTop: 0, marginBottom: moderateScale(4) },
    strong: { fontWeight: '700' },
    em: { fontStyle: 'italic' },
    heading1: { fontSize: moderateScale(20), fontWeight: '700', marginBottom: moderateScale(4) },
    heading2: { fontSize: moderateScale(18), fontWeight: '700', marginBottom: moderateScale(4) },
    heading3: { fontSize: moderateScale(16), fontWeight: '600', marginBottom: moderateScale(4) },
    bullet_list: { marginVertical: moderateScale(2) },
    ordered_list: { marginVertical: moderateScale(2) },
    list_item: { marginVertical: moderateScale(1) },
    code_inline: { backgroundColor: '#E0E0E0', borderRadius: 4, paddingHorizontal: 4, fontSize: moderateScale(13), fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    fence: { backgroundColor: '#E8E8E8', borderRadius: 8, padding: moderateScale(8), fontSize: moderateScale(13), fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    code_block: { backgroundColor: '#E8E8E8', borderRadius: 8, padding: moderateScale(8), fontSize: moderateScale(13), fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    blockquote: { borderLeftWidth: 3, borderLeftColor: colors.secondary, paddingLeft: moderateScale(8), marginVertical: moderateScale(4) },
    link: { color: colors.secondary, textDecorationLine: 'underline' },
    hr: { backgroundColor: colors.borderLight, height: 1, marginVertical: moderateScale(6) },
});

const markdownUserStyles = StyleSheet.create({
    body: { fontSize: moderateScale(15), lineHeight: moderateScale(22), color: 'white', fontWeight: '500' },
    paragraph: { marginTop: 0, marginBottom: moderateScale(4) },
    strong: { fontWeight: '700' },
    em: { fontStyle: 'italic' },
    heading1: { fontSize: moderateScale(20), fontWeight: '700', marginBottom: moderateScale(4), color: 'white' },
    heading2: { fontSize: moderateScale(18), fontWeight: '700', marginBottom: moderateScale(4), color: 'white' },
    heading3: { fontSize: moderateScale(16), fontWeight: '600', marginBottom: moderateScale(4), color: 'white' },
    bullet_list: { marginVertical: moderateScale(2) },
    ordered_list: { marginVertical: moderateScale(2) },
    list_item: { marginVertical: moderateScale(1) },
    code_inline: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, paddingHorizontal: 4, fontSize: moderateScale(13), color: 'white', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    fence: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: moderateScale(8), fontSize: moderateScale(13), color: 'white', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    code_block: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: moderateScale(8), fontSize: moderateScale(13), color: 'white', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    blockquote: { borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.5)', paddingLeft: moderateScale(8), marginVertical: moderateScale(4) },
    link: { color: 'white', textDecorationLine: 'underline' },
    hr: { backgroundColor: 'rgba(255,255,255,0.3)', height: 1, marginVertical: moderateScale(6) },
});

const MessageBubble = React.memo(({ text, isUser, animatedValue, timestamp }) => {
    const bubbleStyle = isUser ? styles.userBubble : styles.botBubble;

    const animStyle = {
        opacity: animatedValue,
        transform: [
            {
                translateY: animatedValue.interpolate
                    ? animatedValue.interpolate({ inputRange: [0, 1], outputRange: [8, 0] })
                    : 0,
            },
        ],
    };

    return (
        <Animated.View style={[styles.messageBubble, bubbleStyle, animStyle]}>
            <Markdown style={isUser ? markdownUserStyles : markdownBotStyles}>
                {text}
            </Markdown>
            {timestamp && (
                <Text style={[styles.timestampText, isUser && styles.timestampUser]}>{timestamp}</Text>
            )}
        </Animated.View>
    );
});

// ======== Main ChatPage ========
export default function ChatPage({ currentScreen, onNavigate }) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const base_url = PYTHON_BACKEND_URL;
    const INPUT_CONTAINER_HEIGHT = verticalScale(70);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [botTyping, setBotTyping] = useState(false);

    const flatListRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchMessages(1);
    }, []);

    const fetchMessages = useCallback(async (pageNumber = 1) => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            const res = await fetch(`${base_url}/api/conversations?user_id=${userId}&page=${pageNumber}`);
            const data = await res.json();

            if (data?.success && Array.isArray(data.messages)) {
                const mapped = data.messages.map((m) => {
                    const raw = m.created_at || new Date().toISOString();
                    const d = new Date(raw);
                    let h = d.getHours(); const min = d.getMinutes().toString().padStart(2, "0"); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
                    return { id: uuid.v4(), text: m.content, sender: m.role, rawDate: raw, timestamp: `${h}:${min} ${ap}` };
                });
                setMessages((prev) => [...prev, ...mapped]);
                setPage(pageNumber);
                setHasMore(!!(data.pagination && data.pagination.has_next_page));
            }
        } catch (err) {
            console.error("fetchMessages error", err);
        } finally {
            setLoading(false);
        }
    }, [hasMore, loading]);

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const now = new Date();
        const userMessage = { id: uuid.v4(), text: trimmed, sender: "user", rawDate: now.toISOString(), timestamp: formatTimestamp(now) };
        setMessages((prev) => [userMessage, ...prev]);
        setInput("");

        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);

        try {
            setBotTyping(true);
            const userId = await AsyncStorage.getItem("userId");
            const res = await fetch(`${base_url}/api/generateText`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, message: trimmed }),
            });
            const data = await res.json();

            const botMessage = { id: uuid.v4(), text: data?.reply ?? "Sorry, I didn't understand that.", sender: "model", rawDate: new Date().toISOString(), timestamp: formatTimestamp(new Date()) };
            setMessages((prev) => [botMessage, ...prev]);
        } catch (err) {
            console.error("sendMessage error", err);
            setMessages((prev) => [
                { id: uuid.v4(), text: "Failed to get a response. Please try again.", sender: "model", rawDate: new Date().toISOString(), timestamp: formatTimestamp(new Date()) },
                ...prev,
            ]);
        } finally {
            setBotTyping(false);
        }
    }, [input]);

    const formatTimestamp = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    const renderItem = ({ item }) => {
        if (item.type === "separator") return <DateSeparator label={item.label} />;
        if (item.typing) return <TypingIndicator />;
        const isUser = item.sender === "user";
        return <MessageBubble text={item.text} isUser={isUser} animatedValue={fadeAnim} timestamp={item.timestamp} />;
    };

    const baseList = botTyping ? [{ id: "typing-indicator", typing: true }, ...messages] : messages;
    const dataForList = addDateSeparators(baseList);

    return (
        <SafeAreaView style={[styles.safeContainer, { paddingTop: insets.top }]}>
            {/* Header */}
            <Header
                title="Chat with REN"
                titleAlignment="center"
                subtitleText={botTyping ? "Typing..." : "Online"}
                subtitleColor="#52ACD7"
                showLeftIcon={false}
                leftIconName="arrow-back"
                onLeftIconPress={() => { }}


                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"

                textSize={21}
            />

            {/* Chat Area */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <LinearGradient colors={["#F9FBFD", "#EAF6FC", "#FFFFFF"]} style={{ flex: 1 }}>
                    {loading && page === 1 && <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 24 }} />}

                    <FlatList
                        ref={flatListRef}
                        data={dataForList}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        inverted
                        contentContainerStyle={{
                            padding: scale(12),
                            paddingTop: verticalScale(10),
                        }}
                        showsVerticalScrollIndicator={false}
                        onEndReached={() => { if (!loading && hasMore) fetchMessages(page + 1); }}
                        onEndReachedThreshold={0.3}
                        removeClippedSubviews={false}
                    />
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type a message..."
                                placeholderTextColor={colors.textLight}
                                value={input}
                                onChangeText={setInput}
                                multiline
                                maxLength={500}
                            />
                            {input.length > 0 && <Text style={styles.charCount}>{input.length}/500</Text>}
                        </View>

                        <TouchableOpacity style={[styles.sendButton, input.trim() === "" && styles.sendButtonDisabled]} onPress={sendMessage} disabled={input.trim() === ""}>
                            <Ionicons name="send" size={scale(18)} color={input.trim() === "" ? colors.textLight : "white"} style={input.trim() ? { transform: [{ scale: 1.05 }, { rotate: "-15deg" }, { translateY: -2 }] } : null} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: "#F5F9F3" },
    flex: { flex: 1 },
    header: { display: "none" },
    headerButton: { display: "none" },
    headerTitleContainer: { display: "none" },
    headerTitle: { display: "none" },
    headerSubtitle: { display: "none" },
    messageBubble: { maxWidth: "80%", paddingHorizontal: moderateScale(16), paddingVertical: moderateScale(10), borderRadius: moderateScale(20), marginBottom: moderateScale(10) },
    userBubble: { backgroundColor: colors.secondary, alignSelf: "flex-end", borderBottomRightRadius: moderateScale(6) },
    botBubble: { backgroundColor: colors.bubbleLight, alignSelf: "flex-start", borderBottomLeftRadius: moderateScale(6) },
    messageText: { fontSize: moderateScale(15), paddingTop: moderateScale(2), lineHeight: moderateScale(20) },
    userText: { color: "white", fontWeight: "500" },
    botText: { color: colors.textDark },
    timestampText: { fontSize: moderateScale(11), color: colors.textLight, marginTop: moderateScale(4), textAlign: "right", margin: 0 },
    timestampUser: { color: "rgba(255,255,255,0.7)", marginTop: 0 },
    dateSeparatorContainer: { flexDirection: "row", alignItems: "center", marginVertical: moderateScale(12), paddingHorizontal: moderateScale(16) },
    dateSeparatorLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
    dateSeparatorText: { fontSize: moderateScale(12), color: colors.textLight, fontWeight: "500", paddingHorizontal: moderateScale(10) },
    inputContainer: {
        flexDirection: "row", alignItems: "flex-end", paddingHorizontal: moderateScale(10), borderTopWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.inputBackground,
        paddingVertical: verticalScale(8),
        paddingBottom: verticalScale(8),
    },
    inputWrapper: { flex: 1, position: "relative" },
    input: { backgroundColor: colors.inputBackground, borderRadius: moderateScale(12), paddingHorizontal: moderateScale(14), paddingVertical: moderateScale(10), paddingRight: moderateScale(50), fontSize: moderateScale(15), color: colors.textDark, maxHeight: moderateScale(100), minHeight: moderateScale(44) },
    charCount: { position: "absolute", right: moderateScale(20), bottom: moderateScale(8), fontSize: moderateScale(11), color: colors.textLight },
    sendButton: { backgroundColor: colors.secondary, width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(12), justifyContent: "center", alignItems: "center", marginLeft: moderateScale(4) },
    sendButtonDisabled: { backgroundColor: colors.bubbleLight },
    dot: { width: moderateScale(6), height: moderateScale(6), backgroundColor: "#B3B3B3", borderRadius: 50, marginHorizontal: 2 },
});

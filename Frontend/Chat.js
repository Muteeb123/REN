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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { useNavigation } from "@react-navigation/native";

// local asset
import BotIcon from "./assets/logo.png";

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

// ======== Typing Indicator ========
const TypingIndicator = ({ size = 22 }) => (
  <View style={[styles.messageBubble, styles.botBubble, { flexDirection: "row", alignItems: "center" }]}>
    <Image source={BotIcon} style={{ width: size, height: size, marginRight: moderateScale(8), borderRadius: 50 }} />
    <View style={{ flexDirection: "row" }}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  </View>
);

// ======== Message Bubble ========
const MessageBubble = React.memo(({ text, isUser, animatedValue }) => {
  const bubbleStyle = isUser ? styles.userBubble : styles.botBubble;
  const textStyle = isUser ? styles.userText : styles.botText;

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
      <Text style={[styles.messageText, textStyle]}>{text}</Text>
    </Animated.View>
  );
});

// ======== Main ChatPage ========
export default function ChatPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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
      const res = await fetch(`http://172.27.176.1:8000/api/conversations?user_id=${userId}&page=${pageNumber}`);
      const data = await res.json();

      if (data?.success && Array.isArray(data.messages)) {
        const mapped = data.messages.map((m) => ({ id: uuid.v4(), text: m.content, sender: m.role }));
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

    const userMessage = { id: uuid.v4(), text: trimmed, sender: "user" };
    setMessages((prev) => [userMessage, ...prev]);
    setInput("");

    setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);

    try {
      setBotTyping(true);
      const userId = await AsyncStorage.getItem("userId");
      const res = await fetch("http://172.27.176.1:8000/api/generateText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: trimmed }),
      });
      const data = await res.json();

      const botMessage = { id: uuid.v4(), text: data?.reply ?? "Sorry, I didn't understand that.", sender: "model" };
      setMessages((prev) => [botMessage, ...prev]);
    } catch (err) {
      console.error("sendMessage error", err);
      setMessages((prev) => [
        { id: uuid.v4(), text: "Failed to get a response. Please try again.", sender: "model" },
        ...prev,
      ]);
    } finally {
      setBotTyping(false);
    }
  }, [input]);

  const renderItem = ({ item }) => {
    if (item.typing) return <TypingIndicator />;
    const isUser = item.sender === "user";
    return <MessageBubble text={item.text} isUser={isUser} animatedValue={fadeAnim} />;
  };

  const dataForList = botTyping ? [{ id: "typing-indicator", typing: true }, ...messages] : messages;

  return (
    <SafeAreaView style={[styles.safeContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>


      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={scale(22)} color={colors.textDark} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chat with REN</Text>
          <Text style={styles.headerSubtitle}>{botTyping ? "Typing..." : "Online"}</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.replace("Login")}>
          <Ionicons name="settings-outline" size={scale(22)} color={colors.textDark} />
        </TouchableOpacity>
      </View>

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
            {/* 
            <TouchableOpacity style={styles.sendButton} onPress={() => navigation.replace("Login")}>
              <Text>Logout</Text>
            </TouchableOpacity> */}
          </View>
        </LinearGradient>

        {/* Input */}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F5F9F3" },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: moderateScale(16), paddingVertical: moderateScale(12), borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.primary },
  headerButton: { padding: moderateScale(4) },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: moderateScale(18), fontWeight: "500", color: colors.textDark },
  headerSubtitle: { fontSize: moderateScale(13), color: colors.secondary, marginTop: moderateScale(2) },
  messageBubble: { maxWidth: "80%", paddingHorizontal: moderateScale(16), paddingVertical: moderateScale(10), borderRadius: moderateScale(20), marginBottom: moderateScale(10) },
  userBubble: { backgroundColor: colors.secondary, alignSelf: "flex-end", borderBottomRightRadius: moderateScale(6) },
  botBubble: { backgroundColor: colors.bubbleLight, alignSelf: "flex-start", borderBottomLeftRadius: moderateScale(6) },
  messageText: { fontSize: moderateScale(15), paddingTop: moderateScale(2), lineHeight: moderateScale(20) },
  userText: { color: "white", fontWeight: "500" },
  botText: { color: colors.textDark },
  inputContainer: {
    flexDirection: "row", alignItems: "flex-end", paddingHorizontal: moderateScale(10), borderTopWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.inputBackground
    , paddingVertical: verticalScale(8),
    paddingBottom: verticalScale(8),

  },
  inputWrapper: { flex: 1, position: "relative" },
  input: { backgroundColor: colors.inputBackground, borderRadius: moderateScale(12), paddingHorizontal: moderateScale(14), paddingVertical: moderateScale(10), paddingRight: moderateScale(50), fontSize: moderateScale(15), color: colors.textDark, maxHeight: moderateScale(100), minHeight: moderateScale(44) },
  charCount: { position: "absolute", right: moderateScale(20), bottom: moderateScale(8), fontSize: moderateScale(11), color: colors.textLight },
  sendButton: { backgroundColor: colors.secondary, width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(12), justifyContent: "center", alignItems: "center", marginLeft: moderateScale(4) },
  sendButtonDisabled: { backgroundColor: colors.bubbleLight },
  dot: { width: moderateScale(6), height: moderateScale(6), backgroundColor: "#B3B3B3", borderRadius: 50, marginHorizontal: 2 },
});

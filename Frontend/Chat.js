import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { useNavigation } from "@react-navigation/native";

// Bot icon for typing indicator
import BotIcon from "./assets/ren.jpg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const scale = (size) => Math.round(size * (SCREEN_WIDTH / 375));
const verticalScale = (size) =>
  Math.round(size * (Dimensions.get("window").height / 812));
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const colors = {
  primary: "#FFFFFF",
  secondary: "#52ACD7",
  textDark: "#1A1B1E",
  textLight: "#6E6E6E",
  bubbleLight: "#F2F2F2",
  inputBackground: "#F8F8F8",
  borderLight: "#E8E8E8",
};

export default function ChatPage() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Bot typing state
  const [botTyping, setBotTyping] = useState(false);

  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();
  const BOTTOM_TAB_HEIGHT = insets.bottom;
  const INPUT_CONTAINER_HEIGHT = verticalScale(70);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    fetchMessages(1);
  }, []);

  // ----------------- FETCH MESSAGES -----------------
  const fetchMessages = async (pageNumber = 1) => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await fetch(
        `http://172.27.176.1:8000/api/conversations?user_id=${userId}&page=${pageNumber}`
      );
      const data = await response.json();

      if (data.success) {
        const mappedMessages = data.messages.map((msg) => ({
          id: uuid.v4(),
          text: msg.content,
          sender: msg.role, // user / model
        }));

        // Inverted list → append old messages
        setMessages((prev) => [...prev, ...mappedMessages]);
        setPage(pageNumber);
        setHasMore(data.pagination.has_next_page);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- SEND MESSAGE -----------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: uuid.v4(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [userMessage, ...prev]); // prepend newest
    setInput("");

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    }, 80);

    try {
      setBotTyping(true); // Show typing indicator

      const userId = await AsyncStorage.getItem("userId");
      const response = await fetch("http://172.27.176.1:8000/api/generateText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: userMessage.text }),
      });
      const data = await response.json();

      const botMessage = {
        id: uuid.v4(),
        text: data.reply || "Sorry, I didn't understand that.",
        sender: "model",
      };

      setBotTyping(false); // Hide typing
      setMessages((prev) => [botMessage, ...prev]); // prepend bot message
    } catch (err) {
      console.error("Chat API error:", err);
      setBotTyping(false);

      const errorMsg = {
        id: uuid.v4(),
        text: "Failed to get a response. Please try again.",
        sender: "model",
      };
      setMessages((prev) => [errorMsg, ...prev]);
    }
  };

  // ----------------- Typing Bubble -----------------
  const TypingBubble = () => (
    <View
      style={[
        styles.messageBubble,
        styles.botBubble,
        { flexDirection: "row", alignItems: "center" },
      ]}
    >
      <Image
        source={BotIcon}
        style={{
          width: moderateScale(22),
          height: moderateScale(22),
          marginRight: moderateScale(8),
          borderRadius: 50,
        }}
      />
      <View style={{ flexDirection: "row", gap: 4 }}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );

  // ----------------- RENDER MESSAGE -----------------
  const renderItem = ({ item }) => {
    const isUser = item.sender === "user";

    return (
      <Animated.View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
          {item.text}
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: 0 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={scale(22)} color={colors.textDark} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chat with REN</Text>
          <Text style={styles.headerSubtitle}>{botTyping ? "Typing..." : "Online"}</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="settings-outline" size={scale(22)} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* CHAT AREA */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? verticalScale(60) : 0}
      >
        <LinearGradient colors={["#F9FBFD", "#EAF6FC", "#FFFFFF"]} style={styles.chatArea}>
          {loading && page === 1 && <ActivityIndicator size="large" color={colors.secondary} />}

          <FlatList
            ref={flatListRef}
            data={botTyping ? [{ id: "typing-indicator", typing: true }, ...messages] : messages}
            renderItem={({ item }) =>
              item.typing ? <TypingBubble /> : renderItem({ item })
            }
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={{
              padding: scale(12),
              paddingTop: verticalScale(10),
              paddingBottom: verticalScale(120),
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (!loading && hasMore) fetchMessages(page + 1);
            }}
            onEndReachedThreshold={0.3}
          />

        </LinearGradient>

        {/* INPUT BAR */}
        <View
          style={[
            styles.inputContainer,
            { bottom: BOTTOM_TAB_HEIGHT, height: INPUT_CONTAINER_HEIGHT },
          ]}
        >
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

          <TouchableOpacity
            style={[styles.sendButton, input.trim() === "" && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={input.trim() === ""}
          >
            <Ionicons
              name="send"
              size={scale(18)}
              color={input.trim() === "" ? colors.textLight : "white"}
              style={
                input.trim()
                  ? { transform: [{ scale: 1.05 }, { rotate: "-15deg" }, { translateY: -2 }] }
                  : null
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              navigation.replace('Login');
            }}

          >
            <Text>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.primary,
  },
  headerButton: { padding: moderateScale(4) },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: moderateScale(18), fontWeight: "500", color: colors.textDark },
  headerSubtitle: { fontSize: moderateScale(13), color: colors.secondary, marginTop: moderateScale(2) },
  chatArea: { flex: 1, backgroundColor: "#F9FBFD" },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  userBubble: { backgroundColor: colors.secondary, alignSelf: "flex-end", borderBottomRightRadius: moderateScale(6) },
  botBubble: { backgroundColor: colors.bubbleLight, alignSelf: "flex-start", borderBottomLeftRadius: moderateScale(6) },
  messageText: { fontSize: moderateScale(15), paddingTop: moderateScale(2), lineHeight: moderateScale(20) },
  userText: { color: "white", fontWeight: "500" },
  botText: { color: colors.textDark },
  inputContainer: {
    position: "relative",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(20),
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.primary,
  },
  inputWrapper: { flex: 1, position: "relative" },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    paddingRight: moderateScale(50),
    fontSize: moderateScale(15),
    color: colors.textDark,
    maxHeight: moderateScale(100),
    minHeight: moderateScale(44),
  },
  charCount: { position: "absolute", right: moderateScale(20), bottom: moderateScale(8), fontSize: moderateScale(11), color: colors.textLight },
  sendButton: { backgroundColor: colors.secondary, width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(12), justifyContent: "center", alignItems: "center", marginLeft: moderateScale(4) },
  sendButtonDisabled: { backgroundColor: colors.bubbleLight },

  // DOTS
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    backgroundColor: "#B3B3B3",
    borderRadius: 50,
    marginHorizontal: 2,
  },
});

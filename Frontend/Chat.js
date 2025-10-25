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
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => {
  const baseWidth = 375;
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  const normalizedSize = size * scaleFactor;
  return Math.round(normalizedSize);
};

const verticalScale = (size) => {
  const baseHeight = 812;
  const scaleFactor = Dimensions.get("window").height / baseHeight;
  const normalizedSize = size * scaleFactor;
  return Math.round(normalizedSize);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const colors = {
  primary: "#FFFFFF",
  secondary: "#52ACD7",
  textDark: "#1A1B1E",
  textLight: "#6E6E6E",
  bubbleLight: "#F2F2F2",
  inputBackground: "#F8F8F8",
  borderLight: "#E8E8E8",
};

export default function ChatPage({ navigation }) {
  const [messages, setMessages] = useState([
  { id: "1", text: "Hey, how are you feeling today?", sender: "bot" },
  { id: "2", text: "I'm doing better, thanks for asking!", sender: "user" },
  { id: "3", text: "That's great to hear! What's on your mind today?", sender: "bot" },
  { id: "4", text: "Just trying to stay focused. It's been a long day.", sender: "user" },
  { id: "5", text: "I understand. Would you like to talk about what made it tiring?", sender: "bot" },
  { id: "6", text: "Mostly work. Lots of meetings and deadlines.", sender: "user" },
  { id: "7", text: "That sounds stressful. Have you tried taking short breaks between tasks?", sender: "bot" },
  { id: "8", text: "Not really, but I probably should. It might help.", sender: "user" },
  { id: "9", text: "Absolutely! Even a quick 5-minute walk can refresh your mind.", sender: "bot" },

]);

  const [input, setInput] = useState("");
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Calculate safe area padding for bottom navigation
  const BOTTOM_TAB_HEIGHT = insets.bottom;
  const INPUT_CONTAINER_HEIGHT = verticalScale(70);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = { id: Date.now().toString(), text: input, sender: "user" };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Thanks for sharing that with me. How can I help you further?",
          sender: "bot",
        },
      ]);
    }, 1200);
  };

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
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="settings-outline" size={scale(22)} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* MAIN CHAT */}
    {/* MAIN CHAT */}
<KeyboardAvoidingView
  style={styles.flex}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? verticalScale(60) : 0}
>
  <LinearGradient
    colors={["#F9FBFD", "#EAF6FC", "#FFFFFF"]}
    style={styles.chatArea}
  >
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{
        padding: scale(12),
        paddingBottom: verticalScale(100), // enough room above input bar
      }}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
    />
  </LinearGradient>

  {/* INPUT BAR - Fixed at bottom but above tab bar */}
  <View
    style={[
      styles.inputContainer,
      {
        bottom: BOTTOM_TAB_HEIGHT,
        height: INPUT_CONTAINER_HEIGHT,
      },
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
      {input.length > 0 && (
        <Text style={styles.charCount}>{input.length}/500</Text>
      )}
    </View>

    <TouchableOpacity
      style={[
        styles.sendButton,
        input.trim() === "" && styles.sendButtonDisabled,
      ]}
      onPress={sendMessage}
      disabled={input.trim() === ""}
    >
      <Ionicons
        name="send"
        size={scale(18)}
        color={input.trim() === "" ? colors.textLight : "white"}
        style={[
          !input.trim()
            ? null
            : {
                transform: [
                  { scale: 1.05 },
                  { rotate: "-15deg" },
                  { translateY: -2 },
                ],
              },
        ]}
      />
    </TouchableOpacity>
  </View>
</KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { 
    flex: 1 
  },
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
  headerButton: { 
    padding: moderateScale(4) 
  },
  headerTitleContainer: { 
    alignItems: "center" 
  },
  headerTitle: { 
    fontSize: moderateScale(18), 
    fontWeight: "700", 
    color: colors.textDark 
  },
  headerSubtitle: { 
    fontSize: moderateScale(13), 
    color: colors.secondary, 
    marginTop: moderateScale(2) 
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#F9FBFD",
  },
  chatContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(20),
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  userBubble: {
    backgroundColor: colors.secondary,
    alignSelf: "flex-end",
    borderBottomRightRadius: moderateScale(6),
  },
  botBubble: {
    backgroundColor: colors.bubbleLight,
    alignSelf: "flex-start",
    borderBottomLeftRadius: moderateScale(6),
  },
  messageText: { 
    fontSize: moderateScale(15), 
    paddingTop: moderateScale(2),
    lineHeight: moderateScale(20),
  },
  userText: { 
    color: "white", 
    fontWeight: "500" 
  },
  botText: { 
    color: colors.textDark 
  },
  inputContainer: {
    position: 'relative',
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
  inputWrapper: { 
    flex: 1, 
    position: "relative" 
  },
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
  charCount: {
    position: "absolute",
    right: moderateScale(20),
    bottom: moderateScale(8),
    fontSize: moderateScale(11),
    color: colors.textLight,
  },
  sendButton: {
    backgroundColor: colors.secondary,
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: moderateScale(4),
  
  },
  sendButtonDisabled: {
    backgroundColor: colors.bubbleLight,
    transform: [{ scale: 1 }, { rotate: "0deg" }, { translateY: 0 }],
    shadowOpacity: 0, // no shadow when disabled
    elevation: 0,
  },

});
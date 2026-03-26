import React, { useState, useEffect, useRef } from "react";
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NODE_BACKEND_URL } from "../config/urls";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) =>
    Math.round(size + (scale(size) - size) * factor);

const colors = {
    background: "#F8FAFC",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    bubbleProvider: "#52ACD7",
    bubbleLight: "#F2F2F2",
    borderLight: "#E8E8E8",
    inputBackground: "#F8F8F8",
    white: "#FFFFFF",
};

const EMOJI_OPTIONS = ["❤️", "👍", "😊", "🙏", "😢", "😮"];

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
};

const MessageBubble = React.memo(({ message, isProvider, onReactionPress }) => (
    <View style={[styles.messageRow, isProvider ? styles.providerRow : styles.seekerRow]}>
        <View
            style={[
                styles.messageBubble,
                isProvider ? styles.providerBubble : styles.seekerBubble,
            ]}
        >
            <Text style={[styles.messageText, isProvider && styles.providerText]}>
                {message.text}
            </Text>
            <Text style={[styles.timestamp, isProvider ? styles.timestampProvider : styles.timestampSeeker]}>
                {formatTime(message.createdAt)}
            </Text>

            {message.reactions && message.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                    {message.reactions.map((reaction, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.reactionBadge}
                            onPress={() => onReactionPress?.(message._id)}
                        >
                            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    </View>
));

export default function HelpProviderChat({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sending, setSending] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [helpProviderId, setHelpProviderId] = useState(null);
    const [activeChatId, setActiveChatId] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const flatListRef = useRef(null);

    // Get help provider ID from storage and check for route params
    useEffect(() => {
        const initialize = async () => {
            try {
                const id = await AsyncStorage.getItem("userId");
                if (!id) {
                    console.warn("Help provider ID not found in storage");
                }
                setHelpProviderId(id);

                // If a specific seekerId is provided from route params, fetch that chat directly
                if (route?.params?.seekerId) {
                    const seeker = {
                        _id: route.params.seekerId,
                        name: route.params.seekerName || "Chat",
                    };
                    setSelectedChat(seeker);
                    await fetchMessagesForSeeker(id, route.params.seekerId);
                } else {
                    fetchChats(id);
                }
            } catch (error) {
                console.error("Error initializing:", error);
            }
        };
        initialize();
    }, []);

    const normalizePageMessages = (list = []) => [...list].reverse();

    const loadMessagesPage = async ({ seekerId, providerId, pageNumber = 1, reset = false }) => {
        if (!seekerId || !providerId) return;

        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await fetch(
                `${NODE_BACKEND_URL}/api/chat/messages?helpSeekerUserId=${seekerId}&helpProviderId=${providerId}&page=${pageNumber}`
            );

            if (response.status === 404) {
                if (reset) {
                    setMessages([]);
                    setActiveChatId(null);
                    setPage(1);
                    setHasMore(false);
                }
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                console.error("Error fetching messages:", data.message);
                return;
            }

            const pageMessages = normalizePageMessages(data.messages || []);
            setActiveChatId(data.chatId || null);
            setPage(pageNumber);
            setHasMore(Boolean(data?.pagination?.hasNextPage));

            if (reset) {
                setMessages(pageMessages);
                setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
            } else {
                setMessages((prev) => [...prev, ...pageMessages]);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            if (reset) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    };

    const fetchMessagesForSeeker = async (providerId, seekerId) => {
        setPage(1);
        setHasMore(true);
        await loadMessagesPage({ seekerId, providerId, pageNumber: 1, reset: true });
    };

    const fetchChats = async (providerId) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${NODE_BACKEND_URL}/api/chat/seekers/${providerId}`
            );
            const data = await response.json();

            if (response.ok) {
                setChats(data.seekers || []);
            } else {
                console.error("Error fetching chats:", data.message);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chat) => {
        setSelectedChat(chat);
        setPage(1);
        setHasMore(true);
        await loadMessagesPage({
            seekerId: chat._id,
            providerId: helpProviderId,
            pageNumber: 1,
            reset: true,
        });
    };

    const sendMessage = async () => {
        if (!messageText.trim() || !selectedChat) return;

        setSending(true);
        try {
            // Fetch messages to get chatId, create chat if not found yet.
            let chatId;
            if (activeChatId) {
                chatId = activeChatId;
            } else {
                const createResponse = await fetch(`${NODE_BACKEND_URL}/api/chat/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        helpSeekerUserId: selectedChat._id,
                        helpProviderId,
                    }),
                });

                const createData = await createResponse.json();
                if (!createResponse.ok || !createData?.chat?.chatId) {
                    throw new Error(createData?.message || "Failed to create chat");
                }
                chatId = createData.chat.chatId;
                setActiveChatId(chatId);
            }

            const response = await fetch(
                `${NODE_BACKEND_URL}/api/chat/${chatId}/send`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        senderId: helpProviderId,
                        text: messageText.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessages((prev) => [data.data, ...prev]);
                setMessageText("");
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            } else {
                console.error("Error sending message:", data.message);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const renderChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => fetchMessages(item)}
        >
            <View style={styles.chatContent}>
                <Text style={styles.chatName}>{item.name || item.email}</Text>
                <Text style={styles.chatEmail}>{item.email}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
        </TouchableOpacity>
    );

    const renderMessageItem = ({ item }) => (
        <MessageBubble
            message={item}
            isProvider={true}
            onReactionPress={(messageId) => {
                setSelectedMessage({ ...item, messageId });
                setShowReactionPicker(true);
            }}
        />
    );

    if (!selectedChat) {
        return (
            <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
                <Header
                    title="Chats"
                    titleAlignment="center"
                    showLeftIcon
                    leftIconName="arrow-back"
                    onLeftIconPress={() => navigation.goBack()}
                    showRightIcon={false}
                    backgroundColor="#FFFFFF"
                    borderBottomColor="rgba(82, 172, 215, 0.1)"
                    textSize={22}
                />

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={colors.bubbleProvider} />
                    </View>
                ) : chats.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>No chats available</Text>
                    </View>
                ) : (
                    <FlatList
                        data={chats}
                        renderItem={renderChatItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
            <Header
                title={selectedChat.name || selectedChat.email || "Chat"}
                titleAlignment="center"
                showLeftIcon
                leftIconName="arrow-back"
                onLeftIconPress={() => {
                    // If we came from dashboard with params, go back to dashboard
                    if (route?.params?.seekerId) {
                        navigation.goBack();
                    } else {
                        // Otherwise just clear the chat
                        setSelectedChat(null);
                        setMessages([]);
                        setMessageText("");
                    }
                }}
                showRightIcon={false}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
                textSize={18}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                enabled
            >
                <LinearGradient colors={["#F9FBFD", "#EAF6FC", "#FFFFFF"]} style={styles.chatLayout}>
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.bubbleProvider} />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessageItem}
                            keyExtractor={(item) => item._id}
                            inverted
                            style={styles.messagesList}
                            contentContainerStyle={styles.messagesContainer}
                            onEndReached={() => {
                                if (!loading && !loadingMore && hasMore && selectedChat) {
                                    loadMessagesPage({
                                        seekerId: selectedChat._id,
                                        providerId: helpProviderId,
                                        pageNumber: page + 1,
                                        reset: false,
                                    });
                                }
                            }}
                            onEndReachedThreshold={0.3}
                            ListFooterComponent={loadingMore ? (
                                <ActivityIndicator size="small" color={colors.bubbleProvider} style={{ marginVertical: 8 }} />
                            ) : null}
                        />
                    )}

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Send message..."
                                placeholderTextColor={colors.textLight}
                                value={messageText}
                                onChangeText={setMessageText}
                                multiline
                                maxLength={500}
                                maxHeight={100}
                                editable={!sending}
                            />
                            {messageText.length > 0 && (
                                <Text style={styles.charCount}>{messageText.length}/500</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (sending || !messageText.trim()) && styles.sendButtonDisabled,
                            ]}
                            onPress={sendMessage}
                            disabled={sending || !messageText.trim()}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <MaterialIcons
                                    name="send"
                                    size={scale(18)}
                                    color={!messageText.trim() ? colors.textLight : colors.white}
                                    style={messageText.trim() ? { transform: [{ rotate: "-15deg" }] } : null}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>

            {/* Reaction Picker Modal */}
            <Modal
                visible={showReactionPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReactionPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowReactionPicker(false)}
                >
                    <View style={styles.emojiPickerContainer}>
                        <Text style={styles.emojiPickerTitle}>Reactions</Text>
                        <ScrollView style={styles.reactionsGrid}>
                            {EMOJI_OPTIONS.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={styles.emojiOption}
                                    onPress={() => {
                                        setShowReactionPicker(false);
                                    }}
                                >
                                    <Text style={styles.emojiText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F5F9F3",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
    },
    chatItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(12),
        backgroundColor: colors.white,
        borderRadius: moderateScale(12),
        marginBottom: moderateScale(12),
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    chatContent: {
        flex: 1,
    },
    chatName: {
        fontSize: moderateScale(16),
        fontWeight: "600",
        color: colors.textDark,
    },
    chatEmail: {
        fontSize: moderateScale(13),
        color: colors.textLight,
        marginTop: moderateScale(4),
    },
    messagesContainer: {
        padding: scale(12),
        paddingTop: verticalScale(10),
    },
    chatLayout: {
        flex: 1,
    },
    messagesList: {
        flex: 1,
    },
    messageRow: {
        marginBottom: moderateScale(22),
        flexDirection: "row",
    },
    providerRow: {
        justifyContent: "flex-end",
    },
    seekerRow: {
        justifyContent: "flex-start",
    },
    messageBubble: {
        maxWidth: "80%",
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(10),
        paddingBottom: moderateScale(14),
        borderRadius: moderateScale(20),
        overflow: "visible",
    },
    providerBubble: {
        backgroundColor: colors.bubbleProvider,
        borderBottomRightRadius: moderateScale(4),
    },
    seekerBubble: {
        backgroundColor: colors.bubbleLight,
        borderBottomLeftRadius: moderateScale(6),
    },
    messageText: {
        fontSize: moderateScale(15),
        lineHeight: moderateScale(20),
        color: colors.textDark,
    },
    providerText: {
        color: colors.white,
    },
    timestamp: {
        fontSize: moderateScale(11),
        marginTop: moderateScale(4),
        textAlign: "right",
    },
    timestampProvider: {
        color: "rgba(255,255,255,0.7)",
    },
    timestampSeeker: {
        color: colors.textLight,
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
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: moderateScale(10),
        borderTopWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.inputBackground,
        paddingVertical: verticalScale(8),
    },
    inputWrapper: {
        flex: 1,
        position: "relative",
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
        backgroundColor: colors.bubbleProvider,
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(12),
        justifyContent: "center",
        alignItems: "center",
        marginLeft: moderateScale(4),
    },
    sendButtonDisabled: {
        backgroundColor: colors.bubbleLight,
        opacity: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    emojiPickerContainer: {
        backgroundColor: colors.white,
        borderRadius: moderateScale(16),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(16),
        maxHeight: "70%",
    },
    emojiPickerTitle: {
        fontSize: moderateScale(18),
        fontWeight: "600",
        color: colors.textDark,
        marginBottom: moderateScale(12),
    },
    reactionsGrid: {
        flexDirection: "column",
    },
    emojiOption: {
        paddingVertical: moderateScale(12),
        paddingHorizontal: moderateScale(16),
    },
    emojiText: {
        fontSize: moderateScale(28),
    },
    emptyText: {
        fontSize: moderateScale(16),
        color: colors.textLight,
    },
});

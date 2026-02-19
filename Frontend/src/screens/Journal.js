import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    SafeAreaView,
    Image,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HTML from "react-native-render-html";
import {
    PlusCircle,
    ArrowLeft,
    PencilLine,
    PlusIcon,
    Trash2,
    CheckIcon,
} from "lucide-react-native";

import { quillHTML } from "../utils/quillhtml";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NODE_BACKEND_URL } from "../config/urls";
import Header from "../components/Header";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((width / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) =>
    Math.round(size + (scale(size) - size) * factor);

const moods = [
    {
        label: "Happy",
        color: "#f9c84c",
        darkColor: "#d4a83a",
        lightColor: "#fff3b0",
        icon: require("../../assets/Happy.png"),
    },
    {
        label: "Sad",
        color: "#38b6ff",
        darkColor: "#2e95d4",
        lightColor: "#cce9ff",
        icon: require("../../assets/Sad.png"),
    },
    {
        label: "Angry",
        color: "#ee1919",
        darkColor: "#c71414",
        lightColor: "#ffd6d6",
        icon: require("../../assets/Angry.png"),
    },
    {
        label: "Anxious",
        color: "#ff7951",
        darkColor: "#e06a45",
        lightColor: "#ffe0d1",
        icon: require("../../assets/Anxious.png"),
    },
    {
        label: "Annoyed",
        color: "#cb6ce6",
        darkColor: "#b259cc",
        lightColor: "#f2d9fa",
        icon: require("../../assets/Annoyed.png"),
    },
    {
        label: "Neutral",
        color: "#00bf63",
        darkColor: "#00a355",
        lightColor: "#c8f7dc",
        icon: require("../../assets/Neutral.png"),
    },
];

const getMood = (label) => {
    return moods.find(
        (mood) => mood.label.toLowerCase() === (label || "").toLowerCase()
    );
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
export default function Journal({ currentScreen, onNavigate }) {
    const editorRef = useRef();
    const BASE_URL = `${NODE_BACKEND_URL}/api/journal`;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [view, setView] = useState("list");
    // Set the default mood to 'Neutral' upon initial load
    const [selectedMood, setSelectedMood] = useState(moods[5]);
    const [note, setNote] = useState("");
    const [title, setTitle] = useState("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const [entries, setEntries] = useState([
        {
            id: 1,
            title: "A Productive Day",
            text: "Had a really productive day today, feeling satisfied with my progress!",
            mood: moods[0],
            date: "Oct 13, 2025 6:45 PM",
        },
    ]);

    const [loadingFetch, setLoadingFetch] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingDeleteId, setLoadingDeleteId] = useState(null);

    useEffect(() => {
        const fetchEntries = async () => {
            setLoadingFetch(true);
            const user_id = await AsyncStorage.getItem("userId");
            try {
                const response = await fetch(`${BASE_URL}/get/${user_id}`, {
                    method: "GET",
                });
                const json = await response.json();
                if (json && Array.isArray(json)) {
                    const fetchedEntries = json.map((entry) => ({
                        id: entry._id,
                        title: entry.title,
                        text: entry.content,
                        // Fallback to Neutral if sentiment is missing/invalid
                        mood: getMood(entry.sentiment) || moods[5],
                        date: new Date(entry.updatedAt).toLocaleString(),
                    }));
                    setEntries(fetchedEntries);
                }
            } catch (err) {
                console.error("Error fetching journal entries:", err);
            } finally {
                setLoadingFetch(false);
            }
        };

        fetchEntries();
    }, []);

    const handleSave = async () => {
        // Check if a mood is selected before saving
        if (!note.trim() || !title.trim() || !selectedMood) return;
        setLoadingSave(true);
        if (editingEntry) {
            const user_id = await AsyncStorage.getItem("userId");
            const payload = {
                user_id,
                id: editingEntry.id,
                title: title.trim(),
                content: note.trim(),
                sentiment: selectedMood?.label,
            };
            try {
                const response = await fetch(`${BASE_URL}/update`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();
                console.log("Update response:", json);
            } catch (error) {
                console.error("Error updating journal entry:", error);
            }

            const updated = entries.map((item) =>
                item.id === editingEntry.id
                    ? {
                        ...item,
                        title: title.trim(),
                        text: note.trim(),
                        mood: selectedMood,
                        date: new Date().toLocaleString(),
                    }
                    : item
            );

            setEntries(updated);
            setEditingEntry(null);
        } else {
            const user_id = await AsyncStorage.getItem("userId");
            try {
                const response = await fetch(`${BASE_URL}/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user_id,
                        title: title.trim(),
                        content: note.trim(),
                        sentiment: selectedMood?.label,
                    }),
                });
                const json = await response.json();
                const newEntry = {
                    id: json._id || Math.random().toString(),
                    title: title.trim(),
                    text: note.trim(),
                    mood: selectedMood,
                    date: new Date().toLocaleString(),
                };
                setEntries([newEntry, ...entries]);
            } catch (error) {
                console.error("Error creating journal entry:", error);
            }
        }

        setTitle("");
        setNote("");
        // Reset to default mood when returning to list
        setSelectedMood(moods[5]);
        setView("list");
        setLoadingSave(false);
    };

    const deleteEntry = async (entryId) => {
        setLoadingDeleteId(entryId);
        try {
            await fetch(`${BASE_URL}/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: entryId }),
            });
            const filtered = entries.filter((e) => e.id !== entryId);
            setEntries(filtered);
        } catch (error) {
            console.error("Error deleting entry:", error);
        } finally {
            setLoadingDeleteId(null);
        }
    };

    const getPreviewHTML = (html) => {
        if (!html) return "";
        if (html.length <= 50) return html;
        return html.substring(0, 50) + "...";
    };
    const setQuillContent = (html) => {
        if (!editorRef.current) return;
        const js = `
      const msg = { type: "set-content", html: ${JSON.stringify(html)} };
      document.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(msg) }));
      true;
    `;
        editorRef.current.injectJavaScript(js);
    };

    // --- NEW FLOW: Directly transition to 'new' view and set initial state ---
    const startNewEntry = () => {
        setEditingEntry(null);
        setTitle("Untitled");
        setNote("");
        // Set a default mood (e.g., Neutral)
        setSelectedMood(moods[5]);
        setView("new");
    };

    const openEntryForEdit = (entry) => {
        setEditingEntry(entry);
        setTitle(entry.title);
        setNote(entry.text);
        setSelectedMood(entry.mood);
        setView("new");
    };

    const handleNavigateToScreen = (screenName) => {
        setCurrentScreen(screenName);
        navigation.navigate(screenName);
    };

    if (view === "list") {
        return (
            <SafeAreaView style={styles.safeContainer}>
                <Header
                    title="Journals"
                    titleAlignment="center"
                    showRightIcon={true}
                    rightIconName="add-circle"
                    rightIconColor="#52ACD7"
                    onRightIconPress={startNewEntry}
                    backgroundColor="#FFFFFF"
                    borderBottomColor="rgba(82, 172, 215, 0.1)"
                    rightIconSize={40}
                    textSize={25}
                />

                {loadingFetch ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollViewContainer}
                        contentContainerStyle={styles.scrollViewContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {entries.map((entry) => (
                            <TouchableOpacity
                                key={entry.id}
                                style={[
                                    styles.entryCard,
                                    {
                                        backgroundColor: entry.mood.lightColor,
                                        borderLeftColor: entry.mood.color,
                                    },
                                ]}
                                onPress={() => openEntryForEdit(entry)}
                            >
                                <View style={styles.entryHeader}>
                                    <View style={styles.moodBadge}>
                                        <Image source={entry.mood.icon} style={styles.moodIconSmall} />
                                        <Text
                                            style={[
                                                styles.moodText,
                                                { color: entry.mood.darkColor },
                                            ]}
                                        >
                                            {entry.mood.label}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={styles.dateText}>{entry.date}</Text>

                                        <TouchableOpacity
                                            onPress={() =>
                                                Alert.alert(
                                                    "Delete entry",
                                                    "Are you sure you want to delete this entry?",
                                                    [
                                                        { text: "Cancel", style: "cancel" },
                                                        {
                                                            text: "Delete",
                                                            style: "destructive",
                                                            onPress: () => deleteEntry(entry.id),
                                                        },
                                                    ]
                                                )
                                            }
                                            style={{ marginLeft: 12 }}
                                            disabled={loadingDeleteId === entry.id}
                                        >
                                            {loadingDeleteId === entry.id ? (
                                                <ActivityIndicator />
                                            ) : (
                                                <Trash2 color={entry.mood.darkColor} size={18} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={() => openEntryForEdit(entry)}>
                                    <Text style={styles.entryTitle}>{entry.title}</Text>
                                    <HTML
                                        source={{ html: getPreviewHTML(entry.text) }}
                                        contentWidth={width}
                                    />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>
        );
    }

    // Default return is the 'new' view (for both create and edit)
    return (
        <SafeAreaView
            style={[
                styles.safeContainer,
                { backgroundColor: selectedMood?.color + "10" },
            ]}
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.journalHeader}>
                    <TouchableOpacity
                        onPress={() => {
                            setEditingEntry(null);
                            setSelectedMood(moods[5]);
                            setView("list");
                        }}
                    >
                        <ArrowLeft color={selectedMood?.darkColor || "#000"} size={26} />
                    </TouchableOpacity>

                    <View style={[styles.moodHeader, { marginLeft: 10 }]}>
                        {selectedMood && (
                            <Image source={selectedMood.icon} style={styles.moodIconSmall} />
                        )}
                        <Text
                            style={[
                                styles.moodTitle,
                                { color: selectedMood?.darkColor || "#000" },
                            ]}
                        >
                            {selectedMood?.label}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            {
                                backgroundColor: "transparent" || "#999",
                                opacity: note.trim() && !loadingSave ? 1 : 0.6,
                            },
                        ]}
                        onPress={handleSave}
                        disabled={!note.trim() || loadingSave}
                    >
                        {loadingSave ? (
                            <ActivityIndicator
                                style={[
                                    styles.saveButton,
                                    {
                                        backgroundColor: "transparent" || "#999",
                                    },
                                ]}
                            />
                        ) : (
                            <Text style={[styles.saveText, { alignItems: "end" }]}>
                                <CheckIcon color={selectedMood?.darkColor} size={35} />
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1, height: "100%", marginTop: 10 }}>
                    {isEditingTitle ? (
                        <TextInput
                            autoFocus
                            value={title}
                            onChangeText={setTitle}
                            onBlur={() => setIsEditingTitle(false)}
                            placeholder="Entry Title..."
                            style={[
                                styles.titleInput,
                                { color: selectedMood?.darkColor || "#000" },
                            ]}
                        />
                    ) : (
                        <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
                            <Text
                                style={[
                                    styles.titleLabel,
                                    { color: selectedMood?.darkColor || "#000" },
                                ]}
                            >
                                {title}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <WebView
                        ref={editorRef}
                        originWhitelist={["*"]}
                        source={{ html: quillHTML }}
                        onMessage={(e) => setNote(e.nativeEvent.data)}
                        javaScriptEnabled
                        domStorageEnabled
                        style={{ backgroundColor: "transparent", flex: 1 }}
                        onLoadEnd={() =>
                            setQuillContent(editingEntry ? editingEntry.text : "")
                        }
                        marginTop={20}
                    />
                </View>

                {/* Floating mood selector */}
                <View style={styles.moodFloatingContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.moodSelectorScroll}
                    >
                        {moods.map((mood) => (
                            <TouchableOpacity
                                key={mood.label}
                                style={[
                                    styles.moodFloatingItem,
                                    {
                                        borderColor: selectedMood?.label === mood.label
                                            ? mood.color
                                            : "transparent",
                                        backgroundColor: selectedMood?.label === mood.label
                                            ? mood.color + "40"
                                            : mood.color + "10",
                                    },
                                ]}
                                onPress={() => setSelectedMood(mood)}
                            >
                                <Image source={mood.icon} style={styles.moodIconFloating} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: "#F5F9F3",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },

    header: {
        display: "none",
    },
    headerTitle: { display: "none" },
    headerButton: { display: "none" },

    scrollViewContainer: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
        paddingBottom: moderateScale(12),
    },
    entryCard: {
        borderLeftWidth: 3,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    entryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },

    entryTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
        marginBottom: 8,
    },

    moodBadge: { flexDirection: "row", alignItems: "center" },
    moodText: { fontSize: 14, fontWeight: "800", marginLeft: 6 },
    dateText: { fontSize: 12, color: "#888" },

    keyboardView: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    journalHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        gap: 10,
    },

    titleInput: {
        fontSize: 18,
        fontWeight: "600",
        borderBottomWidth: 1,
        paddingVertical: 2,
        minWidth: 120,
    },

    titleLabel: {
        fontSize: 18,
        fontWeight: "600",
    },

    saveButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 5,
    },
    saveText: { color: "#fff", fontSize: 17, fontWeight: "600" },

    moodHeader: { flexDirection: "row", alignItems: "center", marginLeft: 12, flex: 1 },
    moodTitle: { fontSize: 18, fontWeight: "600", marginLeft: 6 },

    centered: { flex: 1, justifyContent: "center", alignItems: "center" },

    moodFloatingContainer: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 20 : 10,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingBottom: Platform.OS === "ios" ? 0 : 10,
    },
    moodSelectorScroll: {
        paddingHorizontal: 20,
        alignItems: "flex-end",
    },
    moodFloatingItem: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 4,
        borderWidth: 2,
    },
    moodIconFloating: {
        width: 50,
        height: 50,
        resizeMode: "contain",
        transform: [{ scale: 2 }]
    },

    moodIconSmall: {
        width: 40,
        height: 40,
        resizeMode: "contain",
        transform: [{ scale: 2 }]
    },
});

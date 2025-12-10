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
} from "react-native";
import { WebView } from "react-native-webview";

import HTML from "react-native-render-html";
import { PlusCircle, ArrowLeft, PencilLine, PlusIcon, Trash2, CheckIcon } from "lucide-react-native";

import { quillHTML } from "./quillhtml";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const scale = (size) => Math.round((width / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) => Math.round(size + (scale(size) - size) * factor);

const moods = [
  { label: "Happy", color: "#f9c84c", darkColor: "#d4a83a", lightColor: "#fff3b0", icon: require("./assets/Happy.png") },
  { label: "Sad", color: "#38b6ff", darkColor: "#2e95d4", lightColor: "#cce9ff", icon: require("./assets/Sad.png") },
  { label: "Angry", color: "#ee1919", darkColor: "#c71414", lightColor: "#ffd6d6", icon: require("./assets/Angry.png") },
  { label: "Anxious", color: "#ff7951", darkColor: "#e06a45", lightColor: "#ffe0d1", icon: require("./assets/Anxious.png") },
  { label: "Annoyed", color: "#cb6ce6", darkColor: "#b259cc", lightColor: "#f2d9fa", icon: require("./assets/Annoyed.png") },
  { label: "Neutral", color: "#00bf63", darkColor: "#00a355", lightColor: "#c8f7dc", icon: require("./assets/Neutral.png") },
];

const getMood = (label) => {
  return moods.find((mood) => mood.label.toLowerCase() === (label || "").toLowerCase());
}
const colors = {
  primary: "#FFFFFF",
  secondary: "#52ACD7",
  textDark: "#1A1B1E",
  textLight: "#6E6E6E",
  bubbleLight: "#F2F2F2",
  inputBackground: "#F8F8F8",
  borderLight: "#E8E8E8",
};
export default function Journal() {

  const editorRef = useRef();
  const BASE_URL = "https://namely-finer-seasnail.ngrok-free.app/api/journal";
  const [view, setView] = useState("list");
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const navigation = useNavigation();
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
    if (!note.trim() || !title.trim()) return;
    setLoadingSave(true);
    if (editingEntry) {
      const user_id = await AsyncStorage.getItem("userId");
      const payload =
      {
        user_id,
        id: editingEntry.id,
        title: title.trim(),
        content: note.trim(),
        sentiment: selectedMood?.label,
      }
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
    setSelectedMood(null);
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
  const openEntryForEdit = (entry) => {
    setEditingEntry(entry);
    setView("mood");
  };

  if (view === "list") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>

          <Text style={styles.headerTitle}>My Journal</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              setEditingEntry(null);
              setView("mood");
            }}
            disabled={loadingFetch}
          >
            <PlusIcon color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {loadingFetch ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.entryCard,
                  { backgroundColor: entry.mood.lightColor, borderLeftColor: entry.mood.color },
                ]}

                onPress={() => openEntryForEdit(entry)}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.moodBadge}>
                    <Image source={entry.mood.icon} style={styles.moodIconSmall} />
                    <Text style={[styles.moodText, { color: entry.mood.darkColor, }]}>
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
                  <HTML source={{ html: getPreviewHTML(entry.text) }} contentWidth={width} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  if (view === "mood") {
    return (
      <SafeAreaView style={styles.safeContainer}>

        <View style={styles.moodContainer}>
          <TouchableOpacity onPress={() => setView("list")} >
            <Ionicons name="arrow-back" size={scale(22)} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>Pick your current mood</Text>

          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[styles.moodItem, { backgroundColor: mood.color + "20" }]}
                onPress={() => {
                  setSelectedMood(mood);
                  if (editingEntry) {
                    setTitle(editingEntry.title);
                    setNote(editingEntry.text);
                  } else {
                    setTitle("Untitled");
                    setNote("");
                  }
                  setView("new");
                }}
              >
                <View style={styles.emojiCircle}>
                  <Image source={mood.icon} style={styles.moodIconFull} />
                </View>
                <Text style={[styles.moodLabel, { color: mood.darkColor }]}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: selectedMood?.color + "10" }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.journalHeader}>
          <TouchableOpacity
            onPress={() => {
              setEditingEntry(null);
              setView("list");
            }}
          >
            <ArrowLeft color={selectedMood?.darkColor || "#000"} size={26} />
          </TouchableOpacity>

          <View style={[styles.moodHeader, { marginLeft: 10 }]}>
            {selectedMood && <Image source={selectedMood.icon} style={styles.moodIconSmall} />}
            <Text style={[styles.moodTitle, { color: selectedMood?.darkColor || "#000" }]}>
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
              <ActivityIndicator style={[styles.saveButton,
              {
                backgroundColor: "transparent" || "#999",

              },]} />
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
              style={[styles.titleInput, { color: selectedMood?.darkColor || "#000" }]}
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={[styles.titleLabel, { color: selectedMood?.darkColor || "#000" }]}>
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
            onLoadEnd={() => setQuillContent(editingEntry ? editingEntry.text : "")}
            marginTop={20}
          />
        </View>


      </KeyboardAvoidingView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F5F9F3",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,

  },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: moderateScale(16), paddingVertical: moderateScale(12), borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.primary },

  headerTitle: { fontSize: 26, fontWeight: "500", color: "#222" },
  headerButton: { backgroundColor: "#52ACD7", padding: 10, borderRadius: 50 },

  scrollView: { padding: 16 },
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

  moodContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 28 },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  moodItem: {
    width: (width - 60) / 2,
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 18,
  },

  emojiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },

  moodIconFull: { width: "100%", height: "100%", resizeMode: "cover", transform: [{ scale: 2 }] },
  moodIconSmall: { width: 40, height: 40, resizeMode: "contain", transform: [{ scale: 2 }] },

  moodLabel: { fontSize: 16, fontWeight: "600" },

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
  moodTitle: { fontSize: 18, fontWeight: "700", marginLeft: 6 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});

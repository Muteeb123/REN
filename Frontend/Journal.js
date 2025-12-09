import React, { useRef, useState } from "react";
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
} from "react-native";
import { WebView } from "react-native-webview";
import HTML from "react-native-render-html";
import { PlusCircle, ArrowLeft, PencilLine, PlusIcon } from "lucide-react-native";

import { quillHTML } from "./quillhtml";

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

  const [view, setView] = useState("list");
  const [selectedMood, setSelectedMood] = useState(null);
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

  const handleSave = () => {
    if (!note.trim() || !title.trim()) return;

    if (editingEntry) {
      // UPDATE MODE
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
      // NEW ENTRY MODE
      const newEntry = {
        id: Date.now(),
        title: title.trim(),
        text: note.trim(),
        mood: selectedMood,
        date: new Date().toLocaleString(),
      };
      setEntries([newEntry, ...entries]);
    }

    setTitle("");
    setNote("");
    setSelectedMood(null);
    setView("list");
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
    setView("mood"); // force mood selection (Option B)
  };

  // 🧭 LIST VIEW
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
          >
            <PlusIcon color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => openEntryForEdit(entry)}
              style={[
                styles.entryCard,
                { backgroundColor: entry.mood.lightColor, borderLeftColor: entry.mood.color },
              ]}
            >
              <View style={styles.entryHeader}>
                <View style={styles.moodBadge}>
                  <Image source={entry.mood.icon} style={styles.moodIconSmall} />

                  <Text style={[styles.moodText, { color: entry.mood.darkColor, }]}>
                    {entry.mood.label}
                  </Text>
                </View>
                <Text style={styles.dateText}>{entry.date}</Text>
              </View>


              <Text style={styles.entryTitle}>{entry.title}</Text>
              <HTML source={{ html: getPreviewHTML(entry.text) }} contentWidth={width} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 😌 MOOD SELECTION
  if (view === "mood") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.moodContainer}>
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
                    // PRE-FILL DATA FOR EDITING
                    setTitle(editingEntry.title);
                    setNote(editingEntry.text);

                  } else {
                    setTitle("");
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

  // 📝 NEW / EDIT ENTRY VIEW
  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: selectedMood.color + "10" }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Custom Header */}
        <View style={styles.journalHeader}>
          <TouchableOpacity
            onPress={() => {
              setEditingEntry(null);
              setView("list");
            }}
          >
            <ArrowLeft color={selectedMood.darkColor} size={26} />
          </TouchableOpacity>


          {/* Editable Title */}

          {/* Mood Badge */}
          <View style={[styles.moodHeader, { marginLeft: 10 }]}>
            <Image source={selectedMood.icon} style={styles.moodIconSmall} />

            <Text style={[styles.moodTitle, { color: selectedMood.darkColor }]}>
              {selectedMood.label}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, height: "100%", marginTop: 10 }}>

          {isEditingTitle ? (
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              onBlur={() => setIsEditingTitle(false)}
              placeholder="Entry Title..."
              style={[styles.titleInput, { color: selectedMood.darkColor }]}
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={[styles.titleLabel, { color: selectedMood.darkColor }]}>
                {title || "Untitled"}
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
            style={{ backgroundColor: "transparent" }}
            onLoadEnd={() => setQuillContent(editingEntry ? editingEntry.text : "")}
            marginTop={20}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: selectedMood.darkColor, opacity: note.trim() && title.trim() ? 1 : 0.5 },
          ]}
          onPress={handleSave}
          disabled={!note.trim() || !title.trim()}
        >
          <Text style={styles.saveText}>
            {editingEntry ? "Update Entry" : "Save Entry"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView >
  );
}

// 🎨 Styles
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
    paddingTop: 50,
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
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  saveText: { color: "#fff", fontSize: 17, fontWeight: "600" },

  moodHeader: { flexDirection: "row", alignItems: "center", marginLeft: 12 },
  moodTitle: { fontSize: 18, fontWeight: "700", marginLeft: 6 },
});

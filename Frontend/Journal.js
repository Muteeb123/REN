import React, { useState } from "react";
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
import { PlusCircle, ArrowLeft, PencilLine } from "lucide-react-native";

const { width } = Dimensions.get("window");

const moods = [
  { label: "Happy", color: "#f9c84c", darkColor: "#d4a83a", lightColor: "#fff3b0", icon: require("./assets/Happy.png") },
  { label: "Sad", color: "#38b6ff", darkColor: "#2e95d4", lightColor: "#cce9ff", icon: require("./assets/Sad.png") },
  { label: "Angry", color: "#ee1919", darkColor: "#c71414", lightColor: "#ffd6d6", icon: require("./assets/Angry.png") },
  { label: "Anxious", color: "#ff7951", darkColor: "#e06a45", lightColor: "#ffe0d1", icon: require("./assets/Anxious.png") },
  { label: "Annoyed", color: "#cb6ce6", darkColor: "#b259cc", lightColor: "#f2d9fa", icon: require("./assets/Annoyed.png") },
  { label: "Neutral", color: "#00bf63", darkColor: "#00a355", lightColor: "#c8f7dc", icon: require("./assets/Neutral.png") },
];

export default function Journal() {
  const [view, setView] = useState("list");
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState([
    {
      id: 1,
      text: "Had a really productive day today, feeling satisfied with my progress!",
      mood: moods[0],
      date: "Oct 13, 2025 6:45 PM",
    },
    {
      id: 2,
      text: "Feeling a bit anxious about tomorrow's presentation, trying to stay calm.",
      mood: moods[3],
      date: "Oct 12, 2025 10:15 PM",
    },
    {
      id: 3,
      text: "Woke up feeling low today. Just one of those sad days.",
      mood: moods[1],
      date: "Oct 12, 2025 8:30 AM",
    },
    {
      id: 4,
      text: "Traffic was terrible, and someone cut me off—felt really angry for a while!",
      mood: moods[2],
      date: "Oct 11, 2025 5:40 PM",
    },
    {
      id: 5,
      text: "My app crashed again... getting annoyed with these bugs!",
      mood: moods[4],
      date: "Oct 11, 2025 9:10 PM",
    },
    {
      id: 6,
      text: "Had a calm evening, listening to music and reflecting on the week.",
      mood: moods[5],
      date: "Oct 10, 2025 7:50 PM",
    },
    {
      id: 7,
      text: "Finished my workout! Feeling energized and genuinely happy.",
      mood: moods[0],
      date: "Oct 10, 2025 6:10 AM",
    },
    {
      id: 8,
      text: "Feeling a bit anxious again, but journaling helps me release those thoughts.",
      mood: moods[3],
      date: "Oct 9, 2025 10:00 PM",
    },
  ]);

  const handleSave = () => {
    if (note.trim()) {
      const newEntry = {
        id: Date.now(),
        text: note.trim(),
        mood: selectedMood,
        date: new Date().toLocaleString(),
      };
      setEntries([newEntry, ...entries]);
      setNote("");
      setSelectedMood(null);
      setView("list");
    }
  };

  // 🧭 Journal Listing (Header adjusted only here)
  if (view === "list") {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        {/* Meditation-style header (manual) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Journal</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => setView("mood")}>
            <PencilLine color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                { backgroundColor: entry.mood.lightColor, borderLeftColor: entry.mood.color },
              ]}
            >
              <View style={styles.entryHeader}>
                <View style={styles.moodBadge}>
                  <Image source={entry.mood.icon} style={styles.moodIconSmall} />
                  <Text style={[styles.moodText, { color: entry.mood.darkColor }]}>
                    {entry.mood.label}
                  </Text>
                </View>
                <Text style={styles.dateText}>{entry.date}</Text>
              </View>
              <Text style={styles.entryText}>{entry.text}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 😌 Mood Selection
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

  // 📝 New Entry
  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: selectedMood.color + "10" }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.journalHeader}>
          <TouchableOpacity onPress={() => setView("list")}>
            <ArrowLeft color={selectedMood.darkColor} size={26} />
          </TouchableOpacity>

          <View style={styles.moodHeader}>
            <Image source={selectedMood.icon} style={styles.moodIconSmall} />
            <Text style={[styles.moodTitle, { color: selectedMood.darkColor }]}>
              {selectedMood.label}
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="Write your thoughts here..."
          placeholderTextColor="#777"
          multiline
          value={note}
          onChangeText={setNote}
          autoFocus
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: selectedMood.darkColor, opacity: note.trim() ? 1 : 0.5 },
          ]}
          onPress={handleSave}
          disabled={!note.trim()}
        >
          <Text style={styles.saveText}>Save Entry</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F5F9F3",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  // ✨ Meditation-style header for Journal list only
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 10 : 12,
    paddingBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
  },
  headerButton: {
    backgroundColor: "#52ACD7",
    padding: 10,
    borderRadius: 50,
  },

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
    marginBottom: 8,
  },
  moodBadge: { flexDirection: "row", alignItems: "center" },
  moodText: { fontSize: 14, fontWeight: "600", marginLeft: 6 },
  dateText: { fontSize: 12, color: "#888" },
  entryText: { fontSize: 15, color: "#333", lineHeight: 22 },

  moodContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#222", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 28 },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
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
  journalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  moodHeader: { flexDirection: "row", alignItems: "center", marginLeft: 12 },
  moodTitle: { fontSize: 18, fontWeight: "700", marginLeft: 6 },
  textInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    padding: 12,
    backgroundColor: "transparent",
    color: "#1a1a1a",
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  saveText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});

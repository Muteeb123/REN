import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Enhanced responsive scaling functions
const scale = (size) => {
  const baseWidth = 375;
  const scaleFactor = Math.min(SCREEN_WIDTH / baseWidth, 1.3); // Cap scaling
  return Math.round(size * scaleFactor);
};

const verticalScale = (size) => {
  const baseHeight = 812;
  const scaleFactor = Math.min(SCREEN_HEIGHT / baseHeight, 1.3); // Cap scaling
  return Math.round(size * scaleFactor);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Dynamic font sizing
const getFontSize = (size) => {
  const scaleFactor = Math.min(SCREEN_WIDTH / 375, 1.2);
  return Math.round(size * scaleFactor);
};

const colors = {
  primary: "#FFFFFF",
  secondary: "#52ACD7",
  textDark: "#1A1B1E",
  textLight: "#6E6E6E",
  borderLight: "#E8E8E8",
  background: "#F5F9F3",
  shadow: "rgba(0, 0, 0, 0.1)",
  accent: "#DCEEF7",
  card: "#FFFFFF",
};

// 🧘‍♀️ Local images (you'll need to add these to your assets folder)
const images = {
  calm_focus: require("./assets/yoga.png"),
  severe_breath: require("./assets/aerobic.png"),
  inner_pet: require("./assets/yoga-pose.png"),
  stress_relief: require("./assets/meditation.png"),
  deep_relax: require("./assets/yoga(1).png"),
  calm_rein: require("./assets/aerobic.png"),
};

const meditationData = {
  featured: {
    id: "1",
    title: "Intro to Meditation",
    duration: "8 mins",
    categories: ["All", "Mindfulness", "Stress Reduction"],
  },
  categories: [
    {
      id: "1",
      title: "Mindfulness",
      items: [
        {
          id: "1",
          title: "Calm Focus",
          duration: "10 mins",
          image: images.calm_focus,
        },
        {
          id: "2",
          title: "Severe Breath",
          duration: "20 mins",
          image: images.severe_breath,
        },
        {
          id: "3",
          title: "Inner Pet",
          duration: "35 mins",
          image: images.inner_pet,
        },
      ],
    },
    {
      id: "2",
      title: "Stress Reduction",
      items: [
        {
          id: "4",
          title: "Stress Relief",
          duration: "15 mins",
          image: images.stress_relief,
        },
        {
          id: "5",
          title: "Deep Relax",
          duration: "20 mins",
          image: images.deep_relax,
        },
        {
          id: "6",
          title: "Calm Rein",
          duration: "35 mins",
          image: images.calm_rein,
        },
      ],
    },
  ],
};

export default function Meditation() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Calculate dynamic dimensions based on screen size
  const meditationItemWidth = moderateScale(160);
  const meditationItemHeight = verticalScale(210);
  const featuredCardHeight = verticalScale(180);

  const handleNavigateToSession = (session) => {
    navigation.navigate("MeditationSession", {
      session,
      durationOptions: [5, 8, 10, 15],
    });
  };

  const renderCategoryPill = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategory === item && styles.categoryPillSelected,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryPillText,
          selectedCategory === item && styles.categoryPillTextSelected,
        ]}
        numberOfLines={1}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderMeditationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.meditationItem,
        {
          width: meditationItemWidth,
          height: meditationItemHeight
        }
      ]}
      onPress={() => handleNavigateToSession(item)}
    >
      <Image
        source={item.image}
        style={[
          styles.meditationImage,
          { height: verticalScale(100) }
        ]}
      />
      <View style={styles.meditationInfo}>
        <Text style={styles.meditationTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meditationDuration}>{item.duration}</Text>
        <View style={styles.playCircle}>
          <Ionicons
            name="play"
            size={moderateScale(16)}
            color={colors.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = ({ item }) => (
    <View style={styles.categorySection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{item.title}</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={item.items}
        renderItem={renderMeditationItem}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.meditationList}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(22)}
            color={colors.textDark}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meditations</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons
            name="search-outline"
            size={moderateScale(22)}
            color={colors.textDark}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Meditation */}
        <TouchableOpacity
          style={[
            styles.featuredCard,
            { height: featuredCardHeight }
          ]}
          onPress={() => handleNavigateToSession(meditationData.featured)}
        >
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>
              {meditationData.featured.title}
            </Text>
            <Text style={styles.featuredDuration}>
              {meditationData.featured.duration}
            </Text>

            <FlatList
              data={meditationData.featured.categories}
              renderItem={renderCategoryPill}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleNavigateToSession(meditationData.featured)}
            >
              <Text style={styles.startButtonText}>Start Meditation</Text>
              <Ionicons
                name="play"
                size={moderateScale(16)}
                color={colors.primary}
                style={styles.playIcon}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Category Sections */}
        <FlatList
          data={meditationData.categories}
          renderItem={renderCategorySection}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: 30
  },
  scrollContainer: {
    paddingBottom: verticalScale(40),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.primary,

  },
  headerButton: {
    padding: moderateScale(8),
    minWidth: moderateScale(44),
    minHeight: moderateScale(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: getFontSize(20),
    fontWeight: "700",
    color: colors.textDark,
    textAlign: 'center',
  },

  // Featured Card
  featuredCard: {
    margin: moderateScale(20),
    borderRadius: moderateScale(16),
    overflow: "hidden",
    backgroundColor: colors.accent,
    justifyContent: "center",
    padding: moderateScale(20),
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
        shadowColor: colors.shadow,
      },
    }),
  },
  featuredContent: {
    flex: 1,
    justifyContent: "center"
  },
  featuredTitle: {
    fontSize: getFontSize(22),
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: verticalScale(4),
  },
  featuredDuration: {
    fontSize: getFontSize(14),
    color: colors.textDark,
    marginBottom: verticalScale(12)
  },

  categoriesContainer: {
    paddingHorizontal: moderateScale(20)
  },
  categorySection: {
    marginBottom: verticalScale(30)
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },
  sectionTitle: {
    fontSize: getFontSize(18),
    fontWeight: "700",
    color: colors.textDark,
    flex: 1,
  },
  viewAllText: {
    fontSize: getFontSize(14),
    color: colors.secondary,
    fontWeight: "600"
  },
  meditationList: {
    paddingRight: moderateScale(20)
  },

  // Meditation Item
  meditationItem: {
    marginRight: moderateScale(14),
    borderRadius: moderateScale(14),
    overflow: "hidden",
    backgroundColor: colors.card,
    alignItems: "center",
    padding: moderateScale(12),
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
        shadowColor: colors.shadow,
      },
    }),
  },
  meditationImage: {
    width: "100%",
    resizeMode: "contain",
    marginBottom: verticalScale(10),
  },
  meditationInfo: {
    alignItems: "center",
    flex: 1,
    justifyContent: 'space-between',
  },
  meditationTitle: {
    fontSize: getFontSize(14),
    fontWeight: "600",
    color: colors.textDark,
    textAlign: "center",
    lineHeight: getFontSize(18),
  },
  meditationDuration: {
    fontSize: getFontSize(12),
    color: colors.textLight,
    textAlign: "center",
    marginVertical: verticalScale(4),
  },

  playCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(8),
  },

  categoriesList: {
    paddingVertical: verticalScale(8),
  },
  categoryPill: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(8),
    minWidth: moderateScale(80),
    alignItems: 'center',
  },
  categoryPillSelected: {
    backgroundColor: colors.secondary
  },
  categoryPillText: {
    fontSize: getFontSize(13),
    color: colors.textDark,
    fontWeight: '500',
  },
  categoryPillTextSelected: {
    color: colors.primary,
    fontWeight: "700"
  },

  startButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(10),
    marginTop: verticalScale(14),
    minHeight: verticalScale(44),
  },
  startButtonText: {
    color: colors.primary,
    fontSize: getFontSize(14),
    fontWeight: "600",
    marginRight: moderateScale(6),
  },
  playIcon: {
    marginLeft: moderateScale(2)
  },
});
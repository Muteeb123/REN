import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  useWindowDimensions,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LibraryBig,
  SparklesIcon,
  BotMessageSquare,
  HeartHandshake,
  Settings,
} from "lucide-react-native";

import Login from "./Login";
import Personalization from "./Personalization";
import ChatPage from "./Chat";
import Journal from "./Journal";
import Meditation from "./Meditation"; // ✅ your  meditation page
import MeditationSession from './MeditationSession'
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const scale = (size) => {
  const baseWidth = 375;
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  const normalizedSize = size * scaleFactor;
  return Math.round(normalizedSize);
};

const verticalScale = (size) => {
  const baseHeight = 812;
  const scaleFactor = SCREEN_HEIGHT / baseHeight;
  const normalizedSize = size * scaleFactor;
  return Math.round(normalizedSize);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const responsiveFontSize = (size) => {
  const baseWidth = 375;
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  const normalizedSize = size * scaleFactor;
  const maxSize = size * 1.3;
  const minSize = size * 0.8;
  return Math.min(Math.max(normalizedSize, minSize), maxSize);
};

const colors = {
  primary: "#FFFFFF",
  secondary: "#52ACD7",
  textDark: "#1A1B1E",
  textLight: "#6E6E6E",
  background: "#F8FAFC",
};

// ✅ SafeScreenWrapper: keeps screens responsive and keyboard saf
const SafeScreenWrapper = ({ children }) => {
  const { height } = useWindowDimensions();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? verticalScale(60) : 0}
    >
      <View style={[styles.screenContainer, { minHeight: height }]}>{children}</View>
    </KeyboardAvoidingView>
  );
};

// ✅ Placeholder for unused tabs
const PlaceholderScreen = ({ title }) => {
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 600;

  return (
    <SafeScreenWrapper>
      <View style={[styles.center, { paddingHorizontal: moderateScale(20) }]}>
        <Text
          style={[
            styles.placeholderText,
            { fontSize: isSmallScreen ? responsiveFontSize(16) : responsiveFontSize(18) },
          ]}
        >
          {title} Page
        </Text>
      </View>
    </SafeScreenWrapper>
  );
};

const JournalWithSafeArea = () => (
  <SafeScreenWrapper>
    <Journal />
  </SafeScreenWrapper>
);

const ChatWithSafeArea = () => (
  <SafeScreenWrapper>
    <ChatPage />
  </SafeScreenWrapper>
);

// ✅ Meditation wrapped with SafeArea
const MeditationWithSafeArea = () => (
  <SafeScreenWrapper>
    <Meditation />
  </SafeScreenWrapper>
);

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 600;
  const isLargeScreen = width > 400;

  const getTabBarHeight = () => {
    if (isSmallScreen) {
      return verticalScale(50) + insets.bottom;
    } else if (isLargeScreen) {
      return verticalScale(70) + insets.bottom;
    }
    return verticalScale(60) + insets.bottom;
  };

  const getIconSize = () => {
    if (isSmallScreen) {
      return scale(24);
    } else if (isLargeScreen) {
      return scale(32);
    }
    return scale(28);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: moderateScale(1),
          elevation: 0,
          shadowOpacity: 0,
          height: getTabBarHeight(),
          paddingTop: moderateScale(8),
          borderTopColor: "rgba(82, 172, 215, 0.1)",
        },
        tabBarIcon: ({ focused }) => {
          const iconColor = focused ? colors.secondary : colors.textLight;
          const iconSize = getIconSize();

          switch (route.name) {
            case "Chat":
              return <BotMessageSquare color={iconColor} size={iconSize} strokeWidth={2.3} />;
            case "Journal":
              return <LibraryBig color={iconColor} size={iconSize} strokeWidth={2.3} />;
            case "Meditation":
              return <SparklesIcon color={iconColor} size={iconSize} strokeWidth={2.3} />;

            case "Account":
              return <HeartHandshake color={iconColor} size={iconSize} strokeWidth={2.3} />;
            case "Settings":
              return <Settings color={iconColor} size={iconSize} strokeWidth={2.3} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textLight,
      })}
      initialRouteName="Chat"
    >
      <Tab.Screen name="Journal" component={JournalWithSafeArea} />

      <Tab.Screen name="Meditation" component={MeditationWithSafeArea} />
      <Tab.Screen name="Chat" component={ChatWithSafeArea} />
      <Tab.Screen name="Account" component={() => <PlaceholderScreen title="Account" />} />
      <Tab.Screen name="Settings" component={() => <PlaceholderScreen title="Settings" />} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { height } = useWindowDimensions();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView style={[styles.safeArea, { minHeight: height }]}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Personalization" component={Personalization} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="MeditationSession"
              component={MeditationSession}
            />
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontWeight: "600",
    color: colors.textDark,
  },
});

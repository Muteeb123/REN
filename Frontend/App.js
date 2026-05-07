import React, { useEffect, useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  Alert,
} from "react-native";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppNavigator from "./src/navigation/AppNavigator";
import { NODE_BACKEND_URL } from "./src/config/urls";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Android 13+ notification permission
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log("Android Notification Permission:", result);
      }

      // Request Firebase messaging permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("Firebase Messaging Permission Granted");

        // Get FCM token
        const fcmToken = await messaging().getToken();
        console.log("FCM Token:", fcmToken);

        // Save token to AsyncStorage and backend
        await saveFcmToken(fcmToken);

        // Handle foreground messages
        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
          console.log("Foreground message received:", remoteMessage);
          Alert.alert(
            remoteMessage.notification?.title || "New Message",
            remoteMessage.notification?.body || "You have a new notification"
          );
        });

        // Handle background message tap
        messaging().onNotificationOpenedApp((remoteMessage) => {
          console.log("App opened from background notification:", remoteMessage);
          // Handle navigation based on notification data
        });

        // Handle notification when app is killed
        messaging()
          .getInitialNotification()
          .then((remoteMessage) => {
            if (remoteMessage) {
              console.log("App opened from quit state by notification:", remoteMessage);
            }
          });

        return () => unsubscribe();
      } else {
        console.log("Firebase Messaging Permission Denied");
      }
    } catch (error) {
      console.error("Error initializing push notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFcmToken = async (fcmToken) => {
    try {
      // Save to local storage
      await AsyncStorage.setItem("fcmToken", fcmToken);

      // Get user ID from cache
      const cachedUser = await AsyncStorage.getItem("cachedUser");
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        const userId = user?.user?._id || user?.user?.id;

        if (userId) {
          // Send token to backend
          const response = await fetch(
            `${NODE_BACKEND_URL}/api/notifications/token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: userId,
                fcmToken: fcmToken,
              }),
            }
          );

          if (response.ok) {
            console.log("FCM token saved to backend");
          } else {
            console.error("Failed to save FCM token to backend");
          }
        }
      }
    } catch (error) {
      console.error("Error saving FCM token:", error);
    }
  };

  if (isLoading) {
    return null; // or a loading screen
  }

  return <AppNavigator />;
}
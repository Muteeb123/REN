import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const REDDIT_CLIENT_ID = "UJrTPUb0qwYTcKXFcJX93A";
const REDDIT_AUTH_ENDPOINT = "https://www.reddit.com/api/v1/authorize";
const REDDIT_TOKEN_ENDPOINT = "https://www.reddit.com/api/v1/access_token";
const REDDIT_API_ME = "https://oauth.reddit.com/api/v1/me";

const LOCAL_BASE_URL = "http://172.27.176.1:5000";
const BACKEND_LOGIN_URL = `${LOCAL_BASE_URL}/api/auth/login`;
const BACKEND_SIGNUP_URL = `${LOCAL_BASE_URL}/api/auth/signup`;

const REDIRECT_URI = "exp://xsvoa7q-muteeb1098-8081.exp.direct"

console.log("Redirect URI being used:", REDIRECT_URI);

const discovery = {
  authorizationEndpoint: REDDIT_AUTH_ENDPOINT,
  tokenEndpoint: REDDIT_TOKEN_ENDPOINT,
};

const colors = {
  background: "#FFFFFF",
  primary: "#52ACD7",
  secondary: "#333333",
  buttonText: "#FFFFFF",
};

// Base64 for Reddit Basic Auth
const base64Encode = (str) => {
  if (typeof btoa === "function") return btoa(str);
  console.error("btoa not available.");
  return str;
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: REDDIT_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["identity", "read"],
      extraParams: { duration: "permanent" },
    },
    discovery
  );

  // Exchange Reddit code for token
  const exchangeCodeForToken = async (code) => {
    setIsLoading(true);

    const basicAuth = base64Encode(`${REDDIT_CLIENT_ID}:`);
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", REDIRECT_URI);

    try {
      const res = await fetch(REDDIT_TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: formData.toString(),
      });

      const tokenData = await res.json();
      console.log("Token Response:", tokenData);

      if (res.ok && tokenData.access_token) {
        await fetchRedditProfileAndSend(tokenData);
      } else {
        alert(tokenData.error_description || "Failed to get Reddit token.");
      }
    } catch (err) {
      console.error("❌ Token exchange error:", err);
      alert("Network error during token exchange.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Reddit profile → send to backend
  const fetchRedditProfileAndSend = async (tokenData) => {
    try {
      const profileRes = await fetch(REDDIT_API_ME, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "User-Agent": "ExpoApp/1.0",
        },
      });

      const profile = await profileRes.json();
      console.log("Reddit Profile:", profile);

      if (!profile?.name) {
        alert("Failed to fetch Reddit profile username.");
        return;
      }

      const payload = {
        email: `${profile.name}@gmail.com`,
        name: profile.name,
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        age: null,
      };

      const endpoint =
        authMode === "signup" ? BACKEND_SIGNUP_URL : BACKEND_LOGIN_URL;

      console.log("Sending payload to backend:", payload);

      const backendRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const backendData = await backendRes.json();
      console.log("Backend Response:", backendData);

      if (backendRes.ok) {
        // Save user ID globally
        await AsyncStorage.setItem("userId", backendData.user._id);

        alert(`${authMode === "login" ? "Logged in" : "Signed up"} successfully!`);

        if (authMode === "login") {
          navigation.replace("MainTabs");
        } else {
          navigation.replace("Personalization");
        }
      } else {
        alert(backendData.message || `Backend ${authMode} failed.`);
      }
    } catch (err) {
      console.error("❌ Error sending data to backend:", err);
      alert("Error sending data to backend.");
    }
  };

  // Listen for OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      console.log("Authorization code received:", code);
      exchangeCodeForToken(code);
    } else if (response?.type === "dismiss") {
      setIsLoading(false);
    } else if (response?.type === "error") {
      console.error("Auth error:", response.params);
      setIsLoading(false);
    }
  }, [response]);

  const handleAuth = async (mode) => {
    setAuthMode(mode);
    setIsLoading(true);

    try {
      await promptAsync();
    } catch (err) {
      console.error(`❌ ${mode} start error:`, err);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Image source={require("./assets/logo.png")} style={styles.logo} />
        <Text style={styles.heading}>Let's get started</Text>
        <Text style={styles.subheading}>Log in or sign up using Reddit</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.pbutton}
              onPress={() => handleAuth("login")}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Login with Reddit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sbutton}
              onPress={() => handleAuth("signup")}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Signup with Reddit
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  logo: { width: 180, height: 180, marginBottom: 25, resizeMode: "contain" },
  heading: { fontSize: 26, fontWeight: "bold", marginBottom: 8, color: colors.secondary, textAlign: "center" },
  subheading: { fontSize: 16, color: "#666", marginBottom: 25, textAlign: "center" },
  pbutton: { width: "90%", paddingVertical: 14, borderRadius: 25, alignItems: "center", marginVertical: 8, backgroundColor: colors.primary },
  sbutton: { width: "90%", paddingVertical: 14, borderRadius: 25, alignItems: "center", marginVertical: 8, backgroundColor: "transparent", borderWidth: 2, borderColor: colors.primary },
  buttonText: { fontSize: 16, fontWeight: "600" },
});

export default LoginScreen;

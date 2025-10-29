import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

// --- Reddit OAuth Config ---
const REDDIT_CLIENT_ID = "UJrTPUb0qwYTcKXFcJX93A";
const REDDIT_AUTH_ENDPOINT = "https://www.reddit.com/api/v1/authorize";
const REDDIT_TOKEN_ENDPOINT = "https://www.reddit.com/api/v1/access_token";
const REDDIT_API_ME = "https://oauth.reddit.com/api/v1/me";

// ⚙️ Backend endpoints
const LOCAL_BASE_URL = "http://192.168.18.131:5000"; // 👈 your PC IP address
const BACKEND_LOGIN_URL = `${LOCAL_BASE_URL}/api/auth/login`;
const BACKEND_SIGNUP_URL = `${LOCAL_BASE_URL}/api/auth/signup`;

// On Android emulator, use 10.0.2.2 instead of localhost if needed
// On iOS simulator, use 127.0.0.1

const REDIRECT_URI = makeRedirectUri({});
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

// Helper to encode Reddit Basic Auth
const base64Encode = (str) => {
  if (typeof btoa === "function") return btoa(str);
  console.error("btoa not available.");
  return str;
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // can be 'login' or 'signup'

  // 1️⃣ Setup OAuth Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: REDDIT_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["identity", "read"],
      extraParams: { duration: "permanent" },
    },
    discovery
  );

  // 2️⃣ Exchange authorization code for access token
  const exchangeCodeForToken = async (code) => {
    console.log("🔁 Exchanging authorization code for token...");
    setIsLoading(true);

    const basicAuth = base64Encode(`${REDDIT_CLIENT_ID}:`);
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", REDIRECT_URI);

    try {
      const apiResponse = await fetch(REDDIT_TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: formData.toString(),
      });

      const tokenData = await apiResponse.json();

      if (apiResponse.ok && tokenData.access_token) {
        console.log("✅ Token Received:", tokenData.access_token);
        await fetchRedditProfileAndSend(tokenData.access_token);
      } else {
        console.error("❌ Token exchange failed:", tokenData);
        alert(tokenData.error_description || "Failed to get Reddit token.");
      }
    } catch (err) {
      console.error("❌ Network error while token exchange:", err);
      alert("Network error during token exchange.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3️⃣ Fetch Reddit profile and send data to backend
  const fetchRedditProfileAndSend = async (accessToken) => {
    console.log("📡 Fetching Reddit profile info...");
    try {
      const profileRes = await fetch(REDDIT_API_ME, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "ExpoApp/1.0",
        },
      });
      const profile = await profileRes.json();

      if (!profile || !profile.name) {
        console.error("❌ Failed to get Reddit profile:", profile);
        alert("Could not fetch Reddit profile.");
        return;
      }

      console.log("✅ Reddit Profile:", profile);

      const email = profile.id
        ? `${profile.id}@reddituser.com`
        : `${profile.name}@reddit.com`;

      // Prepare user payload
      const payload = {
        email,
        token: accessToken,
        name: profile.name,
      };

      const endpoint =
        authMode === "signup" ? BACKEND_SIGNUP_URL : BACKEND_LOGIN_URL;

      console.log(`📤 Sending user data to ${authMode.toUpperCase()} endpoint...`);

      const backendResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const backendData = await backendResponse.json();
      console.log("✅ Backend Response:", backendData);

      if (backendResponse.ok) {
        alert(`${authMode === "login" ? "Logged in" : "Signed up"} successfully!`);
        navigation.replace("MainTabs");
      } else {
        alert(backendData.message || `Backend ${authMode} failed.`);
      }
    } catch (err) {
      console.error("❌ Error sendg to backend:", err);
      alert("Error while sending user data to backend.");
    }
  };

  // 4️⃣ Handle Reddit login flow
  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      console.log("🔑 Authorization code received!");
      exchangeCodeForToken(code);
    } else if (response?.type === "dismiss") {
      console.log("🚫 User dismissed Reddit login.");
      setIsLoading(false);
    } else if (response?.type === "error") {
      console.error("❌ Auth error:", response.params);
      setIsLoading(false);
    }
  }, [response]);

  // 5️⃣ Handle button actions
  const handleAuth = async (mode) => {
    setAuthMode(mode);
    console.log(`🟢 Starting Reddit ${mode} flow...`);
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      console.error(`❌ ${mode} start error:`, err);
      setIsLoading(false);
    }
  };

  // --- UI ---
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

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 25,
    resizeMode: "contain",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.secondary,
    textAlign: "center",
  },
  subheading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
  },
  pbutton: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: colors.primary,
  },
  sbutton: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginScreen;

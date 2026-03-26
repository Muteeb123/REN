// src/controllers/auth.controller.js
import User from "../Models/User.model.js";
import fetch from "node-fetch";

// --- STEP 1: Redirect user to Reddit ---
export const redditAuth = (req, res) => {
    const scopes = [
        "identity",
        "edit",
        "flair",
        "history",
        "modconfig",
        "modflair",
        "modlog",
        "modposts",
        "modwiki",
        "mysubreddits",
        "privatemessages",
        "read",
        "report",
        "save",
        "submit",
        "subscribe",
        "vote",
        "wikiedit",
        "wikiread"
    ].join(" ");

    const { appRedirect } = req.query;

    const statePayload = {
        nonce: "random_string",
        appRedirect: typeof appRedirect === "string" ? appRedirect : null,
    };

    const encodedState = Buffer.from(
        JSON.stringify(statePayload)
    ).toString("base64url");

    console.log("Initiating Reddit Auth...");
    console.log("Reddirect URI:", process.env.REDDIT_REDIRECT_URI);
    const url =
        `https://www.reddit.com/api/v1/authorize?` +
        `client_id=${process.env.REDDIT_CLIENT_ID}` +
        `&response_type=code` +
        `&state=${encodedState}` +
        `&redirect_uri=${encodeURIComponent(process.env.REDDIT_REDIRECT_URI)}` +
        `&duration=permanent` +
        `&scope=${encodeURIComponent(scopes)}`;

    console.log("Auth URL:", url);

    return res.redirect(url);
    // return res.status(400).send(process.env.REDDIT_REDIRECT_URI);

};
// --- STEP 2: Reddit redirects here ---
export const redditCallback = async (req, res) => {
    console.log("Received Reddit callback with query:", req.query);
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send("req.query");
    }

    try {
        // 🔹 Exchange code for token
        const tokenRes = await fetch(
            "https://www.reddit.com/api/v1/access_token",
            {
                method: "POST",
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            process.env.REDDIT_CLIENT_ID + ":"
                        ).toString("base64"),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: process.env.REDDIT_REDIRECT_URI,
                }),
            }
        );

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return res.status(400).send("Failed to get access token");
        }

        // 🔹 Fetch Reddit profile
        const profileRes = await fetch(
            "https://oauth.reddit.com/api/v1/me",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    "User-Agent": "MyApp/1.0",
                },
            }
        );

        const profile = await profileRes.json();

        if (!profile?.name) {
            return res.status(400).send("Failed to fetch profile");
        }

        const email = `${profile.name}@gmail.com`;

        // 🔹 Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email,
                name: profile.name,
                token: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                age: null,
            });
        }

        let appRedirect = process.env.FRONTEND_SUCCESS_REDIRECT || "renapp://auth-success";

        if (state) {
            try {
                const decodedState = JSON.parse(
                    Buffer.from(state, "base64url").toString("utf8")
                );

                if (
                    decodedState?.appRedirect &&
                    typeof decodedState.appRedirect === "string"
                ) {
                    appRedirect = decodedState.appRedirect;
                }
            } catch {
                // Ignore invalid state and use fallback redirect
            }
        }

        const separator = appRedirect.includes("?") ? "&" : "?";
        const redirectUrl =
            `${appRedirect}${separator}` +
            `userId=${encodeURIComponent(user._id.toString())}` +
            `&personalized=${encodeURIComponent(String(user.personalized))}`;

        return res.redirect(redirectUrl);

    } catch (error) {
        console.error("Reddit Auth Error:", error);
        return res.status(500).send("Auth failed");
    }
};
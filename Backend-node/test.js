import snoowrap from "snoowrap";



try {
    const reddit = new snoowrap({
        userAgent: "reebz",
        clientId: "UJrTPUb0qwYTcKXFcJX93A",
        clientSecret: "",
        refreshToken: "214028306263860-qJVxnRI23QIpTS62r3ouL4gbfiMHmg",
    });

    console.log("Reddit client initialized successfully");
    console.log("Reddit client details:", {
        userAgent: reddit.clientUserAgent,
        clientId: reddit.clientId,
        hasRefreshToken: !!reddit.refreshToken,
    });

    const me = await reddit.getMe();
    console.log("Authenticated Reddit user:", me.name);
    const [comments, posts] = await Promise.all([
        me.getComments({ limit: 10 }),
        me.getSubmissions({ limit: 10 }),
    ]);

    console.log(`Fetched ${comments.length} comments and ${posts.length} posts for user ${me.name}`);
}
catch (error) {
    console.error("Error initializing Reddit client:", error);
    process.exit(1);
}

console.log("Initialized Reddit client with user agent:", process.env.REDDIT_USER_AGENT);
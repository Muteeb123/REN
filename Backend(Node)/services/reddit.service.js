import snoowrap from "snoowrap";
import RedditContent from "../Models/RedditContent.model.js";

/**
 * Fetch authenticated user's posts + comments, store in DB, and return text list.
 * @param {Object} params
 * @param {string} params.refreshToken - OAuth refresh token for the authenticated Reddit user
 * @param {string} params.userId - MongoDB user id
 * @param {number} [params.limit=50] - Max posts/comments to fetch each
 * @returns {Promise<string[]>} Array of extracted text
 */
export const fetchAuthenticatedUserContent = async ({
  refreshToken,
  userId,
  limit = 50,
}) => {
  if (!refreshToken) throw new Error("refreshToken is required");
  if (!userId) throw new Error("userId is required");

  const reddit = new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken,
  });

  reddit.config({ requestDelay: 1000, continueAfterRatelimitError: true });

  const me = await reddit.getMe();
  const [comments, posts] = await Promise.all([
    me.getComments({ limit }),
    me.getSubmissions({ limit }),
  ]);

  const docs = [];

  for (const c of comments) {
    if (!c?.id || !c?.body) continue;
    docs.push({
      userId,
      redditId: c.id,
      text: c.body,
      type: "comment",
      createdAt: new Date((c.created_utc || Date.now() / 1000) * 1000),
    });
  }

  for (const p of posts) {
    if (!p?.id) continue;
    const postText = [p.title, p.selftext].filter(Boolean).join("\n\n").trim();
    if (!postText) continue;

    docs.push({
      userId,
      redditId: p.id,
      text: postText,
      type: "post",
      createdAt: new Date((p.created_utc || Date.now() / 1000) * 1000),
    });
  }

  if (docs.length > 0) {
    await RedditContent.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { userId: doc.userId, redditId: doc.redditId, type: doc.type },
          update: { $set: doc },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  return docs.map((d) => d.text);
};
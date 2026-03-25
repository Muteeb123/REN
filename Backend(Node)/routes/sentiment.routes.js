import express from "express";
import {testSentiment, analyzeUserSentiment, fetchRedditData} from "../controllers/test.controller.js";

const router = express.Router();

router.post("/test", testSentiment);
router.get("/user/:userId/analyze", analyzeUserSentiment);

// this is a reddit fetching route, not sentiment analysis 
// - consider moving to reddit.routes.js in the future
router.get("/user/:userId/reddit-data", fetchRedditData);


export default router;

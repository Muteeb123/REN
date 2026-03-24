// src/routes/providerAuth.routes.js
import express from "express";
import { providerSignup, providerLogin } from "../controllers/ProviderAuth.controller.js";

const router = express.Router();

router.post("/signup", providerSignup);
router.post("/login", providerLogin);

export default router;
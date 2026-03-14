import express from "express";
import { login, signup, verifyEmail } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/signup", signup)

export default router;
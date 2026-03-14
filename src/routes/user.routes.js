import express from "express";
import { getUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", getUserProfile);

export default router;
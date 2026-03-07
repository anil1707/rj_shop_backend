import express from "express";
import {
  addInventory,
  getInventory
} from "../controllers/inventry.controller.js";

const router = express.Router();

router.post("/", addInventory);
router.get("/", getInventory);

export default router;
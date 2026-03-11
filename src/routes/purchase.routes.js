

import express from "express";
import { createPurchase, getCustomerPurchases, getPurchaseDetails } from "../controllers/purchase.controller.js";

const router = express.Router();

router.post('/', createPurchase) // create new purchase
router.get("/:id/purchases", getCustomerPurchases);
router.get("/:id", getPurchaseDetails)

export default router;
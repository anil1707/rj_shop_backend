import express from "express";
import {
  addTransaction,
  getCustomerTransactions,
  getCustomerBalance
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/", addTransaction);
router.get("/:customerId", getCustomerTransactions);
router.get("/balance/:customerId", getCustomerBalance);

export default router;
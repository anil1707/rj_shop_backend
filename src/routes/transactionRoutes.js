import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionSummary,
  updateTransaction
} from "../controllers/transactionController.js";

const router = express.Router();


// CREATE PAYMENT
router.post("/", createTransaction);


// GET PAYMENTS
router.get("/", getTransactions);

router.put("/:id", updateTransaction);


// SUMMARY
router.get("/summary", getTransactionSummary);



export default router;
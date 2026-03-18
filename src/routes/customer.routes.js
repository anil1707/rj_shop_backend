import express from "express";
import { createCustomer, getCustomerDetails, getCustomers, updateCustomer } from "../controllers/customer.conroller.js";

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerDetails);
router.put("/:id", updateCustomer);

export default router;
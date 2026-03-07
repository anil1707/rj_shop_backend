import express from "express";
import { createCustomer, getCustomerDetails, getCustomers } from "../controllers/customer.conroller.js";

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomerDetails);

export default router;
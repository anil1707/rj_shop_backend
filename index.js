import express from "express";
import cors from "cors";

import customerRoutes from "./src/routes/customer.routes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import inventoryRoutes from "./src/routes/inventryRoutes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import { connectDB } from "./src/config/db.js";
import purchaseRoutes from "./src/routes/purchase.routes.js";

const app = express();
connectDB()

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/purchase", purchaseRoutes)

export default app;
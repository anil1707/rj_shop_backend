import express from "express";
import cors from "cors";

import customerRoutes from "./src/routes/customer.routes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import inventoryRoutes from "./src/routes/inventryRoutes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import authRoutes from "./src/routes/auth.routes.js"
import { connectDB } from "./src/config/db.js";
import purchaseRoutes from "./src/routes/purchase.routes.js";
import { verifyToken } from "./src/middleware/auth.middleware.js";
import { allowRoles } from "./src/middleware/role.middleware.js";
import userRoutes from "./src/routes/user.routes.js"
import { errorHandler } from "./src/middleware/errorHandler.middleware.js"
 

const app = express();
connectDB()

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

app.use("/api/auth", authRoutes)

app.use(verifyToken)
app.use("/api/users", userRoutes);
app.use(allowRoles("shopkeeper"))

app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use(errorHandler);

export default app;
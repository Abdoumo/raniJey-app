import express from "express";
import cors from "cors";
import { createServer } from "http";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import shopRouter from "./routes/shopRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import locationRouter from "./routes/locationRoute.js";
import setupWebSocket from "./config/websocket.js";

// app config
const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer(app);

//middlewares
app.use(express.json());
app.use(cors());

// DB connection
connectDB();

// Setup WebSocket
const io = setupWebSocket(httpServer);

// api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/shop", shopRouter);
app.use("/api/category", categoryRouter);
app.use("/api/location", locationRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

httpServer.listen(port, () => {
  console.log(`Server Started on port: ${port}`);
  console.log("WebSocket server ready for real-time location tracking");
});

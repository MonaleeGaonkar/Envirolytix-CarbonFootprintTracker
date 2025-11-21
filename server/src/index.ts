import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import apiRouter from "./routes/api";

dotenv.config();
console.log("✅ Loaded API_KEY:", process.env.API_KEY ? "Found" : "Missing");


const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(bodyParser.json());
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Envirolytix backend running" });
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/envirolytix";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

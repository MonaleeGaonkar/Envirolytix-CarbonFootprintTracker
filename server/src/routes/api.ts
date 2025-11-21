import express, { Router, Request, Response } from "express";
import { readDB, writeDB } from "../services/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import authRouter from "./auth";
import tripsRouter from "./trips";
import User from "../models/User";//added at 10
import { startOfDay, subDays } from "date-fns";//added at 10

const router = Router();

router.post("/debug", (req, res) => {
  console.log("🧠 DEBUG ROUTE HIT from frontend!");
  res.json({ ok: true });
});


// ✅ Mount sub-routers
router.use("/auth", authRouter);
router.use("/trips", tripsRouter);

// ✅ Health check route
router.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, message: "API is healthy" });
});

// ✅ File-based activities
router.get("/activities", async (_req: Request, res: Response) => {
  const db = await readDB();
  res.json(db.activities || []);
});


// router.post("/activities", async (req: Request, res: Response) => {
//   const db = await readDB();
//   const activities = db.activities || [];

//   const newActivity = {
//     ...req.body,
//     id: Date.now().toString(),
//   };

//   activities.push(newActivity);
//   db.activities = activities;

//   await writeDB(db);
//   res.status(201).json(newActivity);
// });

router.post("/activities", async (req, res) => {
  const { email, co2e, ecoPoints } = req.body;

  if (!email) return res.status(400).json({ error: "Missing user email" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 🟢 new — ensure proper number conversion
    const co2Value = Number(co2e) || 0;
const pointsValue = Number(ecoPoints) || 0;

// Update ecoPoints & totalCarbon
user.ecoPoints = (user.ecoPoints || 0) + pointsValue;
user.totalCarbon = (user.totalCarbon || 0) + co2Value;

// STREAK logic using lastActivityAt
const today = startOfDay(new Date());
const yesterday = startOfDay(subDays(today, 1));

// Use lastActivityAt (new field) — fallback null
const lastActivityDate = user.lastActivityAt ? startOfDay(user.lastActivityAt) : null;
// Cases:
// - no lastActivityAt -> first activity => streak = 1
// - lastActivityAt === yesterday => consecutive => increment
// - lastActivityAt < today (but not yesterday) => reset to 1
// - lastActivityAt === today => already logged today -> leave streak unchanged
if (!lastActivityDate) {
  user.streak = 1;
} else if (lastActivityDate.getTime() === yesterday.getTime()) {
  user.streak = (user.streak || 0) + 1;
} else if (lastActivityDate.getTime() < today.getTime()) {
  // lastActivityDate is older than today and not equal to yesterday => reset
  user.streak = 1;
} // else lastActivityDate === today -> do nothing

// record this activity time
user.lastActivityAt = new Date();

await user.save();

    res.status(201).json({
      message: "Activity logged successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarOptions: user.avatarOptions || {},
        ecoPoints: user.ecoPoints,
        totalCarbon: user.totalCarbon,
        streak: user.streak,
      },
    });
  } catch (error) {
    console.error("Error saving activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Simple Carbon Footprint Calculator
router.post("/activities/calculate", async (req: Request, res: Response) => {
  const { category, type, value } = req.body;

  if (!category || !type || typeof value !== "number") {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let co2e = 0;
  let description = "";
  let ecoPoints = 0;

  switch (category.toLowerCase()) {
    case "transport":
    case "transportation":
      if (type === "car") co2e = value * 0.21;
      else if (type === "bus") co2e = value * 0.1;
      else if (type === "train") co2e = value * 0.05;
      else if (type === "bike") co2e = value * 0.01;
      else co2e = value * 0.15;
      description = `${type} journey of ${value} km`;
      break;

    case "energy":
      if (type === "electricity") co2e = value * 0.475;
      else if (type === "natural gas") co2e = value * 2.0;
      else if (type === "lpg") co2e = value * 1.5;
      else co2e = value * 0.5;
      description = `${type} usage of ${value} kWh`;
      break;

    case "food":
      if (type === "beef") co2e = value * 27;
      else if (type === "chicken") co2e = value * 6.9;
      else if (type === "vegetables") co2e = value * 2;
      else if (type === "dairy") co2e = value * 3;
      else co2e = value * 4;
      description = `${type} consumption (${value} servings or kg)`;
      break;

    case "goods and services":
    case "goods_services":
    case "goods":
      if (type === "clothing") co2e = value * 25;
      else if (type === "electronics") co2e = value * 50;
      else if (type === "furniture") co2e = value * 40;
      else co2e = value * 10;
      description = `${type} purchase worth ${value} units`;
      break;

    default:
      co2e = value * 0.2;
      description = `${type} activity (${category})`;
      break;
  }

  ecoPoints = Math.max(0, Math.round(100 - co2e));

  res.json({ co2e, description, ecoPoints });
});


// ✅ Mock Weather Endpoint
router.get("/weather", async (_req: Request, res: Response) => {
  const mock = [
    { temperature: 5, condition: "Chilly & Clear", icon: "sunny", location: "London, UK" },
    { temperature: 28, condition: "Hot & Sunny", icon: "sunny", location: "London, UK" },
    { temperature: 12, condition: "Rainy Day", icon: "rainy", location: "London, UK" },
    { temperature: 18, condition: "Partly Cloudy", icon: "partly-cloudy", location: "London, UK" },
    { temperature: 15, condition: "Cloudy & Overcast", icon: "cloudy", location: "London, UK" },
  ];
  const item = mock[Math.floor(Math.random() * mock.length)];
  res.json(item);
});

// ✅ AI Chat (Gemini Proxy)
router.post("/ai/chat", async (req: Request, res: Response) => {
  const { activities = [], unlockedBadges = [], dailyGoal = 5, message = "" } = req.body || {};
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.json({
      reply: "⚠️ Missing API key. Add your Google Gemini API key to your .env file.",
    });
  }

  try {
    console.log("✅ Loaded API_KEY: Found");//To check working of API key.

    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ use the correct endpoint and model name
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    const totalToday = (activities || []).reduce(
      (sum: number, a: any) => sum + (Number(a.co2e) || 0),
      0
    );

    const systemInstruction = `You are Green Coach. The user's daily goal is ${dailyGoal} kg CO2e. Today's total is ${totalToday.toFixed(
      2
    )} kg.`;

    const prompt = `${systemInstruction}\nUser message: ${message}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    res.json({ reply: text });
  } catch (error: any) {
    console.error("🔥 AI proxy error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

// ✅ Leaderboard endpoint - returns users sorted by ecoPoints desc
router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const users = await User.find({})
      .select('name ecoPoints streak avatarOptions id email totalCarbon')
      .sort({ ecoPoints: -1 })
      .lean();

    // Normalize _id -> id if needed (mongoose virtuals may already handle this on toJSON)
    const payload = users.map((u: any) => ({
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      ecoPoints: typeof u.ecoPoints === 'number' ? u.ecoPoints : 0,
      streak: typeof u.streak === 'number' ? u.streak : 0,
      totalCarbon: typeof u.totalCarbon === 'number' ? u.totalCarbon : 0,
      avatarOptions: u.avatarOptions || {},
    }));

    res.json(payload);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

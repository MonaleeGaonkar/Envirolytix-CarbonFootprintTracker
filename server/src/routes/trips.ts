import { Router } from "express";
import { TripPlannerRequest, TripCalculation } from "../types/api";
import { calculateFootprint } from "../services/carbon";
import Activity from "../models/Activity";

const router = Router();

const estimateDistance = (origin: string, destination: string): number => {
  if (!origin || !destination) return 0;
  if (!origin.trim() || !destination.trim()) return 0;
  const clampedLength = Math.max(5, Math.min(origin.length + destination.length, 50));
  const distance = clampedLength * 25 + Math.floor(Math.random() * 200);
  return Math.max(10, distance);
};

const estimateTimeAndCost = (
  distance: number,
  type: string
): { time: string; cost: string } => {
  const hours =
    distance /
    (type === "flight_short"
      ? 700
      : type.includes("car")
      ? 80
      : type === "train"
      ? 120
      : 50);
  const costBase =
    type === "flight_short" ? 80 : type === "train" ? 20 : type === "bus" ? 10 : 0;
  const costPerKm =
    type === "car_electric" ? 0.05 : type === "car_petrol" ? 0.15 : type === "flight_short" ? 0.15 : 0.1;

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const time = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const cost = `$${Math.round(costBase + distance * costPerKm)} - $${Math.round(
    (costBase + distance * costPerKm) * 1.5
  )}`;

  return { time, cost };
};

// POST /trips/calculate — create + save trip
router.post("/calculate", async (req, res) => {
  try {
    const { origin, destination, mode, userId }: TripPlannerRequest & { userId?: string } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId. Please include logged-in user's ID." });
    }

    const distance = estimateDistance(origin, destination);
    const { co2e } = calculateFootprint("Transportation", mode, distance);
    const { time, cost } = estimateTimeAndCost(distance, mode);

    const calculation: TripCalculation = {
      mode:
        mode === "car_petrol"
          ? "Petrol Car"
          : mode === "car_electric"
          ? "Electric Car"
          : mode === "bus"
          ? "Bus"
          : mode === "train"
          ? "Train"
          : mode === "flight_short"
          ? "Short Flight"
          : mode,
      distance,
      co2e,
      type: mode,
      time,
      cost,
    };

    const activity = new Activity({
      title: calculation.mode,
      description: `${origin} → ${destination}`,
      userId,
      meta: calculation,
    });

    await activity.save();

    res.status(201).json({ message: "Trip saved successfully", trip: calculation });
  } catch (err) {
    console.error("Trip save error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /trips/user/:userId — fetch all trips for user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const trips = await Activity.find({ userId }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    console.error("Error fetching user trips:", err);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

export default router;

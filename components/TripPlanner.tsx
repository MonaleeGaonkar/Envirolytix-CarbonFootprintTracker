import React, { useState, useCallback, useMemo } from 'react';
import { Activity, ActivityCategory, TripCalculation } from '../types';
import * as carbonService from "../services/carbonService";
import { generateTripSuggestion } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';
import {
  SparklesIcon,
  CarIcon,
  BoltIcon,
  BusIcon,
  TrainIcon,
  PlaneIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from './ui/Icons';

interface TripPlannerProps {
  user: {email: string}; // 🟢 added user prop
  onAddActivity: (activity: Activity) => void;
  setLeaderboardData?: (data: any) => void; // 🟢 added for leaderboard sync
}

const estimateDistance = (origin: string, destination: string): number => {
  if (!origin.trim() || !destination.trim()) return 0;
  const clampedLength = Math.max(5, Math.min(origin.length + destination.length, 50));
  const distance = clampedLength * 25 + Math.floor(Math.random() * 200);
  return Math.max(10, distance);
};

const formatTime = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const estimateTimeAndCost = (
  distance: number,
  type: string
): { time: string; cost: string; timeValue: number; costValue: number } => {
  let hours = 0;
  let costRange = [0, 0];

  switch (type) {
    case "car_petrol":
      hours = distance / 80;
      costRange = [distance * 0.15, distance * 0.2];
      break;
    case "car_electric":
      hours = distance / 80;
      costRange = [distance * 0.04, distance * 0.06];
      break;
    case "bus":
      hours = distance / 50;
      costRange = [10, 20 + distance * 0.05];
      break;
    case "train":
      hours = distance / 120;
      costRange = [20, 40 + distance * 0.1];
      break;
    case "flight_short":
      hours = distance / 700 + 2.5;
      costRange = [80, 150 + distance * 0.15];
      break;
    default:
      break;
  }
  return {
    time: formatTime(hours),
    cost: `$${Math.round(costRange[0])} - $${Math.round(costRange[1])}`,
    timeValue: hours * 60,
    costValue: costRange[0],
  };
};

const transportOptions = [
  { value: "car_petrol", label: "Petrol Car", icon: CarIcon },
  { value: "car_electric", label: "Electric Car", icon: BoltIcon },
  { value: "bus", label: "Bus", icon: BusIcon },
  { value: "train", label: "Train", icon: TrainIcon },
  { value: "flight_short", label: "Short Flight", icon: PlaneIcon },
];

const TripPlanner: React.FC<TripPlannerProps> = ({ user,  onAddActivity, setLeaderboardData }) => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState("car_petrol");
  const [allTripOptions, setAllTripOptions] = useState<TripCalculation[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripCalculation | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // choose correct backend function
  const calcFunc =
    (carbonService as any).calculateTrip ?? (carbonService as any).calculateFootprint;

  // get userId from localStorage if logged in
  const userId = (() => {
    try {
      const u = localStorage.getItem("user");
      if (!u) return undefined;
      const parsed = JSON.parse(u);
      return parsed?.id || parsed?._id;
    } catch {
      return undefined;
    }
  })();

  const handleCalculate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!origin || !destination) {
        alert("Please enter both an origin and a destination.");
        return;
      }

      if (!calcFunc) {
        alert("Calculation service unavailable.");
        return;
      }

      setIsLoading(true);
      setAllTripOptions([]);
      setSelectedTrip(null);
      setSuggestion("");

      const distance = estimateDistance(origin, destination);

      const calculatedOptions: TripCalculation[] = await Promise.all(
        transportOptions.map(async (opt) => {
          try {
            const res = await calcFunc(origin, destination, opt.value, userId);
            const trip = res?.trip ?? res;
            const { time, cost } = estimateTimeAndCost(distance, opt.value);
            return {
              mode: opt.label,
              distance,
              co2e: trip?.co2e ?? 0,
              type: opt.value,
              icon: opt.icon,
              time,
              cost,
            };
          } catch (err) {
            console.error("Failed to calculate footprint for option", opt.value, err);
            const { time, cost } = estimateTimeAndCost(distance, opt.value);
            return {
              mode: opt.label,
              distance,
              co2e: 0,
              type: opt.value,
              icon: opt.icon,
              time,
              cost,
            };
          }
        })
      );

      const selectedOption = calculatedOptions.find((opt) => opt.type === mode);
      setSelectedTrip(selectedOption || null);
      setAllTripOptions(calculatedOptions);

      if (selectedOption) {
        let streamedText = "";
        const suggestionStream = generateTripSuggestion(
          selectedOption,
          calculatedOptions
        );
        for await (const chunk of suggestionStream) {
          streamedText += chunk;
          setSuggestion(streamedText);
        }
      }

      setIsLoading(false);
    },
    [origin, destination, mode, calcFunc, userId]
  );

  // const handleLogTrip = async (trip: TripCalculation) => {
  //   if (!calcFunc || !userId) {
  //     alert("Cannot log trip — missing connection or user info.");
  //     return;
  //   }

  //   try {
  //     const res = await calcFunc(origin, destination, trip.type, userId);
  //     const tripData = res?.trip ?? res;

  //     const newActivity: Activity = {
  //       id: new Date().toISOString(),
  //       category: ActivityCategory.Transportation,
  //       description: `Trip to ${destination} by ${trip.mode.toLowerCase()} (${trip.distance.toFixed(
  //         0
  //       )} km)`,
  //       co2e: tripData?.co2e ?? trip.co2e,
  //       date: new Date().toISOString(),
  //       ecoPoints:
  //         typeof tripData?.ecoPoints === "number"
  //           ? tripData.ecoPoints
  //           : Math.round((tripData?.co2e ?? trip.co2e) * 0.5),
  //     };
  //     onAddActivity(newActivity);
  //     alert(`Logged trip to ${destination}! Check your Activity Log.`);
  //   } catch (err) {
  //     console.error("Failed to log trip", err);
  //     alert("Failed to calculate or log trip. See console for details.");
  //   }
  // };


  const handleLogTrip = async (trip: TripCalculation) => {
  if (!calcFunc) {
    alert("Calculation service unavailable.");
    return;
  }

  if (!user?.email) {
    alert("Cannot log trip — missing user email.");
    console.warn("TripPlanner → user.email missing:", user);
    return;
  }

  try {
    // 🟢 Calculate trip footprint (CO2e etc.)
    const res = await calcFunc(origin, destination, trip.type, userId);
    const tripData = res?.trip ?? res;

    // 🟢 Build new activity object
    const newActivity: Activity = {
      id: new Date().toISOString(),
      category: ActivityCategory.Transportation,
      description: `Trip to ${destination} by ${trip.mode.toLowerCase()} (${trip.distance.toFixed(0)} km)`,
      co2e: tripData?.co2e ?? trip.co2e,
      date: new Date().toISOString(),
      ecoPoints:
        typeof tripData?.ecoPoints === "number"
          ? tripData.ecoPoints
          : Math.round((tripData?.co2e ?? trip.co2e) * 0.5),
    };

    // 🟢 Send activity to backend (so it updates ecoPoints, totalCarbon, and streak)
    const apiRes = await fetch("http://localhost:4000/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newActivity,
        email: user.email, // send user email to identify them
      }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("Backend error:", text);
      alert("Backend failed to save activity — check console.");
      return;
    }

    // 🟢 Get updated user from response
    const updated = await apiRes.json();
    const updatedUser = updated.user ?? updated.updatedUser ?? updated;

    if (updatedUser) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (setLeaderboardData) {
        setLeaderboardData((prevData: any) => prevData.map((u: any) => u.id === updatedUser.id ? updatedUser : u));
      }
      console.log("✅ Updated user saved:", updatedUser);
      // Pass updatedUser to onAddActivity so it syncs properly to leaderboard
      onAddActivity(newActivity);
    } else {
      onAddActivity(newActivity);
    }
    alert(`Trip to ${destination} logged successfully! 🎉`);
  } catch (err) {
    console.error("Failed to log trip", err);
    alert("Failed to log trip — check console for details.");
  }
};



  const bestOptions = useMemo(() => {
    if (allTripOptions.length === 0)
      return { co2e: null, time: null, cost: null };

    const optionsWithValues = allTripOptions.map((opt) => {
      const { timeValue, costValue } = estimateTimeAndCost(opt.distance, opt.type);
      return { ...opt, timeValue, costValue };
    });

    const bestCO2e = optionsWithValues.reduce((best, current) =>
      current.co2e < best.co2e ? current : best
    );
    const bestTime = optionsWithValues.reduce((best, current) =>
      current.timeValue < best.timeValue ? current : best
    );
    const bestCost = optionsWithValues.reduce((best, current) =>
      current.costValue < best.costValue ? current : best
    );

    return {
      co2e: bestCO2e.type,
      time: bestTime.type,
      cost: bestCost.type,
    };
  }, [allTripOptions]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Trip Planner</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Estimate your travel footprint and find greener routes.
        </p>
      </div>

      <Card>
        <form
          onSubmit={handleCalculate}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium">
                From
              </label>
              <input
                type="text"
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g., London"
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium">
                To
              </label>
              <input
                type="text"
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Paris"
                required
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="mode" className="block text-sm font-medium">
              Mode
            </label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              {transportOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Calculating..." : "Calculate Trip"}
          </Button>
        </form>
      </Card>

      {isLoading && (
        <div className="text-center py-8">
          <div role="status">
            <svg
              aria-hidden="true"
              className="inline w-10 h-10 text-slate-200 animate-spin dark:text-slate-600 fill-emerald-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393..."
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {selectedTrip && allTripOptions.length > 0 && !isLoading && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Trip Results:{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {origin} to {destination}
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Estimated distance: ~{selectedTrip.distance.toFixed(0)} km
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">CO₂e (kg)</th>
                    <th className="px-4 py-3 text-right">Time</th>
                    <th className="px-4 py-3 text-right">Est. Cost</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allTripOptions.map((trip) => {
                    const Icon = trip.icon;
                    return (
                      <tr
                        key={trip.type}
                        className={`border-b border-slate-200 dark:border-slate-700 ${
                          trip.type === mode ? "ring-2 ring-emerald-500 rounded-lg" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                            <span>{trip.mode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          <div className="flex items-center justify-end gap-1">
                            {bestOptions.co2e === trip.type && (
                              <span
                                className="w-2 h-2 bg-green-500 rounded-full"
                                title="Lowest Emissions"
                              ></span>
                            )}
                            {trip.co2e.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{trip.time}</td>
                        <td className="px-4 py-3 text-right">{trip.cost}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLogTrip(trip)}
                          >
                            Log
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          {suggestion && (
            <Card>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300">
                      Green Coach Tip
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300/90">
                      {suggestion}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TripPlanner;

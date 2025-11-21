import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, ActivityCategory } from '../types';
import * as carbonService from "../services/carbonService";
import { getDistanceFromLatLonInKm } from '../utils';
import Card from './ui/Card';
import Button from './ui/Button';
import { activityOptions, COLORS, CATEGORY_ICONS } from '../constants';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { LocationMarkerIcon } from './ui/Icons';

interface ActivityLogProps {
  onAddActivity: (activity: Activity) => void;
  activities: Activity[];
  userId?: string;
  userEmail?: string;
  setUser?:(u : any)=>void; // added this
  setLeaderboardData?: (data: any) => void; // added this for leaderboard sync
}

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
  const Icon = CATEGORY_ICONS[activity.category];
  const color = COLORS[activity.category];

  return (
    <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex-shrink-0 mr-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-2 items-center text-sm">
        <div className="sm:col-span-2">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{activity.description}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(activity.date), 'MMM d, yyyy')}</p>
        </div>
        <div className="text-right sm:text-left">
          <p className="font-bold">{activity.co2e.toFixed(2)} kg</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">CO₂e</p>
        </div>
        <div className="text-right sm:text-left">
          <p className="font-bold text-green-600">+{activity.ecoPoints}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">EcoPoints</p>
        </div>
      </div>
    </div>
  );
};

const ActivityLog: React.FC<ActivityLogProps> = ({ onAddActivity, activities, userId: propUserId, userEmail, setUser, setLeaderboardData }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingDistance, setTrackingDistance] = useState(0);
  const [trackingMode, setTrackingMode] = useState('car_petrol');
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // determine userId (prop -> localStorage fallback)
  const userId = propUserId || (() => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return undefined;
      const parsed = JSON.parse(u);
      return parsed?.id || parsed?._id;
    } catch {
      return undefined;
    }
  })();

  // choose calc function (compatible with either export name)
  const calcFunc = (carbonService as any).calculateTrip ?? (carbonService as any).calculateFootprint;

  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      setTrackingError("Geolocation is not supported by your browser.");
      return;
    }

    setTrackingError(null);
    setTrackingDistance(0);
    lastPositionRef.current = null;
    setIsTracking(true);

    const options = { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (lastPositionRef.current) {
          const distanceIncrement = getDistanceFromLatLonInKm(
            lastPositionRef.current.coords.latitude,
            lastPositionRef.current.coords.longitude,
            position.coords.latitude,
            position.coords.longitude
          );
          setTrackingDistance(prev => prev + distanceIncrement);
        }
        lastPositionRef.current = position;
      },
      (error) => {
        setTrackingError(`GPS Error: ${error.message}`);
        setIsTracking(false);
      },
      options
    );
  };

  const handleStopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (trackingDistance > 0.01) { // Only log if distance is meaningful
      if (!calcFunc) {
        setTrackingError('Calculation function not available.');
      } else if (!userId) {
        setTrackingError('No user ID available to save trip.');
      } else {
        try {
          const res = await calcFunc("Current Trip", "Destination", trackingMode, userId);
          const trip = res?.trip ?? res;
          const description = trip?.mode
            ? `${trip.mode} — ${trackingDistance.toFixed(2)} km`
            : `Trip — ${trackingDistance.toFixed(2)} km`;

          const newActivity: Activity = {
            id: new Date().toISOString(),
            category: ActivityCategory.Transportation,
            description,
            co2e: trip?.co2e ?? 0,
            date: new Date().toISOString(),
            ecoPoints: typeof trip?.ecoPoints === "number"
              ? trip.ecoPoints
              : Math.max(0, Math.round((trip?.co2e ?? 0) * 0.5)),
          };

          // 🟢 Save to backend & sync updated user (ecoPoints, totalCarbon, streak)
          if (userEmail) {
            try {
              const apiRes = await fetch("http://localhost:4000/api/activities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newActivity, email: userEmail }), // send email as string
              });

              if (!apiRes.ok) {
                // attempt to read error message if any, then continue updating frontend UI
                const errText = await apiRes.text().catch(() => '');
                console.warn("Backend /api/activities returned non-ok:", apiRes.status, errText);
              } else {
                // backend should return updated user in response -> { user: {...} } or user object directly
                const resJson = await apiRes.json().catch(() => null);

                // check common response shapes and pick updatedUser
                const updatedUser = resJson && (resJson.user ?? resJson.updatedUser ?? resJson);

                if (updatedUser) {
                  if (setUser) setUser(updatedUser); // update app-wide user state
                  if (setLeaderboardData) {
                    setLeaderboardData((prevData: any) => prevData.map((u: any) => u.id === updatedUser.id ? updatedUser : u));
                  }
                  try { localStorage.setItem("user", JSON.stringify(updatedUser)); } catch (e) { /* ignore */ }
                  // Pass updatedUser to onAddActivity so it syncs to leaderboard
                  onAddActivity(newActivity, updatedUser);
                } else {
                  // Fallback: try to refresh profile explicitly
                  const profileRes = await fetch(
                    `http://localhost:4000/auth/profile?email=${encodeURIComponent(userEmail)}`
                  );
                  if (profileRes.ok) {
                    const profileJson = await profileRes.json().catch(() => null);
                    if (profileJson) {
                      if (setUser) setUser(profileJson);
                      try { localStorage.setItem("user", JSON.stringify(profileJson)); } catch (e) {}
                    }
                  }
                  onAddActivity(newActivity);
                }
              }
            } catch (err) {
              console.warn("Failed to POST activity to backend:", err);
              // continue - still update frontend so user sees the entry immediately
              onAddActivity(newActivity);
            }
          } else {
            onAddActivity(newActivity);
          }
        } catch (error) {
          setTrackingError(error instanceof Error ? error.message : "Failed to calculate footprint");
          return;
        }
      }
    }

    setIsTracking(false);
    setTrackingDistance(0);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const filteredAndSortedActivities = useMemo(() => {
    let filtered = activities.filter(a => a.category === ActivityCategory.Transportation);

    const startDate = filterStartDate ? startOfDay(new Date(filterStartDate)) : null;
    const endDate = filterEndDate ? endOfDay(new Date(filterEndDate)) : null;

    if (startDate && isValid(startDate)) {
      filtered = filtered.filter(a => new Date(a.date) >= startDate);
    }
    if (endDate && isValid(endDate)) {
      filtered = filtered.filter(a => new Date(a.date) <= endDate);
    }

    switch (sortBy) {
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'co2e-desc':
        filtered.sort((a, b) => b.co2e - a.co2e);
        break;
      case 'co2e-asc':
        filtered.sort((a, b) => a.co2e - b.co2e);
        break;
      case 'date-desc':
      default:
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
    }

    return filtered;
  }, [activities, filterStartDate, filterEndDate, sortBy]);

  const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  const selectStyle = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Live Travel Tracking</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your trips in real-time and view your activity history.</p>
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <LocationMarkerIcon className="w-6 h-6 text-emerald-500" />
          Live Travel Tracking
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Automatically log your trips using GPS.</p>
        {isTracking ? (
          <div className="space-y-4">
            <div className="flex justify-around text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Distance</p>
                <p className="font-bold text-xl">{trackingDistance.toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mode</p>
                <p className="font-bold text-xl">{trackingMode}</p>
              </div>
            </div>
            <Button onClick={handleStopTracking} className="w-full !bg-red-500 hover:!bg-red-600">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              Stop & Log
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="tracking-mode" className={labelStyle}>Mode of Transport</label>
              <select id="tracking-mode" value={trackingMode} onChange={e => setTrackingMode(e.target.value)} className={selectStyle}>
                {activityOptions[ActivityCategory.Transportation].map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleStartTracking} className="w-full">
              Start Tracking
            </Button>
            {trackingError && <p className="text-sm text-red-500 text-center">{trackingError}</p>}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">Travel History</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-4">
          <div>
            <label htmlFor="sort-by" className="block text-xs font-medium text-slate-500 dark:text-slate-400">Sort By</label>
            <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectStyle + ' text-sm'}>
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="co2e-desc">CO2e (High-Low)</option>
              <option value="co2e-asc">CO2e (Low-High)</option>
            </select>
          </div>
          <div>
            <label htmlFor="start-date" className="block text-xs font-medium text-slate-500 dark:text-slate-400">Start Date</label>
            <input type="date" id="start-date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={inputStyle + ' text-sm py-2'} />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-xs font-medium text-slate-500 dark:text-slate-400">End Date</label>
            <input type="date" id="end-date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={inputStyle + ' text-sm py-2'} />
          </div>
        </div>
        <div className="space-y-3">
          {filteredAndSortedActivities.length > 0 ? (
            filteredAndSortedActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 dark:text-slate-400">No travel activities match your filters.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Use the Live Tracker to log a new trip.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ActivityLog;


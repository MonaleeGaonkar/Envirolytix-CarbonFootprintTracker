import React, { useState } from 'react';
import { Activity, ActivityCategory, Page, User } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { CalculatorIcon, ChevronDownIcon, ChevronUpIcon, EcoPointsIcon, StreakIcon, LocationMarkerIcon, DocumentTextIcon, CameraIcon } from './ui/Icons';
import * as carbonService from "../services/carbonService";
import { activityOptions, COLORS, CATEGORY_ICONS } from '../constants';
import WeatherWidget from './WeatherWidget';
import FriendsConnect from './FriendsConnect';

interface DashboardProps {
  user: User;
  activities: Activity[];
  dailyGoal: number;
  setCurrentPage: (page: Page) => void;
}

const calculateStreak = (activities: Activity[]): number => {
  if (activities.length === 0) return 0;

  const sortedUniqueDays = [...new Set(activities.map(a => startOfDay(new Date(a.date)).getTime()))].sort((a, b) => b - a);

  if (sortedUniqueDays.length === 0) return 0;

  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));

  if (sortedUniqueDays[0] < yesterday.getTime()) {
    return 0;
  }

  let streak = 0;
  let expectedDay = sortedUniqueDays[0];

  for (const dayTime of sortedUniqueDays) {
    if (dayTime === expectedDay) {
      streak++;
      expectedDay = startOfDay(subDays(new Date(expectedDay), 1)).getTime();
    } else {
      break;
    }
  }
  return streak;
};

const Dashboard: React.FC<DashboardProps> = ({ user, activities, dailyGoal, setCurrentPage }) => {
  const now = new Date();
  const goal = typeof dailyGoal === 'number' && isFinite(dailyGoal) ? dailyGoal : 5.0;

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  const todayActivities = activities.filter(a => new Date(a.date).toDateString() === now.toDateString());

  const totalToday = todayActivities.reduce((sum, a) => sum + a.co2e, 5);
  const ecoPointsToday = todayActivities.reduce((sum, a) => sum + a.ecoPoints, 0);

  const currentStreak = calculateStreak(activities);
  const goalProgress = goal > 0 ? Math.min((totalToday / goal) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 70; // for a radius of 70
  const strokeDashoffset = circumference - (goalProgress / 100) * circumference;

  const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(now, 6 - i);
    const dayActivities = activities.filter(a => new Date(a.date).toDateString() === day.toDateString());
    return {
      name: format(day, 'EEE'),
      date: format(day, 'MMM d'),
      CO2e: dayActivities.reduce((sum, a) => sum + a.co2e, 0),
    };
  });

  const categoryData = Object.values(ActivityCategory).map(category => ({
    name: category,
    value: activities
      .filter(a => a.category === category)
      .reduce((sum, a) => sum + a.co2e, 0),
  })).filter(item => item.value > 0);

  const recentActivities = activities.slice(0, 5);

  const [calcCategory, setCalcCategory] = useState<ActivityCategory>(ActivityCategory.Transportation);
  const [calcType, setCalcType] = useState(activityOptions[calcCategory][0].value);
  const [calcValue, setCalcValue] = useState('');
  const [calcResult, setCalcResult] = useState<{description: string, co2e: number} | null>(null);

  // choose calc function robustly
  const calcFunc = (carbonService as any).calculateTrip ?? (carbonService as any).calculateFootprint;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as ActivityCategory;
    setCalcCategory(newCategory);
    setCalcType(activityOptions[newCategory][0].value);
    setCalcValue('');
    setCalcResult(null);
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcValue || parseFloat(calcValue) <= 0) {
      setCalcResult(null);
      return;
    }
    try {
      if (!calcFunc) throw new Error('Calculation function not available');
      // we need origin/destination; use simple placeholders or user-based values
      const origin = "Origin";
      const destination = "Destination";
      const res = await calcFunc(origin, destination, calcType, user?.id || user?._id || '');
      const trip = res?.trip ?? res;
      setCalcResult({ description: trip?.mode || String(trip), co2e: trip?.co2e ?? 0 });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to calculate footprint (dashboard):', err);
      setCalcResult(null);
    }
  };

  const currentUnit = activityOptions[calcCategory].find(opt => opt.value === calcType)?.unit || '';

  const FeatureCard: React.FC<{ title: string; description: string; img: string; delay: number }> = ({
    title,
    description,
    img,
    delay,
  }) => (
    <div
      className="
        relative rounded-2xl overflow-hidden
        shadow-lg transition-all duration-500 ease-in-out
        transform hover:scale-105 hover:shadow-2xl
        border border-white/20 bg-white/10 backdrop-blur-sm text-left
        min-h-[280px] sm:min-h-[320px] md:min-h-[270px]
        flex flex-col justify-end
      "
      style={{ animationDelay: `${delay}ms` }}
    >
      <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      <div className="relative z-10 p-6 sm:p-8">
        <h3 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">{title}</h3>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* HERO SECTION */}
      <div className="relative h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        <video muted autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-85 brightness-105 contrast-105" src="/videos/drone_videos.mp4" />
          {/* Weather widget pinned to top-right above the video on md+ screens; on small screens render inline below hero to avoid overlap */}
          <div className="hidden md:block absolute top-6 right-6 z-40 w-64 pointer-events-auto">
            <div className="p-0 bg-transparent">
              <WeatherWidget context="header" />
            </div>
          </div>
          {/* Mobile placement: show below hero on small devices to avoid overlapping */}
          <div className="md:hidden px-4 mt-4">
            <div className="w-full">
              <WeatherWidget context="card" />
            </div>
          </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70 dark:from-black/40 dark:to-black/80 z-10"></div>
        <div className="relative z-20 max-w-4xl mx-auto px-4 w-full text-white">
          <div className="space-y-4 animate-pop-in">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">Welcome, {user.name?.split(' ')[0] || 'User'}!</h1>
            <p className="text-lg text-gray-100 max-w-2xl mx-auto drop-shadow-md">
              Track your footprint, get AI-powered insights, and build a sustainable lifestyle. Small changes, big impact.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            <button onClick={()=>setCurrentPage('carbonCalculator')}><FeatureCard img="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1974&auto=format&fit=crop" title="Track Your Footprint" description="Easily log your daily activities to understand your carbon impact." delay={100} /></button>
            <FeatureCard img="https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=2070&auto=format&fit=crop" title="Get AI Coaching" description="Receive personalized tips from our AI Green Coach to reduce emissions." delay={200} />
            <FeatureCard img="\public\videos\Images\Competition_2.jpg" title="Earn & Compete" description="Unlock achievements, earn EcoPoints, and climb the leaderboard." delay={300} />
          </div>

          <div className="mt-8 animate-pop-in" style={{ animationDelay: '400ms' }}>
            <Button onClick={() => setCurrentPage('logActivity')} size="lg" className="w-full max-w-sm mx-auto group">
              <LocationMarkerIcon className="w-5 h-5 mr-2" />
              Start Live Travel Tracking
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDownIcon className="w-8 h-8 text-white/50" />
        </div>
      </div>

      <div className="space-y-8 -mt-10 relative z-30">
        <Card>
          <h2 className="text-xl font-bold mb-6">Daily Progress Hub</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center items-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" className="stroke-current text-slate-200 dark:text-slate-700" strokeWidth="12" fill="transparent"></circle>
                  <circle cx="80" cy="80" r="70" className="stroke-current text-emerald-500 transition-all duration-500 ease-in-out" strokeWidth="12" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className={`text-3xl font-bold ${totalToday > goal ? 'text-red-500' : 'text-green-500'}`}>{totalToday.toFixed(2)}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">kg CO₂e</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-300">Daily Goal</h3>
                    <p className="text-xl font-bold">{goal.toFixed(2)} kg</p>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Edit in Profile</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-300">EcoPoints Today</h3>
                  <p className="text-xl font-bold">{user.ecoPoints}</p>
                </div>
                <EcoPointsIcon className="h-8 w-8 text-emerald-500" />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-300">Current Streak</h3>
                  <p className="text-xl font-bold">{user.streak} {user.streak === 1 ? 'Day' : 'Days'}</p>
                </div>
                <StreakIcon className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </Card>

        <FriendsConnect />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h2 className="font-bold text-xl mb-4">Weekly Performance (kg CO₂e)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg, white)', border: '1px solid #ddd', borderRadius: '0.5rem' }}
                  labelFormatter={(label, payload) => payload?.[0]?.payload.date || label}
                  formatter={(value: number) => [`${value.toFixed(2)} kg CO₂e`, 'CO2e']}
                />
                <Legend />
                <Bar dataKey="CO2e" name="CO2 Emissions" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h2 className="font-bold text-xl mb-4">Emissions by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="var(--card-bg)"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as ActivityCategory]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${Number(value).toFixed(2)} kg`, name]} contentStyle={{ backgroundColor: 'var(--card-bg, white)', border: '1px solid #ddd', borderRadius: '0.5rem' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card>
            <button onClick={() => setIsCalculatorOpen(prev => !prev)} className="w-full flex justify-between items-center group">
              <h2 className="font-bold text-xl flex items-center gap-2"><CalculatorIcon className="w-6 h-6 text-emerald-500" /> Quick Calculator</h2>
              {isCalculatorOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-500" /> : <ChevronDownIcon className="w-5 h-5 text-slate-500" />}
            </button>
            {isCalculatorOpen && (
              <div className="mt-4">
                <form onSubmit={handleCalculate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="calc-category" className="block text-sm font-medium">Category</label>
                      <select id="calc-category" value={calcCategory} onChange={handleCategoryChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                        {Object.values(ActivityCategory).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="calc-type" className="block text-sm font-medium">Type</label>
                      <select id="calc-type" value={calcType} onChange={e => setCalcType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                        {activityOptions[calcCategory].map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="calc-value" className="block text-sm font-medium">Amount ({currentUnit})</label>
                    <input type="number" id="calc-value" value={calcValue} onChange={e => setCalcValue(e.target.value)} placeholder={`Enter ${currentUnit}`} min="0.1" step="0.1" className="mt-1 block w-full px-3 py-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                  </div>
                  <Button type="submit" className="w-full">Calculate</Button>
                </form>
                {calcResult && (
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">{calcResult.description}</p>
                    <p className="text-2xl font-bold">{calcResult.co2e.toFixed(2)} kg CO₂e</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="font-bold text-xl mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map(activity => {
                const Icon = CATEGORY_ICONS[activity.category];
                const isExpanded = expandedActivityId === activity.id;
                return (
                  <div key={activity.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg transition-shadow hover:shadow-md">
                    <button onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)} className="w-full flex items-center p-3 text-left">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS[activity.category]}20`, color: COLORS[activity.category] }}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <p className="font-semibold text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <p className="text-xs">{format(new Date(activity.date), 'MMM d, yyyy')}</p>
                          {activity.notes && <DocumentTextIcon className="w-3 h-3" />}
                          {activity.photo && <CameraIcon className="w-3 h-3" />}
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{activity.co2e.toFixed(2)} kg</p>
                        <p className="text-xs text-green-600 font-semibold">+{activity.ecoPoints}</p>
                      </div>
                      <div className="ml-2">
                        {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-slate-500" /> : <ChevronDownIcon className="w-5 h-5 text-slate-500" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2 animate-pop-in">
                        {activity.photo && <img src={activity.photo} alt="Activity attachment" className="rounded-lg max-h-48 w-full object-cover" />}
                        {activity.notes && <p className="text-sm text-slate-600 dark:text-slate-300"><strong className="font-semibold">Notes:</strong> {activity.notes}</p>}
                        {!activity.photo && !activity.notes && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No details were added for this activity.</p>}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500 py-4">Log an activity to see it here.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

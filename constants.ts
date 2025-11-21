import React from 'react';
import { Activity, ActivityCategory, User, Badge, QuizQuestion, AvatarOptions } from './types';
import { LeafIcon, CarIcon, BoltIcon, ShoppingCartIcon, PlaneIcon, FirstTimerIcon, StreakIcon } from './components/ui/Icons';
import { subDays } from 'date-fns/subDays';
import { formatISO } from 'date-fns/formatISO';
import { startOfDay } from 'date-fns/startOfDay';

// Simplified emission factors (kg CO2e per unit)
export const EMISSION_FACTORS = {
  // Transportation (per km)
  car_petrol: 0.192,
  car_electric: 0.05,
  bus: 0.105,
  train: 0.04,
  flight_short: 0.255,
  bike: 0,
  
  // Energy (per kWh)
  electricity: 0.475,
  
  // Food (per meal)
  meal_vegan: 0.5,
  meal_vegetarian: 1.0,
  meal_meat: 3.0,

  // Goods & Services (per item/purchase)
  electronics: 50,
  fashion: 10,
};

export const activityOptions = {
    [ActivityCategory.Transportation]: [
        { value: 'car_petrol', label: 'Petrol Car', unit: 'km' },
        { value: 'car_electric', label: 'Electric Car', unit: 'km' },
        { value: 'bus', label: 'Bus', unit: 'km' },
        { value: 'train', label: 'Train', unit: 'km' },
        { value: 'flight_short', label: 'Short Flight', unit: 'km' },
        { value: 'bike', label: 'Bicycle / Walk', unit: 'km' },
    ],
    [ActivityCategory.Energy]: [
        { value: 'electricity', label: 'Electricity Usage', unit: 'kWh' },
    ],
    [ActivityCategory.Food]: [
        { value: 'meal_vegan', label: 'Vegan Meal', unit: 'meals' },
        { value: 'meal_vegetarian', label: 'Vegetarian Meal', unit: 'meals' },
        { value: 'meal_meat', label: 'Meat-based Meal', unit: 'meals' },
    ],
    [ActivityCategory.GoodsServices]: [
        { value: 'electronics', label: 'Electronics Purchase', unit: 'items' },
        { value: 'fashion', label: 'Fashion Purchase', unit: 'items' },
    ]
};

export const COLORS = {
  [ActivityCategory.Transportation]: '#3b82f6', // blue-500
  [ActivityCategory.Energy]: '#f59e0b',       // amber-500
  [ActivityCategory.Food]: '#ef4444',         // red-500
  [ActivityCategory.GoodsServices]: '#8b5cf6',// violet-500
};

export const CATEGORY_ICONS = {
  [ActivityCategory.Transportation]: CarIcon,
  [ActivityCategory.Energy]: BoltIcon,
  [ActivityCategory.Food]: LeafIcon,
  [ActivityCategory.GoodsServices]: ShoppingCartIcon,
};

export const sampleActivities: Activity[] = [
  { id: '1', category: ActivityCategory.Transportation, description: 'Drove a petrol car (25 km)', co2e: 4.8, date: formatISO(subDays(new Date(), 1)), ecoPoints: 10 },
  { id: '2', category: ActivityCategory.Food, description: 'Ate 1 vegan meal(s)', co2e: 0.5, date: formatISO(subDays(new Date(), 1)), ecoPoints: 25 },
  { id: '3', category: ActivityCategory.Energy, description: 'Used electricity (10 kWh)', co2e: 4.75, date: formatISO(subDays(new Date(), 2)), ecoPoints: 10 },
  { id: '4', category: ActivityCategory.Transportation, description: 'Cycled (10 km)', co2e: 0, date: formatISO(subDays(new Date(), 2)), ecoPoints: 50 },
  { id: '5', category: ActivityCategory.Food, description: 'Ate 1 meat-based meal(s)', co2e: 3.0, date: formatISO(subDays(new Date(), 3)), ecoPoints: 10 },
  { id: '6', category: ActivityCategory.Transportation, description: 'Took the bus (15 km)', co2e: 1.575, date: formatISO(subDays(new Date(), 4)), ecoPoints: 10 },
];


export const badges: Badge[] = [
  { id: 'first_log', name: 'First Timer', description: 'Log your first activity', icon: FirstTimerIcon, isUnlocked: (activities) => activities.length > 0 },
  { id: 'eco_commuter', name: 'Eco-Commuter', description: 'Log a zero-emission commute', icon: CarIcon, isUnlocked: (activities) => activities.some(a => a.category === ActivityCategory.Transportation && a.co2e === 0) },
  { id: 'plant_power', name: 'Plant Power', description: 'Log a vegan meal', icon: LeafIcon, isUnlocked: (activities) => activities.some(a => a.description.includes('vegan')) },
  { id: 'energy_saver', name: 'Energy Saver', description: 'Log an energy usage under 5 kWh', icon: BoltIcon, isUnlocked: (activities) => activities.some(a => a.category === ActivityCategory.Energy && a.co2e < (5 * EMISSION_FACTORS.electricity)) },
  { id: 'conscious_consumer', name: 'Conscious Consumer', description: 'Log 5+ activities in Goods & Services', icon: ShoppingCartIcon, isUnlocked: (activities) => activities.filter(a => a.category === ActivityCategory.GoodsServices).length >= 5 },
  { id: 'flight_free', name: 'Flight Free', description: 'Log 10 transport activities without flying', icon: PlaneIcon, isUnlocked: (activities) => {
      const transport = activities.filter(a => a.category === ActivityCategory.Transportation);
      return transport.length >= 10 && !transport.some(a => a.description.includes('flight'));
  }},
  { id: 'streak_starter', name: 'Streak Starter', description: 'Achieve a 3-day logging streak', icon: StreakIcon, isUnlocked: (activities) => {
      if (activities.length < 3) return false;
      const uniqueDays = [...new Set(activities.map(a => startOfDay(new Date(a.date)).getTime()))].sort((a,b) => b-a);
      if (uniqueDays.length < 3) return false;
      return uniqueDays[0] - uniqueDays[1] === 86400000 && uniqueDays[1] - uniqueDays[2] === 86400000;
  }},
];

export const quizQuestions: QuizQuestion[] = [
    { question: "Which of the following is a major source of methane, a potent greenhouse gas?", options: ["Deforestation", "Livestock farming", "Burning fossil fuels", "Ocean acidification"], correctAnswerIndex: 1, explanation: "Livestock, particularly cattle, produce significant amounts of methane through their digestive processes. Methane is over 25 times more potent than CO2 at trapping heat in the atmosphere." },
    { question: "What does 'vampire power' or 'phantom load' refer to?", options: ["Energy from solar panels at night", "Geothermal energy", "Electricity consumed by devices when they are off or in standby", "Power generated by tidal forces"], correctAnswerIndex: 2, explanation: "Many electronics continue to draw a small amount of power even when turned off. Unplugging them or using a power strip can save a surprising amount of energy." },
    { question: "Which type of light bulb is the most energy-efficient?", options: ["Incandescent", "Halogen", "Compact Fluorescent (CFL)", "Light Emitting Diode (LED)"], correctAnswerIndex: 3, explanation: "LEDs use up to 90% less energy and last up to 25 times longer than traditional incandescent bulbs, making them the most eco-friendly lighting option." },
    { question: "What is the single most effective action an individual can take to reduce their food-related carbon footprint?", options: ["Eating only organic food", "Buying local produce", "Reducing food waste", "Avoiding plastic packaging"], correctAnswerIndex: 2, explanation: "About one-third of all food produced globally is wasted. Reducing food waste saves the energy and resources used to produce it and prevents methane emissions from landfills." },
    { question: "Which mode of transportation generally has the lowest carbon footprint per passenger-kilometer?", options: ["Electric Car (average grid)", "Bus", "Train", "Short-haul flight"], correctAnswerIndex: 2, explanation: "Trains, especially electric ones, are highly efficient at moving many people at once, resulting in a very low carbon footprint per person compared to cars or planes." },
];

export const avatarCustomizationOptions = {
  hair: ['fonze', 'mrT', 'doug', 'mrClean', 'dannyPhantom', 'full', 'turban', 'pixie'],
  hairColor: ['6a4e35', '77311d', '3eac2c', 'd6b370', 'e5d7a3', '000000', '4a4a4a', 'ffffff'],
  skinColor: ['f2d3b1', 'd2b48c', 'c68642', 'a0522d', '8d5524', '614335'],
  eyes: ['eyes', 'eyesShadow', 'round', 'smiling'],
  mouths: ['laughing', 'pucker', 'smile', 'smirk', 'surprised'],
  shirt: ['open', 'collared', 'crew'],
  clothingColor: ['546e7a', 'ff5722', 'fdd835', '4caf50', '2196f3', '673ab7'],
  glasses: ['square', 'round'],
  earrings: ['hoop'],
  facialHair: ['beard', 'scruff'],
};

export const currentUser: User = {
  id: 'user_0',
  name: 'Alex Green',
  avatarOptions: {
    seed: 'Alex Green',
    hair: ['doug'],
    hairColor: ['6a4e35'],
    skinColor: ['f2d3b1'],
    eyes: ['smiling'],
    mouth: ['smile'],
    earrings: ['hoop'],
    earringsProbability: 0,
    glasses: ['square'],
    glassesProbability: 0,
    facialHair: ['scruff'],
    facialHairProbability: 100,
    baseColor: ['546e7a'],
    shirt: ['open'],
  },
  ecoPoints: 7520,
  streak: 5,
};

export const leaderboardData: User[] = [
  currentUser,
  { id: 'user_1', name: 'Brenda Solar', ecoPoints: 9850, streak: 12, avatarOptions: { seed: 'Brenda Solar', hair: ['pixie'], hairColor: ['000000'], skinColor: ['d2b48c'], eyes: ['eyes'], mouth: ['smile'], earrings: ['hoop'], earringsProbability: 100, glasses: ['square'], glassesProbability: 0, facialHair: ['beard'], facialHairProbability: 0, baseColor: ['ff5722'], shirt: ['collared'] } },
  { id: 'user_2', name: 'Charles River', ecoPoints: 8900, streak: 8, avatarOptions: { seed: 'Charles River', hair: ['mrT'], hairColor: ['4a4a4a'], skinColor: ['a0522d'], eyes: ['round'], mouth: ['laughing'], earrings: ['hoop'], earringsProbability: 0, glasses: ['round'], glassesProbability: 100, facialHair: ['beard'], facialHairProbability: 100, baseColor: ['fdd835'], shirt: ['crew'] } },
  { id: 'user_3', name: 'Diana Forest', ecoPoints: 8100, streak: 3, avatarOptions: { seed: 'Diana Forest', hair: ['full'], hairColor: ['e5d7a3'], skinColor: ['c68642'], eyes: ['smiling'], mouth: ['pucker'], earrings: ['hoop'], earringsProbability: 100, glasses: ['square'], glassesProbability: 100, facialHair: ['scruff'], facialHairProbability: 0, baseColor: ['4caf50'], shirt: ['open'] } },
  { id: 'user_4', name: 'Ethan Stone', ecoPoints: 6300, streak: 0, avatarOptions: { seed: 'Ethan Stone', hair: ['mrClean'], hairColor: ['ffffff'], skinColor: ['8d5524'], eyes: ['eyesShadow'], mouth: ['smirk'], earrings: ['hoop'], earringsProbability: 0, glasses: ['square'], glassesProbability: 0, facialHair: ['beard'], facialHairProbability: 0, baseColor: ['2196f3'], shirt: ['collared'] } },
];

export const friendsData: User[] = [
  { id: 'user_1', name: 'Brenda S.', ecoPoints: 9850, streak: 12, avatarOptions: { seed: 'Brenda Solar', hair: ['pixie'], hairColor: ['000000'], skinColor: ['d2b48c'], eyes: ['eyes'], mouth: ['smile'], earrings: ['hoop'], earringsProbability: 100, glasses: ['square'], glassesProbability: 0, facialHair: ['beard'], facialHairProbability: 0, baseColor: ['ff5722'], shirt: ['collared'] } },
  { id: 'user_2', name: 'Charles R.', ecoPoints: 8900, streak: 8, avatarOptions: { seed: 'Charles River', hair: ['mrT'], hairColor: ['4a4a4a'], skinColor: ['a0522d'], eyes: ['round'], mouth: ['laughing'], earrings: ['hoop'], earringsProbability: 0, glasses: ['round'], glassesProbability: 100, facialHair: ['beard'], facialHairProbability: 100, baseColor: ['fdd835'], shirt: ['crew'] } },
  { id: 'user_3', name: 'Diana F.', ecoPoints: 8100, streak: 3, avatarOptions: { seed: 'Diana Forest', hair: ['full'], hairColor: ['e5d7a3'], skinColor: ['c68642'], eyes: ['smiling'], mouth: ['pucker'], earrings: ['hoop'], earringsProbability: 100, glasses: ['square'], glassesProbability: 100, facialHair: ['scruff'], facialHairProbability: 0, baseColor: ['4caf50'], shirt: ['open'] } },
  { id: 'user_4', name: 'Ethan S.', ecoPoints: 6300, streak: 0, avatarOptions: { seed: 'Ethan Stone', hair: ['mrClean'], hairColor: ['ffffff'], skinColor: ['8d5524'], eyes: ['eyesShadow'], mouth: ['smirk'], earrings: ['hoop'], earringsProbability: 0, glasses: ['square'], glassesProbability: 0, facialHair: ['beard'], facialHairProbability: 0, baseColor: ['2196f3'], shirt: ['collared'] } },
  { id: 'user_5', name: 'Fiona W.', ecoPoints: 5500, streak: 21, avatarOptions: { seed: 'Fiona Wave', hair: ['dannyPhantom'], hairColor: ['3eac2c'], skinColor: ['f2d3b1'], eyes: ['round'], mouth: ['surprised'], earrings: ['hoop'], earringsProbability: 0, glasses: ['round'], glassesProbability: 0, facialHair: ['beard'], facialHairProbability: 0, baseColor: ['673ab7'], shirt: ['crew'] } },
  { id: 'user_6', name: 'George M.', ecoPoints: 4200, streak: 1, avatarOptions: { seed: 'George Mountain', hair: ['fonze'], hairColor: ['77311d'], skinColor: ['d2b48c'], eyes: ['eyes'], mouth: ['smirk'], earrings: ['hoop'], earringsProbability: 100, glasses: ['square'], glassesProbability: 100, facialHair: ['scruff'], facialHairProbability: 100, baseColor: ['546e7a'], shirt: ['open'] } },
];

// Fetch leaderboard from backend; fallback to static data
export async function fetchLeaderboard(): Promise<User[]> {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    const data = await res.json();
    // Ensure shape - map backend fields to User where necessary
    return (data || []).map((u: any) => ({
      id: u.id || u._id,
      name: u.name || 'Unknown',
      avatarOptions: u.avatarOptions || { seed: u.name || 'anon' },
      ecoPoints: typeof u.ecoPoints === 'number' ? u.ecoPoints : 0,
      streak: typeof u.streak === 'number' ? u.streak : 0,
      // Keep other optional fields if present
      ...(u.totalCarbon !== undefined ? { totalCarbon: u.totalCarbon } : {}),
      ...(u.email ? { email: u.email } : {}),
    }));
  } catch (err) {
    console.warn('fetchLeaderboard failed, using static leaderboardData', err);
    return leaderboardData;
  }
}
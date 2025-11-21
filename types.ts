import React from 'react';

export type Page = 'dashboard' | 'logActivity' | 'achievements' | 'leaderboard' | 'resources' | 'game' | 'tripPlanner' | 'profile' | 'carbonCalculator';

export enum ActivityCategory {
  Transportation = 'Transportation',
  Energy = 'Energy',
  Food = 'Food',
  GoodsServices = 'Goods & Services',
}

export interface Activity {
  id: string;
  category: ActivityCategory;
  description: string;
  co2e: number; // in kg
  date: string; // ISO string
  ecoPoints: number;
  notes?: string;
  photo?: string;
}

export interface AvatarOptions {
  seed: string;
  hair: string[];
  hairColor: string[];
  skinColor: string[];
  eyes: string[];
  mouth: string[];
  earrings: string[];
  earringsProbability: number;
  glasses: string[];
  glassesProbability: number;
  facialHair: string[];
  facialHairProbability: number;
  baseColor: string[]; // for shirt
  shirt: string[];
}


export interface User {
  id:string;
  name: string;
  avatarOptions: AvatarOptions;
  ecoPoints: number;
  streak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{className?: string}>;
  isUnlocked: (activities: Activity[]) => boolean;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: WeatherIconType;
  location: string;
}

export type WeatherIconType = 'sunny' | 'cloudy' | 'partly-cloudy' | 'rainy';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface TripCalculation {
    mode: string;
    distance: number;
    co2e: number;
    type: string;
    icon: React.FC<{className?: string}>;
    time?: string;
    cost?: string;
}
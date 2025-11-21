// Shared types between frontend and backend
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  location?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    location?: string;
    ecoPoints: number;
    streak: number;
    totalCarbon?: number;
    lastActivityAt?: string | Date;
    avatarOptions?: {
      seed: string;
      style?: string;
      mood?: string;
      color?: string;
    };
  };
}

export interface Activity {
  id: string;
  category: 'Transportation' | 'Energy' | 'Food' | 'GoodsServices';
  type: string;
  co2e: number;
  description: string;
  date: string;
  ecoPoints: number;
  userId?: string;
}

export interface TripCalculation {
  mode: string;
  distance: number;
  co2e: number;
  type: string;
  time?: string;
  cost?: string;
}

export interface TripPlannerRequest {
  origin: string;
  destination: string;
  mode: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  userId?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  location?: string;
  avatarOptions?: {
    seed?: string;
    style?: string;
    mood?: string;
    color?: string;
  };
}
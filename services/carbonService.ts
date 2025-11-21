// src/services/carbonService.ts

interface TripCalculationResponse {
  message?: string;
  trip?: any;
}

export const calculateFootprint = async (
  origin: string,
  destination: string,
  mode: string,
  userId: string
): Promise<TripCalculationResponse> => {
  const response = await fetch("http://localhost:4000/api/trips/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ origin, destination, mode, userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to calculate and save trip");
  }

  return response.json();
};

export const getTripsForUser = async (userId: string): Promise<any[]> => {
  const response = await fetch(
    `http://localhost:4000/api/trips/user/${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch user trips");
  }
  return response.json();
};

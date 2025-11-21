export const EMISSION_FACTORS = {
  // Transportation (kg CO2e per km)
  car_petrol: 0.192,
  car_electric: 0.053,
  bus: 0.082,
  train: 0.041,
  flight_short: 0.255,
  bike: 0,

  // Energy (kg CO2e per kWh)
  electricity: 0.233,

  // Food (kg CO2e per meal)
  meal_vegan: 0.5,
  meal_vegetarian: 1.7,
  meal_meat: 3.3,

  // Goods & Services (kg CO2e per item)
  electronics: 100,
  fashion: 10
} as const;
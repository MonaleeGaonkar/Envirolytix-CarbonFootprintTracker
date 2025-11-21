import { EMISSION_FACTORS } from './constants';

export const calculateFootprint = (
  category: 'Transportation' | 'Energy' | 'Food' | 'GoodsServices',
  type: string,
  value: number
): { co2e: number; description: string } => {
  let co2e = 0;
  let description = '';

  switch (category) {
    case 'Transportation':
      const distance = Number(value);
      if (isNaN(distance) || distance < 0) {
        return { co2e: 0, description: `Invalid transportation distance` };
      }

      switch (type) {
        case 'car_petrol':
          co2e = distance * EMISSION_FACTORS.car_petrol;
          description = `Drove a petrol car (${distance} km)`;
          break;
        case 'car_electric':
          co2e = distance * EMISSION_FACTORS.car_electric;
          description = `Drove an electric car (${distance} km)`;
          break;
        case 'bus':
          co2e = distance * EMISSION_FACTORS.bus;
          description = `Took the bus (${distance} km)`;
          break;
        case 'train':
          co2e = distance * EMISSION_FACTORS.train;
          description = `Train journey (${distance} km)`;
          break;
        case 'flight_short':
          co2e = distance * EMISSION_FACTORS.flight_short;
          description = `Short-haul flight (${distance} km)`;
          break;
        default:
          description = `Unknown transportation (${distance} km)`;
          break;
      }
      break;

    case 'Energy':
      const kwh = value;
      switch (type) {
        case 'electricity':
          co2e = kwh * EMISSION_FACTORS.electricity;
          description = `Used electricity (${kwh} kWh)`;
          break;
      }
      break;
    
    case 'Food':
      const meals = value;
      switch (type) {
        case 'meal_vegan':
          co2e = meals * EMISSION_FACTORS.meal_vegan;
          description = `Ate ${meals} vegan meal(s)`;
          break;
        case 'meal_vegetarian':
          co2e = meals * EMISSION_FACTORS.meal_vegetarian;
          description = `Ate ${meals} vegetarian meal(s)`;
          break;
        case 'meal_meat':
          co2e = meals * EMISSION_FACTORS.meal_meat;
          description = `Ate ${meals} meat-based meal(s)`;
          break;
      }
      break;

    case 'GoodsServices':
      const items = value;
      switch (type) {
        case 'electronics':
          co2e = items * EMISSION_FACTORS.electronics;
          description = `Purchased ${items} electronic item(s)`;
          break;
        case 'fashion':
          co2e = items * EMISSION_FACTORS.fashion;
          description = `Purchased ${items} fashion item(s)`;
          break;
      }
      break;
  }

  if (isNaN(co2e)) {
    co2e = 0;
  }

  return { description, co2e };
};
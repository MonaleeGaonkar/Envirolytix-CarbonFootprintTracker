// import { WeatherData } from '../types';

// export const getWeather = async (): Promise<WeatherData> => {
//     const response = await fetch('/api/weather');
    
//     if (!response.ok) {
//         throw new Error('Failed to fetch weather data');
//     }

//     return response.json();
// };
import { WeatherData } from '../types';

// Fallback mock data in case API fails
const mockWeatherData: WeatherData[] = [
    {
        temperature: 5,
        condition: "Chilly & Clear",
        icon: 'sunny',
        location: 'London, UK'
    },
    {
        temperature: 28,
        condition: "Hot & Sunny",
        icon: 'sunny',
        location: 'London, UK'
    },
    {
        temperature: 12,
        condition: "Rainy Day",
        icon: 'rainy',
        location: 'London, UK'
    },
    {
        temperature: 18,
        condition: "Partly Cloudy",
        icon: 'partly-cloudy',
        location: 'London, UK'
    },
    {
        temperature: 15,
        condition: "Cloudy & Overcast",
        icon: 'cloudy',
        location: 'London, UK'
    }
];

// Map WMO weather codes to your icon types
// https://open-meteo.com/en/docs
const mapWeatherCodeToIcon = (code: number): 'sunny' | 'rainy' | 'cloudy' | 'partly-cloudy' => {
    if (code === 0) return 'sunny'; // Clear sky
    if (code === 1 || code === 2) return 'partly-cloudy'; // Mainly clear, partly cloudy
    if (code === 3) return 'cloudy'; // Overcast
    if (code >= 45 && code <= 48) return 'cloudy'; // Fog
    if (code >= 51 && code <= 67) return 'rainy'; // Drizzle and rain
    if (code >= 71 && code <= 77) return 'cloudy'; // Snow
    if (code >= 80 && code <= 99) return 'rainy'; // Rain showers and thunderstorms
    return 'sunny';
};

// Map WMO weather codes to condition descriptions
const mapWeatherCodeToCondition = (code: number): string => {
    const conditions: { [key: number]: string } = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Slight Snow',
        73: 'Moderate Snow',
        75: 'Heavy Snow',
        80: 'Rain Showers',
        81: 'Moderate Rain Showers',
        82: 'Heavy Rain Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Hail',
        99: 'Thunderstorm with Hail'
    };
    return conditions[code] || 'Unknown';
};

// Get user's geolocation
const getUserLocation = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                timeout: 10000,
                maximumAge: 300000 // Cache for 5 minutes
            }
        );
    });
};

// Get city name from coordinates using reverse geocoding
const getCityName = async (lat: number, lon: number): Promise<string> => {
    try {
        // Use BigDataCloud's free reverse geocoding API (no CORS issues, no API key needed)
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            
            const city = data.city || data.locality || data.principalSubdivision || 'Unknown';
            const state = data.principalSubdivision || '';
            const country = data.countryCode || '';
            
            // Format: City, State, Country
            if (state && state !== city) {
                return country ? `${city}, ${state}, ${country}` : `${city}, ${state}`;
            }
            return country ? `${city}, ${country}` : city;
        }
        
        return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    } catch (error) {
        console.error('Error fetching city name:', error);
        return `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    }
};

// Fetch weather data from Open-Meteo API (no API key needed!)
const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
    // Fetch weather and location data in parallel
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather data');
    }
    
    const weatherData = await weatherResponse.json();
    
    // Try to get city name, but don't wait too long
    let location = 'Unknown Location';
    try {
        const timeoutPromise = new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        location = await Promise.race([getCityName(lat, lon), timeoutPromise]);
    } catch (error) {
        console.error('Could not fetch location name:', error);
        location = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    }
    
    return {
        temperature: Math.round(weatherData.current.temperature_2m),
        condition: mapWeatherCodeToCondition(weatherData.current.weather_code),
        icon: mapWeatherCodeToIcon(weatherData.current.weather_code),
        location: location
    };
};

// Main function to get weather
export const getWeather = async (): Promise<WeatherData> => {
    try {
        // Get user's location
        const location = await getUserLocation();
        
        // Fetch real weather data
        const weatherData = await fetchWeatherData(location.lat, location.lon);
        
        return weatherData;
    } catch (error) {
        console.error('Error fetching weather:', error);
        
        // Fallback to mock data if anything fails
        return mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
    }
};

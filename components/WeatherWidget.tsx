import React, { useState, useEffect } from 'react';
import { getWeather } from '../services/weatherService';
import { generateWeatherInsight } from '../services/geminiService';
import { WeatherData, WeatherIconType } from '../types';
import { SunIcon, CloudIcon, RainIcon, SparklesIcon } from './ui/Icons';

const WeatherIcon: React.FC<{ icon: WeatherIconType, className?: string }> = ({ icon, className }) => {
    switch (icon) {
        case 'sunny':
            return <SunIcon className={className} />;
        case 'cloudy':
            return <CloudIcon className={className} />;
        case 'partly-cloudy': // For simplicity, using cloud icon for partly cloudy too
            return <CloudIcon className={className} />;
        case 'rainy':
            return <RainIcon className={className} />;
        default:
            return <CloudIcon className={className} />;
    }
};

interface WeatherWidgetProps {
    context?: 'card' | 'header';
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ context = 'card' }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const isHeader = context === 'header';

    useEffect(() => {
        const fetchWeatherAndInsight = async () => {
            try {
                setIsLoading(true);
                const weatherData = await getWeather();
                setWeather(weatherData);

                let streamedText = '';
                const insightStream = generateWeatherInsight(weatherData);
                for await (const chunk of insightStream) {
                    streamedText += chunk;
                    setInsight(streamedText);
                }
            } catch (error) {
                console.error("Failed to load weather data or insight:", error);
                setInsight("Could not load a tip at this time.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeatherAndInsight();
    }, []);

    if (isLoading && !weather) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <div className={`animate-pulse flex items-center gap-4 ${isHeader ? 'text-white' : ''}`}>
                    <div className={`w-12 h-12 rounded-full ${isHeader ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    <div className="flex-1">
                        <div className={`h-4 rounded-full w-24 mb-2 ${isHeader ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        <div className={`w-16 h-3 rounded-full ${isHeader ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!weather) {
         return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <p className={isHeader ? 'text-white' : ''}>Could not load weather data.</p>
            </div>
        );
    }


    return (
        <div className={`flex w-full h-full p-2 gap-3 ${isHeader ? 'flex-col items-start' : 'flex-col justify-around'}`}>
            {/* Weather Info */}
            <div className="flex flex-shrink-0 items-center gap-2 text-left">
                <div className={isHeader ? 'text-white' : 'text-sky-500'}>
                    <WeatherIcon icon={weather.icon} className={isHeader ? "w-12 h-12" : "w-14 h-14"} />
                </div>
                <div className={isHeader ? 'text-white' : ''}>
                    <p className={`font-semibold text-xs ${isHeader ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{weather.location}</p>
                    <p className={`font-bold ${isHeader ? 'text-3xl' : 'text-6xl'}`}>
    {weather.temperature}°C
</p>

                    <p className={`text-xs ${isHeader ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>{weather.condition}</p>
                </div>
            </div>

            {/* Divider */}
            <div className={`${isHeader ? 'w-full h-px bg-white/20' : 'w-full h-px bg-slate-200 dark:bg-slate-700'}`}></div>

            {/* AI Tip */}
            {/* <div className="flex items-start gap-2 flex-1 min-w-0">
                <SparklesIcon className={`flex-shrink-0 mt-0.5 ${isHeader ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-500`} />
                <p className={`text-left ${isHeader ? 'text-xs text-slate-200' : 'text-sm text-slate-700 dark:text-slate-300'}`}>
                   {insight || <span className="loading-ellipsis">Generating tip</span>}
                </p>
            </div> */}
        </div>
    );
};

export default WeatherWidget;
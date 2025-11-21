import { ChatMessage, Activity, Badge, ActivityCategory, WeatherData, TripCalculation } from "../types";

const summarizeActivities = (activities: Activity[], unlockedBadges: Badge[], dailyGoal: number): string => {
    // Safeguard against non-numeric dailyGoal values
    const goal = typeof dailyGoal === 'number' && isFinite(dailyGoal) ? dailyGoal : 5.0;

    if (activities.length === 0) {
        return `The user has not logged any activities yet. Their daily goal is ${goal.toFixed(2)} kg CO2e.`;
    }

    const summary: string[] = [];
    const totalsByCategory: Record<ActivityCategory, number> = {
        [ActivityCategory.Transportation]: 0,
        [ActivityCategory.Energy]: 0,
        [ActivityCategory.Food]: 0,
        [ActivityCategory.GoodsServices]: 0,
    };
    
    const totalToday = activities
        .filter(a => new Date(a.date).toDateString() === new Date().toDateString())
        .reduce((sum, a) => sum + a.co2e, 0);

    summary.push(`User's daily emissions goal: ${goal.toFixed(2)} kg CO2e. Today's total: ${totalToday.toFixed(2)} kg CO2e.`);
    if (totalToday > goal) {
        summary.push(`They have exceeded their goal for today.`);
    } else {
        summary.push(`They are on track to meet their goal.`);
    }


    let zeroEmissionActivities = 0;
    activities.forEach(a => {
        totalsByCategory[a.category] += a.co2e;
        if (a.co2e === 0) {
            zeroEmissionActivities++;
        }
    });

    const sortedCategories = Object.entries(totalsByCategory).sort(([, a], [, b]) => b - a);
    
    summary.push(`Highest emissions are from ${sortedCategories[0][0]} (${sortedCategories[0][1].toFixed(2)} kg CO2e).`);
    if (sortedCategories[1][1] > 0) {
        summary.push(`Next highest is ${sortedCategories[1][0]} (${sortedCategories[1][1].toFixed(2)} kg CO2e).`);
    }

    if (zeroEmissionActivities > 0) {
        summary.push(`User has logged ${zeroEmissionActivities} zero-emission activities. Great job!`);
    }

    if (unlockedBadges.length > 0) {
        summary.push(`Unlocked badges: ${unlockedBadges.map(b => b.name).join(', ')}.`);
    } else {
        summary.push("No badges unlocked yet.");
    }

    return summary.join(' ');
};

export async function createChatSession(activities: Activity[], unlockedBadges: Badge[], dailyGoal: number) {
    const activitySummary = summarizeActivities(activities, unlockedBadges, dailyGoal);
    
    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            activities,
            unlockedBadges,
            dailyGoal,
            message: `Initialize chat with activity summary: ${activitySummary}`
        })
    });

    if (!response.ok) {
        throw new Error('Failed to initialize chat session');
    }

    return { ready: true };
}

export async function* streamChatResponse(chat: any, message: string): AsyncGenerator<string> {
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const data = await response.json();
        yield data.reply;
    } catch (error) {
        console.error("Chat error:", error);
        yield "I'm sorry, I'm having trouble connecting. Please try again later.";
    }
}

export async function* generateProactiveTip(activities: Activity[], unlockedBadges: Badge[], dailyGoal: number): AsyncGenerator<string> {
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activities,
                unlockedBadges,
                dailyGoal,
                message: 'Generate a proactive tip based on my recent activity.'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate tip');
        }

        const data = await response.json();
        yield data.reply;
    } catch (error) {
        console.error("Failed to generate tip:", error);
        yield "I'm sorry, I'm having trouble generating a tip. Please try again later.";
    }
}

export async function* generateWeatherInsight(weather: WeatherData): AsyncGenerator<string> {
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Generate a weather-based eco tip for: ${weather.condition}, ${weather.temperature}°C`,
                weatherData: weather
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate weather insight');
        }

        const data = await response.json();
        yield data.reply;
    } catch (error) {
        console.error("Failed to generate weather insight:", error);
        yield "I'm sorry, I'm having trouble generating a weather tip. Please try again later.";
    }
}

export async function* generateTripSuggestion(originalTrip: TripCalculation, allOptions: TripCalculation[]): AsyncGenerator<string> {
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Generate trip suggestion',
                tripData: {
                    originalTrip,
                    allOptions
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate trip suggestion');
        }

        const data = await response.json();
        yield data.reply;
    } catch (error) {
        console.error("Failed to generate trip suggestion:", error);
        yield "I'm sorry, I'm having trouble generating a suggestion. Please try again later.";
    }
}
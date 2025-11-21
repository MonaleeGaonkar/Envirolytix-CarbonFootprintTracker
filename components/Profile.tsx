import React, { useState } from 'react';
import { User, Activity, AvatarOptions } from '../types';
import { badges } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';
import { PencilIcon, CheckCircleIcon, EcoPointsIcon, LogIcon, AchievementIcon, TargetIcon, XCircleIcon } from './ui/Icons';
import Avatar from './Avatar';
import AvatarCustomizer from './AvatarCustomizer';

interface ProfileProps {
    user: User;
    onUpdateUser: (updatedUser: Partial<User>) => void;
    dailyGoal: number;
    onGoalChange: (newGoal: number) => void;
    activities: Activity[];
}

const StatCard: React.FC<{ icon: React.FC<{className?:string}>, label: string, value: string | number, colorClasses: string }> = ({ icon: Icon, label, value, colorClasses }) => (
    <Card className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClasses}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </Card>
);

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, dailyGoal, onGoalChange, activities }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState<string>(user.name ?? '');
    
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [goal, setGoal] = useState(dailyGoal.toString());

    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    const unlockedBadgesCount = badges.filter(b => b.isUnlocked(activities)).length;

    const handleNameSave = () => {
        if (name.trim()) {
            onUpdateUser({ name: name.trim(), avatarOptions: { ...user.avatarOptions, seed: name.trim() } });
            setIsEditingName(false);
        }
    };

    const handleGoalSave = () => {
        const goalValue = parseFloat(goal);
        if (!isNaN(goalValue) && goalValue > 0) {
            onGoalChange(goalValue);
            setIsEditingGoal(false);
        } else {
            alert("Please enter a valid positive number for your goal.");
        }
    };

    const handleAvatarSave = (newOptions: AvatarOptions) => {
        onUpdateUser({ avatarOptions: newOptions });
    };
    return (
        <div className="max-w-4xl mx-auto space-y-8">
             {isCustomizerOpen && (
                <AvatarCustomizer 
                    options={user.avatarOptions}
                    onSave={handleAvatarSave}
                    onClose={() => setIsCustomizerOpen(false)}
                />
            )}
            <div className="text-center">
                <h1 className="text-4xl font-bold">Your Profile</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your info and track your overall progress.</p>
            </div>
            
            <Card className="flex flex-col sm:flex-row items-center gap-6 p-8">
                 <div className="relative flex-shrink-0">
                    <Avatar
  key={JSON.stringify(user.avatarOptions)} // forces re-render when options change
  avatarOptions={user.avatarOptions ?? undefined}
  className="w-24 h-24 rounded-full border-4 border-emerald-500 shadow-lg"

/>

                    <button 
                        onClick={() => setIsCustomizerOpen(true)} 
                        className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-700 rounded-full p-1.5 shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 transition ring-2 ring-white dark:ring-slate-800"
                        aria-label="Edit Avatar"
                    >
                        <PencilIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/>
                    </button>
                </div>

                <div className="flex-1 text-center sm:text-left">
                    {isEditingName ? (
                         <form onSubmit={(e) => { e.preventDefault(); handleNameSave(); }} className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full px-3 py-2 text-2xl font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoFocus
                            />
                            <Button type="submit" size="sm" aria-label="Save name"><CheckCircleIcon className="w-5 h-5"/></Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => { setIsEditingName(false); setName(user.name ?? ''); }} aria-label="Cancel name edit"><XCircleIcon className="w-5 h-5"/></Button>
                        </form>
                    ) : (
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                            <h2 className="text-3xl font-bold">{user.name}</h2>
                            <Button onClick={() => setIsEditingName(true)} variant="ghost" size="sm" className="p-1" aria-label="Edit name"><PencilIcon className="w-5 h-5 text-slate-500"/></Button>
                        </div>
                    )}
                    <p className="text-slate-500 dark:text-slate-400">Eco-Warrior</p>
                </div>
            </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={EcoPointsIcon} label="Total EcoPoints" value={(user.ecoPoints ?? 0).toLocaleString()} colorClasses="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500" />
                <StatCard icon={LogIcon} label="Activities Logged" value={activities.length} colorClasses="bg-sky-100 dark:bg-sky-900/50 text-sky-500" />
                <StatCard icon={AchievementIcon} label="Badges Unlocked" value={`${unlockedBadgesCount} / ${badges.length}`} colorClasses="bg-amber-100 dark:bg-amber-900/50 text-amber-500" />
            </div>            <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><TargetIcon className="w-6 h-6 text-emerald-500"/> Your Daily Goal</h3>
                 {isEditingGoal ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleGoalSave(); }} className="space-y-2">
                    <label htmlFor="daily-goal-input" className="font-semibold text-sm">Set Your Daily Goal (kg CO₂e)</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="daily-goal-input"
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="block w-full px-3 py-2 text-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                        step="0.1"
                        min="0.1"
                      />
                      <Button type="submit">Save Goal</Button>
                      <Button onClick={() => { setIsEditingGoal(false); setGoal(dailyGoal.toString()); }} variant="secondary" type="button">Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                        <p className="text-3xl font-bold">{dailyGoal.toFixed(2)} <span className="text-lg font-normal text-slate-500 dark:text-slate-400">kg CO₂e</span></p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">This is your daily target for carbon emissions.</p>
                    </div>
                        <Button onClick={() => setIsEditingGoal(true)} variant="secondary">
                          <PencilIcon className="w-4 h-4 mr-2" />
                          Edit Goal
                      </Button>
                  </div>
                )}
            </Card>
        </div>
    );
};

export default Profile;
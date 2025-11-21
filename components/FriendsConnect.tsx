import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Avatar from './Avatar';
import { User } from '../types';
import { friendsData } from '../constants';
import { StreakIcon, WaveIcon, UserPlusIcon } from './ui/Icons';

const FriendCard: React.FC<{ friend: User }> = ({ friend }) => {
    const handleNudge = () => {
        alert(`You've nudged ${friend.name}! Keep motivating each other.`);
    };

    return (
        <div className="flex-shrink-0 w-32 flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-600">
            <Avatar avatarOptions={friend.avatarOptions} className="w-14 h-14 rounded-full" />
            <p className="text-sm font-semibold truncate w-full">{friend.name}</p>
            <div className="flex items-center gap-1 text-sm text-orange-500">
                <StreakIcon className="w-4 h-4" />
                <span className="font-bold">{friend.streak}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={handleNudge} className="!px-2 !py-1">
                <WaveIcon className="w-4 h-4 mr-1" /> Nudge
            </Button>
        </div>
    );
};

const AddFriendCard: React.FC = () => (
    <div className="flex-shrink-0 w-32 flex flex-col items-center justify-center text-center p-4 bg-transparent border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
        <button className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            <UserPlusIcon className="w-8 h-8"/>
            <span className="text-sm font-semibold">Find Friends</span>
        </button>
    </div>
);

const FriendsConnect: React.FC = () => {
    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">EcoFriends Streaks</h2>
            <div className="flex items-center space-x-4 overflow-x-auto pb-4 -mb-4">
                {friendsData.map(friend => (
                    <FriendCard key={friend.id} friend={friend} />
                ))}
                <AddFriendCard />
            </div>
        </Card>
    );
};

export default FriendsConnect;
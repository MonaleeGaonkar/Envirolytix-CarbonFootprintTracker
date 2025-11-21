import React, { useState } from 'react';
import { User } from '../types';
import Card from './ui/Card';
import Avatar from './Avatar';

interface LeaderboardProps {
  user: User;
  leaderboardData: User[];
  setLeaderboardData?: (data: User[]) => void;
  showToast?: (msg: string) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ user: currentUser, leaderboardData, setLeaderboardData, showToast }) => {
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!setLeaderboardData) return;
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      const normalized: User[] = (data || []).map((u: any) => ({
        id: u.id || u._id,
        name: u.name || 'Unknown',
        avatarOptions: u.avatarOptions || { seed: u.name || 'anon' },
        ecoPoints: typeof u.ecoPoints === 'number' ? u.ecoPoints : 0,
        streak: typeof u.streak === 'number' ? u.streak : 0,
        totalCarbon: typeof u.totalCarbon === 'number' ? u.totalCarbon : undefined,
        email: u.email,
      } as User));
      setLeaderboardData(normalized);
      showToast?.('Leaderboard refreshed');
    } catch (err) {
      console.warn('Leaderboard refresh failed', err);
      showToast?.('Failed to refresh leaderboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">EcoFriends Leaderboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">See how you stack up against other eco-warriors.</p>
        </div>
        <div>
          <button onClick={refresh} className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <Card>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {leaderboardData.sort((a,b) => b.ecoPoints - a.ecoPoints).map((user, index) => (
            <li key={user.id} className={`p-4 flex items-center space-x-4 ${user.id === currentUser.id ? 'bg-emerald-50 dark:bg-emerald-900/20 rounded-lg' : ''}`}>
              <span className="font-bold text-lg w-6 text-center text-slate-500">{index + 1}</span>
              <Avatar avatarOptions={user.avatarOptions} className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                {user.id === currentUser.id && <p className="text-xs text-emerald-600 font-semibold">This is you!</p>}
              </div>
              <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{user.ecoPoints.toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default Leaderboard;
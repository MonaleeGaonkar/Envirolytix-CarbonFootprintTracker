import React, { useState } from 'react';
import { Activity, Badge } from '../types';
import { badges } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';
import { ShareIcon, TrophyIcon } from './ui/Icons';

interface AchievementsProps {
  activities: Activity[];
}

const Achievements: React.FC<AchievementsProps> = ({ activities }) => {
  const [copiedBadgeId, setCopiedBadgeId] = useState<string | null>(null);
  const unlockedBadges = badges.filter(badge => badge.isUnlocked(activities));
  const lockedBadges = badges.filter(badge => !badge.isUnlocked(activities));

  const totalBadges = badges.length;
  const unlockedCount = unlockedBadges.length;
  const progress = totalBadges > 0 ? (unlockedCount / totalBadges) * 100 : 0;

  const handleShare = async (badge: Badge) => {
    const shareText = `I just unlocked the "${badge.name}" badge on Enviro-Lytix for ${badge.description.toLowerCase()}! Join me in reducing our carbon footprint. #EnviroLytix #ClimateAction`;
    const shareData = {
      title: 'My Enviro-Lytix Achievement!',
      text: shareText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing badge:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedBadgeId(badge.id);
        setTimeout(() => setCopiedBadgeId(null), 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
        alert('Sharing is not supported on this browser. Failed to copy to clipboard.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Achievements</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Celebrate your eco-friendly milestones!</p>
      </div>

      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <TrophyIcon className="w-16 h-16 text-yellow-400" />
          </div>
          <div className="w-full">
            <h2 className="text-xl font-bold">Your Progress</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-2">You've unlocked <strong>{unlockedCount}</strong> of <strong>{totalBadges}</strong> badges. Keep up the great work!</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Unlocked ({unlockedBadges.length})</h2>
          {unlockedBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {unlockedBadges.map(badge => (
                <div key={badge.id} className="relative group bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-800/50 dark:to-emerald-900/50 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700 text-center flex flex-col justify-between transition-transform transform hover:-translate-y-1">
                  <div>
                    <div className="mb-4 inline-block p-1 bg-white/50 rounded-full shadow-md">
                        <div className="p-3 bg-white dark:bg-gray-700 rounded-full">
                            <badge.icon className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{badge.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(badge)}
                        className="!text-green-600 dark:!text-green-400 hover:!bg-green-100 dark:hover:!bg-green-500/20"
                        aria-label={`Share ${badge.name} achievement`}
                      >
                        {copiedBadgeId === badge.id ? 'Copied!' : (
                          <>
                            <ShareIcon className="w-4 h-4 mr-2" />
                            <span>Share</span>
                          </>
                        )}
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-center text-gray-500 dark:text-gray-400 py-4">No badges unlocked yet. Keep logging your activities!</p>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Locked ({lockedBadges.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {lockedBadges.map(badge => (
              <div key={badge.id} className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                  <svg className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-gray-500 dark:text-gray-400">{badge.name}</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;

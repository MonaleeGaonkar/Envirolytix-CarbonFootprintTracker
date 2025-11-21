import React, { useState } from 'react';
import { Activity } from '../types';
import GreenCoach from './GreenCoach';
import { CoachIcon } from './ui/Icons';
import Button from './ui/Button';

interface ChatWidgetProps {
    activities: Activity[];
    dailyGoal: number;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ activities, dailyGoal }) => {
    const [isOpen, setIsOpen] = useState(false);

    // return (
    //     <div className="fixed bottom-6 right-6 z-50">
    //         {/* Chat Window */}
    //         <div className={`
    //             w-80 h-[28rem] sm:w-96 sm:h-[32rem]
    //             bg-white dark:bg-slate-800
    //             rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700
    //             transition-all duration-300 ease-in-out
    //             ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
    //         `}>
    //             <header className="flex items-center justify-between p-4 bg-gradient-primary text-white rounded-t-xl shadow-lg">
    //                 <div className="flex items-center gap-2">
    //                     <CoachIcon className="h-6 w-6" />
    //                     <h2 className="font-bold text-lg">Green Coach</h2>
    //                 </div>
    //                 <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="!text-white hover:!bg-white/20 p-1" aria-label="Close chat">
    //                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    //                     </svg>
    //                 </Button>
    //             </header>
    //             <div className="flex-1 overflow-hidden">
    //                  <GreenCoach activities={activities} dailyGoal={dailyGoal} />
    //             </div>
    //         </div>

    //         {/* Chat Bubble Button */}
    //         <Button
    //             onClick={() => setIsOpen(true)}
    //             className={`
    //                 absolute bottom-0 right-0
    //                 w-16 h-16 rounded-full
    //                 transition-all duration-300 ease-in-out
    //                 transform hover:scale-110
    //                 ${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}
    //             `}
    //             aria-label="Open Green Coach"
    //         >
    //             <CoachIcon className="h-8 w-8" />
    //         </Button>
    //     </div>
    // );
    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Bubble Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110"
                    aria-label="Open Green Coach"
                >
                    <CoachIcon className="h-8 w-8" />
                </Button>
            )}

            {/* Chat Window - only render when open */}
            {isOpen && (
                <div className="w-80 h-[28rem] sm:w-96 sm:h-[32rem] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <header className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-xl shadow-lg">
                        <div className="flex items-center gap-2">
                            <CoachIcon className="h-6 w-6" />
                            <h2 className="font-bold text-lg">Green Coach</h2>
                        </div>
                        <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="!text-white hover:!bg-white/20 p-1" aria-label="Close chat">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </header>
                    <div className="flex-1 overflow-hidden">
                        <GreenCoach activities={activities} dailyGoal={dailyGoal} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { Activity, ChatMessage } from '../types';
import { createChatSession, streamChatResponse, generateProactiveTip } from '../services/geminiService';
import { badges } from '../constants';
import Button from './ui/Button';

interface GreenCoachProps {
    activities: Activity[];
    dailyGoal: number;
}

const GreenCoach: React.FC<GreenCoachProps> = ({ activities, dailyGoal }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hi! I am your Green Coach. I can give you personalized advice based on your logged activities. Ask me anything, or get a proactive tip!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unlockedBadges = badges.filter(b => b.isUnlocked(activities));
        const session = createChatSession(activities, unlockedBadges, dailyGoal);
        setChatSession(session);
    }, [activities, dailyGoal]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleStream = async (stream: AsyncGenerator<string>) => {
        let streamedText = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of stream) {
            streamedText += chunk;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: streamedText };
                return newMessages;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseStream = streamChatResponse(chatSession, input);
            await handleStream(responseStream);
        } catch (error) {
            console.error('Streaming failed:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getTip = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const unlockedBadges = badges.filter(b => b.isUnlocked(activities));
            const responseStream = generateProactiveTip(activities, unlockedBadges, dailyGoal);
            await handleStream(responseStream);
        } catch (error) {
            console.error('Proactive tip failed:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I couldn\'t get a tip right now.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full bg-transparent">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.5 7.5 7.5 7.5h5c1 0 1.012-1.77 1.256-2.179a6.006 6.006 0 011.912 2.706C15.988 8.275 16 9.243 16 10c0 .757-.012 1.725-.256 2.179a6.006 6.006 0 01-1.912 2.706C14.012 14.27 14 12.5 13 12.5h-5c-1 0-1.012 1.77-1.256 2.179a6.006 6.006 0 01-1.912-2.706C4.012 11.725 4 10.757 4 10c0-.757.012-1.725.256-2.179z" clipRule="evenodd" />
                              </svg>
                            </div>
                        )}
                        <div className={`max-w-md p-3 rounded-lg shadow-md ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.5 7.5 7.5 7.5h5c1 0 1.012-1.77 1.256-2.179a6.006 6.006 0 011.912 2.706C15.988 8.275 16 9.243 16 10c0 .757-.012 1.725-.256 2.179a6.006 6.006 0 01-1.912 2.706C14.012 14.27 14 12.5 13 12.5h-5c-1 0-1.012 1.77-1.256 2.179a6.006 6.006 0 01-1.912-2.706C4.012 11.725 4 10.757 4 10c0-.757.012-1.725.256-2.179z" clipRule="evenodd" />
                            </svg>
                         </div>
                         <div className="max-w-md p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                            <div className="flex items-center space-x-1">
                                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce"></span>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="mb-3 flex justify-center">
                    <Button 
                        onClick={getTip} 
                        disabled={isLoading}
                        variant="secondary"
                        size="sm"
                        className="rounded-full !text-emerald-600 dark:!text-emerald-400 !bg-emerald-100 dark:!bg-emerald-900/50 hover:!bg-emerald-200 dark:hover:!bg-emerald-900"
                    >
                       ✨ Get a Personalized Tip
                    </Button>
                </div>
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask for eco-friendly tips..."
                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 placeholder-slate-500 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading} className="rounded-full">
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default GreenCoach;
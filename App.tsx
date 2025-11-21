import React, { useState, useCallback, useEffect } from 'react';
import { Activity, Page, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import Achievements from './components/Achievements';
import Leaderboard from './components/Leaderboard';
import Resources from './components/Resources';
import Game from './components/Game';
import TripPlanner from './components/TripPlanner';
import Profile from './components/Profile';
import CarbonFootprintCalculator from './components/CarbonFootprintCalculator';
import { sampleActivities, currentUser, leaderboardData as initialLeaderboardData, fetchLeaderboard } from './constants';
import { LogoIcon, GameIcon } from './components/ui/Icons';
import ChatWidget from './components/ChatWidget';
import ThemeToggle from './components/ThemeToggle';
import Button from './components/ui/Button';
import Loginpage from './components/Loginpage';
import Footer from './components/Footer';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Check if user was previously logged in
    return localStorage.getItem('isLoggedIn') === 'true' || Boolean(localStorage.getItem('token'));
  });
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User>(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) return JSON.parse(raw) as User;
    } catch (e) {
      // ignore
    }
    return currentUser;
  });
  const [leaderboardData, setLeaderboardData] = useState<User[]>(initialLeaderboardData);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number>(5.0); // Default goal in kg CO2e
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Load live leaderboard from backend on mount
    fetchLeaderboard().then(data => setLeaderboardData(data)).catch(() => {});

    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // small utility to show a toast for a short time
  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // ← ADD THIS FUNCTION
  const handleLogin = (loggedInUser: User, token?: string) => {
    // Normalize incoming user but preserve key identity fields like email so
    // activity logging has the user email available for backend updates.
    const lu: any = loggedInUser || {};
    const normalized: User = {
      id: lu.id || lu._id || 'user_unknown',
      name: lu.name || 'Guest',
      email: lu.email || (currentUser as any).email || '',
      location: lu.location || (currentUser as any).location || '',
      avatarOptions: lu.avatarOptions || (currentUser as any).avatarOptions,
      ecoPoints: typeof lu.ecoPoints === 'number' ? lu.ecoPoints : 0,
      streak: typeof lu.streak === 'number' ? lu.streak : 0,
      totalCarbon: typeof lu.totalCarbon === 'number' ? lu.totalCarbon : 0,
      // keep timestamps if provided
      createdAt: lu.createdAt ? new Date(lu.createdAt) : undefined,
      updatedAt: lu.updatedAt ? new Date(lu.updatedAt) : undefined,
    } as User;

    setIsLoggedIn(true);
    setUser(normalized);
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(normalized));
  };

  // ← ADD THIS FUNCTION
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('user');
    setCurrentPage('dashboard');
  };

  const addActivity = useCallback((activity: Activity, updatedUser?: any) => {
    setActivities(prev => [...prev, activity].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // If backend returned updated user, use that; otherwise increment locally
    if (updatedUser) {
      // Normalize server-returned user into our User shape
      const norm: any = {
        id: updatedUser.id || updatedUser._id || user?.id || 'user_unknown',
        name: updatedUser.name ?? user?.name ?? 'Guest',
        email: updatedUser.email ?? user?.email ?? '',
        avatarOptions: updatedUser.avatarOptions ?? user?.avatarOptions ?? undefined,
        ecoPoints: typeof updatedUser.ecoPoints === 'number' ? updatedUser.ecoPoints : (user?.ecoPoints ?? 0),
        streak: typeof updatedUser.streak === 'number' ? updatedUser.streak : (user?.streak ?? 0),
        totalCarbon: typeof updatedUser.totalCarbon === 'number' ? updatedUser.totalCarbon : (user?.totalCarbon ?? 0),
      } as User;

      setUser(norm);
      try { localStorage.setItem('user', JSON.stringify(norm)); } catch (e) {}
      setLeaderboardData(prevData => prevData.map(u => u.id === norm.id ? { ...u, ...norm } : u));
    } else {
      // Fallback: update local state
      const newUpdatedUser = { ...user, ecoPoints: (user?.ecoPoints ?? 0) + activity.ecoPoints };
      setUser(newUpdatedUser);
      setLeaderboardData(prevData => prevData.map(u => u.id === newUpdatedUser.id ? newUpdatedUser : u));
      try { localStorage.setItem('user', JSON.stringify(newUpdatedUser)); } catch (e) {}
    }

    if (activity.description.includes('EcoQuiz')) {
       setCurrentPage('dashboard');
    } else {
       setCurrentPage('logActivity');
    }
  }, [user]);
  
  const handleUpdateUser = (updatedUserInfo: Partial<User>) => {
  // console.log('🔄 handleUpdateUser called with:', updatedUserInfo);

  // Optimistic UI update
  setUser(prev => {
    const optimistic = { ...prev, ...updatedUserInfo } as User;
    try { 
      localStorage.setItem('user', JSON.stringify(optimistic)); 
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }
    return optimistic;
  });

  // Persist to backend
  const persist = async () => {
    try {
      const stored = localStorage.getItem('user');
      const prevUser: any = stored ? JSON.parse(stored) : user;
      
      const payload = { 
        email: prevUser?.email || user?.email,
        ...updatedUserInfo 
      };

      // console.log('📤 Sending to backend:', payload);

      if (!payload.email) {
        throw new Error('No email available to update profile');
      }

      const res = await fetch('http://localhost:4000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('❌ Backend error:', text);
        throw new Error(`Profile update failed: ${text}`);
      }

      const updatedFromServer = await res.json();
      // console.log('✅ Backend response:', updatedFromServer);

      // Update state with server response
      setUser(prev => {
        const merged = {
          ...prev,
          ...updatedFromServer,
          avatarOptions: updatedFromServer.avatarOptions || updatedUserInfo.avatarOptions || prev.avatarOptions,
        } as User;

        try {
          localStorage.setItem('user', JSON.stringify(merged));
          // console.log('💾 Saved to localStorage:', merged);
        } catch (e) {
          console.error('LocalStorage persist failed:', e);
        }

        return merged;
      });

      // Update leaderboard
      setLeaderboardData(prevData =>
        prevData.map(u =>
          u.id === (updatedFromServer.id || updatedFromServer._id)
            ? { ...u, ...updatedFromServer }
            : u
        )
      );

    } catch (err) {
      console.error('❌ Profile update failed:', err);
      
      // Fallback: keep local changes
      setUser(prevUser => {
        const fallback = { ...prevUser, ...updatedUserInfo };
        try { 
          localStorage.setItem('user', JSON.stringify(fallback)); 
        } catch (e) {}
        return fallback;
      });
    }
  };

  void persist();
};


  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} activities={activities} dailyGoal={dailyGoal} setCurrentPage={setCurrentPage} />;
      case 'logActivity':
        return <ActivityLog onAddActivity={addActivity} activities={activities} userId={user?.id || user?._id}
        userEmail={user?.email} setUser={setUser} setLeaderboardData={setLeaderboardData}/>;
      case 'achievements':
        return <Achievements activities={activities} />;
      case 'leaderboard':
        return <Leaderboard user={user} leaderboardData={leaderboardData} setLeaderboardData={setLeaderboardData} showToast={showToast} />;
      case 'resources':
        return <Resources />;
      case 'game':
        return <Game onQuizComplete={addActivity} />;
      case 'tripPlanner':
        return <TripPlanner user={user} onAddActivity={addActivity} setLeaderboardData={setLeaderboardData} />;
      case 'profile':
        return <Profile user={user} onUpdateUser={handleUpdateUser} dailyGoal={dailyGoal} onGoalChange={setDailyGoal} activities={activities} />;
      case 'carbonCalculator':
        return <CarbonFootprintCalculator />;
      default:
        return <Dashboard user={user} activities={activities} dailyGoal={dailyGoal} setCurrentPage={setCurrentPage} />;
    }
  };

   // ← ADD THIS: Show login page if not logged in
  if (!isLoggedIn) {
  return <Loginpage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
}

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <Sidebar user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 lg:justify-end sticky top-0 z-20">
           <div className="flex items-center gap-2 lg:hidden text-slate-800 dark:text-slate-200">
              <LogoIcon className="h-8 w-8" />
              <h1 className="text-lg font-extrabold tracking-tighter">ENVIROLYTIX</h1>
            </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              onClick={() => setCurrentPage('game')} 
              aria-label="Play EcoQuiz"
            >
              <GameIcon className="h-6 w-6" />
            </Button>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <Button variant="ghost" onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderPage()}
          <Footer />
        </div>
      </main>
      
      <ChatWidget activities={activities} dailyGoal={dailyGoal} />
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50">
          <div className="px-4 py-2 bg-emerald-600 text-white rounded shadow-lg">{toastMessage}</div>
        </div>
      )}
    </div>
  );
};

export default App;
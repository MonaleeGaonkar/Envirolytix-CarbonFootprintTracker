import React from 'react';
import { Page, User } from '../types';
import { DashboardIcon, AchievementIcon, LeaderboardIcon, ResourcesIcon, LogoIcon, RouteIcon, UserIcon, CalculatorIcon, LocationMarkerIcon, LogoutIcon } from './ui/Icons';
import Avatar from './Avatar';

interface SidebarProps {
  user: User;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  onLogout: () => void;  // ← ADD THIS LINE
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  page: Page;
  currentPage: Page;
  onClick: (page: Page) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, page, currentPage, onClick }) => (
  <button
    onClick={() => onClick(page)}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      currentPage === page
        ? 'bg-gradient-primary text-white font-semibold shadow-lg'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`}
  >
    <Icon className="h-6 w-6" />
    <span className="text-sm">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, setCurrentPage, isOpen, setOpen, onLogout }) => {
  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    if(window.innerWidth < 1024) { // Close sidebar on mobile after navigation
      setOpen(false);
    }
  };

  const navItems = [
    { icon: DashboardIcon, label: 'Dashboard', page: 'dashboard' as Page },
    { icon: UserIcon, label: 'Profile', page: 'profile' as Page },
    { icon: LocationMarkerIcon, label: 'Live Tracking', page: 'logActivity' as Page },
    { icon: RouteIcon, label: 'Trip Planner', page: 'tripPlanner' as Page },
    { icon: CalculatorIcon, label: 'Footprint Calculator', page: 'carbonCalculator' as Page},
    { icon: AchievementIcon, label: 'Achievements', page: 'achievements' as Page },
    { icon: LeaderboardIcon, label: 'Leaderboard', page: 'leaderboard' as Page },
    { icon: ResourcesIcon, label: 'About', page: 'resources' as Page },
  ];

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
      <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex items-center justify-center p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
            <LogoIcon className="h-10 w-10 text-emerald-500" />
            <h1 className="text-xl font-extrabold tracking-tighter">ENVIROLYTIX</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.page} {...item} currentPage={currentPage} onClick={handleNavigation} />
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => handleNavigation('profile')}
            className="w-full flex items-center gap-3 p-2 -m-2 rounded-lg text-left transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="View profile"
          >
            {/* Provide safe fallbacks in case user data is partial */}
            <Avatar avatarOptions={user?.avatarOptions ?? undefined} className="h-10 w-10 rounded-full" />
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{user?.name ?? 'Guest'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{(user?.ecoPoints ?? 0).toLocaleString()} EcoPoints</p>
            </div>
          </button>
        </div>
        {/* ADD THIS NEW SECTION - Logout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogoutIcon className="h-6 w-6" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
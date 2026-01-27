
import React from 'react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, setScreen }) => {
  const navItems = [
    { id: Screen.HOME, icon: 'home', label: 'Início' },
    { id: Screen.TOURNAMENT_HISTORY, icon: 'history', label: 'Histórico' },
    { id: Screen.GLOBAL_STATS, icon: 'bar_chart', label: 'Stats' },
    { id: Screen.PLAYERS, icon: 'groups', label: 'Jogadores' },
    { id: Screen.SETTINGS, icon: 'settings', label: 'Config' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-md border-t border-white/5 pb-6 pt-3 z-50 max-w-md mx-auto">
      <div className="flex justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id || 
                          (item.id === Screen.TOURNAMENT_HISTORY && currentScreen === Screen.HISTORY_DETAIL) ||
                          (item.id === Screen.PLAYERS && currentScreen === Screen.PROFILE);
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center gap-1 flex-1 transition-all ${
                isActive ? 'text-primary scale-110' : 'text-slate-500 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

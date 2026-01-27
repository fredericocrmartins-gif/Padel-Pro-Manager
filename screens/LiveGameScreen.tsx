
import React from 'react';
import { Screen, Match } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface LiveGameScreenProps {
  setScreen: (screen: Screen) => void;
  matches: Match[];
  updateMatchScore: (matchId: string, team: 1 | 2, increment: boolean) => void;
  onNextRound: () => void;
  currentRound: number;
}

export const LiveGameScreen: React.FC<LiveGameScreenProps> = ({ 
    setScreen, 
    matches, 
    updateMatchScore, 
    onNextRound, 
    currentRound 
}) => {
  
  if (matches.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center animate-fade-in">
              <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">sports_tennis</span>
              <h2 className="text-xl font-bold text-white mb-2">Sem jogos ativos</h2>
              <button onClick={() => setScreen(Screen.TEAM_SETUP)} className="bg-primary text-background-dark font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors">Configurar Equipas</button>
          </div>
      );
  }

  const getRoundLabel = (r: number) => {
    if (r === 1) return 'Ronda 1 • Início';
    if (r === 2) return 'Ronda 2 • Troca';
    return 'Ronda 3 • Confronto Final';
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 pb-32 max-w-md mx-auto w-full animate-fade-in">
      <header className="flex items-center justify-between py-2 border-b border-white/5">
        <button onClick={() => setScreen(Screen.HOME)} className="size-10 flex items-center justify-center rounded-full bg-white/5"><span className="material-symbols-outlined text-[20px]">close</span></button>
        <div className="text-center">
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{getRoundLabel(currentRound)}</span>
             <h2 className="text-xl font-black text-white">Ronda {currentRound}/3</h2>
        </div>
        <div className="size-10"></div>
      </header>

      <div className="flex flex-col gap-6">
      {matches.map((match) => (
        <article key={match.id} className="bg-card-dark rounded-3xl p-6 shadow-lg border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${match.court === 1 ? 'bg-primary' : 'bg-purple-500'}`}></div>
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${match.court === 1 ? 'text-primary' : 'text-purple-500'}`}>stadium</span>
                    <h3 className="text-sm font-black text-white">CAMPO {match.court}</h3>
                </div>
                <span className="text-[10px] font-black bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">LIVE</span>
            </header>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col flex-1 gap-2">
                        <div className="flex -space-x-1.5">{match.team1.map(p => <div key={p.id}>{renderGlobalAvatar(p, 'size-7')}</div>)}</div>
                        <span className="text-xs font-bold text-white truncate">{match.team1.map(p => p.nickname || p.name.split(' ')[0]).join(' / ')}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background-dark/50 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => updateMatchScore(match.id, 1, false)} className="size-10 flex items-center justify-center rounded-xl bg-white/5"><span className="material-symbols-outlined text-sm">remove</span></button>
                        <span className="w-8 text-center text-xl font-black text-white">{match.score1}</span>
                        <button onClick={() => updateMatchScore(match.id, 1, true)} className="size-10 flex items-center justify-center rounded-xl bg-primary text-background-dark"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                </div>
                <div className="h-px bg-white/5 relative"><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card-dark px-2 text-[8px] font-black text-gray-700 uppercase tracking-widest">VS</div></div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col flex-1 gap-2">
                        <div className="flex -space-x-1.5">{match.team2.map(p => <div key={p.id}>{renderGlobalAvatar(p, 'size-7')}</div>)}</div>
                        <span className="text-xs font-bold text-white truncate">{match.team2.map(p => p.nickname || p.name.split(' ')[0]).join(' / ')}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background-dark/50 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => updateMatchScore(match.id, 2, false)} className="size-10 flex items-center justify-center rounded-xl bg-white/5"><span className="material-symbols-outlined text-sm">remove</span></button>
                        <span className="w-8 text-center text-xl font-black text-white">{match.score2}</span>
                        <button onClick={() => updateMatchScore(match.id, 2, true)} className="size-10 flex items-center justify-center rounded-xl bg-primary text-background-dark"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                </div>
            </div>
        </article>
      ))}
      </div>

       <button onClick={onNextRound} className="w-full bg-primary text-background-dark font-black py-5 rounded-3xl shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined font-black">arrow_forward</span>
          <span>{currentRound < 3 ? `AVANÇAR PARA RONDA ${currentRound + 1}` : 'FINALIZAR JOGOS'}</span>
      </button>
    </div>
  );
};

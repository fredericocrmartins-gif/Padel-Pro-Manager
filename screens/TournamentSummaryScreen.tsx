
import React from 'react';
import { Screen, Match } from '../types';

interface SummaryProps {
  setScreen: (screen: Screen) => void;
  matches: Match[];
  updateMatchScore: (matchId: string, team: 1 | 2, increment: boolean) => void;
  onFinish: () => void;
}

export const TournamentSummaryScreen: React.FC<SummaryProps> = ({ setScreen, matches, updateMatchScore, onFinish }) => {
  const rounds = [1, 2, 3];

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 pb-32 animate-fade-in relative z-20 bg-background-dark min-h-screen">
       <header className="flex items-center justify-between py-4">
            <button onClick={() => setScreen(Screen.LIVE_GAME)} className="size-10 rounded-full flex items-center justify-center bg-white/5"><span className="material-symbols-outlined">arrow_back</span></button>
            <h2 className="text-lg font-black uppercase tracking-widest">Resumo do Torneio</h2>
            <div className="w-10"></div>
        </header>

        <div className="text-center px-4 mb-2">
            <h1 className="text-2xl font-black text-white mb-2">Revisão de Resultados</h1>
            <p className="text-slate-500 text-xs">Confirme se todos os scores estão corretos antes de gerar a classificação final.</p>
        </div>

        <div className="space-y-6">
            {rounds.map(round => {
                const roundMatches = matches.filter(m => m.round === round);
                if (roundMatches.length === 0) return null;
                return (
                    <section key={round} className="bg-card-dark rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                        <header className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/5">
                            <span className="font-black text-[10px] text-primary uppercase tracking-[0.2em]">Ronda {round}</span>
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Fase de Grupos</span>
                        </header>
                        <div className="divide-y divide-white/5">
                            {roundMatches.map(match => (
                                <div key={match.id} className="p-4 flex items-center justify-between gap-2">
                                    <div className="flex-1 text-[10px] font-bold text-white text-right leading-tight">
                                        {match.team1.map(p => p.nickname || p.name.split(' ')[0]).join(' / ')}
                                    </div>
                                    <div className="flex items-center gap-2 bg-background-dark/80 px-3 py-1.5 rounded-2xl border border-white/5">
                                        <div className="flex flex-col items-center">
                                            <button onClick={() => updateMatchScore(match.id, 1, true)} className="text-gray-600 hover:text-primary"><span className="material-symbols-outlined text-xs">expand_less</span></button>
                                            <span className="font-black text-lg w-5 text-center leading-none">{match.score1}</span>
                                            <button onClick={() => updateMatchScore(match.id, 1, false)} className="text-gray-600 hover:text-primary"><span className="material-symbols-outlined text-xs">expand_more</span></button>
                                        </div>
                                        <span className="text-gray-800 font-black">-</span>
                                        <div className="flex flex-col items-center">
                                            <button onClick={() => updateMatchScore(match.id, 2, true)} className="text-gray-600 hover:text-primary"><span className="material-symbols-outlined text-xs">expand_less</span></button>
                                            <span className="font-black text-lg w-5 text-center leading-none">{match.score2}</span>
                                            <button onClick={() => updateMatchScore(match.id, 2, false)} className="text-gray-600 hover:text-primary"><span className="material-symbols-outlined text-xs">expand_more</span></button>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-[10px] font-bold text-white text-left leading-tight">
                                        {match.team2.map(p => p.nickname || p.name.split(' ')[0]).join(' / ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>

        <div className="mt-4 pb-8">
             <button onClick={onFinish} className="w-full bg-green-500 hover:bg-green-600 text-background-dark font-black text-lg h-16 rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-all">
                <span className="material-symbols-outlined text-2xl font-black">check_circle</span>
                Confirmar Classificação
            </button>
        </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Screen, Player, Match } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface TeamSetupScreenProps {
  setScreen: (screen: Screen) => void;
  players: Player[];
  onStartTournament: (matches: Match[]) => void;
}

const TEAM_CONFIG = [
    { label: 'Ases (A)', color: 'text-yellow-400', icon: 'playing_cards' },
    { label: 'Reis (B)', color: 'text-blue-400', icon: 'military_tech' },
    { label: 'Damas (C)', color: 'text-rose-400', icon: 'diamond' },
    { label: 'Valetes (D)', color: 'text-emerald-400', icon: 'shield' },
    { label: 'Dez (E)', color: 'text-orange-400', icon: 'filter_10' },
    { label: 'Nove (F)', color: 'text-purple-400', icon: 'filter_9_plus' }
];

export const TeamSetupScreen: React.FC<TeamSetupScreenProps> = ({ setScreen, players, onStartTournament }) => {
  const numTeams = players.length === 12 ? 6 : 4;
  const [teams, setTeams] = useState<Player[][]>(Array(numTeams).fill([]));
  const [drawMode, setDrawMode] = useState<'manual' | 'smart' | 'random'>('manual');

  const isAssigned = (pid: string) => teams.flat().some(p => p.id === pid);

  const handlePlayerClick = (player: Player) => {
    if (isAssigned(player.id)) return;
    const newTeams = [...teams];
    for (let i = 0; i < newTeams.length; i++) {
        if (newTeams[i].length < 2) {
            newTeams[i] = [...newTeams[i], player];
            setTeams(newTeams);
            return;
        }
    }
  };

  const removePlayer = (player: Player, teamIndex: number) => {
    const newTeams = [...teams];
    newTeams[teamIndex] = newTeams[teamIndex].filter(p => p.id !== player.id);
    setTeams(newTeams);
  };

  const handleAutoAssign = (mode: 'smart' | 'random') => {
    setDrawMode(mode);
    const pool = [...players];
    
    if (mode === 'random') {
        pool.sort(() => 0.5 - Math.random());
    } else if (mode === 'smart') {
        // Para já, o "Smart" é random com um seed simples, num futuro próximo iremos cruzar com o histórico
        pool.sort(() => 0.5 - Math.random());
    }

    const newTeams: Player[][] = [];
    for (let i = 0; i < numTeams; i++) {
        newTeams.push([pool[i*2], pool[i*2+1]]);
    }
    setTeams(newTeams);
  };

  const isReady = teams.every(t => t.length === 2);

  const handleStart = () => {
    if (!isReady) return;
    const timestamp = Date.now();
    const dateStr = new Date().toISOString();
    
    const matches: Match[] = [];
    
    // Campo 1: Team 0 vs Team 1
    matches.push({ id: `m1-${timestamp}`, team1: teams[0], team2: teams[1], score1: 0, score2: 0, court: 1, status: 'live', round: 1, date: dateStr });
    
    // Campo 2: Team 2 vs Team 3
    matches.push({ id: `m2-${timestamp}`, team1: teams[2], team2: teams[3], score1: 0, score2: 0, court: 2, status: 'live', round: 1, date: dateStr });
    
    // Campo 3 (apenas para Sobe e Desce 12 jogadores): Team 4 vs Team 5
    if (numTeams === 6) {
        matches.push({ id: `m3-${timestamp}`, team1: teams[4], team2: teams[5], score1: 0, score2: 0, court: 3, status: 'live', round: 1, date: dateStr });
    }

    onStartTournament(matches);
  };

  const renderTeamBox = (team: Player[], index: number) => {
      const config = TEAM_CONFIG[index];
      return (
        <div key={index} className="bg-card-dark/40 rounded-2xl p-2 border border-white/5 flex flex-col h-full relative overflow-hidden">
          <div className="absolute -right-2 -top-2 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-5xl">{config.icon}</span>
          </div>
          <div className="flex justify-between items-center mb-1 relative z-10">
            <span className={`text-[8px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            {[0, 1].map(idx => (
              <div key={idx} className="h-8 rounded-lg bg-black/30 border border-white/5 flex items-center px-1.5 overflow-hidden">
                {team[idx] ? (
                  <div className="flex items-center gap-1.5 w-full">
                    {renderGlobalAvatar(team[idx], 'size-5')}
                    <span className="text-[9px] font-bold text-white truncate flex-1 uppercase">
                      {team[idx].nickname || team[idx].name.split(' ')[0]}
                    </span>
                    <button onClick={() => removePlayer(team[idx], index)} className="text-gray-600 hover:text-red-400">
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[7px] text-gray-700 font-bold uppercase w-full text-center">Livre</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-background-dark p-3 overflow-hidden animate-fade-in">
      <header className="flex items-center justify-between mb-2 shrink-0">
        <button onClick={() => setScreen(Screen.HOME)} className="size-8 rounded-full bg-white/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-base font-black text-white leading-none">SORTEIO</h2>
          <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">{numTeams === 6 ? 'Sobe e Desce (12 Jogadores)' : 'Clássico (8 Jogadores)'}</span>
        </div>
        <button onClick={() => { setTeams(Array(numTeams).fill([])); setDrawMode('manual'); }} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex gap-2">
            <button onClick={() => setDrawMode('manual')} className={`flex-1 flex flex-col items-center p-2 rounded-xl border ${drawMode === 'manual' ? 'bg-primary/20 border-primary text-primary' : 'bg-card-dark border-white/5 text-gray-500'}`}>
                <span className="material-symbols-outlined mb-1">playing_cards</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Cartas Manuais</span>
            </button>
            <button onClick={() => handleAutoAssign('smart')} className={`flex-1 flex flex-col items-center p-2 rounded-xl border ${drawMode === 'smart' ? 'bg-primary/20 border-primary text-primary' : 'bg-card-dark border-white/5 text-gray-500'}`}>
                <span className="material-symbols-outlined mb-1">psychology</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Inteligente</span>
            </button>
            <button onClick={() => handleAutoAssign('random')} className={`flex-1 flex flex-col items-center p-2 rounded-xl border ${drawMode === 'random' ? 'bg-primary/20 border-primary text-primary' : 'bg-card-dark border-white/5 text-gray-500'}`}>
                <span className="material-symbols-outlined mb-1">shuffle</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Aleatório</span>
            </button>
        </div>

        <div className="flex-1 bg-gradient-to-br from-primary/10 via-card-dark to-card-dark rounded-[2rem] border border-primary/20 p-3 flex flex-col gap-3 min-h-0">
            <section className="bg-black/20 p-2 rounded-2xl border border-white/5 shrink-0">
            <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Pool de Confirmados</h3>
            </div>
            <div className={`grid gap-2 ${numTeams === 6 ? 'grid-cols-6' : 'grid-cols-4'}`}>
                {players.map(p => {
                const assigned = isAssigned(p.id);
                return (
                    <button 
                    key={p.id} 
                    onClick={() => handlePlayerClick(p)}
                    disabled={assigned}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${assigned ? 'opacity-20 scale-90' : 'active:scale-90'}`}
                    >
                    <div className="relative">
                        {renderGlobalAvatar(p, 'size-10')}
                        {!assigned && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-black rounded-full size-3 flex items-center justify-center border border-card-dark">
                            <span className="material-symbols-outlined text-[8px] font-black">add</span>
                        </div>
                        )}
                    </div>
                    <span className="text-[7px] font-black text-white uppercase truncate w-full text-center">{p.nickname || p.name.split(' ')[0]}</span>
                    </button>
                );
                })}
            </div>
            </section>

            <section className={`flex-1 grid gap-2 min-h-0 ${numTeams === 6 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>
                {teams.map((t, i) => renderTeamBox(t, i))}
            </section>
        </div>
      </main>

      <footer className="mt-3 shrink-0 pb-1">
        <button 
          onClick={handleStart}
          disabled={!isReady}
          className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-2xl transition-all ${isReady ? 'bg-primary text-background-dark scale-100' : 'bg-white/5 text-gray-700 opacity-50 cursor-not-allowed'}`}
        >
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          <span>LANÇAR TORNEIO (RONDA 1)</span>
        </button>
        <div className="flex justify-center gap-4 mt-2">
          <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">C1: Ases vs Reis</span>
          <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">C2: Damas vs Valetes</span>
          {numTeams === 6 && <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">C3: Dez vs Nove</span>}
        </div>
      </footer>
    </div>
  );
};


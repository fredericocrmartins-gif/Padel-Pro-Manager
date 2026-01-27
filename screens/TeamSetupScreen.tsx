
import React, { useState } from 'react';
import { Screen, Player, Match } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface TeamSetupScreenProps {
  setScreen: (screen: Screen) => void;
  players: Player[];
  onStartTournament: (matches: Match[]) => void;
}

export const TeamSetupScreen: React.FC<TeamSetupScreenProps> = ({ setScreen, players, onStartTournament }) => {
  const [teamAses, setTeamAses] = useState<Player[]>([]); 
  const [teamReis, setTeamReis] = useState<Player[]>([]); 
  const [teamDamas, setTeamDamas] = useState<Player[]>([]); 
  const [teamValetes, setTeamValetes] = useState<Player[]>([]);

  const isAssigned = (pid: string) => {
    return [...teamAses, ...teamReis, ...teamDamas, ...teamValetes].some(p => p.id === pid);
  };

  const handlePlayerClick = (player: Player) => {
    if (isAssigned(player.id)) return;
    if (teamAses.length < 2) setTeamAses([...teamAses, player]);
    else if (teamReis.length < 2) setTeamReis([...teamReis, player]);
    else if (teamDamas.length < 2) setTeamDamas([...teamDamas, player]);
    else if (teamValetes.length < 2) setTeamValetes([...teamValetes, player]);
  };

  const removePlayer = (player: Player, team: 'Ases' | 'Reis' | 'Damas' | 'Valetes') => {
    if (team === 'Ases') setTeamAses(teamAses.filter(p => p.id !== player.id));
    if (team === 'Reis') setTeamReis(teamReis.filter(p => p.id !== player.id));
    if (team === 'Damas') setTeamDamas(teamDamas.filter(p => p.id !== player.id));
    if (team === 'Valetes') setTeamValetes(teamValetes.filter(p => p.id !== player.id));
  };

  const handleAutoAssign = () => {
    const pool = [...players].sort(() => 0.5 - Math.random());
    setTeamAses([pool[0], pool[1]]);
    setTeamReis([pool[2], pool[3]]);
    setTeamDamas([pool[4], pool[5]]);
    setTeamValetes([pool[6], pool[7]]);
  };

  const isReady = teamAses.length === 2 && teamReis.length === 2 && teamDamas.length === 2 && teamValetes.length === 2;

  const handleStart = () => {
    if (!isReady) return;
    const timestamp = Date.now();
    const dateStr = new Date().toISOString();
    
    // Ronda 1: Ases vs Reis (Campo 1) | Damas vs Valetes (Campo 2)
    const matches: Match[] = [
      { id: `m1-${timestamp}`, team1: teamAses, team2: teamReis, score1: 0, score2: 0, court: 1, status: 'live', round: 1, date: dateStr },
      { id: `m2-${timestamp}`, team1: teamDamas, team2: teamValetes, score1: 0, score2: 0, court: 2, status: 'live', round: 1, date: dateStr }
    ];
    onStartTournament(matches);
  };

  const renderTeamBox = (team: Player[], label: string, color: string, icon: string, teamType: 'Ases' | 'Reis' | 'Damas' | 'Valetes') => (
    <div className="bg-card-dark/40 rounded-2xl p-2 border border-white/5 flex flex-col h-full relative overflow-hidden">
      <div className={`absolute -right-2 -top-2 opacity-5 pointer-events-none`}>
        <span className="material-symbols-outlined text-5xl">{icon}</span>
      </div>
      <div className="flex justify-between items-center mb-1 relative z-10">
        <span className={`text-[8px] font-black uppercase tracking-widest ${color}`}>{label}</span>
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
                <button onClick={() => removePlayer(team[idx], teamType)} className="text-gray-600 hover:text-red-400">
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

  return (
    <div className="h-screen max-h-screen flex flex-col bg-background-dark p-3 overflow-hidden animate-fade-in">
      <header className="flex items-center justify-between mb-2 shrink-0">
        <button onClick={() => setScreen(Screen.HOME)} className="size-8 rounded-full bg-white/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-base font-black text-white leading-none">SORTEIO</h2>
          <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">Mesa de Jogo</span>
        </div>
        <button onClick={() => { setTeamAses([]); setTeamReis([]); setTeamDamas([]); setTeamValetes([]); }} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>
      </header>

      <main className="flex-1 bg-gradient-to-br from-primary/10 via-card-dark to-card-dark rounded-[2rem] border border-primary/20 p-3 flex flex-col gap-3 min-h-0">
        <section className="bg-black/20 p-2 rounded-2xl border border-white/5 shrink-0">
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Pool de Confirmados</h3>
            <button onClick={handleAutoAssign} className="flex items-center gap-1 text-[8px] font-black text-primary uppercase border border-primary/30 px-2 py-1 rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-[12px]">shuffle</span> Baralhar
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
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

        <section className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 min-h-0">
          {renderTeamBox(teamAses, 'Ases (A)', 'text-yellow-400', 'playing_cards', 'Ases')}
          {renderTeamBox(teamReis, 'Reis (B)', 'text-blue-400', 'military_tech', 'Reis')}
          {renderTeamBox(teamDamas, 'Damas (C)', 'text-rose-400', 'diamond', 'Damas')}
          {renderTeamBox(teamValetes, 'Valetes (D)', 'text-emerald-400', 'shield', 'Valetes')}
        </section>
      </main>

      <footer className="mt-3 shrink-0 pb-1">
        <button 
          onClick={handleStart}
          disabled={!isReady}
          className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-2xl transition-all ${isReady ? 'bg-primary text-background-dark scale-100' : 'bg-white/5 text-gray-700 opacity-50 cursor-not-allowed'}`}
        >
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          <span>LANÇAR CARTAS (RONDA 1)</span>
        </button>
        <div className="flex justify-center gap-4 mt-2">
          <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">C1: Ases vs Reis</span>
          <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">C2: Damas vs Valetes</span>
        </div>
      </footer>
    </div>
  );
};

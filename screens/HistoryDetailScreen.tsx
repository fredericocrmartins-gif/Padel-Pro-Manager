
import React, { useMemo } from 'react';
import { Screen, Tournament, Match, Player, Location } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface HistoryDetailProps {
  setScreen: (screen: Screen) => void;
  tournament: Tournament;
  locations: Location[];
  players: Player[];
  onDeleteTournament?: (id: string) => void;
}

export const HistoryDetailScreen: React.FC<HistoryDetailProps> = ({ setScreen, tournament, locations, players, onDeleteTournament }) => {
  const matches = tournament.matches || [];
  const loc = locations.find(l => l.id === tournament.locationId);

  // Encontrar os objetos de jogador completos para os IDs confirmados
  const confirmedPlayers = useMemo(() => {
    return tournament.confirmedPlayerIds
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [tournament.confirmedPlayerIds, players]);

  const standings = useMemo(() => {
    const stats = new Map<string, { id: string, teamName: string, wins: number, pointsDiff: number, players: Player[] }>();
    const getStats = (team: Player[]) => {
        const key = team.map(p => p.id).sort().join('-');
        if (!stats.has(key)) stats.set(key, { id: key, teamName: team.map(p => p.nickname || p.name.split(' ')[0]).join(' & '), wins: 0, pointsDiff: 0, players: team });
        return stats.get(key)!;
    };
    matches.forEach(m => {
        const s1 = getStats(m.team1); const s2 = getStats(m.team2);
        s1.pointsDiff += (m.score1 - m.score2); s2.pointsDiff += (m.score2 - m.score1);
        if (m.score1 > m.score2) s1.wins += 1; else if (m.score2 > m.score1) s2.wins += 1;
    });
    return Array.from(stats.values()).sort((a, b) => b.wins - a.wins || b.pointsDiff - a.pointsDiff);
  }, [matches]);

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a: number, b: number) => a - b);

  const handleShare = async () => {
    if (!loc || standings.length === 0) return;

    const winner = standings[0];
    const dateStr = new Date(tournament.date).toLocaleDateString('pt-PT');
    
    let shareText = `🏆 *RESULTADOS PADEL PRO*\n\n`;
    shareText += `📍 ${loc.name}\n`;
    shareText += `📅 ${dateStr}\n\n`;
    shareText += `🥇 *VENCEDORES:* ${winner.teamName}\n`;
    shareText += `📊 (${winner.wins} Vitórias | Saldo ${winner.pointsDiff})\n\n`;
    shareText += `--- JOGOS ---\n`;

    rounds.forEach(r => {
        shareText += `\n*RONDA ${r}*\n`;
        matches.filter(m => m.round === r).forEach(m => {
            const t1 = m.team1.map(p => p.nickname || p.name.split(' ')[0]).join('/');
            const t2 = m.team2.map(p => p.nickname || p.name.split(' ')[0]).join('/');
            shareText += `• ${t1} ${m.score1}-${m.score2} ${t2}\n`;
        });
    });

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Resultados Padel',
                text: shareText
            });
        } else {
            await navigator.clipboard.writeText(shareText);
            alert('Resultados copiados para o clipboard!');
        }
    } catch (err) {
        console.error('Erro ao partilhar:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 pb-32 animate-fade-in bg-background-dark min-h-screen">
        <header className="flex items-center justify-between py-2">
            <button 
              onClick={() => setScreen(Screen.TOURNAMENT_HISTORY)} 
              className="size-11 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{new Date(tournament.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <h2 className="text-lg font-black text-white truncate max-w-[200px]">{loc?.name}</h2>
            </div>
            <button 
              onClick={() => onDeleteTournament?.(tournament.id)}
              className="size-11 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
        </header>

        {/* Lista de Jogadores Confirmados (Grelha 2x4) */}
        <section className="flex flex-col gap-3 bg-card-dark/30 p-4 rounded-3xl border border-white/5">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Convocados ({confirmedPlayers.length})</h3>
             <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                {confirmedPlayers.map(p => (
                    <div key={p.id} className="flex flex-col items-center gap-1.5 shrink-0">
                        {renderGlobalAvatar(p, 'size-11')}
                        <span className="text-[8px] font-bold text-gray-400 truncate w-full text-center uppercase tracking-tighter">
                            {p.nickname || p.name.split(' ')[0]}
                        </span>
                    </div>
                ))}
                {Array.from({ length: Math.max(0, 8 - confirmedPlayers.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex flex-col items-center gap-1.5 opacity-20">
                        <div className="size-11 rounded-full border-2 border-dashed border-white/20"></div>
                        <div className="h-2 w-8 bg-white/10 rounded"></div>
                    </div>
                ))}
             </div>
        </section>

        {standings.length > 0 && (
            <section className="bg-gradient-to-br from-primary/30 to-card-dark rounded-[2.5rem] p-6 border border-primary/20 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-6 -top-6 size-32 bg-primary/10 blur-3xl rounded-full"></div>
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-5xl drop-shadow-[0_0_15px_rgba(96,122,251,0.5)]">emoji_events</span>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Grande Vencedor</p>
                            <h3 className="text-2xl font-black text-white leading-tight">{standings[0].teamName}</h3>
                        </div>
                    </div>

                    {/* Imagens dos Vencedores */}
                    <div className="flex -space-x-3 mb-2">
                        {standings[0].players.map(p => (
                            <div key={p.id} className="ring-4 ring-card-dark rounded-full">
                                {renderGlobalAvatar(p, 'size-16')}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full justify-center">
                        <div className="flex flex-col items-center bg-black/20 px-4 py-2 rounded-2xl border border-white/5 min-w-[80px]">
                            <span className="text-lg font-black text-white">{standings[0].wins}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">Vitórias</span>
                        </div>
                        <div className="flex flex-col items-center bg-black/20 px-4 py-2 rounded-2xl border border-white/5 min-w-[80px]">
                            <span className="text-lg font-black text-primary">+{standings[0].pointsDiff}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">Saldo</span>
                        </div>
                    </div>
                </div>
            </section>
        )}

        <div className="space-y-8">
            {rounds.map(round => (
                <div key={round} className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ronda {round}</span>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="flex flex-col gap-4">
                        {matches.filter(m => m.round === round).map(match => {
                            const team1Wins = match.score1 > match.score2;
                            const team2Wins = match.score2 > match.score1;
                            
                            return (
                                <div key={match.id} className="bg-card-dark rounded-3xl border border-white/5 p-5 shadow-lg flex flex-col gap-4 relative overflow-hidden group">
                                    <div className="flex items-center justify-between text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/5 pb-3">
                                        <span>Campo {match.court}</span>
                                        <span className="text-primary">Finalizado</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className={`flex flex-col items-center gap-2 flex-1 transition-all duration-500 ${team2Wins ? 'opacity-40 grayscale' : 'scale-105'}`}>
                                            <div className="flex -space-x-2">
                                                {match.team1.map(p => <div key={p.id}>{renderGlobalAvatar(p, 'size-8')}</div>)}
                                            </div>
                                            <span className={`text-[9px] font-black text-center leading-tight ${team1Wins ? 'text-primary' : 'text-white'}`}>
                                                {match.team1.map(p => p.nickname || p.name.split(' ')[0]).join('/')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 bg-background-dark/50 px-4 py-2 rounded-2xl border border-white/5">
                                            <span className={`text-2xl font-black ${team1Wins ? 'text-primary' : 'text-gray-600'}`}>{match.score1}</span>
                                            <span className="text-gray-800 font-black">-</span>
                                            <span className={`text-2xl font-black ${team2Wins ? 'text-primary' : 'text-gray-600'}`}>{match.score2}</span>
                                        </div>

                                        <div className={`flex flex-col items-center gap-2 flex-1 transition-all duration-500 ${team1Wins ? 'opacity-40 grayscale' : 'scale-105'}`}>
                                            <div className="flex -space-x-2">
                                                {match.team2.map(p => <div key={p.id}>{renderGlobalAvatar(p, 'size-8')}</div>)}
                                            </div>
                                            <span className={`text-[9px] font-black text-center leading-tight ${team2Wins ? 'text-primary' : 'text-white'}`}>
                                                {match.team2.map(p => p.nickname || p.name.split(' ')[0]).join('/')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

        {/* Botão de Partilha no Final */}
        <section className="mt-4 pb-12">
            <button 
                onClick={handleShare}
                className="w-full bg-primary text-background-dark font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined">share</span>
                PARTILHAR RESULTADOS
            </button>
            <p className="text-center text-[9px] text-gray-600 font-bold uppercase mt-4 tracking-widest">Padel Pro Manager v1.0</p>
        </section>
    </div>
  );
};

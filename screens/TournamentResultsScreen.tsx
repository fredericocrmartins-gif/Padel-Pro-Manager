
import React, { useMemo } from 'react';
import { Screen, Match, Player } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface ResultsProps {
  setScreen: (screen: Screen) => void;
  matches?: Match[];
}

export const TournamentResultsScreen: React.FC<ResultsProps> = ({ setScreen, matches = [] }) => {
  
  const standings = useMemo(() => {
    const stats = new Map<string, { id: string, teamName: string, wins: number, pointsDiff: number, players: Player[] }>();
    const getStats = (team: Player[]) => {
        const key = team.map(p => p.id).sort().join('-');
        if (!stats.has(key)) stats.set(key, { id: key, teamName: team.map(p => p.nickname || p.name.split(' ')[0]).join(' & '), wins: 0, pointsDiff: 0, players: team });
        return stats.get(key)!;
    };
    matches.forEach(m => {
        const s1 = getStats(m.team1), s2 = getStats(m.team2);
        s1.pointsDiff += (m.score1 - m.score2); s2.pointsDiff += (m.score2 - m.score1);
        if (m.score1 > m.score2) s1.wins++; else if (m.score2 > m.score1) s2.wins++;
    });
    return Array.from(stats.values()).sort((a, b) => b.wins - a.wins || b.pointsDiff - a.pointsDiff);
  }, [matches]);

  const winner = standings[0];

  const handleShare = async () => {
    if (standings.length === 0) return;

    // Data de hoje (assumindo que o resultado é de agora)
    const today = new Date().toLocaleDateString('pt-PT');

    let shareText = `🎾 *PADEL PRO - RELATÓRIO FINAL*\n`;
    shareText += `📅 ${today}\n\n`;
    
    shareText += `🏆 *CAMPEÕES*\n`;
    shareText += `🔥 ${winner.teamName.toUpperCase()}\n`;
    shareText += `✨ ${winner.wins} Vitórias (Saldo ${winner.pointsDiff > 0 ? '+' : ''}${winner.pointsDiff})\n\n`;
    
    shareText += `📊 *CLASSIFICAÇÃO GERAL*\n`;
    standings.forEach((team, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🔹';
        const saldo = team.pointsDiff > 0 ? `+${team.pointsDiff}` : `${team.pointsDiff}`;
        shareText += `${medal} ${team.teamName}\n   └ ${team.wins}V | ${saldo} pts\n`;
    });

    shareText += `\n🚀 _Gerado por Padel Pro Manager_`;

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Resultados Padel',
                text: shareText
            });
        } else {
            await navigator.clipboard.writeText(shareText);
            alert('Relatório copiado para a área de transferência!');
        }
    } catch (err) {
        console.error('Erro ao partilhar:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 pb-32 animate-fade-in bg-background-dark min-h-screen">
        <header className="py-8 text-center">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Torneio Terminado</span>
            <h1 className="text-2xl font-black text-white mt-1">Classificação Final</h1>
        </header>
        
        {winner && (
            <section className="flex flex-col items-center mb-10 animate-fade-in-up">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150"></div>
                    <div className="relative bg-card-dark border border-primary/30 p-6 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center size-56">
                        <span className="material-symbols-outlined text-primary text-[60px] opacity-20 absolute top-4">emoji_events</span>
                        
                        {/* Imagens dos Vencedores */}
                        <div className="flex -space-x-4 mb-4 relative z-10">
                            {winner.players.map((p, idx) => (
                                <div key={p.id} className={`ring-4 ring-card-dark rounded-full shadow-2xl transform ${idx === 0 ? '-rotate-6' : 'rotate-6'}`}>
                                    {renderGlobalAvatar(p, 'size-20')}
                                </div>
                            ))}
                        </div>

                        <div className="bg-primary text-background-dark font-black px-4 py-1 rounded-xl shadow-xl whitespace-nowrap text-[9px] uppercase tracking-widest mb-2">Campeões</div>
                        <h2 className="text-white text-xl font-black text-center leading-tight max-w-[160px]">{winner.teamName}</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                        <span className="text-lg font-black text-white">{winner.wins}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase">Vitórias</span>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                        <span className="text-lg font-black text-primary">+{winner.pointsDiff}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase">Diferença</span>
                    </div>
                </div>
            </section>
        )}

        <div className="w-full bg-card-dark rounded-3xl p-6 shadow-xl border border-white/5 mb-8">
            <header className="grid grid-cols-[3rem_1fr_3rem_3rem] gap-2 pb-4 border-b border-white/10 mb-4">
                <div className="text-center text-[9px] font-black text-gray-500 uppercase tracking-widest">Pos</div>
                <div className="text-left pl-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Equipa</div>
                <div className="text-center text-[9px] font-black text-gray-500 uppercase tracking-widest">V</div>
                <div className="text-right text-[9px] font-black text-gray-500 uppercase tracking-widest">DP</div>
            </header>
            
            <div className="flex flex-col gap-4">
                {standings.map((team, idx) => (
                    <div key={idx} className="grid grid-cols-[3rem_1fr_3rem_3rem] gap-2 items-center">
                        <div className="flex justify-center">
                            <div className={`flex items-center justify-center size-8 rounded-xl font-black text-xs ${idx === 0 ? 'bg-primary text-background-dark shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                                {idx + 1}
                            </div>
                        </div>
                        <div className="pl-2 truncate font-black text-white text-sm">{team.teamName}</div>
                        <div className="text-center font-black text-white text-sm">{team.wins}</div>
                        <div className={`text-right font-black text-sm ${team.pointsDiff > 0 ? 'text-primary' : team.pointsDiff === 0 ? 'text-gray-500' : 'text-red-400'}`}>
                            {team.pointsDiff > 0 ? '+' : ''}{team.pointsDiff}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <footer className="space-y-4">
            <button 
                onClick={() => setScreen(Screen.GLOBAL_STATS)} 
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-black text-sm py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
            >
                <span className="material-symbols-outlined">bar_chart</span>
                <span>VER ESTATÍSTICAS GLOBAIS</span>
            </button>
            
            <button 
                onClick={handleShare}
                className="w-full bg-white text-background-dark font-black text-sm py-5 rounded-3xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined">share</span>
                <span>PARTILHAR NO WHATSAPP</span>
            </button>

            <button 
                onClick={() => setScreen(Screen.HOME)} 
                className="w-full text-gray-600 hover:text-white font-black text-[10px] uppercase py-2 tracking-widest text-center"
            >
                Voltar ao Início
            </button>
        </footer>
    </div>
  );
};

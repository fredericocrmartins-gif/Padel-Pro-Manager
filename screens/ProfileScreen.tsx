
import React, { useMemo, useState, useEffect } from 'react';
import { Screen, Player, Tournament, Match } from '../types';

interface ProfileProps {
  playerId: string | null;
  players: Player[];
  history: Tournament[];
  currentMatches: Match[];
  setScreen: (screen: Screen) => void;
  onUpdatePlayer?: (player: Player) => void;
  rankingHistory?: { date: string, points: number, level: string }[];
}

type TabType = 'overview' | 'ranking' | 'relations' | 'activity';

const PRESET_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 
  'bg-orange-600', 'bg-rose-600', 'bg-cyan-600', 
  'bg-amber-600', 'bg-indigo-600', 'bg-lime-600',
  'bg-pink-600'
];

const getColorForId = (id: string) => {
  const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PRESET_COLORS[sum % PRESET_COLORS.length];
};

const getInitials = (player: { name: string, lastName?: string }) => {
  const first = player.name?.[0] || '';
  const last = player.lastName?.[0] || '';
  return (first + last).toUpperCase();
};

export const renderGlobalAvatar = (p: { id: string, name: string, lastName?: string, image?: string, backgroundColor?: string }, sizeClass: string = 'size-10') => {
  const usePlaceholder = !p.image || p.image.trim() === '';
  
  if (usePlaceholder) {
    const initials = getInitials(p);
    const bgColor = p.backgroundColor || getColorForId(p.id);
    
    return (
      <div className={`${sizeClass} rounded-full ${bgColor} flex items-center justify-center border-2 border-white/20 text-white shadow-lg shrink-0 relative overflow-hidden group transition-all duration-300`}>
        <span className="material-symbols-outlined absolute text-[350%] opacity-30 pointer-events-none rotate-[-15deg] translate-x-2 translate-y-2 select-none">
          sports_tennis
        </span>
        <span className="relative z-10 text-[60%] font-black tracking-tighter select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {initials}
        </span>
      </div>
    );
  }
  
  return (
    <img 
      src={p.image} 
      className={`${sizeClass} rounded-full object-cover border-2 border-white/10 shadow-md shrink-0`} 
      alt={`${p.name} Avatar`} 
    />
  );
};

export const ProfileScreen: React.FC<ProfileProps> = ({ playerId, players, history, setScreen, onUpdatePlayer, rankingHistory = [] }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [drillDown, setDrillDown] = useState<{ title: string; type: 'matches' | 'tournaments'; items: any[] } | null>(null);
  
  const [activePerfIndex, setActivePerfIndex] = useState<number | null>(null);
  const [activeRankIndex, setActiveRankIndex] = useState<number | null>(null);

  const player = players.find(p => p.id === playerId);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editHand, setEditHand] = useState<'Destro' | 'Canhoto'>('Destro');
  const [editImage, setEditImage] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    if (player) {
        setEditFirstName(player.name);
        setEditLastName(player.lastName || '');
        setEditNickname(player.nickname || '');
        setEditHand(player.hand || 'Destro');
        setEditImage(player.image);
        setEditColor(player.backgroundColor || getColorForId(player.id));
    }
  }, [player, isEditing]);

  const stats = useMemo(() => {
    if (!playerId) return null;
    const myMatches: (Match & { date: string })[] = [];
    const myWonMatches: Match[] = [];
    const myTournaments: Tournament[] = [];
    const myWonTournaments: Tournament[] = [];
    
    const partners = new Map<string, { id: string, name: string, lastName?: string, image: string, backgroundColor?: string, wins: number, games: number, matches: Match[] }>();
    const rivals = new Map<string, { id: string, name: string, lastName?: string, image: string, backgroundColor?: string, winsAgainst: number, lossesAgainst: number, games: number, matches: Match[] }>();

    let pointsScored = 0;
    let pointsConceded = 0;

    const finishedHistory = history.filter(t => t.status === 'finished');

    finishedHistory.forEach(t => {
        const tMatches = t.matches?.filter(m => [...m.team1, ...m.team2].some(p => p.id === playerId)) || [];
        if (tMatches.length > 0) {
            myTournaments.push(t);
            
            const teamResults = new Map<string, { wins: number, diff: number, pids: string[] }>();
            t.matches?.forEach(m => {
                const k1 = m.team1.map(p => p.id).sort().join('-');
                const k2 = m.team2.map(p => p.id).sort().join('-');
                
                if (!teamResults.has(k1)) teamResults.set(k1, { wins: 0, diff: 0, pids: m.team1.map(p => p.id) });
                if (!teamResults.has(k2)) teamResults.set(k2, { wins: 0, diff: 0, pids: m.team2.map(p => p.id) });
                
                const tr1 = teamResults.get(k1)!; tr1.diff += (m.score1 - m.score2);
                const tr2 = teamResults.get(k2)!; tr2.diff += (m.score2 - m.score1);

                if (m.score1 > m.score2) tr1.wins++;
                else if (m.score2 > m.score1) tr2.wins++;
            });
            const sortedResults = Array.from(teamResults.values()).sort((a,b) => b.wins - a.wins || b.diff - a.diff);
            const winnersIds = sortedResults.length > 0 ? sortedResults[0].pids : [];
            if (winnersIds.includes(playerId)) myWonTournaments.push(t);

            tMatches.forEach(m => {
                myMatches.push({ ...m, date: t.date });
                const inTeam1 = m.team1.some(p => p.id === playerId);
                const won = inTeam1 ? m.score1 > m.score2 : m.score2 > m.score1;
                
                pointsScored += inTeam1 ? m.score1 : m.score2;
                pointsConceded += inTeam1 ? m.score2 : m.score1;

                if (won) myWonMatches.push(m);

                const myTeam = inTeam1 ? m.team1 : m.team2;
                const oppTeam = inTeam1 ? m.team2 : m.team1;

                myTeam.forEach(p => {
                    if (p.id === playerId) return;
                    if (!partners.has(p.id)) partners.set(p.id, { id: p.id, name: p.nickname || p.name, lastName: p.lastName, image: p.image, backgroundColor: p.backgroundColor, wins: 0, games: 0, matches: [] });
                    const pd = partners.get(p.id)!;
                    pd.games++; pd.matches.push(m); if (won) pd.wins++;
                });

                oppTeam.forEach(p => {
                    if (!rivals.has(p.id)) rivals.set(p.id, { id: p.id, name: p.nickname || p.name, lastName: p.lastName, image: p.image, backgroundColor: p.backgroundColor, winsAgainst: 0, lossesAgainst: 0, games: 0, matches: [] });
                    const rd = rivals.get(p.id)!;
                    rd.games++; rd.matches.push(m); if (won) rd.winsAgainst++; else rd.lossesAgainst++;
                });
            });
        }
    });

    const rivalsList = Array.from(rivals.values()).map(r => ({ ...r, balance: r.winsAgainst - r.lossesAgainst }));

    // ORDENAÇÃO CRONOLÓGICA: Da esquerda para a direita (Mais antigo -> Mais recente)
    // Regra: Por data e por ronda (1, 2, 3)
    const sortedMatches = [...myMatches].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.round - b.round;
    });

    let maxWinStreak = 0;
    let currentStreak = 0;
    sortedMatches.forEach(m => {
        const inT1 = m.team1.some(p => p.id === playerId);
        const won = inT1 ? m.score1 > m.score2 : m.score2 > m.score1;
        if (won) {
            currentStreak++;
            maxWinStreak = Math.max(maxWinStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    });

    return {
        totalMatches: myMatches.length,
        totalWins: myWonMatches.length,
        winRate: myMatches.length > 0 ? Math.round((myWonMatches.length / myMatches.length) * 100) : 0,
        myTournaments,
        myWonTournaments,
        myMatches: sortedMatches,
        pointsScored,
        pointsConceded,
        maxWinStreak,
        partners: Array.from(partners.values()).sort((a,b) => b.wins - a.wins || b.games - a.games),
        victims: rivalsList.filter(r => r.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 10),
        blackBeasts: rivalsList.filter(r => r.balance < 0).sort((a,b) => a.balance - b.balance).slice(0, 10)
    };
  }, [playerId, history]);

  if (!player || !stats) return null;

  const renderPerformanceChart = () => {
    // Últimos 10 jogos ordenados cronologicamente (Esquerda = Antigo, Direita = Novo)
    const last10 = stats.myMatches.slice(-10);
    if (last10.length === 0) return null;

    return (
      <div className="bg-card-dark p-6 rounded-3xl border border-white/5 space-y-4 shadow-lg animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Performance</p>
            <h3 className="text-sm font-black text-white uppercase">Últimos 10 Jogos</h3>
          </div>
          <div className="flex gap-1">
             {last10.map((m, i) => {
               const inT1 = m.team1.some(p => p.id === playerId);
               const won = inT1 ? m.score1 > m.score2 : m.score2 > m.score1;
               return (
                 <div key={i} className={`size-1.5 rounded-full ${won ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}></div>
               );
             })}
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1.5 h-14 relative">
          {last10.map((m, idx) => {
            const inT1 = m.team1.some(p => p.id === playerId);
            const won = inT1 ? m.score1 > m.score2 : m.score2 > m.score1;
            const isActive = activePerfIndex === idx;
            const partner = (inT1 ? m.team1 : m.team2).find(p => p.id !== playerId)?.nickname || 'N/A';
            const opponents = (inT1 ? m.team2 : m.team1).map(p => p.nickname || p.name.split(' ')[0]).join(' & ');

            return (
              <div key={idx} className="relative">
                <button
                  onClick={() => setActivePerfIndex(isActive ? null : idx)}
                  className={`w-full h-full rounded-lg transition-all transform active:scale-95 flex flex-col items-center justify-center border-2 ${won ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'} ${isActive ? 'ring-2 ring-primary scale-110 z-10' : 'opacity-80'}`}
                >
                  <span className={`text-[11px] font-black ${won ? 'text-emerald-400' : 'text-red-400'}`}>
                    {won ? 'V' : 'D'}
                  </span>
                  <span className="text-[7px] font-black text-gray-600">R{m.round}</span>
                </button>
                
                {isActive && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 animate-fade-in-up">
                    <div className="bg-primary text-background-dark p-3 rounded-2xl shadow-2xl whitespace-nowrap border border-white/20 min-w-[140px]">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{new Date(m.date).toLocaleDateString('pt-PT')}</span>
                          <span className="text-[8px] font-black bg-background-dark/20 px-1.5 py-0.5 rounded-full">RONDA {m.round}</span>
                      </div>
                      <p className="text-sm font-black text-center my-1">{m.score1} — {m.score2}</p>
                      <div className="space-y-0.5 mt-2 border-t border-background-dark/10 pt-1">
                          <p className="text-[7px] font-bold uppercase truncate">Com: {partner}</p>
                          <p className="text-[7px] font-bold uppercase truncate opacity-70">Vs: {opponents}</p>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-primary"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between px-1 text-[8px] font-black text-gray-600 uppercase tracking-widest">
            <span>Mais Antigo</span>
            <span>Mais Recente</span>
        </div>
      </div>
    );
  };

  const renderRankingChart = () => {
    if (rankingHistory.length < 2) return (
        <div className="h-48 flex flex-col items-center justify-center text-gray-600 bg-white/5 rounded-3xl border border-white/5">
            <span className="material-symbols-outlined text-4xl mb-2">monitoring</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Aguardando mais jogos...</p>
        </div>
    );

    const width = 340;
    const height = 180;
    const paddingX = 30;
    const paddingY = 20;
    
    const pts = rankingHistory.map(h => h.points);
    const maxPts = Math.max(...pts) + 50;
    const minPts = Math.min(...pts) - 50;
    const range = Math.max(100, maxPts - minPts);

    const points = rankingHistory.map((h, i) => ({
        x: paddingX + (i * ((width - (paddingX * 2)) / (rankingHistory.length - 1))),
        y: (height - paddingY) - ((h.points - minPts) * ((height - paddingY * 2) / range)),
        data: h
    }));

    const d = points.reduce((acc, p, i) => i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');

    return (
        <div className="bg-card-dark p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Evolução do Ranking</p>
                    <h3 className="text-sm font-black text-white uppercase">{player.level} — {player.rankingPoints} pts</h3>
                </div>
                <div className="text-right">
                    <span className="material-symbols-outlined text-primary/30 animate-pulse">trending_up</span>
                </div>
            </div>
            
            <div className="relative h-[220px]">
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height + 40}`} className="overflow-visible">
                    {/* Linhas de grelha horizontais */}
                    <line x1={paddingX} y1={paddingY} x2={width-paddingX} y2={paddingY} stroke="white" strokeOpacity="0.05" strokeDasharray="4" />
                    <line x1={paddingX} y1={height/2} x2={width-paddingX} y2={height/2} stroke="white" strokeOpacity="0.05" strokeDasharray="4" />
                    <line x1={paddingX} y1={height-paddingY} x2={width-paddingX} y2={height-paddingY} stroke="white" strokeOpacity="0.05" strokeDasharray="4" />

                    {/* Linha do Gráfico */}
                    <path d={d} fill="none" stroke="#607AFB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Pontos Interativos */}
                    {points.map((p, i) => {
                      const isSelected = activeRankIndex === i;
                      return (
                        <g key={i}>
                           <circle 
                              cx={p.x} cy={p.y} r={isSelected ? "8" : "5"} 
                              fill={isSelected ? "#607AFB" : "#0f1323"} 
                              stroke="#607AFB" strokeWidth="2"
                              className="cursor-pointer transition-all duration-300"
                              onClick={() => setActiveRankIndex(isSelected ? null : i)}
                           />
                           {isSelected && (
                             <foreignObject x={p.x - 45} y={p.y - 70} width="90" height="60" className="overflow-visible pointer-events-none">
                                <div className="bg-white text-background-dark p-2 rounded-2xl shadow-2xl flex flex-col items-center animate-fade-in-up border border-primary/20">
                                   <span className="text-[8px] font-black uppercase tracking-tighter opacity-70 leading-none mb-1">{p.data.date}</span>
                                   <span className="text-xs font-black">{p.data.points} pts</span>
                                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                </div>
                             </foreignObject>
                           )}
                        </g>
                      );
                    })}

                    {/* Labels de Datas no Eixo X */}
                    {points.length > 0 && (
                      <>
                        <text x={points[0].x} y={height + 25} textAnchor="start" fontSize="8" fontWeight="900" fill="#4b5563" className="uppercase tracking-tighter">{points[0].data.date}</text>
                        {points.length > 2 && (
                          <text x={points[Math.floor(points.length/2)].x} y={height + 25} textAnchor="middle" fontSize="8" fontWeight="900" fill="#4b5563" className="uppercase tracking-tighter opacity-50">{points[Math.floor(points.length/2)].data.date}</text>
                        )}
                        <text x={points[points.length-1].x} y={height + 25} textAnchor="end" fontSize="8" fontWeight="900" fill="#4b5563" className="uppercase tracking-tighter">{points[points.length-1].data.date}</text>
                      </>
                    )}
                </svg>
            </div>
            <p className="text-[8px] text-gray-500 font-bold text-center uppercase tracking-widest mt-2 opacity-50">Toca num ponto para ver detalhes da data</p>
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-32 animate-fade-in bg-background-dark min-h-screen">
      <header className="px-4 pt-8 flex flex-col items-center relative">
        <button onClick={() => setIsEditing(true)} className="absolute top-8 right-6 size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 border border-white/10">
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110"></div>
          {renderGlobalAvatar(player, 'size-24')}
          <div className="absolute -bottom-1 -right-1 bg-primary text-background-dark text-[10px] font-black px-2 py-0.5 rounded-md border-2 border-background-dark shadow-lg">
             {player.level.toUpperCase()}
          </div>
        </div>
        <h1 className="text-2xl font-black text-white leading-tight">{player.name} {player.lastName}</h1>
        <div className="flex items-center gap-2 mt-1">
            {player.nickname && <p className="text-gray-400 text-xs font-bold">"{player.nickname}"</p>}
            <span className="text-gray-600 text-[10px]">•</span>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest">{player.hand || 'Destro'}</p>
        </div>
      </header>

      <div className="px-4">
          <div className="flex bg-card-dark/50 p-1 rounded-2xl border border-white/5 overflow-x-auto hide-scrollbar">
              {[
                { id: 'overview', label: 'Geral', icon: 'dashboard' },
                { id: 'ranking', label: 'Ranking', icon: 'monitoring' },
                { id: 'relations', label: 'Relações', icon: 'groups' },
                { id: 'activity', label: 'Histórico', icon: 'history' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as TabType)} 
                  className={`flex-1 min-w-[80px] py-3 flex flex-col items-center gap-1 rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary text-background-dark shadow-lg' : 'text-gray-500'}`}
                >
                    <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                    <span className="text-[8px] font-black uppercase">{tab.label}</span>
                </button>
              ))}
          </div>
      </div>

      <div className="px-4 space-y-6">
          {activeTab === 'overview' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3">
                      <div className="bg-card-dark p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-sm">
                          <span className="text-xl font-black text-white">{stats.totalMatches}</span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase">Jogos</span>
                      </div>
                      <div className="bg-card-dark p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-sm">
                          <span className="text-xl font-black text-primary">{stats.totalWins}</span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase">Vitórias</span>
                      </div>
                      <div className="bg-card-dark p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-sm">
                          <span className="text-xl font-black text-emerald-400">{stats.winRate}%</span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase">WR</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card-dark border border-white/5 p-4 rounded-2xl flex flex-col items-center shadow-sm">
                        <span className="material-symbols-outlined text-primary text-xl mb-1">local_fire_department</span>
                        <span className="text-xl font-black text-white">{stats.maxWinStreak}</span>
                        <span className="text-[8px] text-gray-500 uppercase font-bold">Streak Max</span>
                    </div>
                    <div className="bg-card-dark border border-white/5 p-4 rounded-2xl flex flex-col items-center shadow-sm">
                        <span className="material-symbols-outlined text-yellow-500 text-xl mb-1">emoji_events</span>
                        <span className="text-xl font-black text-white">{stats.myWonTournaments.length}</span>
                        <span className="text-[8px] text-gray-500 uppercase font-bold">Títulos</span>
                    </div>
                    <div className="bg-card-dark border border-white/5 p-4 rounded-2xl flex flex-col items-center shadow-sm">
                        <span className="material-symbols-outlined text-blue-400 text-xl mb-1">event_available</span>
                        <span className="text-xl font-black text-white">{stats.myTournaments.length}</span>
                        <span className="text-[8px] text-gray-500 uppercase font-bold">Presença</span>
                    </div>
                  </div>
                  {renderPerformanceChart()}
              </div>
          )}

          {activeTab === 'ranking' && (
              <div className="space-y-4 animate-fade-in">
                  {renderRankingChart()}
                  <div className="bg-primary/10 p-5 rounded-3xl border border-primary/20">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Sistema de Pontuação</p>
                      <ul className="space-y-2">
                          <li className="flex items-center gap-2 text-[10px] text-gray-300"><span className="size-1 bg-primary rounded-full"></span> Vitória em Jogo: +20 pts</li>
                          <li className="flex items-center gap-2 text-[10px] text-gray-300"><span className="size-1 bg-primary rounded-full"></span> Vitória em Torneio: +50 pts</li>
                          <li className="flex items-center gap-2 text-[10px] text-gray-300"><span className="size-1 bg-primary rounded-full"></span> Derrota em Jogo: -12 pts</li>
                      </ul>
                  </div>
              </div>
          )}

          {activeTab === 'relations' && (
              <div className="space-y-6 animate-fade-in">
                  <section>
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Sinergia (Melhores Parceiros)</h3>
                      <div className="flex flex-col gap-2">
                          {stats.partners.slice(0, 4).map(p => (
                              <div key={p.id} className="bg-card-dark p-3 rounded-2xl border border-white/5 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {renderGlobalAvatar(p, 'size-10')}
                                    <div>
                                        <span className="text-xs font-black text-white block">{p.name} {p.lastName || ''}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] text-gray-500 font-bold">{p.games} Jogos ({p.wins}V)</span>
                                        </div>
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-1">
                                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-primary" style={{ width: `${(p.wins/p.games)*100}%` }}></div>
                                      </div>
                                      <p className="text-[9px] font-black text-primary">{Math.round((p.wins / p.games) * 100)}% WR</p>
                                  </div>
                              </div>
                          ))}
                          {stats.partners.length === 0 && (
                            <div className="text-center p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-[10px] text-gray-500 font-bold uppercase">Sem parceiros registados</div>
                          )}
                      </div>
                  </section>
                  
                  <section>
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Confronto Direto</h3>
                      <div className="grid grid-cols-1 gap-4">
                          
                          {/* Melhores (Green) */}
                          <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase">Fregueses (Saldo Positivo)</span>
                                </div>
                                {stats.victims.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-white/5 text-center text-[10px] text-gray-500 font-bold uppercase border border-dashed border-white/10">Sem vantagem significativa</div>
                                ) : (
                                    stats.victims.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-card-dark border border-emerald-500/20 rounded-2xl relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                            <div className="flex items-center gap-3">
                                                {renderGlobalAvatar(r, 'size-9')}
                                                <div>
                                                    <div className="text-xs font-black text-white">{r.name} {r.lastName || ''}</div>
                                                    <div className="text-[9px] text-gray-500 font-bold mt-0.5">Ganhou {r.winsAgainst} / Perdeu {r.lossesAgainst}</div>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-500/10 text-emerald-400 font-black text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                                                +{r.balance}
                                            </div>
                                        </div>
                                    ))
                                )}
                          </div>

                          {/* Piores (Red) */}
                          <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-red-500 text-sm">trending_down</span>
                                    <span className="text-[10px] font-black text-red-500 uppercase">Pesadelos (Saldo Negativo)</span>
                                </div>
                                {stats.blackBeasts.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-white/5 text-center text-[10px] text-gray-500 font-bold uppercase border border-dashed border-white/10">Sem desvantagem significativa</div>
                                ) : (
                                    stats.blackBeasts.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-card-dark border border-red-500/20 rounded-2xl relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                            <div className="flex items-center gap-3">
                                                {renderGlobalAvatar(r, 'size-9')}
                                                <div>
                                                    <div className="text-xs font-black text-white">{r.name} {r.lastName || ''}</div>
                                                    <div className="text-[9px] text-gray-500 font-bold mt-0.5">Ganhou {r.winsAgainst} / Perdeu {r.lossesAgainst}</div>
                                                </div>
                                            </div>
                                            <div className="bg-red-500/10 text-red-400 font-black text-xs px-2.5 py-1.5 rounded-lg border border-red-500/20">
                                                {r.balance}
                                            </div>
                                        </div>
                                    ))
                                )}
                          </div>

                      </div>
                  </section>
              </div>
          )}

          {activeTab === 'activity' && (
              <div className="space-y-4 animate-fade-in">
                  <button onClick={() => setDrillDown({ title: 'Jogos Realizados', type: 'matches', items: stats.myMatches })} className="w-full bg-card-dark p-5 rounded-2xl border border-white/5 flex justify-between items-center group active:scale-95 transition-all">
                      <div><p className="text-sm font-black text-white">Todos os Jogos</p><p className="text-[10px] text-gray-500 uppercase">{stats.myMatches.length} Entradas</p></div>
                      <span className="material-symbols-outlined text-primary">chevron_right</span>
                  </button>
                  <button onClick={() => setDrillDown({ title: 'Torneios Disputados', type: 'tournaments', items: stats.myTournaments })} className="w-full bg-card-dark p-5 rounded-2xl border border-white/5 flex justify-between items-center group active:scale-95 transition-all">
                      <div><p className="text-sm font-black text-white">Torneios</p><p className="text-[10px] text-gray-500 uppercase">{stats.myTournaments.length} Participações</p></div>
                      <span className="material-symbols-outlined text-primary">chevron_right</span>
                  </button>
              </div>
          )}
      </div>

      {isEditing && (
          <div className="fixed inset-0 z-[110] bg-background-dark/95 backdrop-blur-xl animate-fade-in flex flex-col p-4 overflow-y-auto">
              <header className="flex items-center justify-between mb-8 shrink-0">
                  <h2 className="text-xl font-bold">Editar Perfil</h2>
                  <button onClick={() => setIsEditing(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white"><span className="material-symbols-outlined">close</span></button>
              </header>
              <div className="space-y-8">
                  <div className="flex flex-col items-center gap-4 py-4 shrink-0">
                    {renderGlobalAvatar({ id: player.id, name: editFirstName || 'J', lastName: editLastName || 'P', image: editImage, backgroundColor: editColor }, 'size-28')}
                    <div className="w-full space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cor do Fundo</label>
                        <div className="grid grid-cols-5 gap-3">
                            {PRESET_COLORS.map(color => (
                                <button 
                                  key={color} 
                                  onClick={() => setEditColor(color)} 
                                  className={`size-11 rounded-full ${color} border-2 transition-transform active:scale-90 ${editColor === color ? 'border-primary scale-110 shadow-[0_0_15px_rgba(96,122,251,0.4)]' : 'border-transparent opacity-60'}`}
                                ></button>
                            ))}
                        </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Imagem URL</label>
                        <input type="text" value={editImage} onChange={(e) => setEditImage(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm" placeholder="URL para foto (opcional)" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome</label>
                            <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Apelido</label>
                            <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Alcunha</label>
                        <input type="text" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} className="w-full bg-card-dark border border-primary/30 rounded-xl px-4 py-3 text-white text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mão de Jogo</label>
                        <div className="flex bg-card-dark rounded-xl p-1 border border-white/10">
                            <button 
                                onClick={() => setEditHand('Destro')}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${editHand === 'Destro' ? 'bg-primary text-background-dark shadow-md' : 'text-gray-500'}`}
                            >
                                Destro
                            </button>
                            <button 
                                onClick={() => setEditHand('Canhoto')}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${editHand === 'Canhoto' ? 'bg-primary text-background-dark shadow-md' : 'text-gray-500'}`}
                            >
                                Canhoto
                            </button>
                        </div>
                    </div>
                  </div>
              </div>
              <div className="mt-12 pb-6">
                <button onClick={() => { if(onUpdatePlayer) { onUpdatePlayer({...player, name: editFirstName, lastName: editLastName, nickname: editNickname, hand: editHand, image: editImage, backgroundColor: editColor}); setIsEditing(false); } }} className="w-full py-4 bg-primary text-background-dark font-bold rounded-2xl shadow-xl shadow-primary/20">Guardar Alterações</button>
              </div>
          </div>
      )}

      {drillDown && (
          <div className="fixed inset-0 z-[120] bg-background-dark/98 backdrop-blur-xl p-4 flex flex-col animate-fade-in">
              <header className="flex items-center justify-between mb-6">
                  <div><h2 className="text-xl font-bold text-white">{drillDown.title}</h2><p className="text-[10px] text-gray-500 uppercase font-black">{drillDown.items.length} Itens</p></div>
                  <button onClick={() => setDrillDown(null)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white"><span className="material-symbols-outlined">close</span></button>
              </header>
              <div className="flex-1 overflow-y-auto space-y-3 pb-24 hide-scrollbar">
                  {drillDown.type === 'matches' ? (
                      drillDown.items.map((m: Match, idx: number) => {
                          const inT1 = m.team1.some(p => p.id === playerId);
                          const won = (inT1 ? m.score1 : m.score2) > (inT1 ? m.score2 : m.score1);
                          return (
                              <div key={idx} className={`bg-card-dark p-4 rounded-2xl border ${won ? 'border-primary/20' : 'border-white/5'} flex justify-between items-center`}>
                                  <div className="flex-1 text-[10px] font-bold text-white truncate text-right">{m.team1.map(p => p.nickname || p.name.split(' ')[0]).join('/')}</div>
                                  <div className="mx-4 flex items-center gap-2 bg-background-dark px-3 py-1 rounded-lg">
                                      <span className={`text-sm font-black ${m.score1 > m.score2 ? 'text-primary' : 'text-gray-500'}`}>{m.score1}</span>
                                      <span className="text-gray-700">-</span>
                                      <span className={`text-sm font-black ${m.score2 > m.score1 ? 'text-primary' : 'text-gray-500'}`}>{m.score2}</span>
                                  </div>
                                  <div className="flex-1 text-[10px] font-bold text-white truncate text-left">{m.team2.map(p => p.nickname || p.name.split(' ')[0]).join('/')}</div>
                              </div>
                          );
                      })
                  ) : (
                    drillDown.items.map((t: Tournament, idx: number) => (
                        <div key={idx} className="bg-card-dark p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                            <div><p className="text-sm font-bold text-white">{new Date(t.date).toLocaleDateString('pt-PT')}</p><p className="text-[10px] text-gray-500 uppercase">{t.matches?.length || 0} Jogos</p></div>
                            <span className="material-symbols-outlined text-primary">chevron_right</span>
                        </div>
                    ))
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

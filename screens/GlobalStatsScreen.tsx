
import React, { useState, useMemo } from 'react';
import { Tournament, Player, Match, Location, Screen } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface GlobalStatsProps {
  history?: Tournament[];
  players?: Player[];
  locations?: Location[];
  onViewTournament?: (tournament: Tournament) => void;
  onViewPlayer?: (id: string) => void;
}

interface PlayerStats extends Player {
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsScored: number;
  pointsConceded: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  maxWinStreak: number;
  currentStreak: number;
  balance: number;
}

type SortKey = keyof Pick<PlayerStats, 'gamesPlayed' | 'wins' | 'losses' | 'balance' | 'pointsScored' | 'pointsConceded' | 'tournamentsWon'>;

export const GlobalStatsScreen: React.FC<GlobalStatsProps> = ({ history = [], players = [], locations = [], onViewTournament, onViewPlayer }) => {
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'year'>('all');
  const [drillDown, setDrillDown] = useState<{ title: string; type: string; data: any[] } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ 
    key: 'tournamentsWon', 
    direction: 'desc' 
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getWinnersOfTournament = (t: Tournament) => {
    if (!t.matches || t.matches.length === 0) return null;
    
    const stats = new Map<string, { wins: number, diff: number, pids: string[] }>();
    t.matches.forEach(m => {
        const k1 = m.team1.map(p => p.id).sort().join('-');
        const k2 = m.team2.map(p => p.id).sort().join('-');
        if (!stats.has(k1)) stats.set(k1, { wins: 0, diff: 0, pids: m.team1.map(p => p.id) });
        if (!stats.has(k2)) stats.set(k2, { wins: 0, diff: 0, pids: m.team2.map(p => p.id) });
        const s1 = stats.get(k1)!, s2 = stats.get(k2)!;
        s1.diff += (m.score1 - m.score2); s2.diff += (m.score2 - m.score1);
        if (m.score1 > m.score2) s1.wins++; else if (m.score2 > m.score1) s2.wins++;
    });
    
    const standings = Array.from(stats.values()).sort((a, b) => b.wins - a.wins || b.diff - a.diff);
    if (standings.length === 0) return null;
    
    return standings[0].pids.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p);
  };

  const filteredHistory = useMemo(() => {
    const finished = history.filter(t => t.status === 'finished');
    if (timeRange === 'all') return finished;
    const now = new Date();
    return finished.filter(t => {
      const tDate = new Date(t.date);
      if (timeRange === 'month') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (timeRange === 'year') return tDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [history, timeRange]);

  const stats = useMemo(() => {
    const pStats = new Map<string, PlayerStats>();
    const duoStats = new Map<string, { wins: number, games: number, p1: Player, p2: Player }>();
    const locStats = new Map<string, number>();
    
    let totalMatches = 0;
    let totalPoints = 0;
    let allMatches: (Match & { tournamentId: string, locationName: string })[] = [];

    players.forEach(p => {
      pStats.set(p.id, { 
        ...p, gamesPlayed: 0, wins: 0, losses: 0, 
        pointsScored: 0, pointsConceded: 0, 
        tournamentsPlayed: 0, tournamentsWon: 0, 
        maxWinStreak: 0, currentStreak: 0,
        balance: 0
      });
    });

    filteredHistory.forEach(t => {
      const locationName = locations.find(l => l.id === t.locationId)?.name || 'Local N/A';
      locStats.set(t.locationId, (locStats.get(t.locationId) || 0) + 1);
      const tPlayers = new Set<string>();
      
      if (t.matches) {
        const teamResults = new Map<string, { wins: number, diff: number, ids: string[] }>();

        t.matches.forEach(m => {
          allMatches.push({ ...m, tournamentId: t.id, locationName });
          totalMatches++;
          totalPoints += (m.score1 + m.score2);
          
          const k1 = m.team1.map(p => p.id).sort().join('-');
          const k2 = m.team2.map(p => p.id).sort().join('-');
          
          if (!duoStats.has(k1)) duoStats.set(k1, { wins: 0, games: 0, p1: m.team1[0], p2: m.team1[1] });
          if (!duoStats.has(k2)) duoStats.set(k2, { wins: 0, games: 0, p1: m.team2[0], p2: m.team2[1] });
          
          const ds1 = duoStats.get(k1)!; ds1.games++;
          const ds2 = duoStats.get(k2)!; ds2.games++;

          if (!teamResults.has(k1)) teamResults.set(k1, { wins: 0, diff: 0, ids: m.team1.map(p => p.id) });
          if (!teamResults.has(k2)) teamResults.set(k2, { wins: 0, diff: 0, ids: m.team2.map(p => p.id) });
          
          const tr1 = teamResults.get(k1)!; tr1.diff += (m.score1 - m.score2);
          const tr2 = teamResults.get(k2)!; tr2.diff += (m.score2 - m.score1);

          if (m.score1 > m.score2) {
             ds1.wins++; tr1.wins++;
          } else if (m.score2 > m.score1) {
             ds2.wins++; tr2.wins++;
          }

          [m.team1, m.team2].forEach((team, idx) => {
             const isT1 = idx === 0;
             const won = isT1 ? m.score1 > m.score2 : m.score2 > m.score1;
             team.forEach(p => {
                tPlayers.add(p.id);
                const ps = pStats.get(p.id);
                if (ps) {
                  ps.gamesPlayed++;
                  ps.pointsScored += isT1 ? m.score1 : m.score2;
                  ps.pointsConceded += isT1 ? m.score2 : m.score1;
                  if (won) { ps.wins++; ps.currentStreak++; ps.maxWinStreak = Math.max(ps.maxWinStreak, ps.currentStreak); }
                  else { ps.losses++; ps.currentStreak = 0; }
                  ps.balance = ps.wins - ps.losses;
                }
             });
          });
        });

        const sortedStandings = Array.from(teamResults.values()).sort((a, b) => b.wins - a.wins || b.diff - a.diff);
        if (sortedStandings.length > 0) {
          const winners = sortedStandings[0].ids;
          winners.forEach(id => {
            const ps = pStats.get(id);
            if (ps) ps.tournamentsWon++;
          });
        }
      }
      tPlayers.forEach(id => { const ps = pStats.get(id); if (ps) ps.tournamentsPlayed++; });
    });

    const activePlayers = Array.from(pStats.values()).filter(p => p.gamesPlayed > 0);
    const duos = Array.from(duoStats.values())
      .filter(d => d.games >= 2)
      .map(d => ({ ...d, winRate: Math.round((d.wins / d.games) * 100) }))
      .sort((a,b) => b.winRate - a.winRate || b.games - a.games);

    const locationsRanked = Array.from(locStats.entries())
      .map(([id, count]) => ({ ...locations.find(l => l.id === id), count }))
      .sort((a,b) => b.count - a.count);

    const matchEquilibrium = [...allMatches].sort((a,b) => Math.abs(a.score1 - a.score2) - Math.abs(b.score1 - b.score2));
    const matchUnbalanced = [...allMatches].sort((a,b) => Math.abs(b.score1 - b.score2) - Math.abs(a.score1 - a.score2));

    const tournamentEquilibrium = filteredHistory.map(t => {
      const diffs = t.matches?.map(m => Math.abs(m.score1 - m.score2)) || [];
      const avgDiff = diffs.length > 0 ? diffs.reduce((a,b) => a+b, 0) / diffs.length : 99;
      const totalPts = t.matches?.reduce((a,b) => a + b.score1 + b.score2, 0) || 0;
      return { ...t, avgDiff, totalPts, locName: locations.find(l => l.id === t.locationId)?.name };
    }).sort((a,b) => a.avgDiff - b.avgDiff);

    const tournamentMostPoints = [...tournamentEquilibrium].sort((a,b) => b.totalPts - a.totalPts);

    return {
      totalTournaments: filteredHistory.length,
      totalMatches,
      totalPoints,
      activePlayers,
      mostWins: [...activePlayers].sort((a,b) => b.wins - a.wins),
      mostAttendance: [...activePlayers].sort((a,b) => b.tournamentsPlayed - a.tournamentsPlayed),
      mostPointsELO: [...activePlayers].sort((a,b) => (b.rankingPoints || 0) - (a.rankingPoints || 0)),
      mostStreaks: [...activePlayers].sort((a,b) => b.maxWinStreak - a.maxWinStreak),
      duos,
      locationsRanked,
      matchEquilibrium,
      matchUnbalanced,
      tournamentEquilibrium,
      tournamentMostPoints
    };
  }, [filteredHistory, players, locations]);

  // Novo Memo para ordenar os jogadores ativos dinamicamente
  const sortedActivePlayers = useMemo(() => {
    return [...stats.activePlayers].sort((a, b) => {
      const valA = a[sortConfig.key] as number;
      const valB = b[sortConfig.key] as number;
      
      if (sortConfig.direction === 'desc') {
        return valB - valA || (b.rankingPoints || 0) - (a.rankingPoints || 0);
      }
      return valA - valB || (a.rankingPoints || 0) - (b.rankingPoints || 0);
    });
  }, [stats.activePlayers, sortConfig]);

  const StatBox = ({ label, value, sub, icon, color, onClick }: any) => (
    <button onClick={onClick} className="bg-card-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-2 text-left active:scale-95 transition-all group">
      <div className={`size-10 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color} group-hover:bg-${color}/20 transition-colors`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
        {sub && <p className="text-[9px] font-bold text-gray-600 uppercase">{sub}</p>}
      </div>
    </button>
  );

  const SortHeader = ({ label, sortKey, align = 'center' }: { label: string, sortKey: SortKey, align?: 'center' | 'left' | 'right' }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th 
        onClick={() => handleSort(sortKey)} 
        className={`px-2 py-3 text-[8px] font-black uppercase cursor-pointer select-none transition-colors active:bg-white/10 ${isActive ? 'text-primary' : 'text-gray-500'}`}
      >
        <div className={`flex items-center gap-0.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          {label}
          {isActive ? (
            <span className="material-symbols-outlined text-[12px]">
              {sortConfig.direction === 'desc' ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
            </span>
          ) : (
            <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100">unfold_more</span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in bg-background-dark min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Central <span className="text-primary">Global</span></h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Dashboard de Performance</p>
        </div>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
          {['all', 'month', 'year'].map(r => (
            <button key={r} onClick={() => setTimeRange(r as any)} className={`px-3 py-1.5 text-[8px] font-black rounded-lg transition-all ${timeRange === r ? 'bg-primary text-background-dark' : 'text-gray-500'}`}>{r === 'all' ? 'TOTAL' : r === 'month' ? 'MÊS' : 'ANO'}</button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatBox label="Torneios" value={stats.totalTournaments} icon="emoji_events" color="yellow-500" onClick={() => setDrillDown({ title: 'Torneios Realizados', type: 'tournaments', data: filteredHistory })} />
        <StatBox label="Jogos" value={stats.totalMatches} sub={`${stats.totalPoints} Pontos`} icon="sports_tennis" color="primary" onClick={() => setDrillDown({ title: 'Histórico de Jogos', type: 'matches', data: stats.matchEquilibrium })} />
        <StatBox label="Ativos" value={stats.activePlayers.length} icon="group" color="emerald-400" onClick={() => setDrillDown({ title: 'Jogadores Ativos', type: 'players-attendance', data: stats.mostAttendance })} />
        <StatBox label="Clube Favorito" value={stats.locationsRanked[0]?.name || '-'} icon="location_on" color="purple-400" onClick={() => setDrillDown({ title: 'Locais Frequentes', type: 'locations', data: stats.locationsRanked })} />
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Liderança & Rankings</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setDrillDown({ title: 'Líderes de Vitórias', type: 'players-wins', data: stats.mostWins })} className="bg-card-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
            <span className="text-[8px] font-black text-primary uppercase">Vitórias Individuais</span>
            <div className="flex items-center gap-2">
              {stats.mostWins[0] && renderGlobalAvatar(stats.mostWins[0], 'size-8')}
              <div className="flex flex-col">
                <span className="text-xs font-black text-white">{stats.mostWins[0]?.nickname || stats.mostWins[0]?.name.split(' ')[0] || '-'}</span>
                <span className="text-[10px] font-bold text-gray-500">{stats.mostWins[0]?.wins || 0}V</span>
              </div>
            </div>
          </button>
          <button onClick={() => setDrillDown({ title: 'Ranking de Pontos', type: 'players-elo', data: stats.mostPointsELO })} className="bg-card-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-3">
            <span className="text-[8px] font-black text-orange-400 uppercase">Ranking ELO</span>
            <div className="flex items-center gap-2">
              {stats.mostPointsELO[0] && renderGlobalAvatar(stats.mostPointsELO[0], 'size-8')}
              <div className="flex flex-col">
                <span className="text-xs font-black text-white">{stats.mostPointsELO[0]?.nickname || stats.mostPointsELO[0]?.name.split(' ')[0] || '-'}</span>
                <span className="text-[10px] font-bold text-gray-500">{stats.mostPointsELO[0]?.rankingPoints || 0} pts</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Tabela de Ranking Geral com Ordenação */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ranking de Dados dos Jogadores</h3>
          <span className="text-[8px] text-primary font-bold uppercase tracking-wider">Clique nos títulos para ordenar</span>
        </div>
        <div className="bg-card-dark rounded-[2rem] border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-[8px] font-black text-gray-500 uppercase min-w-[120px]">Jogador</th>
                  <SortHeader label="J" sortKey="gamesPlayed" />
                  <SortHeader label="V" sortKey="wins" />
                  <SortHeader label="D" sortKey="losses" />
                  <SortHeader label="S" sortKey="balance" />
                  <SortHeader label="PG" sortKey="pointsScored" />
                  <SortHeader label="PS" sortKey="pointsConceded" />
                  <th onClick={() => handleSort('tournamentsWon')} className={`px-3 py-3 text-[8px] font-black uppercase text-center cursor-pointer transition-colors ${sortConfig.key === 'tournamentsWon' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-yellow-500/5 text-gray-500'}`}>
                    <div className="flex items-center justify-center gap-0.5">
                      Tít
                      {sortConfig.key === 'tournamentsWon' && (
                        <span className="material-symbols-outlined text-[12px]">
                          {sortConfig.direction === 'desc' ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedActivePlayers.map((p, idx) => (
                  <tr key={p.id} className={`${idx === 0 && sortConfig.key === 'tournamentsWon' ? 'bg-primary/5' : ''} active:bg-white/5 transition-colors`} onClick={() => onViewPlayer?.(p.id)}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-700 w-3 shrink-0">{idx + 1}</span>
                        {renderGlobalAvatar(p, 'size-7')}
                        <span className="text-[10px] font-black text-white">{p.nickname || p.name}</span>
                      </div>
                    </td>
                    <td className={`px-2 py-3 text-[10px] font-bold text-center ${sortConfig.key === 'gamesPlayed' ? 'text-primary' : 'text-white'}`}>{p.gamesPlayed}</td>
                    <td className={`px-2 py-3 text-[10px] font-bold text-center ${sortConfig.key === 'wins' ? 'text-emerald-400' : 'text-emerald-400/70'}`}>{p.wins}</td>
                    <td className={`px-2 py-3 text-[10px] font-bold text-center ${sortConfig.key === 'losses' ? 'text-red-400' : 'text-red-400/70'}`}>{p.losses}</td>
                    <td className={`px-2 py-3 text-[10px] font-black text-center ${sortConfig.key === 'balance' ? 'text-primary' : p.balance >= 0 ? 'text-white/80' : 'text-red-500'}`}>
                      {p.balance > 0 ? `+${p.balance}` : p.balance}
                    </td>
                    <td className={`px-2 py-3 text-[10px] font-bold text-center ${sortConfig.key === 'pointsScored' ? 'text-emerald-500' : 'text-emerald-500/50'}`}>{p.pointsScored}</td>
                    <td className={`px-2 py-3 text-[10px] font-bold text-center ${sortConfig.key === 'pointsConceded' ? 'text-red-500' : 'text-red-500/50'}`}>{p.pointsConceded}</td>
                    <td className={`px-3 py-3 text-[10px] font-black text-center ${sortConfig.key === 'tournamentsWon' ? 'text-yellow-500 bg-yellow-500/10' : 'text-yellow-500/60 bg-yellow-500/5'}`}>{p.tournamentsWon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Duplas em Destaque</h3>
        <button onClick={() => setDrillDown({ title: 'Ranking de Duplas', type: 'duos', data: stats.duos })} className="w-full bg-gradient-to-br from-primary/20 to-card-dark p-6 rounded-[2.5rem] border border-primary/20 flex flex-col gap-4 text-left shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10"><span className="material-symbols-outlined text-7xl">groups</span></div>
           <div className="flex justify-between items-start">
             <div><p className="text-[9px] font-black text-primary uppercase mb-1">Dupla Imbatível</p><h4 className="text-xl font-black text-white">{stats.duos[0] ? `${stats.duos[0].p1.name.split(' ')[0]} & ${stats.duos[0].p2.name.split(' ')[0]}` : 'Sem dados'}</h4></div>
             <div className="bg-primary/20 px-3 py-1 rounded-full text-primary text-[10px] font-black">{stats.duos[0]?.winRate || 0}% WR</div>
           </div>
           <div className="flex items-center gap-4">
             <div className="flex -space-x-3">{stats.duos[0] && renderGlobalAvatar(stats.duos[0].p1, 'size-10')}{stats.duos[0] && renderGlobalAvatar(stats.duos[0].p2, 'size-10')}</div>
             <p className="text-[10px] font-bold text-gray-500 uppercase">{stats.duos[0]?.wins} Vitórias em {stats.duos[0]?.games} Jogos</p>
           </div>
        </button>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Equilíbrio & Recordes</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setDrillDown({ title: 'Jogos Mais Equilibrados', type: 'matches-eq', data: stats.matchEquilibrium })} className="bg-card-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-2 text-left">
            <span className="text-[8px] font-black text-emerald-400 uppercase">Jogo + Equilibrado</span>
            <p className="text-xs font-black text-white truncate">{stats.matchEquilibrium[0] ? `${stats.matchEquilibrium[0].score1}-${stats.matchEquilibrium[0].score2}` : '-'}</p>
            <p className="text-[8px] text-gray-500 uppercase font-bold">{stats.matchEquilibrium[0]?.locationName || '-'}</p>
          </button>
          <button onClick={() => setDrillDown({ title: 'Jogos Mais Desequilibrados', type: 'matches-un', data: stats.matchUnbalanced })} className="bg-card-dark p-4 rounded-3xl border border-white/5 flex flex-col gap-2 text-left">
            <span className="text-[8px] font-black text-red-400 uppercase">Jogo + Desequilibrado</span>
            <p className="text-xs font-black text-white truncate">{stats.matchUnbalanced[0] ? `${stats.matchUnbalanced[0].score1}-${stats.matchUnbalanced[0].score2}` : '-'}</p>
            <p className="text-[8px] text-gray-500 uppercase font-bold">{stats.matchUnbalanced[0]?.locationName || '-'}</p>
          </button>
        </div>
      </section>

      {drillDown && (
        <div className="fixed inset-0 z-[100] bg-background-dark/98 backdrop-blur-2xl animate-fade-in flex flex-col p-4">
          <header className="flex items-center justify-between mb-8 shrink-0">
            <div>
              <h2 className="text-xl font-black text-white">{drillDown.title}</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest">{drillDown.data.length} Entradas</p>
            </div>
            <button onClick={() => setDrillDown(null)} className="size-11 rounded-full bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
          </header>
          <div className="flex-1 overflow-y-auto space-y-3 pb-24 hide-scrollbar">
            {drillDown.type.startsWith('players') && drillDown.data.map((p, i) => (
              <button key={p.id} onClick={() => { onViewPlayer?.(p.id); setDrillDown(null); }} className="w-full bg-card-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-gray-700 w-4">{i+1}</span>
                  {renderGlobalAvatar(p, 'size-10')}
                  <div><p className="text-sm font-black text-white">{p.nickname || p.name}</p><p className="text-[9px] text-gray-500 uppercase">{p.level}</p></div>
                </div>
                <p className="text-xs font-black text-primary">
                  {drillDown.type === 'players-wins' ? `${p.wins}V` : drillDown.type === 'players-streaks' ? `${p.maxWinStreak}S` : drillDown.type === 'players-elo' ? `${p.rankingPoints} pts` : `${p.tournamentsPlayed} T`}
                </p>
              </button>
            ))}
            {drillDown.type === 'duos' && drillDown.data.map((d, i) => (
              <div key={i} className="bg-card-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">{renderGlobalAvatar(d.p1, 'size-9')}{renderGlobalAvatar(d.p2, 'size-9')}</div>
                  <div><p className="text-xs font-black text-white">{d.p1.name.split(' ')[0]} & {d.p2.name.split(' ')[0]}</p><p className="text-[9px] text-gray-500">{d.games} Jogos</p></div>
                </div>
                <p className="text-sm font-black text-primary">{d.winRate}% WR</p>
              </div>
            ))}
            {drillDown.type.startsWith('matches') && drillDown.data.map((m, i) => (
              <div key={i} className="bg-card-dark p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[8px] font-black text-gray-600 uppercase mb-1"><span>Campo {m.court}</span><span>{m.locationName}</span></div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex-1 text-[10px] font-black text-white text-right">{m.team1.map((p: any) => p.nickname || p.name.split(' ')[0]).join('/')}</span>
                  <div className="bg-background-dark px-4 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                    <span className={`text-base font-black ${m.score1 > m.score2 ? 'text-primary' : 'text-gray-600'}`}>{m.score1}</span>
                    <span className="text-[10px] text-gray-800">-</span>
                    <span className={`text-base font-black ${m.score2 > m.score1 ? 'text-primary' : 'text-gray-600'}`}>{m.score2}</span>
                  </div>
                  <span className="flex-1 text-[10px] font-black text-white text-left">{m.team2.map((p: any) => p.nickname || p.name.split(' ')[0]).join('/')}</span>
                </div>
              </div>
            ))}
            {drillDown.type.startsWith('tournaments') && drillDown.data.map((t) => {
              const winners = getWinnersOfTournament(t);
              return (
              <button key={t.id} onClick={() => { onViewTournament?.(t); setDrillDown(null); }} className="w-full bg-card-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between text-left group">
                <div><p className="text-[10px] font-black text-primary uppercase">{new Date(t.date).toLocaleDateString()}</p><p className="text-sm font-black text-white">{locations.find(l => l.id === t.locationId)?.name}</p></div>
                
                {drillDown.type === 'tournaments-eq' ? (
                   <p className="text-xs font-black text-white">±{t.avgDiff.toFixed(1)} diff</p>
                ) : drillDown.type === 'tournaments-pts' ? (
                   <p className="text-xs font-black text-white">{t.totalPts} pts</p>
                ) : winners ? (
                   <div className="flex gap-2">
                      {winners.map((p: Player) => (
                          <div key={p.id} className="flex flex-col items-center gap-0.5">
                              {renderGlobalAvatar(p, 'size-8 ring-1 ring-white/10')}
                              <span className="text-[7px] font-black text-white/60 uppercase tracking-tighter truncate w-10 text-center">{p.nickname || p.name.split(' ')[0]}</span>
                          </div>
                      ))}
                   </div>
                ) : (
                   <p className="text-xs font-black text-white">{t.matches?.length || 0} Jogos</p>
                )}
              </button>
              );
            })}
            {drillDown.type === 'locations' && drillDown.data.map((loc, i) => (
              <div key={loc.id} className="bg-card-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4"><span className="text-[10px] font-black text-gray-700 w-4">{i+1}</span><div><p className="text-sm font-black text-white">{loc.name}</p><p className="text-[9px] text-gray-500 uppercase">{loc.type}</p></div></div>
                <div className="bg-primary/10 px-3 py-1 rounded-lg text-primary text-[10px] font-black">{loc.count} Torneios</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

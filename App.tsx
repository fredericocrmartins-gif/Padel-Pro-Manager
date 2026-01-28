
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Screen, Match, Player, Tournament, Location, CloudConfig } from './types';
import { Navigation } from './components/Navigation';
import { PullToRefresh } from './components/PullToRefresh';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LiveGameScreen } from './screens/LiveGameScreen';
import { TournamentResultsScreen } from './screens/TournamentResultsScreen';
import { GlobalStatsScreen } from './screens/GlobalStatsScreen';
import { TeamSetupScreen } from './screens/TeamSetupScreen';
import { PlayerListScreen } from './screens/PlayerListScreen';
import { LocationManagerScreen } from './screens/LocationManagerScreen';
import { TournamentSummaryScreen } from './screens/TournamentSummaryScreen';
import { HistoryDetailScreen } from './screens/HistoryDetailScreen';
import { TournamentHistoryScreen } from './screens/TournamentHistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tournamentHistory, setTournamentHistory] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'error'>('offline');
  const [lastErrorMessage, setLastErrorMessage] = useState<string>('');
  
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (envUrl && envKey) return { url: envUrl, key: envKey, enabled: true };
    const saved = localStorage.getItem('padel_cloud_config');
    return saved ? JSON.parse(saved) : { url: '', key: '', enabled: false };
  });

  const [currentScreen, setScreen] = useState<Screen>(Screen.HOME);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedHistoryTournament, setSelectedHistoryTournament] = useState<Tournament | null>(null);

  const isTournamentDifferent = (t1: Tournament | null, t2: Tournament | null) => {
      if (!t1 && !t2) return false;
      if (!t1 || !t2) return true;
      return JSON.stringify(t1) !== JSON.stringify(t2);
  };

  const loadLocalData = useCallback(() => {
      const p = localStorage.getItem('padel_players');
      const l = localStorage.getItem('padel_locations');
      const h = localStorage.getItem('padel_history');
      
      let loadedPlayers = p ? JSON.parse(p) : [];
      let loadedLocations = l ? JSON.parse(l) : [];
      let allTournaments = h ? JSON.parse(h) : [];

      setPlayers(loadedPlayers);
      setLocations(loadedLocations);
      return allTournaments;
  }, []);

  const fetchCloudData = useCallback(async (config: CloudConfig) => {
    if (!config.enabled || !config.url || !config.key) {
        setSyncStatus('offline');
        return null;
    }
    
    try {
      const headers = { 'apikey': config.key, 'Authorization': `Bearer ${config.key}`, 'Content-Type': 'application/json' };
      const responses = await Promise.all([
        fetch(`${config.url}/rest/v1/players?select=data`, { headers, cache: 'no-store' }),
        fetch(`${config.url}/rest/v1/locations?select=data`, { headers, cache: 'no-store' }),
        fetch(`${config.url}/rest/v1/tournaments?select=data`, { headers, cache: 'no-store' })
      ]);

      for (const res of responses) {
          if (!res.ok) {
              if (res.status === 404) {
                 throw new Error("Tabelas não encontradas no Supabase.");
              }
              const errorText = await res.text();
              throw new Error(`Erro ${res.status}: ${errorText}`);
          }
      }

      const [pRes, lRes, tRes] = await Promise.all(responses.map(r => r.json()));
      const playersData = Array.isArray(pRes) ? pRes.map((i: any) => i.data) : [];
      const locationsData = Array.isArray(lRes) ? lRes.map((i: any) => i.data) : [];
      const tournamentsData = Array.isArray(tRes) ? tRes.map((i: any) => i.data) : [];
      
      tournamentsData.sort((a: Tournament, b: Tournament) => {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

      setSyncStatus('online');
      setLastErrorMessage('');
      
      return {
        players: playersData,
        locations: locationsData,
        tournaments: tournamentsData
      };
    } catch (e: any) { 
        setSyncStatus('error');
        setLastErrorMessage(e.message || "Erro de rede");
        return null;
    }
  }, []);

  const pushToCloud = async (table: 'players' | 'locations' | 'tournaments', id: string, data: any) => {
    if (!cloudConfig.enabled) return;
    try {
      const res = await fetch(`${cloudConfig.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: { 
            'apikey': cloudConfig.key, 
            'Authorization': `Bearer ${cloudConfig.key}`, 
            'Content-Type': 'application/json', 
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id, data })
      });
      if (!res.ok) setSyncStatus('error');
      else setSyncStatus('online');
    } catch (e: any) {
        setSyncStatus('error');
    }
  };

  const deleteFromCloud = async (table: 'players' | 'locations' | 'tournaments', id: string) => {
    if (!cloudConfig.enabled) return;
    try {
      await fetch(`${cloudConfig.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 
          'apikey': cloudConfig.key, 
          'Authorization': `Bearer ${cloudConfig.key}` 
        }
      });
    } catch (e) {
      console.error("Delete Error:", e);
    }
  };

  const refreshAllData = useCallback(async () => {
    let allTournaments: Tournament[] = [];
    const cloudData = await fetchCloudData(cloudConfig);

    if (cloudData) {
        setPlayers(cloudData.players);
        setLocations(cloudData.locations);
        allTournaments = cloudData.tournaments;
    } else {
        allTournaments = loadLocalData();
    }

    const active = allTournaments.find(t => t.status === 'scheduled' || t.status === 'live');
    const history = allTournaments.filter(t => t.status === 'finished' || t.status === 'cancelled');

    setTournamentHistory(history);

    if (active) {
       setActiveTournament(prev => {
           if (isTournamentDifferent(prev, active)) {
               if (active.matches && active.matches.length > 0) {
                   setMatches(active.matches);
                   const maxRound = Math.max(...active.matches.map(m => m.round));
                   setCurrentRound(maxRound);
               }
               return active;
           }
           return prev;
       });
    } else {
       setActiveTournament(null);
       setMatches([]);
    }
  }, [cloudConfig, fetchCloudData, loadLocalData]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshAllData();
      setIsLoading(false);
    };
    init();
  }, [refreshAllData]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('padel_players', JSON.stringify(players));
      localStorage.setItem('padel_locations', JSON.stringify(locations));
      const allTournaments = [...tournamentHistory];
      if (activeTournament) allTournaments.push(activeTournament);
      localStorage.setItem('padel_history', JSON.stringify(allTournaments));
      localStorage.setItem('padel_cloud_config', JSON.stringify(cloudConfig));
    }
  }, [players, locations, tournamentHistory, activeTournament, cloudConfig, isLoading]);

  const playerRankings = useMemo(() => {
    const rankings = new Map<string, { current: number, history: { date: string, points: number, level: string }[] }>();
    players.forEach(p => rankings.set(p.id, { current: 1000, history: [{ date: 'Início', points: 1000, level: 'Nível 1' }] }));
    const finishedTournaments = tournamentHistory.filter(t => t.status === 'finished');
    const sortedHistory = [...finishedTournaments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedHistory.forEach(t => {
        if (!t.matches) return;
        const teamResults = new Map<string, { wins: number, diff: number, pids: string[] }>();
        t.matches.forEach(m => {
            const k1 = m.team1.map(p => p.id).sort().join('-');
            const k2 = m.team2.map(p => p.id).sort().join('-');
            if (!teamResults.has(k1)) teamResults.set(k1, { wins: 0, diff: 0, pids: m.team1.map(p=>p.id) });
            if (!teamResults.has(k2)) teamResults.set(k2, { wins: 0, diff: 0, pids: m.team2.map(p=>p.id) });
            const s1 = teamResults.get(k1)!, s2 = teamResults.get(k2)!;
            s1.diff += (m.score1 - m.score2); s2.diff += (m.score2 - m.score1);
            if (m.score1 > m.score2) s1.wins++; else if (m.score2 > m.score1) s2.wins++;
        });
        const standingsArr = Array.from(teamResults.values()).sort((a,b) => b.wins - a.wins || b.diff - a.diff);
        const championsIds = standingsArr[0]?.pids || [];
        t.matches.forEach(m => {
            const updateP = (p: Player, won: boolean) => {
                const d = rankings.get(p.id); if (d) { d.current += won ? 20 : -12; if (d.current < 800) d.current = 800; }
            };
            m.team1.forEach(p => updateP(p, m.score1 > m.score2)); m.team2.forEach(p => updateP(p, m.score2 > m.score1));
        });
        const affected = new Set<string>();
        t.matches.forEach(m => [...m.team1, ...m.team2].forEach(p => affected.add(p.id)));
        affected.forEach(pid => {
            const d = rankings.get(pid);
            if (d) {
                if (championsIds.includes(pid)) d.current += 50;
                const getL = (pts: number) => pts >= 1600 ? 'Pro' : pts >= 1400 ? 'Nível 3' : pts >= 1200 ? 'Nível 2' : 'Nível 1';
                d.history.push({ date: new Date(t.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }), points: d.current, level: getL(d.current) });
            }
        });
    });
    return rankings;
  }, [players, tournamentHistory]);

  const playersWithDynamicRanking = useMemo(() => {
    return players.map(p => {
        const r = playerRankings.get(p.id); const pts = r?.current || 1000;
        const getL = (pts: number) => pts >= 1600 ? 'Pro' : pts >= 1400 ? 'Nível 3' : pts >= 1200 ? 'Nível 2' : 'Nível 1';
        return { ...p, rankingPoints: pts, level: getL(pts) };
    });
  }, [players, playerRankings]);

  const handleNextRound = async () => {
    const nextRoundNumber = currentRound + 1;
    if (nextRoundNumber > 3) {
      setScreen(Screen.TOURNAMENT_SUMMARY);
      return;
    }

    const r1 = matches.filter(m => m.round === 1);
    const m1 = r1.find(m => m.court === 1);
    const m2 = r1.find(m => m.court === 2);

    if (m1 && m2) {
      const winner1 = m1.score1 > m1.score2 ? m1.team1 : m1.team2;
      const loser1 = m1.score1 > m1.score2 ? m1.team2 : m1.team1;
      const winner2 = m2.score1 > m2.score2 ? m2.team1 : m2.team2;
      const loser2 = m2.score1 > m2.score2 ? m2.team2 : m2.team1;

      let nextMatches: Match[] = [];
      const timestamp = Date.now();
      const dateStr = new Date().toISOString();

      if (nextRoundNumber === 2) {
        nextMatches = [
          { id: `m-r2-c1-${timestamp}`, team1: winner1, team2: loser2, score1: 0, score2: 0, court: 1, status: 'live', round: 2, date: dateStr },
          { id: `m-r2-c2-${timestamp}`, team1: winner2, team2: loser1, score1: 0, score2: 0, court: 2, status: 'live', round: 2, date: dateStr }
        ];
      } else if (nextRoundNumber === 3) {
        nextMatches = [
          { id: `m-r3-c1-${timestamp}`, team1: winner1, team2: winner2, score1: 0, score2: 0, court: 1, status: 'live', round: 3, date: dateStr },
          { id: `m-r3-c2-${timestamp}`, team1: loser1, team2: loser2, score1: 0, score2: 0, court: 2, status: 'live', round: 3, date: dateStr }
        ];
      }

      const updatedMatches = [...matches, ...nextMatches];
      setMatches(updatedMatches);
      setCurrentRound(nextRoundNumber);
      if (activeTournament) {
         const updatedTournament = { ...activeTournament, matches: updatedMatches };
         setActiveTournament(updatedTournament);
         await pushToCloud('tournaments', updatedTournament.id, updatedTournament);
      }
    }
  };

  const handleCreateTournament = async (t: Tournament) => {
      const newT = { ...t, status: 'scheduled' as const, rosterClosed: false };
      setActiveTournament(newT);
      await pushToCloud('tournaments', newT.id, newT);
  };
  const handleUpdateActiveTournament = async (t: Tournament) => {
      setActiveTournament(t);
      await pushToCloud('tournaments', t.id, t);
  };
  const handleCancelTournament = async () => {
      if (activeTournament && window.confirm('Deseja cancelar este agendamento?')) {
          const cancelledT = { ...activeTournament, status: 'cancelled' as const };
          setActiveTournament(null);
          setMatches([]);
          setTournamentHistory(prev => [cancelledT, ...prev]);
          await pushToCloud('tournaments', cancelledT.id, cancelledT);
      }
  };
  const updateMatchScore = async (id: string, team: 1 | 2, increment: boolean) => {
    const updatedMatches = matches.map(m => m.id === id ? {
      ...m, 
      [team === 1 ? 'score1' : 'score2']: increment 
        ? m[team === 1 ? 'score1' : 'score2'] + 1 
        : Math.max(0, m[team === 1 ? 'score1' : 'score2'] - 1)
    } : m);
    setMatches(updatedMatches);
    if (activeTournament) {
        const updatedTournament = { ...activeTournament, matches: updatedMatches };
        setActiveTournament(updatedTournament);
        pushToCloud('tournaments', updatedTournament.id, updatedTournament);
    }
  };
  const handleStartTournament = async (initialMatches: Match[]) => {
      setMatches(initialMatches);
      setCurrentRound(1);
      if (activeTournament) {
          const liveTournament: Tournament = { 
              ...activeTournament, 
              status: 'live', 
              matches: initialMatches 
          };
          setActiveTournament(liveTournament);
          await pushToCloud('tournaments', liveTournament.id, liveTournament);
      }
      setScreen(Screen.LIVE_GAME);
  };
  const handleAddPlayer = async (p: Player) => { setPlayers(prev => [...prev, p]); await pushToCloud('players', p.id, p); };
  const handleUpdatePlayer = async (p: Player) => { setPlayers(prev => prev.map(old => old.id === p.id ? p : old)); await pushToCloud('players', p.id, p); };
  const handleDeletePlayer = async (id: string) => { if (window.confirm('Remover jogador?')) { setPlayers(prev => prev.filter(p => p.id !== id)); await deleteFromCloud('players', id); } };
  const handleAddLocation = async (l: Location) => { setLocations(prev => [...prev, l]); await pushToCloud('locations', l.id, l); };
  const handleUpdateLocation = async (l: Location) => { setLocations(prev => prev.map(old => old.id === l.id ? l : old)); await pushToCloud('locations', l.id, l); };
  const handleDeleteLocation = async (id: string) => { setLocations(prev => prev.filter(l => l.id !== id)); await deleteFromCloud('locations', id); };
  const handleFinishTournament = async () => {
    if (activeTournament) {
        const finished: Tournament = { ...activeTournament, status: 'finished', matches: matches.map(m => ({...m, status: 'finished'})), };
        setTournamentHistory(prev => [finished, ...prev]);
        setActiveTournament(null);
        setMatches([]);
        await pushToCloud('tournaments', finished.id, finished);
    }
    setScreen(Screen.TOURNAMENT_RESULTS);
  };
  const handleDeleteTournament = async (id: string) => { 
    if (window.confirm('Apagar do histórico permanentemente?')) { 
      setTournamentHistory(prev => prev.filter(t => t.id !== id)); 
      await deleteFromCloud('tournaments', id); 
      setScreen(Screen.TOURNAMENT_HISTORY); 
    } 
  };

  const renderScreen = () => {
    if (isLoading) return <div className="h-screen flex flex-col items-center justify-center text-primary bg-background-dark"><span className="material-symbols-outlined animate-spin text-5xl mb-4">sync</span><p className="font-black uppercase tracking-widest text-xs">A carregar...</p></div>;
    
    switch (currentScreen) {
      case Screen.HOME: return <HomeScreen setScreen={setScreen} activeTournament={activeTournament} players={playersWithDynamicRanking} locations={locations} onCreateTournament={handleCreateTournament} onAddPlayer={handleAddPlayer} onUpdateTournament={handleUpdateActiveTournament} onCancelTournament={handleCancelTournament} history={tournamentHistory.filter(t => t.status === 'finished')} onViewTournament={(t) => { setSelectedHistoryTournament(t); setScreen(Screen.HISTORY_DETAIL); }} />;
      case Screen.PROFILE: return <ProfileScreen playerId={selectedPlayerId} players={playersWithDynamicRanking} history={tournamentHistory.filter(t => t.status === 'finished')} currentMatches={matches} setScreen={setScreen} onUpdatePlayer={handleUpdatePlayer} rankingHistory={selectedPlayerId ? playerRankings.get(selectedPlayerId)?.history : []} />;
      case Screen.LIVE_GAME: return <LiveGameScreen setScreen={setScreen} matches={matches.filter(m => m.round === currentRound)} updateMatchScore={updateMatchScore} onNextRound={handleNextRound} currentRound={currentRound} />;
      case Screen.TOURNAMENT_SUMMARY: return <TournamentSummaryScreen setScreen={setScreen} matches={matches} updateMatchScore={updateMatchScore} onFinish={handleFinishTournament} />;
      case Screen.TOURNAMENT_RESULTS: return <TournamentResultsScreen setScreen={setScreen} matches={tournamentHistory[0]?.matches || []} />;
      case Screen.GLOBAL_STATS: return <GlobalStatsScreen history={tournamentHistory.filter(t => t.status === 'finished')} players={playersWithDynamicRanking} onViewTournament={(t) => { setSelectedHistoryTournament(t); setScreen(Screen.HISTORY_DETAIL); }} onViewPlayer={(id) => { setSelectedPlayerId(id); setScreen(Screen.PROFILE); }} locations={locations} />;
      case Screen.TOURNAMENT_HISTORY: return <TournamentHistoryScreen history={tournamentHistory} locations={locations} players={playersWithDynamicRanking} onViewTournament={(t) => { setSelectedHistoryTournament(t); setScreen(Screen.HISTORY_DETAIL); }} onDeleteTournament={handleDeleteTournament} />;
      case Screen.HISTORY_DETAIL: return selectedHistoryTournament ? <HistoryDetailScreen setScreen={setScreen} tournament={selectedHistoryTournament} locations={locations} players={playersWithDynamicRanking} onDeleteTournament={handleDeleteTournament} /> : null;
      case Screen.TEAM_SETUP: return <TeamSetupScreen setScreen={setScreen} players={playersWithDynamicRanking.filter(p => activeTournament?.confirmedPlayerIds.includes(p.id))} onStartTournament={handleStartTournament} />;
      case Screen.PLAYERS: return <PlayerListScreen setScreen={setScreen} players={playersWithDynamicRanking} onPlayerClick={(id) => { setSelectedPlayerId(id); setScreen(Screen.PROFILE); }} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} />;
      case Screen.LOCATIONS: return <LocationManagerScreen setScreen={setScreen} locations={locations} onAddLocation={handleAddLocation} onUpdateLocation={handleUpdateLocation} onDeleteLocation={handleDeleteLocation} history={tournamentHistory} />;
      case Screen.SETTINGS: return <SettingsScreen setScreen={setScreen} players={players} locations={locations} history={tournamentHistory} cloudConfig={cloudConfig} onUpdateCloudConfig={setCloudConfig} onImportData={(d) => { setPlayers(d.players); setLocations(d.locations); setTournamentHistory(d.history); }} onResetData={() => { localStorage.clear(); window.location.reload(); }} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-background-dark">
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl border-x border-white/5 bg-background-dark">
        <button 
          onClick={() => refreshAllData()}
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 backdrop-blur-md px-3 py-1 rounded-full border cursor-pointer hover:bg-black/60 active:scale-95 transition-all ${syncStatus === 'error' ? 'bg-red-500/20 border-red-500/50' : 'bg-black/40 border-white/5'}`}
        >
          <div className={`size-1.5 rounded-full ${syncStatus === 'online' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
             {syncStatus === 'online' ? 'Cloud Sync' : syncStatus === 'error' ? 'Erro Sync' : 'Offline'}
          </span>
          <span className="material-symbols-outlined text-[10px] text-gray-500">refresh</span>
        </button>
        <PullToRefresh onRefresh={refreshAllData}>
            {renderScreen()}
        </PullToRefresh>
        {[Screen.HOME, Screen.PROFILE, Screen.GLOBAL_STATS, Screen.PLAYERS, Screen.SETTINGS, Screen.TOURNAMENT_HISTORY].includes(currentScreen) && <Navigation currentScreen={currentScreen} setScreen={setScreen} />}
      </div>
    </div>
  );
};

export default App;

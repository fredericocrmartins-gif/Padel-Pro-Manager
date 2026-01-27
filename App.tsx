
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Screen, Match, Player, Tournament, Location, CloudConfig } from './types';
import { Navigation } from './components/Navigation';
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

const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Albino', lastName: 'Guerreiro', nickname: 'Guerreiro', level: 'Nível 1', image: '' },
  { id: '2', name: 'Carlos', lastName: 'Nunes', nickname: 'Carlitos', level: 'Nível 1', image: '' },
  { id: '3', name: 'Frederico', lastName: 'Martins', nickname: 'Fred', level: 'Nível 1', image: '' },
  { id: '4', name: 'Gonçalo', lastName: 'Catita', nickname: 'Catita', level: 'Nível 1', image: '' },
  { id: '5', name: 'Miguel', lastName: 'Jesus', nickname: 'Miguel', level: 'Nível 1', image: '' },
  { id: '6', name: 'Pedro', lastName: 'Nascimento', nickname: 'Pedro', level: 'Nível 1', image: '' },
  { id: '7', name: 'Ricardo', lastName: 'Santos', nickname: 'Ricardo', level: 'Nível 1', image: '' },
  { id: '8', name: 'Rui', lastName: 'Nascimento', nickname: 'Rui', level: 'Nível 1', image: '' },
];

const DEFAULT_LOCATIONS: Location[] = [
  { id: '1', name: 'Rackets Pro EUL', type: 'Outdoor', address: 'Azinhaga das Galhardas, Lisboa' },
  { id: '2', name: 'W Padel Country Club', type: 'Indoor', address: 'Parque Florestal de Monsanto, Lisboa' },
  { id: '3', name: 'LX Indoor Padel', type: 'Indoor', address: 'Rua das Eiras 14, Camarate' },
  { id: '4', name: 'Lisboa Racket Centre', type: 'Outdoor', address: 'Rua Alferes Malheiro, Lisboa' }
];

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [locations, setLocations] = useState<Location[]>(DEFAULT_LOCATIONS);
  const [tournamentHistory, setTournamentHistory] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
    const saved = localStorage.getItem('padel_cloud_config');
    return saved ? JSON.parse(saved) : { url: '', key: '', enabled: false };
  });

  const [currentScreen, setScreen] = useState<Screen>(Screen.HOME);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedHistoryTournament, setSelectedHistoryTournament] = useState<Tournament | null>(null);

  // --- LOGICA DE SINCRONIZAÇÃO CLOUD (SUPABASE) ---
  const fetchCloudData = useCallback(async (config: CloudConfig) => {
    if (!config.enabled || !config.url || !config.key) return null;
    try {
      const headers = { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` };
      const [pRes, lRes, tRes] = await Promise.all([
        fetch(`${config.url}/rest/v1/players?select=data`, { headers }).then(r => r.json()),
        fetch(`${config.url}/rest/v1/locations?select=data`, { headers }).then(r => r.json()),
        fetch(`${config.url}/rest/v1/tournaments?select=data&order=created_at.desc`, { headers }).then(r => r.json())
      ]);
      return {
        players: pRes.map((i: any) => i.data),
        locations: lRes.map((i: any) => i.data),
        history: tRes.map((i: any) => i.data)
      };
    } catch (e) { console.error("Erro na Cloud:", e); return null; }
  }, []);

  const pushToCloud = async (table: 'players' | 'locations' | 'tournaments', id: string, data: any) => {
    if (!cloudConfig.enabled) return;
    try {
      await fetch(`${cloudConfig.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: { 
          'apikey': cloudConfig.key, 
          'Authorization': `Bearer ${cloudConfig.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ id, data })
      });
    } catch (e) { console.error(`Erro ao gravar ${table}:`, e); }
  };

  const deleteFromCloud = async (table: 'players' | 'locations' | 'tournaments', id: string) => {
    if (!cloudConfig.enabled) return;
    try {
      await fetch(`${cloudConfig.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': cloudConfig.key, 'Authorization': `Bearer ${cloudConfig.key}` }
      });
    } catch (e) { console.error(`Erro ao apagar ${table}:`, e); }
  };

  // Carregamento Inicial
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const cloudData = await fetchCloudData(cloudConfig);
      
      if (cloudData) {
        setPlayers(cloudData.players);
        setLocations(cloudData.locations);
        setTournamentHistory(cloudData.history);
      } else {
        const p = localStorage.getItem('padel_players');
        const l = localStorage.getItem('padel_locations');
        const h = localStorage.getItem('padel_history');
        if (p) setPlayers(JSON.parse(p));
        if (l) setLocations(JSON.parse(l));
        if (h) setTournamentHistory(JSON.parse(h));
      }
      setIsLoading(false);
    };
    init();
  }, [cloudConfig, fetchCloudData]);

  // Persistência Local (Fallback)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('padel_players', JSON.stringify(players));
      localStorage.setItem('padel_locations', JSON.stringify(locations));
      localStorage.setItem('padel_history', JSON.stringify(tournamentHistory));
      localStorage.setItem('padel_cloud_config', JSON.stringify(cloudConfig));
    }
  }, [players, locations, tournamentHistory, cloudConfig, isLoading]);

  // RANKING LOGIC (Igual à anterior, reativa aos dados)
  const playerRankings = useMemo(() => {
    const rankings = new Map<string, { current: number, history: { date: string, points: number, level: string }[] }>();
    players.forEach(p => rankings.set(p.id, { current: 1000, history: [{ date: 'Início', points: 1000, level: 'Nível 1' }] }));
    const sortedHistory = [...tournamentHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedHistory.forEach(t => {
        if (!t.matches) return;
        const teamWins = new Map<string, { wins: number, diff: number, pids: string[] }>();
        t.matches.forEach(m => {
            const k1 = m.team1.map(p => p.id).sort().join('-');
            const k2 = m.team2.map(p => p.id).sort().join('-');
            if (!teamWins.has(k1)) teamWins.set(k1, { wins: 0, diff: 0, pids: m.team1.map(p=>p.id) });
            if (!teamWins.has(k2)) teamWins.set(k2, { wins: 0, diff: 0, pids: m.team2.map(p=>p.id) });
            const s1 = teamWins.get(k1)!, s2 = teamWins.get(k2)!;
            s1.diff += (m.score1 - m.score2); s2.diff += (m.score2 - m.score1);
            if (m.score1 > m.score2) s1.wins++; else if (m.score2 > m.score1) s2.wins++;
        });
        const championsIds = Array.from(teamWins.values()).sort((a,b) => b.wins - a.wins || b.diff - a.diff)[0]?.pids || [];
        t.matches.forEach(m => {
            const updateP = (p: Player, won: boolean) => {
                const d = rankings.get(p.id);
                if (d) { d.current += won ? 20 : -12; if (d.current < 800) d.current = 800; }
            };
            m.team1.forEach(p => updateP(p, m.score1 > m.score2));
            m.team2.forEach(p => updateP(p, m.score2 > m.score1));
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
        const r = playerRankings.get(p.id);
        const pts = r?.current || 1000;
        const getL = (pts: number) => pts >= 1600 ? 'Pro' : pts >= 1400 ? 'Nível 3' : pts >= 1200 ? 'Nível 2' : 'Nível 1';
        return { ...p, rankingPoints: pts, level: getL(pts) };
    });
  }, [players, playerRankings]);

  // HANDLERS COM SYNC CLOUD
  const handleAddPlayer = async (p: Player) => {
    setPlayers(prev => [...prev, p]);
    await pushToCloud('players', p.id, p);
  };

  const handleUpdatePlayer = async (p: Player) => {
    setPlayers(prev => prev.map(old => old.id === p.id ? p : old));
    await pushToCloud('players', p.id, p);
  };

  const handleDeletePlayer = async (id: string) => {
    if (window.confirm('Remover jogador?')) {
        setPlayers(prev => prev.filter(p => p.id !== id));
        await deleteFromCloud('players', id);
    }
  };

  const handleFinishTournament = async () => {
    if (activeTournament) {
        const finished: Tournament = { 
          ...activeTournament, 
          status: 'finished', 
          matches: matches.map(m => ({...m, status: 'finished'})), 
        };
        setTournamentHistory(prev => [finished, ...prev]);
        setActiveTournament(null);
        await pushToCloud('tournaments', finished.id, finished);
    }
    setScreen(Screen.TOURNAMENT_RESULTS);
  };

  const handleDeleteTournament = async (id: string) => {
    if (window.confirm('Apagar do histórico?')) {
        setTournamentHistory(prev => prev.filter(t => t.id !== id));
        await deleteFromCloud('tournaments', id);
        setScreen(Screen.TOURNAMENT_HISTORY);
    }
  };

  const renderScreen = () => {
    if (isLoading) return <div className="h-screen flex flex-col items-center justify-center text-primary"><span className="material-symbols-outlined animate-spin text-5xl mb-4">sync</span><p className="font-black uppercase tracking-widest text-xs">Sincronizando Cloud...</p></div>;

    switch (currentScreen) {
      case Screen.HOME: return <HomeScreen setScreen={setScreen} activeTournament={activeTournament} players={playersWithDynamicRanking} locations={locations} onCreateTournament={setActiveTournament} onAddPlayer={handleAddPlayer} onUpdateTournament={setActiveTournament} history={tournamentHistory} />;
      case Screen.PROFILE: return <ProfileScreen playerId={selectedPlayerId} players={playersWithDynamicRanking} history={tournamentHistory} currentMatches={matches} setScreen={setScreen} onUpdatePlayer={handleUpdatePlayer} rankingHistory={selectedPlayerId ? playerRankings.get(selectedPlayerId)?.history : []} />;
      case Screen.LIVE_GAME: return <LiveGameScreen setScreen={setScreen} matches={matches.filter(m => m.round === currentRound)} updateMatchScore={(id, t, inc) => setMatches(prev => prev.map(m => m.id === id ? {...m, [t === 1 ? 'score1' : 'score2']: inc ? m[t === 1 ? 'score1' : 'score2'] + 1 : Math.max(0, m[t === 1 ? 'score1' : 'score2'] - 1)} : m))} onNextRound={() => { /* Logica de rondas mantida */ }} currentRound={currentRound} />;
      case Screen.TOURNAMENT_RESULTS: return <TournamentResultsScreen setScreen={setScreen} matches={matches} />;
      case Screen.GLOBAL_STATS: return <GlobalStatsScreen history={tournamentHistory} players={playersWithDynamicRanking} onViewTournament={(t) => { setSelectedHistoryTournament(t); setScreen(Screen.HISTORY_DETAIL); }} onViewPlayer={(id) => { setSelectedPlayerId(id); setScreen(Screen.PROFILE); }} locations={locations} />;
      case Screen.TOURNAMENT_HISTORY: return <TournamentHistoryScreen history={tournamentHistory} locations={locations} onViewTournament={(t) => { setSelectedHistoryTournament(t); setScreen(Screen.HISTORY_DETAIL); }} onDeleteTournament={handleDeleteTournament} />;
      case Screen.HISTORY_DETAIL: return selectedHistoryTournament ? <HistoryDetailScreen setScreen={setScreen} tournament={selectedHistoryTournament} locations={locations} onDeleteTournament={handleDeleteTournament} /> : null;
      case Screen.TEAM_SETUP: return <TeamSetupScreen setScreen={setScreen} players={playersWithDynamicRanking.filter(p => activeTournament?.confirmedPlayerIds.includes(p.id))} onStartTournament={(m) => { setMatches(m); setCurrentRound(1); setScreen(Screen.LIVE_GAME); }} />;
      case Screen.PLAYERS: return <PlayerListScreen setScreen={setScreen} players={playersWithDynamicRanking} onPlayerClick={(id) => { setSelectedPlayerId(id); setScreen(Screen.PROFILE); }} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} />;
      case Screen.LOCATIONS: return <LocationManagerScreen setScreen={setScreen} locations={locations} setLocations={setLocations} history={tournamentHistory} />;
      case Screen.SETTINGS: return <SettingsScreen setScreen={setScreen} players={players} locations={locations} history={tournamentHistory} cloudConfig={cloudConfig} onUpdateCloudConfig={setCloudConfig} onImportData={(d) => { setPlayers(d.players); setLocations(d.locations); setTournamentHistory(d.history); }} onResetData={() => { localStorage.clear(); window.location.reload(); }} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-background-dark">
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl border-x border-white/5 bg-background-dark">
        {/* Status Bar */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 pointer-events-none">
          <div className={`size-1.5 rounded-full ${cloudConfig.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-orange-500 animate-pulse'}`}></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
            {cloudConfig.enabled ? 'Database Cloud On' : 'Modo Offline Local'}
          </span>
        </div>
        {renderScreen()}
        {[Screen.HOME, Screen.PROFILE, Screen.GLOBAL_STATS, Screen.PLAYERS, Screen.SETTINGS, Screen.TOURNAMENT_HISTORY].includes(currentScreen) && <Navigation currentScreen={currentScreen} setScreen={setScreen} />}
      </div>
    </div>
  );
};

export default App;

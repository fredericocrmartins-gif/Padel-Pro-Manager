
import React, { useState, useMemo, useEffect } from 'react';
import { Screen, Match, Player, Tournament, Location } from './types';
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
  // Inicialização do estado a partir do LocalStorage
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('padel_players');
    return saved ? JSON.parse(saved) : MOCK_PLAYERS;
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('padel_locations');
    return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
  });

  const [tournamentHistory, setTournamentHistory] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('padel_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentScreen, setScreen] = useState<Screen>(Screen.HOME);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedHistoryTournament, setSelectedHistoryTournament] = useState<Tournament | null>(null);

  // Efeitos para guardar dados sempre que mudam
  useEffect(() => {
    localStorage.setItem('padel_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('padel_locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('padel_history', JSON.stringify(tournamentHistory));
  }, [tournamentHistory]);

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
        const sortedStandings = Array.from(teamWins.values()).sort((a,b) => b.wins - a.wins || b.diff - a.diff);
        const championsIds = sortedStandings[0]?.pids || [];

        t.matches.forEach(m => {
            const updatePlayer = (p: Player, won: boolean) => {
                const data = rankings.get(p.id);
                if (data) { data.current += won ? 20 : -12; if (data.current < 800) data.current = 800; }
            };
            m.team1.forEach(p => updatePlayer(p, m.score1 > m.score2));
            m.team2.forEach(p => updatePlayer(p, m.score2 > m.score1));
        });

        const affected = new Set<string>();
        t.matches.forEach(m => [...m.team1, ...m.team2].forEach(p => affected.add(p.id)));
        affected.forEach(pid => {
            const data = rankings.get(pid);
            if (data) {
                if (championsIds.includes(pid)) data.current += 50;
                const getLevel = (pts: number) => {
                    if (pts >= 1600) return 'Pro'; if (pts >= 1400) return 'Nível 3';
                    if (pts >= 1200) return 'Nível 2'; return 'Nível 1';
                };
                data.history.push({ date: new Date(t.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }), points: data.current, level: getLevel(data.current) });
            }
        });
    });
    return rankings;
  }, [players, tournamentHistory]);

  const playersWithDynamicRanking = useMemo(() => {
    return players.map(p => {
        const rankingData = playerRankings.get(p.id);
        const pts = rankingData?.current || 1000;
        const getLevel = (pts: number) => { if (pts >= 1600) return 'Pro'; if (pts >= 1400) return 'Nível 3'; if (pts >= 1200) return 'Nível 2'; return 'Nível 1'; };
        return { ...p, rankingPoints: pts, level: getLevel(pts) };
    });
  }, [players, playerRankings]);

  const handleStartTournament = (generatedMatches: Match[]) => {
    setMatches(generatedMatches.map(m => ({ ...m, date: activeTournament?.date || new Date().toISOString() })));
    setCurrentRound(1);
    setScreen(Screen.LIVE_GAME);
  };

  const handleNextRound = () => {
    const currentRoundMatches = matches.filter(m => m.round === currentRound);
    if (currentRoundMatches.length < 2) return;

    const updatedAllMatches = matches.map(m => m.round === currentRound ? { ...m, status: 'finished' as const } : m);

    if (currentRound === 1) {
        const matchC1 = currentRoundMatches.find(m => m.court === 1)!;
        const matchC2 = currentRoundMatches.find(m => m.court === 2)!;
        const winC1 = matchC1.score1 > matchC1.score2 ? matchC1.team1 : matchC1.team2;
        const lossC1 = matchC1.score1 > matchC1.score2 ? matchC1.team2 : matchC1.team1;
        const winC2 = matchC2.score1 > matchC2.score2 ? matchC2.team1 : matchC2.team2;
        const lossC2 = matchC2.score1 > matchC2.score2 ? matchC2.team2 : matchC2.team1;

        const round2: Match[] = [
            { id: `m-r2-c1-${Date.now()}`, team1: winC1, team2: lossC2, score1: 0, score2: 0, court: 1, status: 'live' as const, round: 2, date: activeTournament?.date },
            { id: `m-r2-c2-${Date.now()}`, team1: winC2, team2: lossC1, score1: 0, score2: 0, court: 2, status: 'live' as const, round: 2, date: activeTournament?.date }
        ];
        setMatches([...updatedAllMatches, ...round2]);
        setCurrentRound(2);
    } else if (currentRound === 2) {
        const r1 = updatedAllMatches.filter(m => m.round === 1);
        const teams = [r1[0].team1, r1[0].team2, r1[1].team1, r1[1].team2];
        const playedR1 = updatedAllMatches.filter(m => m.round === 1).map(m => [m.team1, m.team2]);
        const playedR2 = updatedAllMatches.filter(m => m.round === 2).map(m => [m.team1, m.team2]);

        const getTeamId = (t: Player[]) => t.map(p => p.id).sort().join('-');
        const pairsPlayed = new Set<string>();
        [...playedR1, ...playedR2].forEach(pair => {
            const ids = [getTeamId(pair[0]), getTeamId(pair[1])].sort();
            pairsPlayed.add(ids.join('|'));
        });

        let round3: Match[] = [];
        const t0Id = getTeamId(teams[0]);
        for(let i=1; i<4; i++) {
            const pairKey = [t0Id, getTeamId(teams[i])].sort().join('|');
            if(!pairsPlayed.has(pairKey)) {
                const otherTwo = teams.filter((_, idx) => idx !== 0 && idx !== i);
                round3 = [
                    { id: `m-r3-c1-${Date.now()}`, team1: teams[0], team2: teams[i], score1: 0, score2: 0, court: 1, status: 'live' as const, round: 3, date: activeTournament?.date },
                    { id: `m-r3-c2-${Date.now()}`, team1: otherTwo[0], team2: otherTwo[1], score1: 0, score2: 0, court: 2, status: 'live' as const, round: 3, date: activeTournament?.date }
                ];
                break;
            }
        }
        setMatches([...updatedAllMatches, ...round3]);
        setCurrentRound(3);
    } else {
        setMatches(updatedAllMatches);
        setScreen(Screen.TOURNAMENT_SUMMARY);
    }
  };

  const updateMatchScore = (matchId: string, team: 1 | 2, increment: boolean) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      const current = team === 1 ? m.score1 : m.score2;
      return { ...m, [team === 1 ? 'score1' : 'score2']: increment ? current + 1 : Math.max(0, current - 1) };
    }));
  };

  const handleFinishTournament = () => {
    if (activeTournament) {
        const finishedTournament: Tournament = { 
          ...activeTournament, 
          status: 'finished', 
          matches: matches.map(m => ({...m, status: 'finished'})), 
        };
        setTournamentHistory(prev => [finishedTournament, ...prev]);
        setActiveTournament(null);
    }
    setScreen(Screen.TOURNAMENT_RESULTS);
  };

  const handleDeleteTournament = (id: string) => {
    if (window.confirm('Tem a certeza que deseja apagar este torneio do histórico? Esta ação é irreversível.')) {
        setTournamentHistory(prev => prev.filter(t => t.id !== id));
        if (selectedHistoryTournament?.id === id) setSelectedHistoryTournament(null);
        setScreen(Screen.TOURNAMENT_HISTORY);
    }
  };

  const handleDeletePlayer = (id: string) => {
    if (window.confirm('Tem a certeza que deseja remover este jogador?')) {
        setPlayers(prev => prev.filter(p => p.id !== id));
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.HOME: return <HomeScreen setScreen={setScreen} activeTournament={activeTournament} players={playersWithDynamicRanking} locations={locations} onCreateTournament={(t) => {setActiveTournament(t); setScreen(Screen.HOME);}} onAddPlayer={(p) => setPlayers([...players, p])} onUpdateTournament={setActiveTournament} history={tournamentHistory} />;
      case Screen.PROFILE: return <ProfileScreen playerId={selectedPlayerId} players={playersWithDynamicRanking} history={tournamentHistory} currentMatches={matches} setScreen={setScreen} onUpdatePlayer={(up) => setPlayers(players.map(p => p.id === up.id ? up : p))} rankingHistory={selectedPlayerId ? playerRankings.get(selectedPlayerId)?.history : []} />;
      case Screen.LIVE_GAME: return <LiveGameScreen setScreen={setScreen} matches={matches.filter(m => m.round === currentRound)} updateMatchScore={updateMatchScore} onNextRound={handleNextRound} currentRound={currentRound} />;
      case Screen.TOURNAMENT_SUMMARY: return <TournamentSummaryScreen setScreen={setScreen} matches={matches} updateMatchScore={updateMatchScore} onFinish={handleFinishTournament} />;
      case Screen.TOURNAMENT_RESULTS: return <TournamentResultsScreen setScreen={setScreen} matches={matches} />;
      case Screen.GLOBAL_STATS: return <GlobalStatsScreen history={tournamentHistory} players={playersWithDynamicRanking} onViewTournament={(t) => { setSelectedHistoryTournament(t); setScreen(Screen.HISTORY_DETAIL); }} onViewPlayer={(id) => { setSelectedPlayerId(id); setScreen(Screen.PROFILE); }} locations={locations} />;
      case Screen.TOURNAMENT_HISTORY: return <TournamentHistoryScreen history={tournamentHistory} locations={locations} onViewTournament={(t) => { setSelectedHistoryTournament(t); setScreen(Screen.HISTORY_DETAIL); }} onDeleteTournament={handleDeleteTournament} />;
      case Screen.HISTORY_DETAIL: return selectedHistoryTournament ? <HistoryDetailScreen setScreen={setScreen} tournament={selectedHistoryTournament} locations={locations} onDeleteTournament={handleDeleteTournament} /> : null;
      case Screen.TEAM_SETUP: return <TeamSetupScreen setScreen={setScreen} players={playersWithDynamicRanking.filter(p => activeTournament?.confirmedPlayerIds.includes(p.id))} onStartTournament={handleStartTournament} />;
      case Screen.PLAYERS: return <PlayerListScreen setScreen={setScreen} players={playersWithDynamicRanking} onPlayerClick={(id) => { setSelectedPlayerId(id); setScreen(Screen.PROFILE); }} onAddPlayer={(p) => setPlayers([...players, p])} onUpdatePlayer={(up) => setPlayers(players.map(p => p.id === up.id ? up : p))} onDeletePlayer={handleDeletePlayer} />;
      case Screen.LOCATIONS: return <LocationManagerScreen setScreen={setScreen} locations={locations} setLocations={setLocations} history={tournamentHistory} />;
      default: return null;
    }
  };

  const showNav = [Screen.HOME, Screen.PROFILE, Screen.GLOBAL_STATS, Screen.PLAYERS, Screen.LOCATIONS, Screen.TOURNAMENT_HISTORY].includes(currentScreen);

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-background-dark">
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl border-x border-white/5 bg-background-dark">
        {renderScreen()}
        {showNav && <Navigation currentScreen={currentScreen} setScreen={setScreen} />}
      </div>
    </div>
  );
};

export default App;

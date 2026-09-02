import { Tournament, Player } from './types';

export const getSeason = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0 = Jan, 8 = Sep
    if (month >= 8) return `${year}/${year + 1}`;
    return `${year - 1}/${year}`;
};

export const getAllSeasons = (history: Tournament[]) => {
    const seasons = new Set<string>();
    seasons.add(getSeason(new Date().toISOString())); // Garante que a época atual aparece sempre
    history.forEach(t => {
        if (t.status === 'finished') {
            seasons.add(getSeason(t.date));
        }
    });
    return Array.from(seasons).sort().reverse();
};

export const getPreviousSeason = (season: string) => {
    if (season === 'Global') return 'Global';
    const parts = season.split('/');
    if (parts.length === 2) {
        return `${parseInt(parts[0]) - 1}/${parseInt(parts[1]) - 1}`;
    }
    return season;
};

export const calculateRankings = (players: Player[], tournamentHistory: Tournament[], selectedSeason: string) => {
    const rankings = new Map<string, { current: number, history: { date: string, points: number, level: string }[] }>();
    players.forEach(p => rankings.set(p.id, { current: 1000, history: [{ date: 'Início', points: 1000, level: 'Nível 1' }] }));
    
    const filteredHistory = tournamentHistory.filter(t => t.status === 'finished' && (selectedSeason === 'Global' || getSeason(t.date) === selectedSeason));
    const sortedHistory = [...filteredHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
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
};

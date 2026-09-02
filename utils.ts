import { Tournament } from './types';

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

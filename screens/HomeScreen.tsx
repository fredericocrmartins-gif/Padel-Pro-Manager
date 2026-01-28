
import React, { useState, useEffect } from 'react';
import { Screen, Tournament, Player, Location } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface HomeScreenProps {
  setScreen: (screen: Screen) => void;
  activeTournament: Tournament | null;
  players: Player[];
  locations: Location[];
  onCreateTournament: (tournament: Tournament) => void;
  onAddPlayer: (player: Player) => void;
  onUpdateTournament: (tournament: Tournament) => void;
  onCancelTournament: () => void;
  history: Tournament[];
  onViewTournament: (t: Tournament) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
    setScreen, 
    activeTournament, 
    players, 
    locations,
    onCreateTournament,
    onAddPlayer,
    onUpdateTournament,
    onCancelTournament,
    history,
    onViewTournament
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingPlayers, setIsManagingPlayers] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('22:00');
  const [duration, setDuration] = useState(2);
  const [locationId, setLocationId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!activeTournament) return;
    
    const calculateTimeLeft = () => {
        const start = new Date(`${activeTournament.date}T${activeTournament.time}`);
        const now = new Date();
        const diff = start.getTime() - now.getTime();

        if (diff <= 0) {
             if (diff > -1000 * 60 * 60 * activeTournament.duration) return 'A DECORRER';
             return 'TERMINADO';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `Faltam ${days}d ${hours}h`;
        if (hours > 0) return `Faltam ${hours}h ${minutes}m`;
        return `Faltam ${minutes}m`;
    };

    setTimeRemaining(calculateTimeLeft());
    const timer = setInterval(() => setTimeRemaining(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, [activeTournament]);
  
  const totalGames = history.reduce((acc, t) => acc + (t.matches?.length || 0), 0);
  const totalHours = history.reduce((acc, t) => acc + t.duration, 0);
  
  const locationUsage: Record<string, number> = {};
  history.forEach(t => {
    locationUsage[t.locationId] = (locationUsage[t.locationId] || 0) + 1;
  });
  const favLocationId = Object.entries(locationUsage).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favLocation = locations.find(l => l.id === favLocationId)?.name || 'N/A';

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

  const initCreation = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setSelectedPlayers([]);
    const lxIndoor = locations.find(l => l.name.toLowerCase().includes('lx indoor'));
    if (lxIndoor) setLocationId(lxIndoor.id);
    else if (locations.length > 0) setLocationId(locations[0].id);
    setIsCreating(true);
    setIsEditing(false);
  };

  const initEdit = () => {
    if (!activeTournament) return;
    setDate(activeTournament.date);
    setTime(activeTournament.time);
    setDuration(activeTournament.duration);
    setLocationId(activeTournament.locationId);
    setSelectedPlayers(activeTournament.confirmedPlayerIds);
    setIsCreating(true);
    setIsEditing(true);
  };

  const togglePlayerInActiveTournament = (id: string) => {
    if (!activeTournament) return;
    const isAlreadyConfirmed = activeTournament.confirmedPlayerIds.includes(id);
    const updatedIds = isAlreadyConfirmed 
        ? activeTournament.confirmedPlayerIds.filter(pid => pid !== id)
        : [...activeTournament.confirmedPlayerIds, id];
    onUpdateTournament({ ...activeTournament, confirmedPlayerIds: updatedIds });
  };

  const handleSubmitTournament = () => {
    if (!date || !time || !locationId) return;
    if (isEditing && activeTournament) {
        onUpdateTournament({ 
            ...activeTournament, 
            date, 
            time, 
            duration, 
            locationId, 
            confirmedPlayerIds: selectedPlayers 
        });
    } else {
        onCreateTournament({ 
            id: `t-${Date.now()}`, 
            date, 
            time, 
            duration, 
            locationId, 
            confirmedPlayerIds: selectedPlayers, 
            status: 'scheduled', 
            rosterClosed: false 
        });
    }
    setIsCreating(false);
  };

  const handleCloseRoster = () => {
    if (activeTournament?.confirmedPlayerIds.length !== 8) {
        alert("São necessários exatamente 8 jogadores."); return;
    }
    if (confirm("Fechar convocatória e preparar sorteio?")) {
        onUpdateTournament({ ...activeTournament, rosterClosed: true });
        setIsManagingPlayers(false);
    }
  };

  const StatsSection = (
    <section className="grid grid-cols-3 gap-3">
      <div className="bg-card-dark p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-sm">
        <span className="material-symbols-outlined text-primary mb-1">sports_tennis</span>
        <span className="text-xl font-bold text-white">{totalGames}</span>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Jogos</span>
      </div>
      <div className="bg-card-dark p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-sm">
        <span className="material-symbols-outlined text-purple-400 mb-1">schedule</span>
        <span className="text-xl font-bold text-white">{totalHours}h</span>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tempo</span>
      </div>
      <button 
        onClick={() => setScreen(Screen.LOCATIONS)}
        className="bg-card-dark p-4 rounded-2xl border border-white/5 flex flex-col items-center shadow-sm overflow-hidden active:scale-95 transition-all group"
      >
        <span className="material-symbols-outlined text-emerald-400 mb-1 group-hover:scale-110 transition-transform">star</span>
        <span className="text-[10px] font-bold text-white text-center truncate w-full">{favLocation}</span>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Clube</span>
      </button>
    </section>
  );

  if (isCreating) {
    return (
        <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in min-h-screen bg-background-dark relative z-20">
            <header className="flex items-center justify-between">
                <button onClick={() => setIsCreating(false)} className="size-10 rounded-full flex items-center justify-center bg-white/5"><span className="material-symbols-outlined text-white">close</span></button>
                <h2 className="text-lg font-bold">{isEditing ? 'Editar Torneio' : 'Novo Torneio'}</h2>
                <div className="w-10"></div>
            </header>
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hora</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duração</label><span className="text-xs font-bold text-primary">{duration}h</span></div>
                    <input type="range" min="1" max="4" step="0.5" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-full accent-primary h-2 bg-card-dark rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local</label>
                    <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white appearance-none">
                        {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </select>
                </div>
                {!isEditing && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirmados Iniciais ({selectedPlayers.length})</label>
                        <div className="grid grid-cols-4 gap-2">
                            {players.map(p => (
                                <button key={p.id} onClick={() => { if(selectedPlayers.includes(p.id)) setSelectedPlayers(selectedPlayers.filter(i => i !== p.id)); else setSelectedPlayers([...selectedPlayers, p.id]); }} className={`flex flex-col items-center p-2 rounded-xl border transition-all ${selectedPlayers.includes(p.id) ? 'bg-primary/20 border-primary' : 'bg-card-dark border-transparent opacity-60'}`}>
                                    {renderGlobalAvatar(p, 'size-8')}
                                    <span className="text-[9px] font-bold truncate w-full text-center mt-1">{p.nickname || p.name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <button onClick={handleSubmitTournament} className="mt-auto w-full bg-primary text-background-dark font-bold py-4 rounded-xl">{isEditing ? 'Guardar Alterações' : 'Criar Torneio'}</button>
        </div>
    );
  }

  if (activeTournament) {
    const loc = locations.find(l => l.id === activeTournament.locationId);
    const locName = loc?.name || 'Local Desconhecido';
    const confirmedCount = activeTournament.confirmedPlayerIds.length;
    const isLive = activeTournament.status === 'live';
    const isRosterClosed = activeTournament.rosterClosed;
    const isQuorumReached = confirmedCount === 8;
    const progress = Math.min(100, (confirmedCount / 8) * 100);

    return (
        <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in relative">
            {isManagingPlayers && (
                <div className="fixed inset-0 z-[60] bg-background-dark flex flex-col animate-fade-in p-4">
                    <header className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Gerir Jogadores ({confirmedCount}/8)</h2>
                        <button onClick={() => setIsManagingPlayers(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
                    </header>
                    <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 pb-40 hide-scrollbar">
                        {players.filter(p => (p.nickname || p.name).toLowerCase().includes(playerSearchTerm.toLowerCase())).map(p => {
                            const isConfirmed = activeTournament.confirmedPlayerIds.includes(p.id);
                            return (
                                <button key={p.id} onClick={() => togglePlayerInActiveTournament(p.id)} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${isConfirmed ? 'bg-primary/20 border-primary' : 'bg-card-dark border-white/5'}`}>
                                    {renderGlobalAvatar(p, 'size-12')}
                                    <span className="text-[10px] font-bold mt-1 text-center truncate w-full">{p.nickname || p.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 safe-area-bottom pb-28">
                         {isQuorumReached && (
                             <button onClick={handleCloseRoster} className="w-full bg-emerald-500 text-background-dark font-black py-4 rounded-2xl">FECHAR CONVOCATÓRIA</button>
                         )}
                    </div>
                </div>
            )}
            
            <header className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                    <img src="/favicon.svg" className="w-14 h-14 object-contain" alt="Logo" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1 leading-none">Padel <br/><span className="text-primary">Manager</span></h1>
                        <p className="text-slate-400 text-xs mt-1">{isLive ? 'Em direto!' : 'Fase de convocatória'}</p>
                    </div>
                </div>
                {!isLive && (
                    <div className="flex gap-2">
                         <button onClick={initEdit} className="bg-white/5 text-white size-10 flex items-center justify-center rounded-xl border border-white/10 active:scale-95 transition-all"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                         <button onClick={onCancelTournament} className="bg-red-500/10 text-red-500 size-10 flex items-center justify-center rounded-xl border border-red-500/20 active:scale-95 transition-all"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                )}
            </header>

            {StatsSection}

            <section className="relative overflow-hidden rounded-3xl min-h-[280px] flex flex-col justify-end bg-card-dark border border-white/10 p-5 shadow-2xl">
                {loc?.imageUrl && <img src={loc.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt={locName} />}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-background-dark'}`}>
                            {isLive ? 'LIVE' : 'AGENDADO'}
                        </span>
                        <span className="text-xs font-black text-white">{timeRemaining}</span>
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-black text-white leading-tight">{locName}</h3>
                        <p className="text-gray-400 text-xs font-bold">{new Date(activeTournament.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })} • {activeTournament.time}</p>
                    </div>

                    {!isLive && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Convocatória</span>
                                <span className={`text-[10px] font-black uppercase ${isQuorumReached ? 'text-emerald-400' : 'text-primary'}`}>
                                    {isQuorumReached ? 'QUORUM ATINGIDO' : `Faltam ${8 - confirmedCount} jogadores`}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ease-out ${isQuorumReached ? 'bg-emerald-500' : 'bg-primary'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase">
                                <span>{confirmedCount} Confirmados</span>
                                <span>8 Necessários</span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {isLive ? (
                <button onClick={() => setScreen(Screen.LIVE_GAME)} className="w-full bg-primary text-background-dark font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined font-black">sports_tennis</span>
                    IR PARA JOGO
                </button>
            ) : isRosterClosed ? (
                <button onClick={() => setScreen(Screen.TEAM_SETUP)} className="w-full bg-emerald-500 text-background-dark font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined font-black">shuffle</span>
                    REALIZAR SORTEIO
                </button>
            ) : (
                <button onClick={() => setIsManagingPlayers(true)} className="w-full bg-white/5 border border-white/10 font-bold py-5 rounded-2xl flex items-center justify-center gap-2 active:bg-white/10 transition-all">
                    <span className="material-symbols-outlined font-black">group_add</span>
                    GERIR CONVOCATÓRIA
                </button>
            )}
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in min-h-screen">
        <header className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
                <img src="/favicon.svg" className="w-14 h-14 object-contain" alt="Logo" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight leading-none">Padel <br/><span className="text-primary">Manager</span></h1>
                    <p className="text-slate-400 text-xs mt-1">Pronto para o próximo jogo?</p>
                </div>
            </div>
        </header>

        {StatsSection}

        <section className="bg-card-dark/50 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-6 shadow-xl">
             <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-bounce">event_available</span>
             </div>
             <div>
                <h3 className="text-xl font-black text-white">Nenhum jogo agendado</h3>
                <p className="text-gray-500 text-sm mt-2">Dá o primeiro passo e organiza o próximo torneio para o teu grupo.</p>
             </div>
             <button 
                onClick={initCreation} 
                className="w-full bg-primary text-background-dark font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-all"
             >
                <span className="material-symbols-outlined font-black">add</span>
                AGENDAR TORNEIO
             </button>
        </section>

        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Últimos Torneios</h3>
              <button onClick={() => setScreen(Screen.TOURNAMENT_HISTORY)} className="text-[10px] font-black text-primary uppercase tracking-widest">Ver Tudo</button>
            </div>
            <div className="flex flex-col gap-3">
                {history.slice(0, 3).map((t) => {
                    const winners = getWinnersOfTournament(t);
                    return (
                        <button key={t.id} onClick={() => onViewTournament(t)} className="flex items-center justify-between p-4 bg-card-dark rounded-2xl border border-white/5 active:bg-white/5 transition-all group">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="size-10 rounded-xl bg-white/5 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[9px] font-black text-gray-500 uppercase">{new Date(t.date).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                    <span className="text-sm font-black text-white">{new Date(t.date).getDate()}</span>
                                </div>
                                <div className="text-left truncate">
                                    <p className="text-sm font-black text-white leading-tight truncate">{locations.find(l => l.id === t.locationId)?.name || 'Local'}</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t.time} • {t.duration}h</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {winners && (
                                    <div className="flex gap-2">
                                        {winners.map(p => (
                                            <div key={p.id} className="flex flex-col items-center gap-0.5">
                                                {renderGlobalAvatar(p, 'size-7 ring-1 ring-white/10')}
                                                <span className="text-[6px] font-black text-white/40 uppercase tracking-tighter truncate w-8 text-center">{p.nickname || p.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <span className="material-symbols-outlined text-gray-700 group-hover:text-primary transition-colors">chevron_right</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    </div>
  );
};

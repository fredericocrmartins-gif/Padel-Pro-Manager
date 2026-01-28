
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
  const [isManagingPlayers, setIsManagingPlayers] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  
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

  const initCreation = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setSelectedPlayers([]);
    const lxIndoor = locations.find(l => l.name.toLowerCase().includes('lx indoor'));
    if (lxIndoor) setLocationId(lxIndoor.id);
    else if (locations.length > 0) setLocationId(locations[0].id);
    setIsCreating(true);
  };

  const togglePlayerInActiveTournament = (id: string) => {
    if (!activeTournament) return;
    const isAlreadyConfirmed = activeTournament.confirmedPlayerIds.includes(id);
    const updatedIds = isAlreadyConfirmed 
        ? activeTournament.confirmedPlayerIds.filter(pid => pid !== id)
        : [...activeTournament.confirmedPlayerIds, id];
    onUpdateTournament({ ...activeTournament, confirmedPlayerIds: updatedIds });
  };

  const handleSaveGuest = () => {
    if (!guestFirstName.trim()) return;
    const newId = `p-${Date.now()}`;
    const newPlayer: Player = { id: newId, name: guestFirstName, lastName: guestLastName, nickname: guestNickname || guestFirstName, level: 'Nível 3', image: '' };
    onAddPlayer(newPlayer);
    if (activeTournament) {
        onUpdateTournament({ ...activeTournament, confirmedPlayerIds: [...activeTournament.confirmedPlayerIds, newId] });
    }
    setGuestFirstName(''); setGuestLastName(''); setGuestNickname(''); setIsAddingGuest(false);
  };

  const handleSubmitTournament = () => {
    if (!date || !time || !locationId) return;
    onCreateTournament({ id: `t-${Date.now()}`, date, time, duration, locationId, confirmedPlayerIds: selectedPlayers, status: 'scheduled', rosterClosed: false });
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

  if (isCreating) {
    return (
        <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in min-h-screen bg-background-dark relative z-20">
            <header className="flex items-center justify-between">
                <button onClick={() => setIsCreating(false)} className="size-10 rounded-full flex items-center justify-center bg-white/5"><span className="material-symbols-outlined text-white">close</span></button>
                <h2 className="text-lg font-bold">Novo Torneio</h2>
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
            </div>
            <button onClick={handleSubmitTournament} className="mt-auto w-full bg-primary text-background-dark font-bold py-4 rounded-xl">Criar Torneio</button>
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
            </header>
            {StatsSection}
            <section className="relative overflow-hidden rounded-3xl min-h-[250px] flex flex-col justify-end bg-card-dark border border-white/10 p-5">
                {loc?.imageUrl && <img src={loc.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt={locName} />}
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="bg-primary text-background-dark text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{isLive ? 'LIVE' : 'PRÓXIMO'}</span>
                        <span className="text-xs font-black text-white">{timeRemaining}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">{locName}</h3>
                    <p className="text-gray-400 text-xs font-bold">{new Date(activeTournament.date).toLocaleDateString()} • {activeTournament.time}</p>
                </div>
            </section>
            {isLive ? (
                <button onClick={() => setScreen(Screen.LIVE_GAME)} className="w-full bg-primary text-background-dark font-black py-5 rounded-2xl shadow-xl">IR PARA JOGO</button>
            ) : isRosterClosed ? (
                <button onClick={() => setScreen(Screen.TEAM_SETUP)} className="w-full bg-emerald-500 text-background-dark font-black py-4 rounded-2xl">REALIZAR SORTEIO</button>
            ) : (
                <button onClick={() => setIsManagingPlayers(true)} className="w-full bg-white/5 border border-white/10 font-bold py-4 rounded-2xl">GERIR JOGADORES</button>
            )}
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in">
        <header className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
                <img src="/favicon.svg" className="w-14 h-14 object-contain" alt="Logo" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight leading-none">Padel <br/><span className="text-primary">Manager</span></h1>
                    <p className="text-slate-400 text-xs mt-1">Pronto para o próximo jogo?</p>
                </div>
            </div>
            <button onClick={initCreation} className="bg-primary text-background-dark size-12 flex items-center justify-center rounded-2xl"><span className="material-symbols-outlined font-bold text-2xl">add</span></button>
        </header>
        {StatsSection}
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Últimos Torneios</h3>
              <button onClick={() => setScreen(Screen.TOURNAMENT_HISTORY)} className="text-[10px] font-bold text-primary">Ver Tudo</button>
            </div>
            <div className="flex flex-col gap-3">
                {history.slice(0, 5).map((t) => (
                    <button key={t.id} onClick={() => onViewTournament(t)} className="flex items-center justify-between p-4 bg-card-dark rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-white/5 flex flex-col items-center justify-center">
                                <span className="text-[9px] font-bold text-gray-500 uppercase">{new Date(t.date).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                <span className="text-sm font-bold text-white">{new Date(t.date).getDate()}</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-white leading-tight">{locations.find(l => l.id === t.locationId)?.name || 'Local'}</p>
                                <p className="text-[10px] text-gray-500">{t.matches?.length || 0} Jogos</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-600">chevron_right</span>
                    </button>
                ))}
            </div>
        </section>
    </div>
  );
};

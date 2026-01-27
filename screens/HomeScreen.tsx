
import React, { useState } from 'react';
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
  history: Tournament[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
    setScreen, 
    activeTournament, 
    players, 
    locations,
    onCreateTournament,
    onAddPlayer,
    onUpdateTournament,
    history
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isManagingPlayers, setIsManagingPlayers] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('22:00'); // Hora predefinida para as 22:00
  const [duration, setDuration] = useState(2);
  const [locationId, setLocationId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  const totalGames = history.reduce((acc, t) => acc + (t.matches?.length || 0), 0);
  const totalHours = history.reduce((acc, t) => acc + t.duration, 0);
  
  const locationUsage: Record<string, number> = {};
  history.forEach(t => {
    locationUsage[t.locationId] = (locationUsage[t.locationId] || 0) + 1;
  });
  const favLocationId = Object.entries(locationUsage).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favLocation = locations.find(l => l.id === favLocationId)?.name || 'N/A';

  const initCreation = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setSelectedPlayers([]);
    
    const lxIndoor = locations.find(l => l.name.toLowerCase().includes('lx indoor'));
    if (lxIndoor) {
        setLocationId(lxIndoor.id);
    } else if (locations.length > 0) {
        setLocationId(locations[0].id);
    }
    
    setIsCreating(true);
  };

  const togglePlayerInForm = (id: string) => {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter(pid => pid !== id));
    } else {
      setSelectedPlayers([...selectedPlayers, id]);
    }
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
    if (!guestName.trim()) return;
    const newId = `p-${Date.now()}`;
    const newPlayer: Player = {
        id: newId,
        name: guestName,
        nickname: guestNickname || guestName,
        level: 'Nível 3',
        image: '' 
    };
    onAddPlayer(newPlayer);
    if (activeTournament) {
        onUpdateTournament({
            ...activeTournament,
            confirmedPlayerIds: [...activeTournament.confirmedPlayerIds, newId]
        });
    }
    setGuestName('');
    setGuestNickname('');
    setIsAddingGuest(false);
  };

  const handleSubmitTournament = () => {
    if (!date || !time || !locationId) return;
    const newTournament: Tournament = {
        id: `t-${Date.now()}`,
        date,
        time,
        duration,
        locationId,
        confirmedPlayerIds: selectedPlayers,
        status: 'scheduled'
    };
    onCreateTournament(newTournament);
    setIsCreating(false);
  };

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || 'Local Desconhecido';

  if (isCreating) {
    return (
        <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in min-h-screen bg-background-dark relative z-20">
            <header className="flex items-center justify-between">
                <button onClick={() => setIsCreating(false)} className="size-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-white">close</span>
                </button>
                <h2 className="text-lg font-bold">Novo Torneio</h2>
                <div className="w-10"></div>
            </header>
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hora</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-card-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
                        {players.sort((a,b) => (a.nickname || a.name).localeCompare(b.nickname || b.name)).map(p => (
                            <button key={p.id} onClick={() => togglePlayerInForm(p.id)} className={`flex flex-col items-center p-2 rounded-xl border transition-all ${selectedPlayers.includes(p.id) ? 'bg-primary/20 border-primary' : 'bg-card-dark border-transparent opacity-60'}`}>
                                {renderGlobalAvatar(p, 'size-8')}
                                <span className="text-[9px] font-bold truncate w-full text-center mt-1">{p.nickname || p.name.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={handleSubmitTournament} className="mt-auto w-full bg-primary text-background-dark font-bold py-4 rounded-xl shadow-xl shadow-primary/20">Criar Torneio</button>
        </div>
    );
  }

  if (activeTournament) {
    const locName = getLocationName(activeTournament.locationId);
    const confirmedCount = activeTournament.confirmedPlayerIds.length;
    const isReady = confirmedCount === 8;
    const confirmedPlayers = activeTournament.confirmedPlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => p !== undefined);

    return (
        <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in relative">
            {isManagingPlayers && (
                <div className="fixed inset-0 z-[60] bg-background-dark/95 backdrop-blur-md p-4 animate-fade-in flex flex-col">
                    <header className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Gestão de Confirmados</h2><button onClick={() => setIsManagingPlayers(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button></header>
                    {isAddingGuest ? (
                        <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl mb-4 animate-fade-in-up">
                            <h3 className="text-xs font-bold text-primary uppercase mb-3">Novo Convidado</h3>
                            <div className="space-y-3">
                                <input type="text" placeholder="Nome Completo" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                                <input type="text" placeholder="Alcunha" value={guestNickname} onChange={(e) => setGuestNickname(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                                <div className="flex gap-2"><button onClick={() => setIsAddingGuest(false)} className="flex-1 py-2 text-gray-400 font-bold text-xs uppercase">Cancelar</button><button onClick={handleSaveGuest} className="flex-1 py-2 bg-primary text-background-dark rounded-xl font-bold text-xs uppercase">Guardar</button></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span><input type="text" placeholder="Pesquisar..." value={playerSearchTerm} onChange={(e) => setPlayerSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white" /></div>
                            <button onClick={() => setIsAddingGuest(true)} className="bg-primary/20 text-primary border border-primary/30 px-4 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-sm">person_add</span></button>
                        </div>
                    )}
                    <div className="grid grid-cols-4 gap-3 overflow-y-auto pb-24 hide-scrollbar">
                        {players.filter(p => (p.nickname || p.name).toLowerCase().includes(playerSearchTerm.toLowerCase())).map(p => {
                            const isConfirmed = activeTournament.confirmedPlayerIds.includes(p.id);
                            return (
                                <button key={p.id} onClick={() => togglePlayerInActiveTournament(p.id)} className={`flex flex-col items-center p-2 rounded-2xl border transition-all ${isConfirmed ? 'bg-primary/20 border-primary scale-105' : 'bg-card-dark border-white/5 opacity-50'}`}>
                                    <div className="relative mb-1">
                                        {renderGlobalAvatar(p, 'size-10')}
                                        {isConfirmed && <div className="absolute -bottom-1 -right-1 bg-primary text-black rounded-full p-0.5 border border-background-dark"><span className="material-symbols-outlined text-[10px] font-bold block">check</span></div>}
                                    </div>
                                    <span className="text-[9px] font-bold truncate w-full text-center">{p.nickname || p.name.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto">
                        <button onClick={() => setIsManagingPlayers(false)} className={`w-full font-bold py-4 rounded-2xl shadow-xl transition-all ${isReady ? 'bg-emerald-500 text-background-dark' : 'bg-primary text-background-dark'}`}>Concluído ({confirmedCount}/8)</button>
                    </div>
                </div>
            )}
            <header><h1 className="text-3xl font-bold tracking-tight">Dashboard</h1><p className="text-slate-400">Próxima sessão confirmada.</p></header>
            <section className={`relative overflow-hidden rounded-3xl bg-card-dark shadow-xl ring-1 transition-all duration-700 ${isReady ? 'ring-emerald-500/50 scale-[1.01]' : 'ring-white/10'}`}>
                <div className="p-5 relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div><div className="flex items-center gap-2 mb-2"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${isReady ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>{isReady ? 'QUÓRUM ATINGIDO' : 'A AGUARDAR CONFIRMAÇÕES'}</span></div><h3 className="text-xl font-bold text-white mb-1">{locName}</h3><p className="text-slate-400 text-xs flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">calendar_today</span>{new Date(activeTournament.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })} • {activeTournament.time}</p></div>
                        <div className={`p-2.5 rounded-xl border ${isReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-primary'}`}><span className="material-symbols-outlined text-2xl">sports_tennis</span></div>
                    </div>
                    <div className="space-y-2"><div className="flex justify-between items-end"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Jogadores ({confirmedCount}/8)</span><span className={`text-xs font-bold font-mono ${isReady ? 'text-emerald-400' : 'text-white'}`}>{isReady ? 'TUDO PRONTO' : `FALTAM ${8 - confirmedCount}`}</span></div><div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5"><div style={{ width: `${Math.min(100, (confirmedCount / 8) * 100)}%` }} className={`h-full transition-all duration-1000 rounded-full ${isReady ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-primary'}`}></div></div></div>
                </div>
            </section>
            <button onClick={() => setScreen(Screen.TEAM_SETUP)} disabled={!isReady} className={`w-full font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all ${isReady ? 'bg-emerald-500 text-background-dark shadow-xl scale-[1.02] active:scale-100' : 'bg-white/5 text-gray-600 border border-white/5 opacity-50 cursor-not-allowed'}`}><span className="material-symbols-outlined">casino</span><span>Realizar Sorteio de Equipas</span></button>
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1"><h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Confirmados</h3><button onClick={() => setIsManagingPlayers(true)} className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full">Gerir Todos</button></div>
                <div className="grid grid-cols-4 gap-4">
                    {confirmedPlayers.map((p) => (
                        <div key={p.id} className="flex flex-col items-center gap-2 animate-fade-in-up">
                            {renderGlobalAvatar(p, 'size-14')}
                            <span className="text-[10px] font-bold text-center truncate w-full">{p.nickname || p.name.split(' ')[0]}</span>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 8 - confirmedCount) }).map((_, idx) => (
                        <button key={`empty-${idx}`} onClick={() => setIsManagingPlayers(true)} className="flex flex-col items-center gap-2">
                            <div className="size-14 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all"><span className="material-symbols-outlined text-gray-700">person_add</span></div>
                            <span className="text-[10px] font-bold text-gray-700">Livre</span>
                        </button>
                    ))}
                </div>
            </section>
            <button onClick={() => onUpdateTournament(null as any)} className="text-[10px] font-bold text-red-500/40 hover:text-red-500 text-center mt-6">Remover agendamento atual</button>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in">
        <header className="flex justify-between items-start"><div><h1 className="text-3xl font-bold tracking-tight mb-1">Padel Manager</h1><p className="text-slate-400">Bom dia! Pronto para o próximo jogo?</p></div><button onClick={initCreation} className="bg-primary text-background-dark p-2.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"><span className="material-symbols-outlined font-bold">add</span></button></header>
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
        <button onClick={initCreation} className="w-full bg-gradient-to-r from-primary to-blue-600 p-6 rounded-3xl shadow-xl shadow-primary/20 flex flex-col items-start gap-1 relative overflow-hidden group active:scale-[0.98] transition-all"><div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500"><span className="material-symbols-outlined text-6xl">event_available</span></div><span className="text-background-dark font-bold uppercase tracking-widest text-[10px]">Agendamento</span><span className="text-background-dark font-bold text-xl">Criar Novo Torneio</span><span className="text-background-dark/70 text-xs">Selecione local, data e jogadores iniciais.</span></button>
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1"><h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Últimos Torneios</h3><button onClick={() => setScreen(Screen.GLOBAL_STATS)} className="text-[10px] font-bold text-primary">Ver Tudo</button></div>
            <div className="flex flex-col gap-3">
                {history.slice(0, 5).map((t) => (
                    <button key={t.id} onClick={() => setScreen(Screen.GLOBAL_STATS)} className="flex items-center justify-between p-4 bg-card-dark rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group"><div className="flex items-center gap-4"><div className="size-10 rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors"><span className="text-[9px] font-bold text-gray-500 uppercase">{new Date(t.date).toLocaleDateString('pt-PT', { month: 'short' })}</span><span className="text-sm font-bold text-white">{new Date(t.date).getDate()}</span></div><div className="text-left"><p className="text-sm font-bold text-white leading-tight group-hover:text-primary transition-colors">{getLocationName(t.locationId)}</p><p className="text-[10px] text-gray-500">{t.matches?.length || 0} Jogos • Finalizado</p></div></div><span className="material-symbols-outlined text-gray-600">chevron_right</span></button>
                ))}
                {history.length === 0 && <div className="flex flex-col items-center justify-center py-10 opacity-30"><span className="material-symbols-outlined text-4xl mb-2">history</span><p className="text-xs">Ainda não realizou torneios.</p></div>}
            </div>
        </section>
    </div>
  );
};

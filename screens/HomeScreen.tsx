
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
    history
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isManagingPlayers, setIsManagingPlayers] = useState(false);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('22:00'); // Hora predefinida para as 22:00
  const [duration, setDuration] = useState(2);
  const [locationId, setLocationId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  // State para o countdown
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
    const timer = setInterval(() => setTimeRemaining(calculateTimeLeft()), 60000); // Atualiza a cada minuto
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

  // --- COMPONENTE DE ESTATÍSTICAS REUTILIZÁVEL ---
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
    if (!guestFirstName.trim()) return;
    const newId = `p-${Date.now()}`;
    const newPlayer: Player = {
        id: newId,
        name: guestFirstName,
        lastName: guestLastName,
        nickname: guestNickname || guestFirstName,
        level: 'Nível 3',
        image: '' 
    };
    // Adiciona o jogador à base de dados global e atualiza o torneio imediatamente
    onAddPlayer(newPlayer);
    if (activeTournament) {
        onUpdateTournament({
            ...activeTournament,
            confirmedPlayerIds: [...activeTournament.confirmedPlayerIds, newId]
        });
    }
    setGuestFirstName('');
    setGuestLastName('');
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
        status: 'scheduled',
        rosterClosed: false
    };
    onCreateTournament(newTournament);
    setIsCreating(false);
  };

  const handleCloseRoster = () => {
    if (!activeTournament) return;
    if (activeTournament.confirmedPlayerIds.length !== 8) {
        alert("São necessários exatamente 8 jogadores para fechar a convocatória.");
        return;
    }
    if (confirm("Fechar convocatória e preparar sorteio?")) {
        onUpdateTournament({ ...activeTournament, rosterClosed: true });
        setIsManagingPlayers(false);
    }
  };

  const handleReopenRoster = () => {
      if (!activeTournament) return;
      if (confirm("Reabrir convocatória para alterações?")) {
          onUpdateTournament({ ...activeTournament, rosterClosed: false });
      }
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
    const loc = locations.find(l => l.id === activeTournament.locationId);
    const locName = loc?.name || 'Local Desconhecido';
    const confirmedCount = activeTournament.confirmedPlayerIds.length;
    const confirmedPlayers = activeTournament.confirmedPlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => p !== undefined);

    const isLive = activeTournament.status === 'live';
    const isRosterClosed = activeTournament.rosterClosed;
    const isQuorumReached = confirmedCount === 8;

    return (
        <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in relative">
            {isManagingPlayers && (
                <div className="fixed inset-0 z-[60] bg-background-dark flex flex-col animate-fade-in">
                    {/* Header e Search - Fixo no Topo */}
                    <div className="shrink-0 p-4 border-b border-white/5 bg-background-dark/95 backdrop-blur-md z-10 space-y-3">
                        <header className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold leading-none">Gestão de Equipa</h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    <span className={isQuorumReached ? "text-emerald-400" : "text-primary"}>{confirmedCount}</span> de 8 Selecionados
                                </p>
                            </div>
                            <button onClick={() => setIsManagingPlayers(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 active:scale-95 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        
                        {/* Barra de Progresso Visual */}
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${isQuorumReached ? 'bg-emerald-500' : 'bg-primary'}`} 
                                style={{ width: `${Math.min(100, (confirmedCount / 8) * 100)}%` }}
                            ></div>
                        </div>
                        
                        {isAddingGuest ? (
                            <div className="bg-card-dark border border-white/10 p-4 rounded-2xl animate-fade-in-up shadow-xl">
                                <h3 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">person_add</span>
                                    Novo Convidado
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" placeholder="Nome" value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:border-primary/50 transition-colors" />
                                        <input type="text" placeholder="Apelido" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:border-primary/50 transition-colors" />
                                    </div>
                                    <input type="text" placeholder="Alcunha (Opcional)" value={guestNickname} onChange={(e) => setGuestNickname(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:border-primary/50 transition-colors" />
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsAddingGuest(false)} className="flex-1 py-3 text-gray-400 font-bold text-xs uppercase border border-white/10 rounded-xl hover:bg-white/5">Cancelar</button>
                                        <button onClick={handleSaveGuest} className="flex-1 py-3 bg-primary text-background-dark rounded-xl font-bold text-xs uppercase shadow-lg shadow-primary/20 hover:bg-primary/90">Guardar</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Pesquisar jogador..." 
                                        value={playerSearchTerm} 
                                        onChange={(e) => setPlayerSearchTerm(e.target.value)} 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-600" 
                                    />
                                </div>
                                <button onClick={() => setIsAddingGuest(true)} className="bg-primary/10 text-primary border border-primary/20 px-4 rounded-2xl flex items-center justify-center active:scale-95 transition-transform">
                                    <span className="material-symbols-outlined text-xl">person_add</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Lista com Scroll - Otimizada para Mobile (3 Colunas) */}
                    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar bg-gradient-to-b from-transparent to-black/20">
                        <div className="grid grid-cols-3 gap-3 pb-48">
                            {players.filter(p => (p.nickname || p.name).toLowerCase().includes(playerSearchTerm.toLowerCase())).map(p => {
                                const isConfirmed = activeTournament.confirmedPlayerIds.includes(p.id);
                                return (
                                    <button 
                                        key={p.id} 
                                        onClick={() => togglePlayerInActiveTournament(p.id)} 
                                        className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
                                            isConfirmed 
                                                ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(96,122,251,0.15)] ring-1 ring-primary/50' 
                                                : 'bg-card-dark border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="relative mb-2">
                                            {renderGlobalAvatar(p, 'size-12')}
                                            {isConfirmed && (
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-background-dark rounded-full size-5 flex items-center justify-center border-2 border-background-dark animate-bounce-subtle shadow-sm">
                                                    <span className="material-symbols-outlined text-[12px] font-black">check</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold truncate w-full text-center leading-tight ${isConfirmed ? 'text-white' : 'text-gray-400'}`}>
                                            {p.nickname || p.name.split(' ')[0]}
                                        </span>
                                        <span className="text-[8px] font-bold text-gray-600 mt-0.5">{p.level}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Fixo - Sempre visível mesmo com teclado */}
                    <div className="shrink-0 p-4 bg-background-dark border-t border-white/10 pb-28 safe-area-bottom z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                         {isQuorumReached ? (
                             <button onClick={handleCloseRoster} className="w-full bg-emerald-500 text-background-dark font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                                <span className="material-symbols-outlined">lock</span>
                                <span>FECHAR CONVOCATÓRIA</span>
                             </button>
                        ) : (
                            <div className="bg-card-dark border border-white/10 p-4 rounded-2xl flex items-center justify-center gap-3">
                                <span className="material-symbols-outlined text-gray-500 animate-pulse">group_add</span>
                                <span className="text-xs font-bold text-gray-400">
                                    Selecione mais <span className="text-primary text-sm font-black mx-1">{8 - confirmedCount}</span> para fechar
                                </span>
                            </div>
                        )}
                        <button onClick={() => setIsManagingPlayers(false)} className="w-full py-3 mt-2 text-gray-500 font-bold text-xs uppercase hover:text-white transition-colors">Voltar</button>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                    <img src="/favicon.png" className="w-14 h-14 object-contain drop-shadow-2xl" alt="Logo" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1 leading-none">Padel <br/><span className="text-primary">Manager</span></h1>
                        <p className="text-slate-400 text-xs mt-1">
                            {isLive ? 'Torneio em andamento!' : isRosterClosed ? 'Tudo pronto para começar.' : 'Fase de convocatória.'}
                        </p>
                    </div>
                </div>
            </header>
            
            {StatsSection}
            
            <section className={`relative overflow-hidden rounded-3xl shadow-xl ring-1 transition-all duration-700 min-h-[280px] flex flex-col justify-end group ${isLive ? 'ring-primary shadow-primary/20' : isRosterClosed ? 'ring-emerald-500/50' : 'ring-white/10'}`}>
                
                {/* Imagem de Fundo */}
                {loc?.imageUrl ? (
                    <>
                        <img src={loc.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={locName} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
                    </>
                ) : (
                     <div className="absolute inset-0 bg-card-dark"></div>
                )}
                
                {isLive && <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>}
                
                <div className="p-5 relative z-10 w-full">
                    {/* Top Right Countdown */}
                    {!isLive && (
                        <div className="absolute top-0 right-5 -mt-20 flex flex-col items-end">
                            <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                 <span className="material-symbols-outlined text-primary text-sm animate-pulse">timer</span>
                                 <span className="text-xs font-black text-white uppercase tracking-wider">{timeRemaining}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border backdrop-blur-md ${isLive ? 'bg-primary text-background-dark border-primary' : isRosterClosed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/10 text-white border-white/20'}`}>
                                {isLive ? 'A DECORRER' : isRosterClosed ? 'CONVOCATÓRIA FECHADA' : 'ABERTO A INSCRIÇÕES'}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-4">
                         <div>
                             <h3 className="text-2xl font-black text-white mb-1 leading-none drop-shadow-lg">{locName}</h3>
                             <div className="flex items-center gap-3">
                                 <p className="text-gray-300 text-xs flex items-center gap-1.5 font-bold drop-shadow-md">
                                     <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                                     {new Date(activeTournament.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })} • {activeTournament.time}
                                 </p>
                             </div>
                         </div>
                         
                         {/* Botão GPS */}
                         {loc?.googleMapsUrl && (
                             <a href={loc.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-background-dark transition-all shadow-lg active:scale-90 z-20">
                                 <span className="material-symbols-outlined text-lg">near_me</span>
                             </a>
                         )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest drop-shadow-md">Jogadores ({confirmedCount}/8)</span>
                            <span className={`text-xs font-bold font-mono drop-shadow-md ${isQuorumReached ? 'text-emerald-400' : 'text-white'}`}>
                                {isQuorumReached ? 'LOTAÇÃO ESGOTADA' : `FALTAM ${8 - confirmedCount}`}
                            </span>
                        </div>
                        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 p-0.5 backdrop-blur-sm">
                            <div style={{ width: `${Math.min(100, (confirmedCount / 8) * 100)}%` }} className={`h-full transition-all duration-1000 rounded-full ${isQuorumReached ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-primary'}`}></div>
                        </div>
                    </div>
                </div>
            </section>
            
            {isLive ? (
                <button onClick={() => setScreen(Screen.LIVE_GAME)} className="w-full bg-primary text-background-dark font-black py-5 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 animate-bounce-subtle">
                    <span className="material-symbols-outlined">scoreboard</span>
                    <span>IR PARA JOGO (EM DIRETO)</span>
                </button>
            ) : isRosterClosed ? (
                <div className="space-y-3">
                    <button onClick={() => setScreen(Screen.TEAM_SETUP)} className="w-full font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all bg-emerald-500 text-background-dark shadow-xl scale-[1.02] active:scale-100">
                        <span className="material-symbols-outlined">casino</span>
                        <span>Realizar Sorteio de Equipas</span>
                    </button>
                    <button onClick={handleReopenRoster} className="w-full text-[10px] font-bold text-gray-500 uppercase py-2 flex items-center justify-center gap-1 hover:text-white">
                        <span className="material-symbols-outlined text-sm">lock_open</span> Reabrir Convocatória para Alterações
                    </button>
                </div>
            ) : (
                <button onClick={() => setIsManagingPlayers(true)} className="w-full font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all bg-white/5 text-white border border-white/10 hover:bg-white/10">
                    <span className="material-symbols-outlined">person_add</span>
                    <span>Gerir Jogadores / Convidados</span>
                </button>
            )}

            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Confirmados</h3>
                    {!isRosterClosed && !isLive && <button onClick={() => setIsManagingPlayers(true)} className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full">Editar</button>}
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {confirmedPlayers.map((p) => (
                        <div key={p.id} className="flex flex-col items-center gap-2 animate-fade-in-up">
                            {renderGlobalAvatar(p, 'size-14')}
                            <span className="text-[10px] font-bold text-center truncate w-full">{p.nickname || p.name.split(' ')[0]}</span>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 8 - confirmedCount) }).map((_, idx) => (
                        <button key={`empty-${idx}`} onClick={() => !isRosterClosed && setIsManagingPlayers(true)} className={`flex flex-col items-center gap-2 ${isRosterClosed ? 'opacity-30 cursor-not-allowed' : ''}`}>
                            <div className="size-14 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all"><span className="material-symbols-outlined text-gray-700">person_add</span></div>
                            <span className="text-[10px] font-bold text-gray-700">Livre</span>
                        </button>
                    ))}
                </div>
            </section>
            
            <button onClick={onCancelTournament} className="text-[10px] font-bold text-red-500/60 hover:text-red-500 text-center mt-6 uppercase tracking-widest border border-red-500/10 hover:border-red-500/30 py-3 rounded-xl transition-all">
                Cancelar e Remover Agendamento
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-32 animate-fade-in">
        <header className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
                <img src="/favicon.png" className="w-14 h-14 object-contain drop-shadow-2xl" alt="Logo" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 leading-none">Padel <br/><span className="text-primary">Manager</span></h1>
                    <p className="text-slate-400 text-xs mt-1">Pronto para o próximo jogo?</p>
                </div>
            </div>
            <button onClick={initCreation} className="bg-primary text-background-dark size-12 flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <span className="material-symbols-outlined font-bold text-2xl">add</span>
            </button>
        </header>
        
        {StatsSection}

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

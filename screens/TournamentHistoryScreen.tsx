
import React, { useState, useMemo } from 'react';
import { Screen, Tournament, Location } from '../types';

interface HistoryProps {
  history: Tournament[];
  locations: Location[];
  onViewTournament: (t: Tournament) => void;
  onDeleteTournament?: (id: string) => void;
}

export const TournamentHistoryScreen: React.FC<HistoryProps> = ({ history, locations, onViewTournament, onDeleteTournament }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // Alterado para false: o calendário começa recolhido por defeito
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

  // Lógica do Calendário
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  
  const days = useMemo(() => {
    const totalDays = daysInMonth(currentYear, currentMonth);
    const firstDay = firstDayOfMonth(currentYear, currentMonth);
    const daysArray = [];
    
    // Espaços vazios para alinhar o primeiro dia
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    
    for (let i = 1; i <= totalDays; i++) {
      daysArray.push(i);
    }
    
    return daysArray;
  }, [currentYear, currentMonth]);

  const tournamentDates = useMemo(() => {
    const dates = new Set<string>();
    history.forEach(t => {
      const statusMatch = t.status === 'finished' || (showCancelled && t.status === 'cancelled');
      if (statusMatch) {
        const d = new Date(t.date);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          dates.add(d.getDate().toString());
        }
      }
    });
    return dates;
  }, [history, currentYear, currentMonth, showCancelled]);

  const filteredHistory = useMemo(() => {
    return history
      .filter(t => {
        const loc = locations.find(l => l.id === t.locationId);
        const locName = loc?.name || 'Local Desconhecido';
        const matchesSearch = locName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const tDate = new Date(t.date);
        const matchesDay = selectedDay === null || (
          tDate.getDate() === selectedDay && 
          tDate.getMonth() === currentMonth && 
          tDate.getFullYear() === currentYear
        );
        
        const statusMatch = t.status === 'finished' || (showCancelled && t.status === 'cancelled');
        
        return matchesSearch && matchesDay && statusMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, searchTerm, selectedDay, currentMonth, currentYear, locations, showCancelled]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setCalendarDate(newDate);
    setSelectedDay(null);
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-32 animate-fade-in">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white">Registo <br/><span className="text-primary">Histórico</span></h1>
          <p className="text-gray-500 text-sm mt-1">Consulte todos os torneios realizados.</p>
        </div>
        <button 
          onClick={() => setShowCancelled(!showCancelled)} 
          className={`size-12 rounded-2xl border flex items-center justify-center transition-all ${showCancelled ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-card-dark border-white/5 text-gray-500'}`}
          title="Ver Cancelados"
        >
          <span className="material-symbols-outlined">{showCancelled ? 'event_busy' : 'event_available'}</span>
        </button>
      </header>

      {/* Calendário Interativo com Expansão/Colapso */}
      <section className="bg-card-dark rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden relative transition-all duration-500 ease-in-out">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-8xl">calendar_month</span>
        </div>

        {/* Header do Calendário */}
        <div className="flex items-center justify-between p-6 relative z-10 border-b border-white/5">
          <div className="flex items-center gap-4">
             <button onClick={() => changeMonth(-1)} className="size-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
               <span className="material-symbols-outlined text-xl">chevron_left</span>
             </button>
             <div className="text-left">
               <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                 {calendarDate.toLocaleDateString('pt-PT', { year: 'numeric' })}
               </h3>
               <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                 {calendarDate.toLocaleDateString('pt-PT', { month: 'long' })}
               </h3>
             </div>
             <button onClick={() => changeMonth(1)} className="size-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
               <span className="material-symbols-outlined text-xl">chevron_right</span>
             </button>
          </div>
          
          {/* Botão de Expansão */}
          <button 
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isCalendarExpanded ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400'}`}
          >
            <span className="material-symbols-outlined text-sm">{isCalendarExpanded ? 'expand_less' : 'expand_more'}</span>
            {isCalendarExpanded ? 'Recolher' : 'Calendário'}
          </button>
        </div>

        {/* Grelha do Calendário (Colapsável) */}
        <div className={`transition-all duration-500 ease-in-out px-6 ${isCalendarExpanded ? 'max-h-[400px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0 overflow-hidden'}`}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[8px] font-black text-gray-600 uppercase mb-2">{day}</div>
            ))}
            {days.map((day, i) => {
              const hasTournament = day !== null && tournamentDates.has(day.toString());
              const isSelected = selectedDay === day;
              const isToday = day !== null && new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();
              
              return (
                <button
                  key={i}
                  disabled={day === null}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`
                    relative h-10 rounded-xl flex flex-col items-center justify-center transition-all text-[10px] font-bold
                    ${day === null ? 'opacity-0' : 'hover:bg-white/5'}
                    ${isSelected ? 'bg-primary text-background-dark scale-110 shadow-lg shadow-primary/20 z-10' : 'text-gray-400'}
                    ${isToday && !isSelected ? 'border border-primary/30 text-primary' : ''}
                  `}
                >
                  {day}
                  {hasTournament && (
                    <div className={`absolute bottom-1.5 size-1.5 rounded-full ${isSelected ? 'bg-background-dark' : 'bg-primary shadow-[0_0_5px_rgba(96,122,251,0.5)]'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
          
          {selectedDay && (
            <button 
              onClick={() => setSelectedDay(null)}
              className="w-full mt-4 py-2 bg-white/5 rounded-xl text-[9px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Limpar Filtro de Data
            </button>
          )}
        </div>
      </section>

      <div className="space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
          <input 
            type="text" 
            placeholder="Pesquisar local..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card-dark border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {selectedDay ? `Torneios em ${selectedDay} de ${calendarDate.toLocaleDateString('pt-PT', { month: 'long' })}` : 'Lista de Torneios'}
            </h3>
            <span className="text-[10px] font-bold text-primary">{filteredHistory.length} encontrados</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
              <span className="material-symbols-outlined text-6xl mb-4">history_toggle_off</span>
              <p className="text-sm font-bold">Nenhum registo encontrado</p>
              {selectedDay && <p className="text-[10px] uppercase mt-1">Tente selecionar outro dia ou limpar o filtro.</p>}
            </div>
          ) : (
            filteredHistory.map(t => {
              const loc = locations.find(l => l.id === t.locationId);
              const locName = loc?.name || 'Local Desconhecido';
              const isCancelled = t.status === 'cancelled';

              return (
                <div key={t.id} className={`relative group ${isCancelled ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <button 
                    onClick={() => !isCancelled && onViewTournament(t)}
                    disabled={isCancelled}
                    className="w-full bg-card-dark p-5 rounded-3xl border border-white/5 hover:border-primary/30 transition-all text-left group active:scale-[0.98] disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isCancelled ? 'text-red-500' : 'text-primary'}`}>
                          {new Date(t.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {isCancelled && ' (CANCELADO)'}
                        </span>
                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{locName}</h3>
                      </div>
                      {!isCancelled && (
                          <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">chevron_right</span>
                          </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">sports_tennis</span>
                        <span className="text-[10px] font-bold uppercase">{t.matches?.length || 0} Jogos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span className="text-[10px] font-bold uppercase">{t.time} • {t.duration}h</span>
                      </div>
                    </div>
                  </button>
                  {/* Botão de eliminar flutuante */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteTournament?.(t.id); }}
                    className="absolute bottom-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

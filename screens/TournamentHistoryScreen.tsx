
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
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const filteredHistory = useMemo(() => {
    return history
      .filter(t => {
        const loc = locations.find(l => l.id === t.locationId);
        // Fallback seguro se o local não existir na lista sincronizada
        const locName = loc?.name || 'Local Desconhecido';
        const matchesSearch = locName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const tDate = new Date(t.date);
        const monthYear = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        const matchesMonth = selectedMonth === 'all' || monthYear === selectedMonth;
        return matchesSearch && matchesMonth && t.status === 'finished';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, searchTerm, selectedMonth, locations]);

  const months = useMemo(() => {
    const m = new Set<string>();
    history.forEach(t => {
      const d = new Date(t.date);
      m.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(m).sort().reverse();
  }, [history]);

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-32 animate-fade-in">
      <header>
        <h1 className="text-3xl font-black text-white">Registo <br/><span className="text-primary">Histórico</span></h1>
        <p className="text-gray-500 text-sm mt-1">Consulte todos os torneios realizados.</p>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
          <input 
            type="text" 
            placeholder="Filtrar por local..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card-dark border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button 
            onClick={() => setSelectedMonth('all')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${selectedMonth === 'all' ? 'bg-primary border-primary text-background-dark' : 'bg-white/5 border-white/10 text-gray-500'}`}
          >
            Todos os Meses
          </button>
          {months.map(m => {
            const [year, month] = m.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            const label = date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
            return (
              <button 
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${selectedMonth === m ? 'bg-primary border-primary text-background-dark' : 'bg-white/5 border-white/10 text-gray-500'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">history_toggle_off</span>
            <p className="text-sm font-bold">Nenhum registo encontrado</p>
          </div>
        ) : (
          filteredHistory.map(t => {
            const loc = locations.find(l => l.id === t.locationId);
            const locName = loc?.name || 'Local Desconhecido';
            return (
              <div key={t.id} className="relative group">
                <button 
                  onClick={() => onViewTournament(t)}
                  className="w-full bg-card-dark p-5 rounded-3xl border border-white/5 hover:border-primary/30 transition-all text-left group active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">
                        {new Date(t.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{locName}</h3>
                    </div>
                    <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <span className="material-symbols-outlined text-gray-500 group-hover:text-primary">chevron_right</span>
                    </div>
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
                  className="absolute bottom-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

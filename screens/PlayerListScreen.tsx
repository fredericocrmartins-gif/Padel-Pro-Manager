
import React, { useState, useMemo } from 'react';
import { Screen, Player } from '../types';
import { renderGlobalAvatar } from './ProfileScreen';

interface PlayerListProps {
  setScreen: (screen: Screen) => void;
  players?: Player[];
  onPlayerClick?: (id: string) => void;
  onAddPlayer?: (player: Player) => void;
  onUpdatePlayer?: (player: Player) => void;
}

const PRESET_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 
  'bg-orange-600', 'bg-rose-600', 'bg-cyan-600', 
  'bg-amber-600', 'bg-indigo-600', 'bg-lime-600',
  'bg-pink-600'
];

export const PlayerListScreen: React.FC<PlayerListProps> = ({ setScreen, players = [], onPlayerClick, onAddPlayer, onUpdatePlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [image, setImage] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
        const fullName = `${p.name} ${p.lastName || ''} ${p.nickname || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    }).sort((a, b) => (b.rankingPoints || 1000) - (a.rankingPoints || 1000));
  }, [players, searchTerm]);

  const handleSave = () => {
      if (!firstName.trim()) return;
      const playerData: Player = { 
        id: `p-${Date.now()}`, 
        name: firstName, 
        lastName, 
        nickname, 
        level: 'Nível 1', 
        image: image.trim(),
        backgroundColor: selectedColor
      };
      if (onAddPlayer) onAddPlayer(playerData);
      setIsAdding(false);
      resetForm();
  };

  const resetForm = () => {
    setFirstName(''); setLastName(''); setNickname(''); setImage(''); setSelectedColor(PRESET_COLORS[0]);
  };

  return (
    <div className="flex flex-col gap-3 px-4 pb-24 animate-fade-in">
      <div className="py-2"><h2 className="text-3xl font-bold leading-tight">Total de {players.length} <br/> <span className="text-primary">Jogadores</span></h2></div>
      
      {!isAdding && (
          <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
              <input className="w-full bg-card-dark border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all" placeholder="Pesquisar..." type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
      )}

      {isAdding ? (
          <div className="bg-card-dark p-6 rounded-3xl border border-primary/30 shadow-lg animate-fade-in-up">
              <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Novo Jogador</h3>
              <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    {renderGlobalAvatar({ id: 'temp', name: firstName || 'J', lastName: lastName || 'P', image: image, backgroundColor: selectedColor }, 'size-20')}
                    <div className="w-full space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cor do Avatar</label>
                        <div className="grid grid-cols-5 gap-2">
                            {PRESET_COLORS.map(color => (
                                <button key={color} onClick={() => setSelectedColor(color)} className={`size-8 rounded-full ${color} border-2 ${selectedColor === color ? 'border-primary scale-110 shadow-lg' : 'border-transparent opacity-50'}`}></button>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                          <input type="text" placeholder="Apelido" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                      </div>
                      <input type="text" placeholder="Alcunha (Opcional)" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                      <input type="text" placeholder="URL da Foto (Opcional)" value={image} onChange={(e) => setImage(e.target.value)} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm" />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm">Cancelar</button>
                      <button onClick={handleSave} className="flex-1 py-3 bg-primary text-background-dark rounded-xl font-bold text-sm shadow-xl shadow-primary/20">Criar Jogador</button>
                  </div>
              </div>
          </div>
      ) : (
        <div className="flex flex-col gap-3">
            {filteredPlayers.map((p, idx) => (
                <div key={p.id} onClick={() => onPlayerClick && onPlayerClick(p.id)} className="group relative flex items-center justify-between p-4 rounded-2xl bg-card-dark shadow-sm ring-1 ring-white/5 hover:ring-primary/50 transition-all cursor-pointer overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {renderGlobalAvatar(p, 'size-12')}
                            <div className="absolute -top-1 -left-1 bg-background-dark px-1.5 py-0.5 rounded-md border border-white/10"><span className="text-[8px] font-black text-gray-500">{idx + 1}º</span></div>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-base font-bold text-white leading-tight">{p.nickname || p.name}</p>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{p.level} • {p.rankingPoints} pts</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-700 group-hover:text-primary transition-colors">chevron_right</span>
                </div>
            ))}
        </div>
      )}
      {!isAdding && (
          <div className="fixed bottom-24 right-6 z-30"><button onClick={() => setIsAdding(true)} className="flex items-center justify-center size-14 rounded-full bg-primary text-background-dark shadow-lg shadow-primary/30 active:scale-95 transition-all"><span className="material-symbols-outlined text-[32px] font-bold">add</span></button></div>
      )}
    </div>
  );
};

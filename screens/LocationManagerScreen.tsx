

import React, { useState, useMemo } from 'react';
import { Screen, Location, Tournament } from '../types';

interface LocationManagerProps {
  setScreen: (screen: Screen) => void;
  locations: Location[];
  onAddLocation: (location: Location) => void;
  onUpdateLocation: (location: Location) => void;
  onDeleteLocation: (id: string) => void;
  history: Tournament[];
}

export const LocationManagerScreen: React.FC<LocationManagerProps> = ({ 
    setScreen, 
    locations, 
    onAddLocation,
    onUpdateLocation,
    onDeleteLocation,
    history 
}) => {
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<'Indoor' | 'Outdoor'>('Indoor');
  const [newAddress, setNewAddress] = useState('');
  const [newMapsUrl, setNewMapsUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedLocations = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(t => {
        counts[t.locationId] = (counts[t.locationId] || 0) + 1;
    });
    
    return [...locations].sort((a, b) => {
        const countA = counts[a.id] || 0;
        const countB = counts[b.id] || 0;
        return countB - countA;
    });
  }, [locations, history]);

  const getUsageCount = (id: string) => {
      return history.filter(t => t.locationId === id).length;
  };

  const handleSave = () => {
    if (!newLocName.trim()) return;

    if (editingId) {
        const existing = locations.find(l => l.id === editingId);
        if (existing) {
            onUpdateLocation({
                ...existing,
                name: newLocName,
                type: newLocType,
                address: newAddress,
                imageUrl: newImageUrl,
                googleMapsUrl: newMapsUrl,
                websiteUrl: newWebsiteUrl
            });
        }
    } else {
        const newLocation: Location = {
            id: `loc-${Date.now()}`,
            name: newLocName,
            type: newLocType,
            address: newAddress,
            imageUrl: newImageUrl,
            googleMapsUrl: newMapsUrl,
            websiteUrl: newWebsiteUrl
        };
        onAddLocation(newLocation);
    }
    
    resetForm();
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setNewLocName(loc.name);
    setNewLocType(loc.type);
    setNewAddress(loc.address || '');
    setNewMapsUrl(loc.googleMapsUrl || '');
    setNewImageUrl(loc.imageUrl || '');
    setNewWebsiteUrl(loc.websiteUrl || '');
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem a certeza que deseja remover este local?')) {
        onDeleteLocation(id);
    }
  };

  const resetForm = () => {
    setNewLocName('');
    setNewAddress('');
    setNewMapsUrl('');
    setNewImageUrl('');
    setNewWebsiteUrl('');
    setNewLocType('Indoor');
    setEditingId(null);
    setIsAdding(false);
  };

  const openLink = (url?: string) => {
      if(url) window.open(url, '_blank');
      else alert("Link não configurado.");
  };

  return (
    <div className="flex flex-col h-full px-4 pb-24 animate-fade-in">
        <header className="flex items-center gap-4 pt-8 pb-4">
            <button 
              onClick={() => setScreen(Screen.HOME)} 
              className="size-11 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
                 <h2 className="text-2xl font-black text-white leading-tight">Gestão de <span className="text-primary">Locais</span></h2>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Clubes e Instalações</p>
            </div>
        </header>
        
        {isAdding ? (
            <div className="bg-card-dark p-6 rounded-3xl border border-primary/30 shadow-lg mb-6 animate-fade-in-up">
                <h3 className="font-bold text-white mb-6 border-b border-white/5 pb-2 uppercase tracking-widest text-[10px] text-primary">{editingId ? 'Editar Local' : 'Novo Local'}</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Nome do Local</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Rackets Pro EUL" 
                            value={newLocName}
                            onChange={(e) => setNewLocName(e.target.value)}
                            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            autoFocus
                        />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Tipo de Campo</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setNewLocType('Indoor')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${newLocType === 'Indoor' ? 'bg-primary text-background-dark border-primary' : 'bg-transparent border-white/10 text-gray-400'}`}
                            >
                                Indoor
                            </button>
                            <button 
                                onClick={() => setNewLocType('Outdoor')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${newLocType === 'Outdoor' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent border-white/10 text-gray-400'}`}
                            >
                                Outdoor
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Morada</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Rua das Flores, 123" 
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Website</label>
                             <input 
                                type="text" 
                                placeholder="URL..." 
                                value={newWebsiteUrl}
                                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Google Maps</label>
                            <input 
                                type="text" 
                                placeholder="Link..." 
                                value={newMapsUrl}
                                onChange={(e) => setNewMapsUrl(e.target.value)}
                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Imagem de Capa (URL)</label>
                        <input 
                            type="text" 
                            placeholder="https://..." 
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={resetForm} className="flex-1 py-4 text-gray-400 font-bold hover:text-white text-xs uppercase">Cancelar</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-primary text-background-dark rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/20">
                            {editingId ? 'Atualizar' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-5 mb-6 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95"
            >
                <span className="material-symbols-outlined text-3xl">add_location_alt</span>
                <span className="font-black text-[10px] uppercase tracking-[0.2em]">Adicionar Novo Clube</span>
            </button>
        )}

        <div className="flex flex-col gap-4">
             <div className="flex justify-between items-end px-1 mb-2">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Meus Clubes ({locations.length})</h3>
                 <span className="text-[9px] text-primary font-bold italic">Mais frequentados primeiro</span>
             </div>
             {sortedLocations.length === 0 && (
                 <div className="text-center py-20 bg-card-dark rounded-3xl border border-white/5">
                     <span className="material-symbols-outlined text-4xl text-gray-700 mb-2">explore_off</span>
                     <p className="text-xs text-gray-500">Nenhum local configurado.</p>
                 </div>
             )}
             {sortedLocations.map((loc) => {
                 const count = getUsageCount(loc.id);
                 return (
                 <div key={loc.id} className="group relative bg-card-dark rounded-3xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all shadow-lg">
                     <div className="h-32 w-full bg-gray-900 relative overflow-hidden">
                        {loc.imageUrl ? (
                             <img src={loc.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20 bg-gradient-to-br from-primary/20 to-transparent">
                                <span className="material-symbols-outlined text-6xl">stadium</span>
                            </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                            <span className="text-[9px] font-black px-3 py-1.5 rounded-xl backdrop-blur-xl bg-black/60 text-white border border-white/10 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px] text-yellow-500">emoji_events</span>
                                {count} {count === 1 ? 'Torneio' : 'Torneios'}
                            </span>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl backdrop-blur-xl border border-white/10 uppercase ${loc.type === 'Indoor' ? 'bg-primary/40 text-white' : 'bg-blue-500/40 text-white'}`}>
                                {loc.type}
                            </span>
                        </div>
                     </div>

                     <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 pr-4">
                                <h4 className="font-black text-white text-xl leading-tight group-hover:text-primary transition-colors">{loc.name}</h4>
                                {loc.address && (
                                    <p className="text-gray-500 text-[10px] font-bold flex items-center gap-1.5 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        {loc.address}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEdit(loc)}
                                    className="size-9 flex items-center justify-center bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary rounded-xl transition-all border border-white/5"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button 
                                    onClick={() => handleDelete(loc.id)}
                                    className="size-9 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-white/5"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
                            {loc.websiteUrl && (
                                <button 
                                    onClick={() => openLink(loc.websiteUrl)}
                                    className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-primary transition-all uppercase tracking-widest"
                                >
                                    <span className="material-symbols-outlined text-[18px]">language</span>
                                    Website
                                </button>
                            )}
                            {loc.googleMapsUrl && (
                                <button 
                                    onClick={() => openLink(loc.googleMapsUrl)}
                                    className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-primary transition-all uppercase tracking-widest"
                                >
                                    <span className="material-symbols-outlined text-[18px]">near_me</span>
                                    GPS
                                </button>
                            )}
                        </div>
                     </div>
                 </div>
             );
            })}
        </div>
    </div>
  );
};

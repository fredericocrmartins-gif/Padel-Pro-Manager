import React, { useState, useMemo } from 'react';
import { Screen, Location, Tournament } from '../types';

interface LocationManagerProps {
  setScreen: (screen: Screen) => void;
  locations: Location[];
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  history: Tournament[];
}

export const LocationManagerScreen: React.FC<LocationManagerProps> = ({ setScreen, locations, setLocations, history }) => {
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<'Indoor' | 'Outdoor'>('Indoor');
  const [newAddress, setNewAddress] = useState('');
  const [newMapsUrl, setNewMapsUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Calculate usage and sort
  const sortedLocations = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(t => {
        counts[t.locationId] = (counts[t.locationId] || 0) + 1;
    });
    
    // Return a new array sorted by usage count descending
    return [...locations].sort((a, b) => {
        const countA = counts[a.id] || 0;
        const countB = counts[b.id] || 0;
        return countB - countA;
    });
  }, [locations, history]);

  // Helper to get count for a specific ID
  const getUsageCount = (id: string) => {
      return history.filter(t => t.locationId === id).length;
  };

  const handleSave = () => {
    if (!newLocName.trim()) return;

    if (editingId) {
        // UPDATE MODE
        setLocations(prev => prev.map(loc => {
            if (loc.id === editingId) {
                return {
                    ...loc,
                    name: newLocName,
                    type: newLocType,
                    address: newAddress,
                    imageUrl: newImageUrl,
                    googleMapsUrl: newMapsUrl,
                    websiteUrl: newWebsiteUrl
                };
            }
            return loc;
        }));
    } else {
        // CREATE MODE
        const newLocation: Location = {
            id: `loc-${Date.now()}`,
            name: newLocName,
            type: newLocType,
            address: newAddress,
            imageUrl: newImageUrl,
            googleMapsUrl: newMapsUrl,
            websiteUrl: newWebsiteUrl
        };
        setLocations([...locations, newLocation]);
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
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem a certeza que deseja remover este local?')) {
        setLocations(locations.filter(l => l.id !== id));
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
        <div className="py-4">
             <h2 className="text-3xl font-bold leading-tight tracking-tight">Gerir <br/> <span className="text-primary">Locais</span></h2>
        </div>
        
        {/* Form Section (Add/Edit) */}
        {isAdding ? (
            <div className="bg-card-dark p-4 rounded-2xl border border-primary/30 shadow-lg mb-6 animate-fade-in-up">
                <h3 className="font-bold text-white mb-4 border-b border-white/5 pb-2">{editingId ? 'Editar Local' : 'Adicionar Local'}</h3>
                
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

                    <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Website</label>
                         <input 
                            type="text" 
                            placeholder="https://..." 
                            value={newWebsiteUrl}
                            onChange={(e) => setNewWebsiteUrl(e.target.value)}
                            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block ml-1">Link Google Maps</label>
                        <input 
                            type="text" 
                            placeholder="https://maps.google.com/..." 
                            value={newMapsUrl}
                            onChange={(e) => setNewMapsUrl(e.target.value)}
                            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
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
                        <button onClick={resetForm} className="flex-1 py-3 text-gray-400 font-bold hover:text-white text-sm">Cancelar</button>
                        <button onClick={handleSave} className="flex-1 py-3 bg-white text-background-dark rounded-xl font-bold hover:bg-gray-200 text-sm shadow-lg">
                            {editingId ? 'Atualizar Local' : 'Guardar Local'}
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-4 mb-6 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
                <span className="material-symbols-outlined">add_location</span>
                <span className="font-bold">Adicionar Novo Local</span>
            </button>
        )}

        {/* List */}
        <div className="flex flex-col gap-4">
             <div className="flex justify-between items-end px-1">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Locais Guardados ({locations.length})</h3>
                 <span className="text-[10px] text-primary italic">Ordenado por utilização</span>
             </div>
             {sortedLocations.length === 0 && (
                 <div className="text-center py-10 text-gray-600">
                     <p>Nenhum local configurado.</p>
                 </div>
             )}
             {sortedLocations.map((loc) => {
                 const count = getUsageCount(loc.id);
                 return (
                 <div key={loc.id} className="group relative bg-surface-dark rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all">
                     {/* Image Banner */}
                     <div className="h-28 w-full bg-gray-800 relative">
                        {loc.imageUrl ? (
                             <img src={loc.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                <span className="material-symbols-outlined text-4xl">stadium</span>
                            </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                             {/* Usage Badge */}
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md bg-black/40 text-white border border-white/10 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-yellow-500">emoji_events</span>
                                {count} Torneios
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md border border-white/10 ${loc.type === 'Indoor' ? 'bg-primary/20 text-white' : 'bg-blue-500/20 text-white'}`}>
                                {loc.type}
                            </span>
                        </div>
                     </div>

                     {/* Content */}
                     <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white text-lg leading-tight flex-1 pr-2">{loc.name}</h4>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleEdit(loc)}
                                    className="size-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-300 rounded-full transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button 
                                    onClick={() => handleDelete(loc.id)}
                                    className="size-8 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-full transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>
                        
                        {loc.address && (
                            <div className="flex items-start gap-2 text-gray-400 text-xs mb-3">
                                <span className="material-symbols-outlined text-[14px] mt-0.5">location_on</span>
                                <span className="leading-relaxed">{loc.address}</span>
                            </div>
                        )}
                        
                        {/* Links Toolbar */}
                        <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
                            {loc.websiteUrl && (
                                <button 
                                    onClick={() => openLink(loc.websiteUrl)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">language</span>
                                    Website
                                </button>
                            )}
                            {loc.googleMapsUrl && (
                                <button 
                                    onClick={() => openLink(loc.googleMapsUrl)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">map</span>
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
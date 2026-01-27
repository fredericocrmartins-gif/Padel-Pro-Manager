
import React, { useState } from 'react';
import { Screen, Player, Location, Tournament, CloudConfig } from '../types';

interface SettingsProps {
  setScreen: (screen: Screen) => void;
  players: Player[];
  locations: Location[];
  history: Tournament[];
  cloudConfig: CloudConfig;
  onUpdateCloudConfig: (config: CloudConfig) => void;
  onImportData: (data: { players: Player[], locations: Location[], history: Tournament[] }) => void;
  onResetData: () => void;
}

export const SettingsScreen: React.FC<SettingsProps> = ({ setScreen, players, locations, history, cloudConfig, onUpdateCloudConfig, onImportData, onResetData }) => {
  const [url, setUrl] = useState(cloudConfig.url);
  const [key, setKey] = useState(cloudConfig.key);

  const handleSaveCloud = () => {
    onUpdateCloudConfig({ url, key, enabled: !!(url && key) });
    alert('Configurações de base de dados guardadas!');
  };

  return (
    <div className="flex flex-col gap-8 px-4 pt-12 pb-32 animate-fade-in">
      <header>
        <h1 className="text-3xl font-black text-white">Central de <br/><span className="text-primary">Dados</span></h1>
        <p className="text-gray-500 text-sm mt-1">Configurações globais e sincronização.</p>
      </header>

      {/* NOVO: SECÇÃO DE DATABASE CLOUD */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Base de Dados Partilhada (Supabase)</h3>
        <div className="bg-card-dark rounded-3xl border border-primary/20 p-6 space-y-4 shadow-xl shadow-primary/5">
          <p className="text-[10px] text-gray-400 leading-relaxed">Conecte a aplicação a uma base de dados central para que todos os jogadores vejam o mesmo histórico e ranking em tempo real.</p>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-primary uppercase ml-1">Supabase Project URL</label>
              <input 
                type="text" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://xyz.supabase.co" 
                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-primary uppercase ml-1">Anon API Key</label>
              <input 
                type="password" 
                value={key} 
                onChange={(e) => setKey(e.target.value)} 
                placeholder="sua-chave-anon-publica" 
                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-xs text-white"
              />
            </div>
            <button 
              onClick={handleSaveCloud}
              className="w-full bg-primary text-background-dark font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">sync</span>
              ATIVAR SINCRONIZAÇÃO
            </button>
          </div>
          
          {!cloudConfig.enabled && (
             <div className="flex items-center gap-2 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
               <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
               <span className="text-[9px] text-orange-200">A app está em modo local. Os dados são guardados apenas neste telemóvel.</span>
             </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Ficheiros de Backup</h3>
        <div className="bg-card-dark rounded-3xl border border-white/5 p-6 flex flex-col gap-3">
            <button 
              onClick={() => {
                const data = { players, locations, history, date: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `padel_backup.json`;
                link.click();
              }}
              className="w-full bg-white/5 text-white border border-white/10 font-bold py-4 rounded-2xl text-xs uppercase hover:bg-white/10 transition-all"
            >
              Exportar para JSON
            </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">Zona Crítica</h3>
        <div className="bg-red-500/5 rounded-3xl border border-red-500/10 p-6">
          <button 
            onClick={onResetData}
            className="w-full bg-red-500/10 text-red-500 border border-red-500/30 font-black py-3 rounded-2xl text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all"
          >
            Reset Total da App
          </button>
        </div>
      </section>
    </div>
  );
};

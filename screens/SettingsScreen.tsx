
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

  const isEnvManaged = (import.meta as any).env?.VITE_SUPABASE_URL;

  const handleSaveCloud = () => {
    onUpdateCloudConfig({ url, key, enabled: !!(url && key) });
    alert('Configurações de base de dados guardadas localmente!');
  };

  const sqlScript = `
-- 1. Criar Tabelas
CREATE TABLE IF NOT EXISTS players (id text PRIMARY KEY, data jsonb);
CREATE TABLE IF NOT EXISTS locations (id text PRIMARY KEY, data jsonb);
CREATE TABLE IF NOT EXISTS tournaments (id text PRIMARY KEY, data jsonb);

-- 2. Ativar RLS (Segurança)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de Acesso Público
-- (Permite que a App leia e escreva sem login, usando apenas a API Key)
CREATE POLICY "Public Access Players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Locations" ON locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
`.trim();

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    alert("Código SQL copiado! Cole-o no 'SQL Editor' do Supabase e execute.");
  };

  // --- FUNÇÕES DE EXPORTAÇÃO CSV ---

  const downloadCSV = (content: string, filename: string) => {
    // Adiciona o BOM para o Excel abrir com acentos corretos (UTF-8)
    const bom = "\uFEFF"; 
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const escapeCSV = (str: string | undefined) => {
    if (!str) return '""';
    return `"${str.toString().replace(/"/g, '""')}"`;
  };

  const handleExportPlayersCSV = () => {
    const headers = ['ID', 'Nome', 'Apelido', 'Alcunha', 'Mão', 'Nível', 'Link Imagem'];
    const rows = players.map(p => [
      p.id,
      p.name,
      p.lastName || '',
      p.nickname || '',
      p.hand || 'Destro',
      p.level || '',
      p.image || ''
    ].map(escapeCSV).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `padel_jogadores_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportMatchesCSV = () => {
    const headers = ['Data', 'Hora', 'Local', 'Ronda', 'Campo', 'Equipa 1', 'Equipa 2', 'Score 1', 'Score 2', 'Vencedor', 'Diferença Pontos'];
    const rows: string[] = [];

    history.forEach(t => {
      const locName = locations.find(l => l.id === t.locationId)?.name || 'Desconhecido';
      const date = new Date(t.date).toLocaleDateString('pt-PT');
      
      t.matches?.forEach(m => {
        const team1Names = m.team1.map(p => p.nickname || p.name).join(' & ');
        const team2Names = m.team2.map(p => p.nickname || p.name).join(' & ');
        
        let winner = 'Empate';
        if (m.score1 > m.score2) winner = team1Names;
        else if (m.score2 > m.score1) winner = team2Names;

        const diff = Math.abs(m.score1 - m.score2);

        rows.push([
          date,
          t.time,
          locName,
          m.round,
          m.court,
          team1Names,
          team2Names,
          m.score1,
          m.score2,
          winner,
          diff
        ].map(escapeCSV).join(','));
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `padel_historico_jogos_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="flex flex-col gap-8 px-4 pt-12 pb-32 animate-fade-in">
      <header>
        <h1 className="text-3xl font-black text-white">Central de <br/><span className="text-primary">Dados</span></h1>
        <p className="text-gray-500 text-sm mt-1">Configurações globais e sincronização.</p>
      </header>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Base de Dados Cloud</h3>
        <div className={`bg-card-dark rounded-3xl border ${isEnvManaged ? 'border-emerald-500/30 shadow-emerald-500/5' : 'border-primary/20 shadow-primary/5'} p-6 space-y-4 shadow-xl`}>
          
          {isEnvManaged ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500">lock</span>
              <div className="flex-1">
                <p className="text-[10px] font-black text-emerald-400 uppercase">Gestão Via GitHub</p>
                <p className="text-[9px] text-emerald-100/60 leading-tight">As credenciais estão protegidas pelo repositório. A ligação é automática.</p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 leading-relaxed">Insira as chaves do Supabase para partilhar o histórico entre dispositivos.</p>
          )}
          
          <div className={`space-y-4 ${isEnvManaged ? 'opacity-40 pointer-events-none' : ''}`}>
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
            {!isEnvManaged && (
              <button 
                onClick={handleSaveCloud}
                className="w-full bg-primary text-background-dark font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">save</span>
                GUARDAR CONFIGURAÇÃO
              </button>
            )}
          </div>
          
          {!cloudConfig.enabled && !isEnvManaged && (
             <div className="flex items-center gap-2 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
               <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
               <span className="text-[9px] text-orange-200">App em modo offline. Use as Variáveis de Ambiente no GitHub para sincronização oficial.</span>
             </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Exportação de Dados (Excel/CSV)</h3>
        <div className="bg-card-dark rounded-3xl border border-white/5 p-6 flex flex-col gap-3">
             <button 
              onClick={handleExportMatchesCSV}
              className="w-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold py-4 rounded-2xl text-xs uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">table_view</span>
              Exportar Histórico de Jogos
            </button>
            <button 
              onClick={handleExportPlayersCSV}
              className="w-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold py-4 rounded-2xl text-xs uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">groups</span>
              Exportar Jogadores
            </button>
            <p className="text-[9px] text-gray-500 text-center pt-1">O formato CSV é compatível com Microsoft Excel e Google Sheets.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Setup Supabase</h3>
        <div className="bg-card-dark rounded-3xl border border-white/5 p-6 space-y-3">
            <p className="text-[10px] text-gray-400">Se a sincronização não funcionar (Erro 404), corre este script no SQL Editor do Supabase para criar as tabelas necessárias.</p>
            <button 
                onClick={copySql}
                className="w-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold py-4 rounded-2xl text-xs uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">content_copy</span>
                Copiar SQL de Configuração
            </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Ficheiros de Backup (JSON)</h3>
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
              Exportar App Data (JSON)
            </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">Zona Crítica</h3>
        <div className="bg-red-500/5 rounded-3xl border border-red-500/10 p-6">
          <button 
            onClick={() => { if(confirm('Apagar todos os dados locais?')) onResetData(); }}
            className="w-full bg-red-500/10 text-red-500 border border-red-500/30 font-black py-3 rounded-2xl text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all"
          >
            Reset Total da App
          </button>
        </div>
      </section>
    </div>
  );
};

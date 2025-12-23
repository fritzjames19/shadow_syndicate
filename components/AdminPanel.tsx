
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminMetrics, Player } from '../types';
import { getRateLimitStats } from '../services/aiRateLimit';

interface Props {
  onClose: () => void;
  onPlayerUpdate: (p: Player) => void;
  onSystemUpdate: () => void;
}

const AdminPanel: React.FC<Props> = ({ onClose, onPlayerUpdate, onSystemUpdate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'PLAYER' | 'MISSIONS' | 'AI'>('PLAYER');
  
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [playerDebug, setPlayerDebug] = useState<Player | null>(null);
  const [cooldownsReset, setCooldownsReset] = useState(false);
  
  // AUTHENTICATION
  const handleAuth = () => {
    if (api.admin.verifyKey(keyInput)) {
      setIsAuthenticated(true);
      setError('');
      loadData();
    } else {
      setError('INVALID KEY');
    }
  };

  const loadData = async () => {
    const m = await api.admin.getOverview();
    if (m.success && m.data) setMetrics(m.data);

    const p = await api.admin.getPlayerDetails();
    if (p.success && p.data) setPlayerDebug(p.data);
  };

  useEffect(() => {
      if (isAuthenticated) {
          const interval = setInterval(loadData, 5000);
          return () => clearInterval(interval);
      }
  }, [isAuthenticated]);

  // ADJUSTMENTS
  const handleAdjust = async (type: 'gang' | 'xp' | 'heat' | 'hp' | 'reset', delta: number) => {
    if (!isAuthenticated) return;
    
    const payload: any = {};
    if (type === 'gang') payload.gangDelta = delta;
    if (type === 'xp') payload.xpDelta = delta;
    if (type === 'heat') payload.heatDelta = delta;
    if (type === 'hp') payload.hpDelta = delta;
    if (type === 'reset') payload.resetSave = true;

    const res = await api.admin.adjustPlayer('admin-secret', payload);
    if (res.success && res.data) {
      setPlayerDebug(res.data);
      onPlayerUpdate(res.data); // Sync to main app
    }
  };

  const handleResetCooldowns = async () => {
      const res = await api.admin.resetCooldowns('admin-secret');
      if (res.success && res.data) {
          setPlayerDebug(res.data);
          onPlayerUpdate(res.data);
          setCooldownsReset(true);
          setTimeout(() => setCooldownsReset(false), 2000);
      }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 font-mono">
        <div className="border border-red-900 p-8 w-96 bg-zinc-900 shadow-2xl">
          <h2 className="text-red-600 text-xl font-bold mb-4 uppercase tracking-widest text-center">Admin Access</h2>
          <input 
            type="password" 
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            className="w-full bg-black border border-zinc-700 p-2 text-white mb-4 outline-none focus:border-red-600 text-center tracking-widest"
            placeholder="ENTER KEY"
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            autoFocus
          />
          {error && <div className="text-red-500 text-xs text-center mb-4">{error}</div>}
          <div className="flex gap-2">
            <button onClick={handleAuth} className="flex-1 bg-red-900/50 text-red-500 hover:bg-red-900 hover:text-white py-2 uppercase text-sm font-bold border border-red-900/50">Verify</button>
            <button onClick={onClose} className="flex-1 border border-zinc-700 text-zinc-500 hover:text-white py-2 uppercase text-sm">Cancel</button>
          </div>
          <div className="text-[10px] text-zinc-700 mt-4 text-center">KEY: admin-secret</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 font-mono overflow-auto p-4 md:p-8 text-zinc-300 backdrop-blur-sm">
      
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-red-900/50 pb-4">
          <div>
             <h1 className="text-2xl text-red-600 font-bold uppercase tracking-widest flex items-center gap-3">
                 <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                 System Override // Admin Panel
             </h1>
          </div>
          <button onClick={onClose} className="text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-white px-3 py-1 uppercase tracking-widest">[ Terminate Session ]</button>
        </div>

        {/* NAVIGATION */}
        <div className="flex gap-4 mb-8 border-b border-zinc-800">
            <button 
                onClick={() => setActiveTab('PLAYER')}
                className={`pb-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'PLAYER' ? 'text-white border-b-2 border-red-600' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
                Player Data
            </button>
            <button 
                onClick={() => setActiveTab('MISSIONS')}
                className={`pb-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'MISSIONS' ? 'text-white border-b-2 border-red-600' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
                Mission Control
            </button>
            <button 
                onClick={() => setActiveTab('AI')}
                className={`pb-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'AI' ? 'text-white border-b-2 border-red-600' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
                AI & System
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* LEFT COLUMN: LIVE METRICS (Always visible but sticky) */}
            <div className="space-y-4">
               <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded">
                   <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">Session Metrics</h3>
                   <div className="space-y-3">
                       <div className="flex justify-between items-center">
                           <span className="text-sm text-zinc-400">Total Players</span>
                           <span className="text-white font-mono">{metrics?.totalPlayers}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-sm text-zinc-400">Active (24h)</span>
                           <span className="text-neon-blue font-mono font-bold">{metrics?.activePlayers24h}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-sm text-zinc-400">Missions Run</span>
                           <span className="text-neon-green font-mono">{metrics?.missionsRun24h}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-sm text-zinc-400">AI Calls</span>
                           <span className="text-purple-400 font-mono font-bold">{metrics?.geminiCalls24h}</span>
                       </div>
                   </div>
               </div>

               <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded">
                   <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">Admin Actions</h3>
                   <button 
                        onClick={() => { if(confirm("WARNING: This will permanently delete your local save file.")) handleAdjust('reset', 0); }}
                        className="w-full bg-red-950/30 hover:bg-red-900 text-red-500 hover:text-white border border-red-900/50 py-3 px-4 rounded text-xs font-bold uppercase tracking-widest transition-colors mb-2"
                    >
                        ⚠ Wipe Save Data
                    </button>
                    <div className="text-[9px] text-zinc-600 text-center">
                        Action cannot be undone.
                    </div>
               </div>
            </div>

            {/* RIGHT COLUMN: TAB CONTENT */}
            <div className="md:col-span-2 space-y-6">
                
                {/* PLAYER TAB */}
                {activeTab === 'PLAYER' && playerDebug && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl text-white font-bold">{playerDebug.name}</h2>
                                <div className="text-xs text-zinc-500 font-mono">{playerDebug.id}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-neon-blue font-bold uppercase">{playerDebug.faction}</div>
                                <div className="text-xs text-zinc-500">{playerDebug.profession} • Lvl {playerDebug.level}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                             <div className="bg-black/50 p-4 rounded border border-zinc-800">
                                <div className="text-[10px] uppercase text-zinc-500 mb-2">Wallet Control</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl text-yellow-500 font-bold">${playerDebug.wallet}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAdjust('gang', 1000)} className="flex-1 bg-zinc-800 hover:bg-yellow-600 hover:text-black text-xs py-1 px-2 rounded font-bold">+1000</button>
                                    <button onClick={() => handleAdjust('gang', 5000)} className="flex-1 bg-zinc-800 hover:bg-yellow-600 hover:text-black text-xs py-1 px-2 rounded font-bold">+5k</button>
                                </div>
                             </div>

                             <div className="bg-black/50 p-4 rounded border border-zinc-800">
                                <div className="text-[10px] uppercase text-zinc-500 mb-2">Experience Injection</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl text-neon-purple font-bold">{playerDebug.xp} XP</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAdjust('xp', 500)} className="flex-1 bg-zinc-800 hover:bg-purple-600 hover:text-black text-xs py-1 px-2 rounded font-bold">+500</button>
                                    <button onClick={() => handleAdjust('xp', 2000)} className="flex-1 bg-zinc-800 hover:bg-purple-600 hover:text-black text-xs py-1 px-2 rounded font-bold">LVL UP</button>
                                </div>
                             </div>
                        </div>

                        <div className="bg-black/50 p-4 rounded border border-zinc-800">
                            <div className="text-[10px] uppercase text-zinc-500 mb-2">Vitals & Heat</div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>HP</span>
                                        <span className="text-neon-red">{playerDebug.stats.hp}/{playerDebug.stats.maxHp}</span>
                                    </div>
                                    <button onClick={() => handleAdjust('hp', 100)} className="w-full bg-zinc-800 hover:bg-green-600 hover:text-black text-xs py-1 rounded">Heal All</button>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Heat</span>
                                        <span className="text-orange-500">{playerDebug.stats.heat}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleAdjust('heat', -10)} className="flex-1 bg-zinc-800 hover:bg-blue-500 hover:text-black text-xs py-1 rounded">-10</button>
                                        <button onClick={() => handleAdjust('heat', 10)} className="flex-1 bg-zinc-800 hover:bg-red-500 hover:text-black text-xs py-1 rounded">+10</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MISSIONS TAB */}
                {activeTab === 'MISSIONS' && playerDebug && (
                     <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
                         <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg text-white font-bold uppercase">Mission Debugger</h2>
                            <button 
                                onClick={handleResetCooldowns}
                                className="bg-blue-900/30 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-800 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all"
                            >
                                {cooldownsReset ? "COOLDOWNS CLEARED" : "Reset All Cooldowns"}
                            </button>
                         </div>

                         <div className="space-y-2">
                             <div className="text-[10px] uppercase text-zinc-500 mb-2">Active Cooldown Timers</div>
                             {Object.entries(playerDebug.missionCooldowns).length === 0 ? (
                                 <div className="p-4 bg-black/40 text-zinc-500 text-sm italic rounded border border-zinc-800">
                                     No active cooldowns. All mission types available.
                                 </div>
                             ) : (
                                 Object.entries(playerDebug.missionCooldowns).map(([type, time]) => (
                                     <div key={type} className="flex justify-between items-center bg-black/40 p-3 rounded border border-zinc-800">
                                         <span className="text-sm font-bold text-zinc-300">{type}</span>
                                         <span className="font-mono text-xs text-orange-500">
                                             {(time as number) > Date.now() ? `${Math.ceil(((time as number) - Date.now()) / 1000)}s remaining` : 'READY'}
                                         </span>
                                     </div>
                                 ))
                             )}
                         </div>

                         <div className="mt-6 pt-6 border-t border-zinc-800">
                             <div className="text-[10px] uppercase text-zinc-500 mb-3">Mastery Progress</div>
                             <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                 {Object.entries(playerDebug.missionMastery).map(([id, val]) => (
                                     <div key={id} className="flex justify-between text-xs bg-black/20 p-2 rounded">
                                         <span className="truncate w-24">{id}</span>
                                         <span className={(val as number) >= 100 ? "text-yellow-500" : "text-zinc-400"}>{val}%</span>
                                     </div>
                                 ))}
                                 {Object.keys(playerDebug.missionMastery).length === 0 && (
                                     <div className="col-span-2 text-zinc-600 italic text-xs">No mastery data yet.</div>
                                 )}
                             </div>
                         </div>
                     </div>
                )}

                {/* AI / SYSTEM TAB */}
                {activeTab === 'AI' && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded p-6">
                        <h2 className="text-lg text-white font-bold uppercase mb-4">Neural Network Status</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-black/50 p-4 rounded border border-zinc-800 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] uppercase text-zinc-500 mb-1">Global Hourly Usage</div>
                                    <div className="text-3xl font-bold text-white mb-2">{metrics?.geminiCalls24h} <span className="text-sm text-zinc-600 font-normal">/ 300</span></div>
                                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, ((metrics?.geminiCalls24h || 0) / 300) * 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-black/50 p-4 rounded border border-zinc-800 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] uppercase text-zinc-500 mb-1">Error Rate</div>
                                    <div className="text-3xl font-bold text-white mb-2">{metrics?.errorRate}%</div>
                                    <div className="text-xs text-zinc-500">Last 24 hours</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 font-mono text-xs text-zinc-400">
                            <div className="mb-2 text-zinc-600 uppercase font-bold">System Logs (Mock)</div>
                            <div className="space-y-1">
                                <div><span className="text-green-500">[OK]</span> Database Integrity Verified</div>
                                <div><span className="text-green-500">[OK]</span> AI Rate Limiter Active</div>
                                <div><span className="text-green-500">[OK]</span> Player Session Synced</div>
                                <div><span className="text-blue-500">[INFO]</span> Market Prices Updated 4m ago</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;

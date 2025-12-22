import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AdminMetrics, Player, Mission, Item, DistrictMeta } from '../types';

interface Props {
  onClose: () => void;
  onPlayerUpdate: (p: Player) => void;
  onSystemUpdate: () => void;
}

const AdminPanel: React.FC<Props> = ({ onClose, onPlayerUpdate, onSystemUpdate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [playerDebug, setPlayerDebug] = useState<Player | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [districts, setDistricts] = useState<DistrictMeta[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{current: number, total: number} | null>(null);
  
  // Resolution Control
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');

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

    const staticData = await api.system.getStaticData();
    // @ts-ignore
    if (staticData.success) {
         // @ts-ignore
         setMissions(staticData.data.missions);
         // @ts-ignore
         setItems(staticData.data.items);
         // @ts-ignore
         setDistricts(staticData.data.districts);
    }
  };

  // ADJUSTMENTS
  const handleAdjust = async (type: 'gang' | 'xp' | 'heat' | 'hp', delta: number) => {
    if (!isAuthenticated) return;
    
    const payload: any = {};
    if (type === 'gang') payload.gangDelta = delta;
    if (type === 'xp') payload.xpDelta = delta;
    if (type === 'heat') payload.heatDelta = delta;
    if (type === 'hp') payload.hpDelta = delta;

    const res = await api.admin.adjustPlayer('admin-secret', payload);
    if (res.success && res.data) {
      setPlayerDebug(res.data);
      onPlayerUpdate(res.data); // Sync to main app
    }
  };

  // GEN IMAGES
  const handleGenerateMissionImage = async (missionId: string) => {
    if (generating) return;
    setGenerating(missionId);
    
    const res = await api.admin.generateMissionImage('admin-secret', missionId, imageSize);
    if (res.success) {
      const staticData = await api.system.getStaticData();
      // @ts-ignore
      if (staticData.success) {
        setMissions(staticData.data.missions);
        onSystemUpdate();
      }
    } else {
      console.error(res.message);
    }
    setGenerating(null);
  };

  const handleGenerateItemImage = async (itemId: string) => {
    if (generating) return;
    setGenerating(itemId);
    
    const res = await api.admin.generateItemImage('admin-secret', itemId, imageSize);
    if (res.success) {
      const staticData = await api.system.getStaticData();
      // @ts-ignore
      if (staticData.success) {
        setItems(staticData.data.items);
        onSystemUpdate();
      }
    } else {
        console.error(res.message);
    }
    setGenerating(null);
  }

  const handleGenerateDistrictImage = async (districtId: any) => {
      if (generating) return;
      setGenerating(districtId);
      
      const res = await api.admin.generateDistrictImage('admin-secret', districtId, imageSize);
      if (res.success) {
          const staticData = await api.system.getStaticData();
          // @ts-ignore
          if (staticData.success) {
            setDistricts(staticData.data.districts);
            onSystemUpdate();
          }
      }
      setGenerating(null);
  }

  const handleGeneratePortrait = async () => {
      if (generating) return;
      setGenerating('portrait');
      const res = await api.admin.generatePlayerPortrait('admin-secret', imageSize);
      if (res.success && res.data && playerDebug) {
          setPlayerDebug({ ...playerDebug, portraitUrl: res.data });
          onPlayerUpdate({ ...playerDebug, portraitUrl: res.data });
      }
      setGenerating(null);
  }

  const handleGenerateAllMissions = async () => {
      if (bulkProgress || generating) return;
      const missingImages = missions.filter(m => !m.imageUrl);
      
      if (missingImages.length === 0) {
          alert("All missions already have assets.");
          return;
      }

      setBulkProgress({ current: 0, total: missingImages.length });

      for (let i = 0; i < missingImages.length; i++) {
          const m = missingImages[i];
          setGenerating(m.id);
          await api.admin.generateMissionImage('admin-secret', m.id, imageSize);
          setBulkProgress({ current: i + 1, total: missingImages.length });
          // Note: we don't refresh after every single image in bulk to avoid flicker, just at end
          await new Promise(r => setTimeout(r, 1000));
      }

      // Final refresh
      const staticData = await api.system.getStaticData();
      // @ts-ignore
      if (staticData.success) {
          setMissions(staticData.data.missions);
          onSystemUpdate();
      }

      setBulkProgress(null);
      setGenerating(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 font-mono">
        <div className="border border-red-900 p-8 w-96 bg-zinc-900">
          <h2 className="text-red-600 text-xl font-bold mb-4 uppercase tracking-widest text-center">Admin Access</h2>
          <input 
            type="password" 
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            className="w-full bg-black border border-zinc-700 p-2 text-white mb-4 outline-none focus:border-red-600 text-center"
            placeholder="ENTER KEY"
          />
          {error && <div className="text-red-500 text-xs text-center mb-4">{error}</div>}
          <div className="flex gap-2">
            <button onClick={handleAuth} className="flex-1 bg-red-900/50 text-red-500 hover:bg-red-900 hover:text-white py-2 uppercase text-sm">Verify</button>
            <button onClick={onClose} className="flex-1 border border-zinc-700 text-zinc-500 hover:text-white py-2 uppercase text-sm">Cancel</button>
          </div>
          <div className="text-[10px] text-zinc-700 mt-4 text-center">KEY: admin-secret</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 font-mono overflow-auto p-8 text-zinc-300">
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-red-900 pb-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl text-red-600 font-bold uppercase tracking-widest">System Override // Admin Panel</h1>
          </div>
          <div className="flex gap-4 items-center">
             <div className="flex items-center gap-2">
                 <span className="text-xs text-zinc-500 uppercase">OUTPUT RES:</span>
                 <select 
                    value={imageSize} 
                    onChange={(e) => setImageSize(e.target.value as any)}
                    className="bg-black border border-neon-blue text-neon-blue text-xs p-1 font-bold outline-none"
                 >
                     <option value="1K">1K RES</option>
                     <option value="2K">2K RES</option>
                     <option value="4K">4K RES</option>
                 </select>
             </div>
             <button onClick={onClose} className="text-xs text-zinc-500 hover:text-white">[ EXIT ]</button>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-5 gap-4 mb-8">
           <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase">Total Players</div>
              <div className="text-2xl text-white">{metrics?.totalPlayers}</div>
           </div>
           <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase">Active 24h</div>
              <div className="text-2xl text-neon-blue">{metrics?.activePlayers24h}</div>
           </div>
           <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase">Missions (24h)</div>
              <div className="text-2xl text-neon-green">{metrics?.missionsRun24h}</div>
           </div>
           <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase">AI Calls</div>
              <div className="text-2xl text-purple-400">{metrics?.geminiCalls24h}</div>
           </div>
           <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 uppercase">Error Rate</div>
              <div className="text-2xl text-red-500">{metrics?.errorRate}%</div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
          {/* LEFT: PLAYER DEBUGGER */}
          <div className="space-y-8">
            {playerDebug && (
              <div className="bg-zinc-900 border border-zinc-800">
                 <div className="p-4 border-b border-zinc-800 flex justify-between">
                    <h3 className="text-white text-sm uppercase">Live Session</h3>
                    <span className="text-xs text-neon-green">CONNECTED</span>
                 </div>
                 
                 <div className="p-6 space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 bg-zinc-800 border border-zinc-700 relative">
                             {playerDebug.portraitUrl ? (
                                 <img src={playerDebug.portraitUrl} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-[10px]">NO IMG</div>
                             )}
                        </div>
                        <div className="flex-1">
                            <div className="text-lg font-bold text-white">{playerDebug.name}</div>
                            <div className="text-xs text-zinc-500 mb-2">{playerDebug.faction} • Lvl {playerDebug.level}</div>
                            <button 
                                onClick={handleGeneratePortrait}
                                disabled={generating !== null}
                                className="bg-neon-blue text-black text-[10px] font-bold px-2 py-1 hover:bg-white disabled:opacity-50"
                            >
                                {generating === 'portrait' ? 'GENERATING...' : 'GENERATE PORTRAIT'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-black border border-zinc-800 p-4">
                          <div className="text-xs text-zinc-400 uppercase mb-2">Wallet</div>
                          <div className="flex gap-2">
                             <button onClick={() => handleAdjust('gang', 1000)} className="bg-zinc-800 hover:bg-neon-green hover:text-black px-2 py-1 text-[10px]">+1000</button>
                             <button onClick={() => handleAdjust('gang', -500)} className="bg-zinc-800 hover:bg-red-500 hover:text-black px-2 py-1 text-[10px]">-500</button>
                          </div>
                       </div>
                       <div className="bg-black border border-zinc-800 p-4">
                          <div className="text-xs text-zinc-400 uppercase mb-2">Experience</div>
                          <div className="flex gap-2">
                             <button onClick={() => handleAdjust('xp', 100)} className="bg-zinc-800 hover:bg-neon-purple hover:text-black px-2 py-1 text-[10px]">+100</button>
                             <button onClick={() => handleAdjust('xp', 1000)} className="bg-zinc-800 hover:bg-neon-purple hover:text-black px-2 py-1 text-[10px]">LVL UP</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* RIGHT: ASSETS */}
          <div className="flex flex-col gap-6">
              
              {/* MISSIONS */}
              <div className="bg-zinc-900 border border-zinc-800 flex flex-col h-80">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                   <div>
                     <h3 className="text-white text-sm uppercase">Mission Assets</h3>
                     <div className="text-xs text-zinc-500 mt-1">16:9 Cinematic Scenes</div>
                   </div>
                   <button 
                      onClick={handleGenerateAllMissions}
                      disabled={!!bulkProgress || generating !== null}
                      className="bg-neon-blue text-black px-3 py-1 text-xs font-bold uppercase hover:bg-white disabled:opacity-50"
                   >
                      {bulkProgress ? `Processing ${bulkProgress.current}/${bulkProgress.total}` : 'GENERATE MISSING'}
                   </button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                   {missions.map(m => (
                     <div key={m.id} className="bg-black p-3 border border-zinc-800 flex gap-4">
                        <div className="w-24 h-14 bg-zinc-800 shrink-0 border border-zinc-700 overflow-hidden relative group">
                           {m.imageUrl ? (
                             <img src={m.imageUrl} alt="Asset" className="w-full h-full object-cover" />
                           ) : (
                             <div className="flex flex-col items-center justify-center h-full text-[10px] text-zinc-600 bg-zinc-900/50">
                                 <span>NO ASSET</span>
                             </div>
                           )}
                           {generating === m.id && (
                               <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                   <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                               </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <div className="text-xs text-white font-bold truncate">{m.title}</div>
                           <button 
                                onClick={() => handleGenerateMissionImage(m.id)}
                                disabled={generating !== null}
                                className="text-[10px] text-neon-blue text-left hover:underline disabled:opacity-50"
                              >
                                {m.imageUrl ? 'REGENERATE' : 'GENERATE'}
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* DISTRICTS */}
              <div className="bg-zinc-900 border border-zinc-800 flex flex-col h-64">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                   <div>
                     <h3 className="text-white text-sm uppercase">Districts</h3>
                     <div className="text-xs text-zinc-500 mt-1">Area Banners</div>
                   </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                   {districts.map(d => (
                     <div key={d.id} className="bg-black p-3 border border-zinc-800 flex gap-4">
                        <div className="w-24 h-14 bg-zinc-800 shrink-0 border border-zinc-700 overflow-hidden relative group">
                           {d.imageUrl ? (
                             <img src={d.imageUrl} alt="Asset" className="w-full h-full object-cover" />
                           ) : (
                             <div className="flex flex-col items-center justify-center h-full text-[10px] text-zinc-600 bg-zinc-900/50">
                                 <span>NO ASSET</span>
                             </div>
                           )}
                           {generating === d.id && (
                               <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                   <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                               </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <div className="text-xs text-white font-bold truncate">{d.name}</div>
                           <button 
                                onClick={() => handleGenerateDistrictImage(d.id)}
                                disabled={generating !== null}
                                className="text-[10px] text-neon-blue text-left hover:underline disabled:opacity-50"
                              >
                                {d.imageUrl ? 'REGENERATE' : 'GENERATE'}
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* ITEMS */}
              <div className="bg-zinc-900 border border-zinc-800 flex flex-col h-48">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                   <div>
                     <h3 className="text-white text-sm uppercase">Item Assets</h3>
                     <div className="text-xs text-zinc-500 mt-1">Inventory Icons</div>
                   </div>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                   {items.map(i => (
                     <div key={i.id} className="bg-black p-3 border border-zinc-800 flex gap-4">
                        <div className="w-12 h-12 bg-zinc-800 shrink-0 border border-zinc-700 overflow-hidden relative group">
                           {i.imageUrl ? (
                             <img src={i.imageUrl} alt="Asset" className="w-full h-full object-cover" />
                           ) : (
                             <div className="flex flex-col items-center justify-center h-full text-[10px] text-zinc-600 bg-zinc-900/50">
                                 <span>ICON</span>
                             </div>
                           )}
                           {generating === i.id && (
                               <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                   <div className="w-3 h-3 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                               </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <div className="text-xs text-white font-bold truncate">{i.name}</div>
                           <button 
                                onClick={() => handleGenerateItemImage(i.id)}
                                disabled={generating !== null}
                                className="text-[10px] text-neon-blue text-left hover:underline disabled:opacity-50"
                              >
                                {i.imageUrl ? 'REGENERATE' : 'GENERATE'}
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminPanel;
import React, { useState, useEffect, useRef } from 'react';
import CharacterCreation from './components/CharacterCreation';
import AdminPanel from './components/AdminPanel';
import { DistrictBanner, PlayerCard, MissionCard, MissionGrid, MissionResult, DailyRewardsCard, RewardModal, ActiveMission, MissionStructureInfo } from './components/GameUI';
import { SkillTreeUI } from './components/SkillTreeUI';
import { Player, FactionId, ProfessionId, Mission, MissionType, CrewMember, LogEntry, Item, ItemType, ItemRarity, MissionOutcome, DistrictMeta, District, DailyRewardResult } from './types';
import { api } from './services/api';

const CREW_TYPES: CrewMember[] = [
  { id: 'recruit_thug', name: 'Street Thug', type: 'Thug', atk: 5, def: 0, cost: 500, upkeep: 10, isActive: true },
  { id: 'recruit_soldier', name: 'Soldier', type: 'Soldier', atk: 15, def: 5, cost: 2500, upkeep: 25, isActive: true },
  { id: 'recruit_enforcer', name: 'Enforcer', type: 'Enforcer', atk: 35, def: 10, cost: 10000, upkeep: 50, isActive: true },
];

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<'CREATION' | 'DASHBOARD' | 'MISSIONS' | 'ACTIVE_MISSION' | 'MISSION_RESULT' | 'CREW' | 'INVENTORY' | 'SKILLS'>('CREATION');
  const [player, setPlayer] = useState<Player | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [districts, setDistricts] = useState<DistrictMeta[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District>(District.DOCKS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showMissionIntel, setShowMissionIntel] = useState(false);
  
  // Admin State
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Mission Flow State
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [lastMissionResult, setLastMissionResult] = useState<MissionOutcome | null>(null);

  // Daily Reward State
  const [dailyRewardResult, setDailyRewardResult] = useState<DailyRewardResult | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- HELPERS ---
  const addLog = (message: string, type: LogEntry['type'] = 'INFO') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
      type,
      message,
    };
    setLogs(prev => [...prev, newLog]);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, view]);

  // Clock for cooldowns
  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
  }, []);

  // Passive Regeneration Loop
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(async () => {
      // API CALL: System Tick
      const res = await api.system.tick();
      if (res.success && res.data) {
        setPlayer(prev => {
          if (!prev) return null;
          // Optimistic update check to avoid jitter, but we need news updates
          return res.data!;
        });
      }
    }, 10000); 
    
    return () => clearInterval(interval);
  }, [player]);

  // Data Fetching Logic
  const refreshSystemData = async () => {
      const res = await api.system.getStaticData();
      if (res.success && res.data) {
        // @ts-ignore
        setMissions(res.data.missions);
        // @ts-ignore
        setItems(res.data.items);
        // @ts-ignore
        setDistricts(res.data.districts);
      }
  };

  useEffect(() => {
    // Initial Data Fetch
    const init = async () => {
      await refreshSystemData();

      // Check for active session
      const dash = await api.player.getDashboard();
      if (dash.success && dash.data) {
          setPlayer(dash.data);
          // Check for pending missions (Crash Recovery)
          const pendingId = await api.system.getPendingMission(dash.data.id);
          if (pendingId) {
             // We need to re-find the mission object to resume properly
             // This is a bit tricky without storing missionId separately in state, but we can try to fetch run details if API supported it.
             // For prototype stability, we just warn for now or reset if we can't find mission object.
             // Ideally we'd fetch the specific mission from the run ID.
             setActiveRunId(pendingId);
             // Attempt to find mission from generic list if possible, otherwise we might be in inconsistent state
             // In a real app, `getPendingMission` would return the full object.
             addLog("Pending operation detected. Please resume via dashboard if available.", 'DANGER');
          } else {
             setView('DASHBOARD');
          }
      }
    };
    init();
  }, []);

  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case ItemRarity.COMMON: return 'text-zinc-400';
      case ItemRarity.RARE: return 'text-neon-blue';
      case ItemRarity.EPIC: return 'text-neon-purple';
      case ItemRarity.LEGENDARY: return 'text-yellow-400';
      default: return 'text-zinc-400';
    }
  };

  const getCooldown = (type: MissionType) => {
      if (!player?.missionCooldowns[type]) return 0;
      const end = player.missionCooldowns[type];
      if (end <= now) return 0;
      return end - now;
  };

  // --- ACTIONS ---

  const handleCreatePlayer = async (name: string, faction: FactionId, profession: ProfessionId) => {
    const res = await api.player.create(name, faction, profession);
    if (res.success && res.data) {
      setPlayer(res.data);
      setView('DASHBOARD');
      addLog(res.message || "Welcome.", 'INFO');
    }
  };

  const handleMaintenance = async () => {
    setProcessing(true);
    addLog("Calculating Influence Drain...", 'INFO');
    const res = await api.player.performMaintenance();
    setTimeout(() => {
      if (res.success && res.data) {
        setPlayer(res.data);
        addLog(res.message || "Day Cycle Complete.", 'SUCCESS');
      } else {
        addLog(res.message || "Error during cycle.", 'FAILURE');
      }
      setProcessing(false);
    }, 1000);
  };

  const handleRest = async () => {
    setProcessing(true);
    addLog("Resting at Safehouse...", 'INFO');
    const res = await api.player.rest();
    setTimeout(() => {
        if (res.success && res.data) {
            setPlayer(res.data);
            addLog(res.message || "Rested.", 'SUCCESS');
        }
        setProcessing(false);
    }, 1000);
  }

  const handleRecruit = async (crewType: any) => {
    const res = await api.crew.hire(crewType.type);
    if (res.success && res.data) {
      setPlayer(res.data);
      addLog(res.message || "Recruited.", 'SUCCESS');
    } else {
      addLog(res.message || "Failed.", 'FAILURE');
    }
  };

  const handleToggleCrew = async (crewId: string) => {
      const res = await api.crew.toggle(crewId);
      if (res.success && res.data) {
          setPlayer(res.data);
          addLog(res.message || "Crew status updated.", 'INFO');
      }
  }

  const handleClaimReward = async () => {
    setProcessing(true);
    const res = await api.player.claimDailyReward();
    if (res.success && res.data) {
      setPlayer(res.data);
      if (res.dailyResult.claimed) {
        setDailyRewardResult(res.dailyResult);
        addLog(res.message || "Daily reward claimed.", 'SUCCESS');
      } else {
        addLog("Reward already claimed.", 'INFO');
      }
    }
    setProcessing(false);
  }

  // STEP 1: START MISSION
  const handleMissionStart = async (mission: Mission) => {
    setProcessing(true);
    addLog(`Initiating Operation: ${mission.title}...`, 'INFO');
    
    // API CALL: Start
    const res = await api.missions.start(mission.id);
    
    if (res.success && res.data) {
      // @ts-ignore - The api type is complex, but we know it returns missionRunId
      setActiveRunId(res.data.missionRunId);
      setActiveMission(mission);
      // We manually deduct energy in UI just for immediate feedback, though state update will handle it
      setPlayer(prev => prev ? { ...prev, stats: { ...prev.stats, enr: prev.stats.enr - mission.costEnr } } : null);
      
      addLog("Link Established. Analyzing tactical options...", 'SUCCESS');
      setView('ACTIVE_MISSION');
    } else {
      addLog(res.message || "Mission Aborted.", 'FAILURE');
    }
    
    setProcessing(false);
  };

  // STEP 2: RESOLVE MISSION
  const handleMissionResolve = async (decisionId?: string) => {
    if (!activeRunId) return;
    setProcessing(true);
    // addLog("Executing tactical decision...", 'INFO'); // UI handles the visual feedback now

    const res = await api.missions.resolve(activeRunId, decisionId);

    if (res.success !== undefined && res.data) {
        setPlayer(res.data);
        if (res.missionResult) {
            setLastMissionResult(res.missionResult);
            setActiveRunId(null);
            setActiveMission(null);
            setView('MISSION_RESULT');
            addLog("Mission Complete. Debriefing ready.", 'SUCCESS');
        } else {
            addLog(res.message || "Error resolving mission.", 'FAILURE');
        }
    } else {
        addLog("Critical failure in resolution link.", 'FAILURE');
    }
    setProcessing(false);
  }

  const handleMissionContinue = () => {
      setLastMissionResult(null);
      // Return to missions list
      setView('MISSIONS');
  };

  const handleBuyItem = async (item: Item) => {
    const res = await api.items.buy(item.id);
    if (res.success && res.data) {
      setPlayer(res.data);
      addLog(res.message || "Bought item.", 'SUCCESS');
    } else {
      addLog(res.message || "Cannot buy.", 'FAILURE');
    }
  };

  const handleEquipItem = async (item: Item) => {
    const res = await api.items.equip(item.id);
    if (res.success && res.data) {
      setPlayer(res.data);
      addLog(res.message || "Equipped.", 'INFO');
    }
  };

  const handleUnequipItem = async (slot: 'weapon' | 'armor') => {
    const res = await api.items.unequip(slot);
    if (res.success && res.data) {
      setPlayer(res.data);
      addLog(res.message || "Unequipped.", 'INFO');
    }
  };

  const handleUseItem = async (item: Item) => {
    const res = await api.items.use(item.id);
    if (res.success && res.data) {
      setPlayer(res.data);
      addLog(res.message || "Used item.", 'SUCCESS');
    }
  };

  // --- RENDER ---

  if (view === 'CREATION') {
    return <CharacterCreation onComplete={handleCreatePlayer} />;
  }

  if (!player) return null;

  // Derived Data for UI
  const xpProgress = (player.xp / (Math.round(100 * Math.pow(player.level, 1.4)))) * 100;
  const activeDistrictMeta = districts.find(d => d.id === selectedDistrict);
  const filteredMissions = missions.filter(m => m.district === selectedDistrict);
  const canClaimReward = player.lastLoginDate !== new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-black text-slate-300 font-mono flex flex-col md:flex-row overflow-hidden relative">
      
      {/* ADMIN OVERLAY */}
      {showAdmin && (
          <AdminPanel 
            onClose={() => setShowAdmin(false)} 
            onPlayerUpdate={(p) => setPlayer(p)} 
            onSystemUpdate={refreshSystemData}
          />
      )}

      {/* REWARD MODAL OVERLAY */}
      {dailyRewardResult && (
          <RewardModal result={dailyRewardResult} onClose={() => setDailyRewardResult(null)} />
      )}

      {/* MISSION INFO MODAL */}
      {showMissionIntel && (
          <MissionStructureInfo onClose={() => setShowMissionIntel(false)} />
      )}

      {/* ADMIN TOGGLE */}
      <button 
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-2 right-2 z-50 text-[10px] text-zinc-800 hover:text-red-500 uppercase tracking-widest opacity-50 hover:opacity-100"
      >
        System.Override()
      </button>

      {/* LEFT PANEL: STATS / LOGS */}
      <aside className="w-full md:w-80 bg-panel-bg border-r border-zinc-800 flex flex-col shrink-0 z-10">
        <div className="p-6 border-b border-zinc-800">
            <h1 className="text-2xl font-bold text-white tracking-tighter mb-1">SHADOW<span className="text-neon-red">SYNDICATE</span></h1>
            <div className="text-xs text-zinc-500 flex justify-between mb-2">
                <span>{player.faction}</span>
                <span>DAY {player.day}</span>
            </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* MINI PLAYER CARD FOR STATS VIEW */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs mb-1 uppercase tracking-wider">
                        <span className="text-neon-red">Health</span>
                        <span>{player.stats.hp} / {player.stats.maxHp}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-neon-red" style={{ width: `${(player.stats.hp / player.stats.maxHp) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1 uppercase tracking-wider">
                        <span className="text-yellow-400">Energy</span>
                        <span>{player.stats.enr} / {player.stats.maxEnr}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${(player.stats.enr / player.stats.maxEnr) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* ACTION MENU */}
            <div className="space-y-2">
                <button 
                    onClick={() => setView('DASHBOARD')}
                    className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${view === 'DASHBOARD' ? 'bg-neon-blue text-black' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => setView('MISSIONS')}
                    className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${view === 'MISSIONS' ? 'bg-neon-blue text-black' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                >
                    Missions
                </button>
                <button 
                    onClick={() => setView('SKILLS')}
                    className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${view === 'SKILLS' ? 'bg-neon-blue text-black' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                >
                    Neural Skills
                </button>
            </div>

            {/* SYSTEM LOGS */}
            <div className="flex-1 bg-black border border-zinc-800 p-2 font-mono text-[10px] overflow-hidden flex flex-col min-h-[150px]">
                <div className="text-zinc-500 border-b border-zinc-900 pb-1 mb-1">SYSTEM LOG</div>
                <div className="overflow-y-auto flex-1 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {logs.map((log) => (
                        <div key={log.id} className="leading-tight">
                            <span className="text-zinc-600">[{log.timestamp}]</span>{' '}
                            <span className={
                                log.type === 'SUCCESS' ? 'text-neon-green' : 
                                log.type === 'FAILURE' ? 'text-red-500' : 
                                log.type === 'DANGER' ? 'text-orange-500' : 
                                'text-zinc-400'
                            }>{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-black p-4 relative">
         
         {/* DASHBOARD VIEW */}
         {view === 'DASHBOARD' && (
             <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
                 <PlayerCard player={player} />
                 
                 <DailyRewardsCard player={player} onClaim={handleClaimReward} processing={processing} />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-zinc-900 border border-zinc-800 p-4 rounded">
                         <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Operations Status</h3>
                         <div className="space-y-2">
                             <div className="flex justify-between items-center text-sm">
                                 <span>Active Mission</span>
                                 <span className={activeRunId ? "text-neon-green" : "text-zinc-600"}>{activeRunId ? "IN PROGRESS" : "NONE"}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span>Heat Level</span>
                                 <span className={player.stats.heat > 50 ? "text-red-500 font-bold" : "text-zinc-400"}>{player.stats.heat}%</span>
                             </div>
                         </div>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-4 rounded">
                        <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Quick Actions</h3>
                        <div className="flex gap-2">
                            <button onClick={handleRest} disabled={processing} className="flex-1 bg-zinc-800 hover:bg-white hover:text-black py-2 text-xs font-bold uppercase transition-colors">
                                Safehouse Rest
                            </button>
                            <button onClick={handleMaintenance} disabled={processing} className="flex-1 bg-zinc-800 hover:bg-white hover:text-black py-2 text-xs font-bold uppercase transition-colors">
                                Wait (Day Cycle)
                            </button>
                        </div>
                     </div>
                 </div>
             </div>
         )}

         {/* MISSIONS VIEW */}
         {view === 'MISSIONS' && (
             <div className="space-y-6 animate-in fade-in duration-500">
                 <div className="flex justify-between items-end mb-4 px-4">
                    <div>
                        <h2 className="text-2xl text-white font-bold uppercase tracking-widest">Available Contracts</h2>
                        <div className="text-zinc-500 text-xs mt-1">Select a district to view local opportunities</div>
                    </div>
                    <select 
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value as District)}
                        className="bg-zinc-900 border border-zinc-700 text-white text-sm p-2 rounded outline-none focus:border-neon-blue"
                    >
                        {districts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                 </div>

                 {activeDistrictMeta && <DistrictBanner district={activeDistrictMeta} />}

                 <MissionGrid>
                     {filteredMissions.map(m => (
                         <MissionCard 
                            key={m.id} 
                            mission={m} 
                            player={player} 
                            onRun={handleMissionStart}
                            cooldownTime={getCooldown(m.type)}
                        />
                     ))}
                 </MissionGrid>
             </div>
         )}

         {/* ACTIVE MISSION VIEW */}
         {view === 'ACTIVE_MISSION' && activeMission && activeRunId && (
             <ActiveMission 
                mission={activeMission} 
                runId={activeRunId} 
                onResolve={handleMissionResolve} 
             />
         )}

         {/* RESULT VIEW */}
         {view === 'MISSION_RESULT' && lastMissionResult && (
             <MissionResult 
                result={lastMissionResult} 
                mission={missions.find(m => m.id === lastMissionResult.missionId) || missions[0]}
                onClose={handleMissionContinue}
             />
         )}

         {/* SKILLS VIEW */}
         {view === 'SKILLS' && (
             <SkillTreeUI player={player} onUpdate={setPlayer} onLog={addLog} />
         )}

      </main>
    </div>
  );
};

export default App;
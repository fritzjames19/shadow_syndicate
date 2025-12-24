
import React, { useEffect, useState } from 'react';
import { Player, Mission, MissionOutcome, DistrictMeta, MissionType, DailyRewardResult, MissionDecision } from '../types';
import { getMissionFactors, api, getMissionMasteryReward } from '../services/api';

// --- INTERFACES ---

interface MissionStructureInfoProps {
  onClose: () => void;
}

interface DistrictBannerProps {
  district: DistrictMeta;
}

interface PlayerCardProps {
  player: Player;
}

interface DailyRewardsCardProps {
  player: Player;
  onClaim: () => void;
  processing: boolean;
}

interface RewardModalProps {
  result: DailyRewardResult;
  onClose: () => void;
}

interface MissionCardProps {
  mission: Mission;
  player: Player;
  onRun: (mission: Mission) => void;
  cooldownTime: number;
}

interface MissionGridProps {
  children: React.ReactNode;
}

interface ActiveMissionProps {
  mission: Mission;
  runId: string;
  onResolve: (decisionId?: string) => void;
}

interface MissionResultProps {
  result: MissionOutcome;
  mission: Mission;
  onClose: () => void;
}

// --- COMPONENTS ---

export const MissionStructureInfo: React.FC<MissionStructureInfoProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-4xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Operations Intel</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white uppercase text-xs font-bold tracking-widest">[CLOSE]</button>
        </div>
        
        <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-4 border-l-4 border-neon-blue pl-3">Mission Structure</h3>
        <div className="grid grid-cols-1 gap-4 mb-8">
            {/* Story Missions */}
            <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-lg flex gap-4 hover:border-yellow-500/50 transition-colors group">
                <div className="text-4xl text-yellow-500 bg-yellow-900/20 p-4 rounded flex items-center justify-center h-20 w-20 shrink-0">
                    📖
                </div>
                <div>
                    <h3 className="text-yellow-500 font-bold uppercase tracking-wider text-sm mb-2">Story Missions</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                        Multi-part narrative arcs with cinematics, dialogue choices, and permanent consequences. Each district has 15-20 story missions forming a complete chapter.
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Energy Cost: <span className="text-white">10-30</span> | Completion Time: <span className="text-white">15-30 min</span>
                    </div>
                </div>
            </div>

            {/* Side Jobs */}
            <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-lg flex gap-4 hover:border-neon-blue/50 transition-colors group">
                <div className="text-4xl text-neon-blue bg-blue-900/20 p-4 rounded flex items-center justify-center h-20 w-20 shrink-0">
                    ⭐
                </div>
                <div>
                    <h3 className="text-neon-blue font-bold uppercase tracking-wider text-sm mb-2">Side Jobs</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                        Repeatable missions for grinding resources. Quick, simple, and efficient for building up your operation.
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Energy Cost: <span className="text-white">5-15</span> | Completion Time: <span className="text-white">5 min</span>
                    </div>
                </div>
            </div>

            {/* Contract Hits */}
            <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-lg flex gap-4 hover:border-neon-red/50 transition-colors group">
                <div className="text-4xl text-neon-red bg-red-900/20 p-4 rounded flex items-center justify-center h-20 w-20 shrink-0">
                    🎁
                </div>
                <div>
                    <h3 className="text-neon-red font-bold uppercase tracking-wider text-sm mb-2">Contract Hits</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                        High-risk, high-reward assassination missions. Target powerful NPCs for rare drops and reputation gains.
                    </p>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Energy Cost: <span className="text-white">25-50</span> | Completion Time: <span className="text-white">30-45 min</span>
                    </div>
                </div>
            </div>
        </div>

        {/* LOOT TIERS SECTION */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
            <h3 className="text-neon-blue font-bold uppercase tracking-widest text-sm mb-4 border-l-4 border-neon-blue pl-3">Loot Tiers & Rewards</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-black/60 border border-zinc-800 p-4 rounded text-center flex flex-col justify-center min-h-[80px]">
                    <div className="text-xs text-zinc-400 font-bold uppercase mb-1 tracking-wider">Common</div>
                    <div className="text-white font-mono text-sm">60%</div>
                </div>
                <div className="bg-black/60 border border-zinc-800 p-4 rounded text-center flex flex-col justify-center min-h-[80px] shadow-[0_0_15px_rgba(0,255,65,0.05)]">
                    <div className="text-xs text-neon-green font-bold uppercase mb-1 tracking-wider">Uncommon</div>
                    <div className="text-white font-mono text-sm">25%</div>
                </div>
                <div className="bg-black/60 border border-zinc-800 p-4 rounded text-center flex flex-col justify-center min-h-[80px] shadow-[0_0_15px_rgba(0,243,255,0.05)]">
                    <div className="text-xs text-neon-blue font-bold uppercase mb-1 tracking-wider">Rare</div>
                    <div className="text-white font-mono text-sm">10%</div>
                </div>
                <div className="bg-black/60 border border-zinc-800 p-4 rounded text-center flex flex-col justify-center min-h-[80px] shadow-[0_0_15px_rgba(176,38,255,0.05)]">
                    <div className="text-xs text-neon-purple font-bold uppercase mb-1 tracking-wider">Epic</div>
                    <div className="text-white font-mono text-sm">4%</div>
                </div>
                <div className="bg-black/60 border border-zinc-800 p-4 rounded text-center flex flex-col justify-center min-h-[80px] shadow-[0_0_15px_rgba(234,179,8,0.05)]">
                    <div className="text-xs text-yellow-500 font-bold uppercase mb-1 tracking-wider">Legendary</div>
                    <div className="text-white font-mono text-sm">0.9%</div>
                </div>
                <div className="bg-black/60 border border-zinc-800 p-4 rounded text-center flex flex-col justify-center min-h-[80px] shadow-[0_0_15px_rgba(255,0,60,0.05)]">
                    <div className="text-xs text-neon-red font-bold uppercase mb-1 tracking-wider">Mythic</div>
                    <div className="text-white font-mono text-sm">0.1%</div>
                </div>
            </div>
            
            <p className="text-zinc-500 text-xs mt-4 italic border-t border-zinc-800/50 pt-3">
                * Luck stat and mission mastery bonuses increase rare drop chances.
            </p>
        </div>

        {/* Action Button */}
        <button 
            onClick={onClose}
            className="mt-8 w-full py-3 bg-zinc-800 hover:bg-white hover:text-black text-white font-bold uppercase tracking-widest rounded transition-colors"
        >
            Close Intel
        </button>
      </div>
    </div>
  );
};

export const DistrictBanner: React.FC<DistrictBannerProps> = ({ district }) => {
  return (
    <div className="mb-8 border-l-4 border-neon-blue bg-zinc-900/50 p-6 rounded-r-xl shadow-lg border-y border-r border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-4xl font-bold text-white uppercase tracking-tighter mb-2">{district.name}</h2>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Sector Active</span>
                </div>
            </div>
            <div className="hidden md:block text-right">
                <div className="text-[10px] uppercase text-zinc-600 tracking-[0.2em] font-bold">Security Level</div>
                <div className="text-xl font-bold text-red-500">EXTREME</div>
            </div>
        </div>
        <p className="text-zinc-300 max-w-2xl text-sm leading-relaxed border-t border-zinc-800/50 pt-4 mt-2">
            {district.description}
        </p>
    </div>
  );
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
    // Helper to render bars
    const renderBar = (label: string, current: number, max: number, colorClass: string) => (
        <div className="mb-2">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-1">
                <span className="text-zinc-400">{label}</span>
                <span className="text-white">{current} / {max}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${colorClass}`} style={{ width: `${Math.min(100, (current / max) * 100)}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-lg relative overflow-hidden">
             <div className="flex flex-col gap-6">
                 {/* Header */}
                 <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                     <div>
                         <h2 className="text-3xl font-bold text-white uppercase tracking-tighter leading-none">{player.name}</h2>
                         <div className="flex gap-3 mt-2 text-xs">
                             <span className="text-neon-blue font-bold uppercase tracking-widest px-2 py-0.5 bg-blue-900/20 border border-blue-900/50 rounded">{player.profession}</span>
                             <span className="text-zinc-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded">{player.faction}</span>
                             <span className="text-white font-bold uppercase tracking-widest px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded">LVL {player.level}</span>
                         </div>
                     </div>
                     <div className="text-right">
                         <div className="text-yellow-400 font-bold text-2xl tracking-wider">${player.wallet.toLocaleString()}</div>
                         <div className="text-[10px] text-zinc-500 uppercase tracking-widest">GANG TOKENS</div>
                     </div>
                 </div>

                 {/* Stats */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        {renderBar('Health', player.stats.hp, player.stats.maxHp, 'bg-neon-red')}
                        {renderBar('Energy', player.stats.enr, player.stats.maxEnr, 'bg-yellow-400')}
                        {renderBar('Stamina', player.stats.sta, player.stats.maxSta, 'bg-green-500')}
                     </div>
                     <div>
                        <div className="grid grid-cols-4 gap-2 h-full items-center">
                            <div className="text-center p-2 bg-zinc-950/50 border border-zinc-800 rounded">
                                <div className="text-[10px] text-zinc-500 uppercase mb-1">ATK</div>
                                <div className="text-white font-bold text-lg">{player.stats.atk}</div>
                            </div>
                            <div className="text-center p-2 bg-zinc-950/50 border border-zinc-800 rounded">
                                <div className="text-[10px] text-zinc-500 uppercase mb-1">DEF</div>
                                <div className="text-white font-bold text-lg">{player.stats.def}</div>
                            </div>
                            <div className="text-center p-2 bg-zinc-950/50 border border-zinc-800 rounded">
                                <div className="text-[10px] text-zinc-500 uppercase mb-1">LCK</div>
                                <div className="text-white font-bold text-lg">{player.stats.lck}</div>
                            </div>
                            <div className="text-center p-2 bg-zinc-950/50 border border-zinc-800 rounded">
                                <div className="text-[10px] text-zinc-500 uppercase mb-1">INT</div>
                                <div className="text-white font-bold text-lg">{player.stats.cInt}</div>
                            </div>
                        </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

export const DailyRewardsCard: React.FC<DailyRewardsCardProps> = ({ player, onClaim, processing }) => {
    const isClaimable = player.lastLoginDate !== new Date().toISOString().split('T')[0];
    const streak = player.loginStreak;
    const rewards = [50, 75, 100, 'ENR', 150, 'ENR', 300];
    const dayIndex = (streak) % 7; 

    return (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Daily Login Streak</h3>
                 <div className="text-xs text-neon-blue font-bold">{streak} DAYS</div>
             </div>

             <div className="flex justify-between gap-1 mb-4 overflow-x-auto pb-2">
                 {rewards.map((r, i) => {
                     const isCurrent = i === dayIndex;
                     const isPast = i < dayIndex;
                     return (
                         <div key={i} className={`flex-1 min-w-[40px] h-12 flex items-center justify-center border text-xs font-bold rounded ${
                             isCurrent ? 'border-neon-green bg-green-900/20 text-white' :
                             isPast ? 'border-zinc-700 bg-zinc-800 text-zinc-500' :
                             'border-zinc-800 bg-black text-zinc-600'
                         }`}>
                             {r}
                         </div>
                     );
                 })}
             </div>

             <button 
                onClick={onClaim}
                disabled={!isClaimable || processing}
                className={`w-full py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                    isClaimable && !processing
                    ? 'bg-neon-green text-black hover:bg-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
             >
                 {processing ? 'Processing...' : isClaimable ? 'Claim Reward' : 'Come back tomorrow'}
             </button>
        </div>
    );
};

export const RewardModal: React.FC<RewardModalProps> = ({ result, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <div className="bg-zinc-900 border border-neon-green p-8 rounded-lg max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(0,255,65,0.2)]">
                 <div className="text-4xl mb-4">🎁</div>
                 <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Daily Reward</h2>
                 <p className="text-zinc-400 mb-6">{result.message}</p>
                 
                 <div className="bg-black p-4 rounded mb-6 border border-zinc-800">
                     {result.reward?.gang && (
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-zinc-500">CREDITS</span>
                             <span className="text-neon-green font-bold">+${result.reward.gang}</span>
                         </div>
                     )}
                     {result.reward?.energy && (
                         <div className="flex justify-between text-sm mb-1">
                             <span className="text-zinc-500">MAX ENERGY</span>
                             <span className="text-yellow-400 font-bold">+{result.reward.energy}</span>
                         </div>
                     )}
                     {result.reward?.badge && (
                         <div className="flex justify-between text-sm pt-2 border-t border-zinc-800 mt-2">
                             <span className="text-zinc-500">BADGE</span>
                             <span className="text-neon-purple font-bold">{result.reward.badge}</span>
                         </div>
                     )}
                 </div>

                 <button onClick={onClose} className="w-full bg-white text-black font-bold uppercase py-3 hover:bg-zinc-200">
                     Collect
                 </button>
             </div>
        </div>
    );
};

export const MissionCard: React.FC<MissionCardProps> = ({ mission, player, onRun, cooldownTime }) => {
  const { factors, estHpLoss, estHeatGain } = getMissionFactors(player, mission);
  const oddsPercent = Math.min(95, Math.max(5, (factors.base * 100 + factors.atk * 100 + factors.def * 100 + factors.crew * 100 + factors.lck * 100 + factors.heat * 100 + factors.skills * 100)));
  const isLocked = player.level < mission.minLevel;
  const isOnCooldown = cooldownTime > 0;
  
  // Mastery Calculation
  const masteryProgress = player.missionMastery[mission.id] || 0;
  const isMastered = masteryProgress >= 100;
  const masteryReward = getMissionMasteryReward(mission);

  // Crew Traits Analysis
  const activeCrew = player.crew.filter(c => c.isActive);
  const corpoCount = activeCrew.filter(c => c.trait === 'Ex-Corpo').length;
  const psychoCount = activeCrew.filter(c => c.trait === 'Psycho').length;

  const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
        case 'Low': return 'text-zinc-400';
        case 'Medium': return 'text-yellow-500';
        case 'High': return 'text-orange-500';
        case 'Extreme': return 'text-neon-red';
        default: return 'text-zinc-400';
    }
  };

  const getOddsColor = (percent: number) => {
      if (percent >= 80) return 'text-neon-green';
      if (percent >= 50) return 'text-yellow-500';
      return 'text-neon-red';
  }

  // Stat Caps for Tooltip (Matched with API limits)
  const isAtkMaxed = factors.atk >= 0.30;
  const isDefMaxed = factors.def >= 0.20;
  const isCrewMaxed = factors.crew >= 0.25;
  const isLuckMaxed = factors.lck >= 0.10;

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col group transition-all duration-300 hover:border-zinc-500 hover:shadow-xl hover:shadow-neon-blue/10 relative hover:z-50 ${isLocked ? 'opacity-50 grayscale' : ''}`}>
      {/* TEXT HEADER AREA */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex justify-between items-start mb-2">
             <div className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded shadow-md backdrop-blur-sm ${
                mission.type === MissionType.STORY ? 'bg-yellow-500 text-black' : 
                mission.type === MissionType.CONTRACT ? 'bg-red-500 text-white' : 
                'bg-neon-blue text-black'
            }`}>
                {mission.type.replace('_', ' ')}
            </div>
             {isLocked && (
                <div className="px-2 py-0.5 text-[10px] font-bold uppercase rounded shadow-md bg-zinc-900 text-zinc-400 border border-zinc-700">
                    LVL {mission.minLevel}
                </div>
            )}
            {isMastered && (
                <div className="absolute top-3 right-3 text-yellow-400 animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.5)] cursor-help" title={`Mastered: ${masteryReward.label}`}>
                    👑
                </div>
            )}
        </div>
        <h4 className="text-white font-bold text-lg uppercase tracking-wider leading-tight truncate">{mission.title}</h4>
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 flex-1 flex flex-col">
        
        <p className="text-xs text-zinc-400 line-clamp-2 mb-2 flex-1 leading-relaxed min-h-[3em]">{mission.description}</p>
        
        {/* Objectives Preview */}
        {mission.objectives && mission.objectives.length > 0 && (
            <div className="mb-4 bg-black/20 p-2 rounded border border-zinc-800/50">
                <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <span>🎯</span> Objectives
                </div>
                <ul className="text-[10px] text-zinc-400 space-y-0.5">
                    {mission.objectives.slice(0, 2).map((obj, i) => (
                        <li key={i} className="truncate flex gap-1">
                            <span className="text-zinc-600">›</span> {obj}
                        </li>
                    ))}
                    {mission.objectives.length > 2 && <li className="text-zinc-600 italic pl-2">+ {mission.objectives.length - 2} more</li>}
                </ul>
            </div>
        )}
        
        {/* REFINED STATS GRID (2x2) */}
        <div className="grid grid-cols-2 gap-px bg-zinc-800/50 border border-zinc-800 rounded mb-4">
            {/* Energy */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors rounded-tl border-r border-b border-zinc-800/50">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Energy</span>
                <span className="text-neon-blue font-bold text-sm">-{mission.costEnr} ⚡</span>
            </div>
            {/* Payout */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors rounded-tr border-b border-zinc-800/50">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Payout</span>
                <span className="text-neon-green font-bold text-sm">
                    ${isMastered ? Math.floor(mission.baseReward * 1.25) : mission.baseReward}
                    {isMastered && <span className="text-[9px] align-top text-yellow-400 ml-0.5">*</span>}
                </span>
            </div>
            {/* Odds with Tooltip */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors relative group/tooltip cursor-help rounded-bl border-r border-zinc-800/50">
                <div className="flex items-center justify-center gap-1 border-b border-dotted border-zinc-600 pb-0.5 mb-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Success</span>
                    <span className="text-[8px] text-zinc-600">ⓘ</span>
                </div>
                <span className={`font-bold text-sm ${getOddsColor(oddsPercent)}`}>{oddsPercent.toFixed(0)}%</span>
                
                {/* TOOLTIP */}
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-zinc-950 border border-zinc-700 rounded shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md scale-95 group-hover/tooltip:scale-100 origin-bottom duration-200">
                    <div className="bg-zinc-900/80 p-2 border-b border-zinc-800 rounded-t">
                        <div className="text-[10px] uppercase font-bold text-white tracking-widest text-center">Success Probability Breakdown</div>
                    </div>
                    <div className="p-3 space-y-1.5 text-[10px]">
                        <div className="flex justify-between text-zinc-300 border-b border-zinc-800/30 pb-1">
                            <span>Base Chance</span> 
                            <span className="font-mono text-zinc-400">{(factors.base * 100).toFixed(0)}%</span>
                        </div>
                        
                        {factors.atk > 0 && (
                            <div className="flex justify-between text-neon-red">
                                <span>⚔️ ATK Factor {isAtkMaxed && <span className="text-[8px] bg-red-900/50 px-1 rounded ml-1">MAX</span>}</span> 
                                <span className="font-mono">+{(factors.atk * 100).toFixed(0)}%</span>
                            </div>
                        )}
                        {factors.def > 0 && (
                            <div className="flex justify-between text-neon-blue">
                                <span>🛡️ DEF Factor {isDefMaxed && <span className="text-[8px] bg-blue-900/50 px-1 rounded ml-1">MAX</span>}</span> 
                                <span className="font-mono">+{(factors.def * 100).toFixed(0)}%</span>
                            </div>
                        )}
                        {factors.crew > 0 && (
                            <div className="flex justify-between text-neon-purple">
                                <span>👥 Crew Factor {isCrewMaxed && <span className="text-[8px] bg-purple-900/50 px-1 rounded ml-1">MAX</span>}</span> 
                                <span className="font-mono">+{(factors.crew * 100).toFixed(0)}%</span>
                            </div>
                        )}
                        {factors.lck > 0 && (
                            <div className="flex justify-between text-yellow-400">
                                <span>🍀 Luck Factor {isLuckMaxed && <span className="text-[8px] bg-yellow-900/50 px-1 rounded ml-1">MAX</span>}</span> 
                                <span className="font-mono">+{(factors.lck * 100).toFixed(0)}%</span>
                            </div>
                        )}
                        {factors.skills > 0 && (
                            <div className="flex justify-between text-neon-green">
                                <span>🧠 Skill Bonuses</span> 
                                <span className="font-mono">+{(factors.skills * 100).toFixed(0)}%</span>
                            </div>
                        )}
                        
                        {factors.heat !== 0 && (
                            <div className="flex justify-between text-red-500 border-t border-zinc-800/50 pt-1 mt-1">
                                <span>🔥 Heat Penalty</span> 
                                <span className="font-mono">{(factors.heat * 100).toFixed(0)}%</span>
                            </div>
                        )}
                        
                         <div className="mt-2 pt-2 border-t border-zinc-700 flex justify-between font-bold text-white bg-black/20 -mx-3 -mb-3 p-3 rounded-b">
                             <span>TOTAL ODDS</span> 
                             <span className={`${getOddsColor(oddsPercent)} text-sm`}>{oddsPercent.toFixed(0)}%</span>
                         </div>
                    </div>
                </div>
            </div>
            {/* Risk with Tooltip */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors relative group/tooltip-risk cursor-help rounded-br">
                <div className="flex items-center justify-center gap-1 border-b border-dotted border-zinc-600 pb-0.5 mb-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Risk</span>
                    <span className="text-[8px] text-zinc-600">ⓘ</span>
                </div>
                <span className={`font-bold text-sm ${getRiskColor(mission.risk)}`}>{mission.risk}</span>

                {/* RISK TOOLTIP */}
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-zinc-950 border border-red-900/30 rounded shadow-2xl opacity-0 group-hover/tooltip-risk:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md scale-95 group-hover/tooltip-risk:scale-100 origin-bottom duration-200">
                     <div className="bg-red-950/20 p-2 border-b border-red-900/30 rounded-t">
                        <div className="text-[10px] uppercase font-bold text-red-500 tracking-widest text-center">Failure Consequences</div>
                     </div>
                     <div className="p-3 space-y-2 text-[10px]">
                        <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-red-900/20">
                            <span className="text-zinc-400">Est. Damage</span> 
                            <span className="text-red-500 font-bold">-{estHpLoss} HP</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-orange-900/20">
                            <span className="text-zinc-400">Heat Spike</span> 
                            <span className="text-orange-500 font-bold">+{estHeatGain} HEAT</span>
                        </div>
                        
                        {(corpoCount > 0 || psychoCount > 0) && (
                            <div className="border-t border-red-900/20 pt-2 mt-1">
                                <div className="text-[9px] text-zinc-500 uppercase mb-1">Crew Traits Active</div>
                                {corpoCount > 0 && (
                                    <div className="flex justify-between text-green-500">
                                        <span>Ex-Corpo ({corpoCount})</span>
                                        <span>Reducing Heat</span>
                                    </div>
                                )}
                                {psychoCount > 0 && (
                                    <div className="flex justify-between text-red-400">
                                        <span>Psycho ({psychoCount})</span>
                                        <span>Increasing Heat</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-[9px] text-zinc-600 italic mt-1 text-center border-t border-zinc-800/30 pt-2">
                            "Consequences are only for those who fail."
                        </div>
                     </div>
                </div>
            </div>
        </div>

        {/* MASTERY BAR */}
        <div className="mb-4 group/mastery relative cursor-help">
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider mb-1">
                <span className={isMastered ? "text-yellow-400" : "text-zinc-500"}>{isMastered ? "Mastered" : "Mastery"}</span>
                <span className={isMastered ? "text-yellow-400" : "text-zinc-500"}>{masteryProgress}/100</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                <div className={`h-full transition-all duration-500 ${isMastered ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-zinc-600'}`} style={{ width: `${masteryProgress}%` }}></div>
                {/* Reward Indicator Ticks */}
                <div className="absolute top-0 right-0 w-0.5 h-full bg-white/20"></div>
            </div>
            
            {/* MASTERY TOOLTIP */}
            <div className="absolute bottom-full left-0 mb-2 w-full bg-zinc-950 border border-zinc-700 p-2 rounded shadow opacity-0 group-hover/mastery:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="text-[10px] text-center">
                    {isMastered ? (
                        <>
                            <div className="text-yellow-400 font-bold mb-1">UNLOCKED: {masteryReward.label}</div>
                            <div className="text-zinc-400">Passive Bonus: +25% Cash & XP</div>
                        </>
                    ) : (
                        <>
                            <div className="text-zinc-300 font-bold mb-1">Reward: {masteryReward.label}</div>
                            <div className="text-zinc-500">Reach 100% to permanently unlock stats & bonus.</div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => onRun(mission)}
          disabled={isLocked || isOnCooldown}
          className={`w-full py-3 text-xs font-bold uppercase tracking-[0.15em] rounded transition-all shadow-md relative group/btn overflow-hidden ${
             isLocked ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700' :
             isOnCooldown ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700' :
             'bg-white text-black hover:bg-neon-blue hover:text-white hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]'
          }`}
        >
           <span className="relative z-10">
               {isLocked ? 'LOCKED' : isOnCooldown ? `WAIT ${formatTime(cooldownTime)}` : 'EXECUTE'}
           </span>
           {!isLocked && !isOnCooldown && (
               <div className="absolute inset-0 bg-neon-blue transform scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left duration-300 -z-0" />
           )}
        </button>
      </div>
    </div>
  );
};

export const MissionGrid: React.FC<MissionGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {children}
    </div>
  );
};

export const ActiveMission: React.FC<ActiveMissionProps> = ({ mission, runId, onResolve }) => {
  const [phase, setPhase] = useState<'LOADING' | 'DECISION' | 'EXECUTING'>('LOADING');
  const [narrative, setNarrative] = useState<string>('');
  const [choices, setChoices] = useState<MissionDecision[]>([]);
  const [dynamicObjectives, setDynamicObjectives] = useState<string[]>([]);

  useEffect(() => {
      const loadScenario = async () => {
          // Delay for suspense
          await new Promise(r => setTimeout(r, 1500));
          const res = await api.missions.getScenario(runId);
          if (res.success && res.data) {
              setNarrative(res.data.narrative);
              setChoices(res.data.choices);
              if (res.data.objectives) {
                  setDynamicObjectives(res.data.objectives);
              } else {
                  setDynamicObjectives(mission.objectives);
              }
              setPhase('DECISION');
          } else {
              // Fallback to auto-resolve if data fails
              onResolve(); 
          }
      };
      loadScenario();
  }, [runId]);

  const handleDecision = (choiceId: string) => {
      setPhase('EXECUTING');
      onResolve(choiceId);
  }

  const objectivesToDisplay = dynamicObjectives.length > 0 ? dynamicObjectives : mission.objectives;

  if (phase === 'LOADING') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in zoom-in duration-300">
            <div className="relative w-24 h-24 mb-8">
                 <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-neon-blue rounded-full border-t-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">📡</div>
            </div>
            <h2 className="text-2xl text-white font-bold uppercase tracking-widest animate-pulse">Establishing Uplink</h2>
            <div className="text-neon-blue text-xs mt-2 uppercase tracking-[0.3em] font-bold">Gathering Intel...</div>
        </div>
      );
  }

  if (phase === 'EXECUTING') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in zoom-in duration-300">
            <div className="relative w-24 h-24 mb-8">
                 <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-neon-green rounded-full border-t-transparent animate-spin direction-reverse"></div>
                 <div className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce">⚡</div>
            </div>
            <h2 className="text-2xl text-white font-bold uppercase tracking-widest">Executing Protocol</h2>
            <div className="text-neon-green text-xs mt-2 uppercase tracking-[0.3em] font-bold">Resolving Outcome...</div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-3xl w-full bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl relative">
         <div className="p-8">
            <div className="text-center mb-8">
                <div className="text-neon-blue text-xs uppercase tracking-[0.3em] font-bold mb-2">Tactical Decision Required</div>
                <h2 className="text-3xl text-white font-bold uppercase tracking-widest mb-4">{mission.title}</h2>
                <div className="bg-black border border-zinc-800 p-6 rounded-lg text-left shadow-inner">
                    <p className="text-zinc-300 font-mono leading-relaxed text-sm md:text-base border-l-2 border-neon-blue pl-4">
                        {narrative}
                    </p>
                    
                    {/* OBJECTIVES LIST */}
                    {objectivesToDisplay && objectivesToDisplay.length > 0 && (
                        <div className="mt-6 border-t border-zinc-800 pt-4">
                            <h4 className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-3 font-bold">Mission Objectives</h4>
                            <ul className="space-y-2">
                                {objectivesToDisplay.map((obj, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-300 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                                        <div className="w-1.5 h-1.5 bg-neon-blue rounded-full shadow-[0_0_5px_rgba(0,243,255,0.8)]"></div>
                                        <span className="font-mono">{obj}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {choices.map((choice) => (
                    <button 
                        key={choice.id}
                        onClick={() => handleDecision(choice.id)}
                        className={`group relative p-5 border text-left transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between min-h-[120px] ${
                            choice.type === 'AGGRESSIVE' ? 'border-red-900/50 bg-red-950/20 hover:border-red-500 hover:bg-red-900/30' :
                            choice.type === 'STEALTH' ? 'border-blue-900/50 bg-blue-950/20 hover:border-blue-500 hover:bg-blue-900/30' :
                            choice.type === 'DIPLOMATIC' ? 'border-yellow-900/50 bg-yellow-950/20 hover:border-yellow-500 hover:bg-yellow-900/30' :
                            choice.type === 'TECH' ? 'border-purple-900/50 bg-purple-950/20 hover:border-purple-500 hover:bg-purple-900/30' :
                            'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500'
                        }`}
                    >
                        <div>
                            <div className={`font-bold text-lg mb-1 uppercase tracking-wider ${
                                choice.type === 'AGGRESSIVE' ? 'text-red-400 group-hover:text-red-300' :
                                choice.type === 'STEALTH' ? 'text-blue-400 group-hover:text-blue-300' :
                                choice.type === 'DIPLOMATIC' ? 'text-yellow-400 group-hover:text-yellow-300' :
                                choice.type === 'TECH' ? 'text-purple-400 group-hover:text-purple-300' :
                                'text-white'
                            }`}>
                                {choice.label}
                            </div>
                            <div className="text-xs text-zinc-400 group-hover:text-zinc-300">{choice.description}</div>
                        </div>
                        
                        <div className="mt-4 flex gap-2 text-[10px] font-mono uppercase">
                            {choice.riskModifier > 1.0 && <span className="text-red-500 bg-red-950/50 px-2 py-1 rounded border border-red-900">High Risk</span>}
                            {choice.riskModifier < 1.0 && <span className="text-green-500 bg-green-950/50 px-2 py-1 rounded border border-green-900">Low Risk</span>}
                            {choice.rewardModifier > 1.0 && <span className="text-yellow-500 bg-yellow-950/50 px-2 py-1 rounded border border-yellow-900">High Reward</span>}
                            {choice.cost && <span className="text-zinc-300 bg-zinc-800 px-2 py-1 rounded border border-zinc-600">Cost: ${choice.cost}</span>}
                        </div>
                    </button>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export const MissionResult: React.FC<MissionResultProps> = ({ result, mission, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in zoom-in duration-300">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl relative">
         <div className={`p-8 border-b border-zinc-800 ${result.success ? 'bg-green-950/20' : 'bg-red-950/20'}`}>
            <h2 className={`text-3xl font-bold tracking-widest uppercase text-center ${result.success ? 'text-neon-green' : 'text-red-500'}`}>
                {result.success ? 'MISSION SUCCESS' : 'MISSION FAILED'}
            </h2>
         </div>

         <div className="p-6">
            <p className="text-sm text-zinc-300 italic text-center mb-6 leading-relaxed border-l-2 border-zinc-700 pl-4 py-2">
                "{result.narrative}"
            </p>

            {result.objectives && result.objectives.length > 0 && (
                <div className="mb-6 bg-black/40 border border-zinc-800/50 rounded p-3">
                    <div className="text-[10px] uppercase text-zinc-500 mb-2 font-bold tracking-widest">Objectives Status</div>
                    <ul className="space-y-1">
                        {result.objectives.map((obj, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs">
                                <span className={result.success ? "text-neon-green" : "text-red-500"}>
                                    {result.success ? "✓" : "✕"}
                                </span>
                                <span className={result.success ? "text-zinc-300" : "text-zinc-500 line-through"}>
                                    {obj}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/50 p-3 rounded border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase">Rewards</div>
                    <div className="text-neon-green text-lg font-bold">+${result.rewards.money}</div>
                    <div className="text-neon-purple text-xs font-bold">+{result.rewards.exp} XP</div>
                </div>
                <div className="bg-black/50 p-3 rounded border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase">Consequences</div>
                    <div className="text-red-500 text-lg font-bold">-{result.penalties.hpLoss} HP</div>
                    <div className="text-orange-500 text-xs font-bold">+{result.penalties.heatGain} HEAT</div>
                </div>
            </div>

            <button onClick={onClose} className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded hover:bg-zinc-200">
                Continue
            </button>
         </div>
      </div>
    </div>
  );
}

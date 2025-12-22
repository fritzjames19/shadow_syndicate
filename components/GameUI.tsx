import React, { useEffect, useState } from 'react';
import { Player, Mission, MissionOutcome, DistrictMeta, MissionType, DailyRewardResult, MissionDecision } from '../types';
import { getMissionFactors, api } from '../services/api';

// --- MISSION STRUCTURE INFO MODAL ---
interface MissionStructureInfoProps {
  onClose: () => void;
}

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

        {/* CRAFTING MATERIALS SECTION */}
        <div className="mt-8">
            <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-6">
                <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-4">Crafting Materials</h3>
                
                <div className="flex items-center gap-3 mb-6 text-zinc-400 text-xs">
                    <span className="text-yellow-500 text-lg">🔧</span>
                    <p>Missions drop crafting materials used to upgrade gear, build rackets, and create consumables.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/60 border border-zinc-800 p-4 rounded flex flex-col">
                        <div className="text-yellow-500 font-bold text-sm mb-1">Scrap Metal</div>
                        <div className="text-zinc-500 text-xs">Weapon crafting</div>
                    </div>
                    <div className="bg-black/60 border border-zinc-800 p-4 rounded flex flex-col">
                        <div className="text-cyan-400 font-bold text-sm mb-1">Circuit Boards</div>
                        <div className="text-zinc-500 text-xs">Tech upgrades</div>
                    </div>
                    <div className="bg-black/60 border border-zinc-800 p-4 rounded flex flex-col">
                        <div className="text-red-600 font-bold text-sm mb-1">Blood Diamonds</div>
                        <div className="text-zinc-500 text-xs">Legendary crafts</div>
                    </div>
                    <div className="bg-black/60 border border-zinc-800 p-4 rounded flex flex-col">
                        <div className="text-white font-bold text-sm mb-1">Contraband</div>
                        <div className="text-zinc-500 text-xs">Trade goods</div>
                    </div>
                </div>
            </div>
        </div>

        {/* MISSION MASTERY SYSTEM SECTION */}
        <div className="mt-8 border border-red-900/30 bg-red-950/10 rounded-lg p-6">
            <h3 className="text-red-600 font-bold uppercase tracking-widest text-sm mb-4">Mission Mastery System</h3>
            
            <p className="text-zinc-400 text-xs mb-6">
                Complete missions multiple times to increase mastery level (1-5 stars). Higher mastery unlocks:
            </p>

            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <span className="text-red-600 mt-0.5 text-xs">●</span>
                    <div className="text-xs">
                        <span className="text-white font-bold mr-2">★</span>
                        <span className="text-zinc-300">10% increased loot drops</span>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-red-600 mt-0.5 text-xs">●</span>
                    <div className="text-xs">
                        <span className="text-white font-bold mr-2">★★</span>
                        <span className="text-zinc-300">Reduced energy cost (-20%)</span>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-red-600 mt-0.5 text-xs">●</span>
                    <div className="text-xs">
                        <span className="text-white font-bold mr-2">★★★</span>
                        <span className="text-zinc-300">Access to Hard Mode variant</span>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-red-600 mt-0.5 text-xs">●</span>
                    <div className="text-xs">
                        <span className="text-white font-bold mr-2">★★★★</span>
                        <span className="text-zinc-300">Exclusive mastery cosmetic</span>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-red-600 mt-0.5 text-xs">●</span>
                    <div className="text-xs">
                        <span className="text-white font-bold mr-2">★★★★★</span>
                        <span className="text-zinc-300">Unique NFT reward (one-time)</span>
                    </div>
                </div>
            </div>
        </div>

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

// --- DISTRICT BANNER ---
interface DistrictBannerProps {
  district: DistrictMeta;
}

export const DistrictBanner: React.FC<DistrictBannerProps> = ({ district }) => {
  return (
    <div className="relative h-48 md:h-64 w-full rounded-b-xl overflow-hidden border-b border-zinc-800 shadow-2xl mb-6 group">
      {district.imageUrl ? (
        <img 
          src={district.imageUrl} 
          alt={district.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
        />
      ) : (
        <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center p-4 border-b-4 border-neon-red/20 relative overflow-hidden">
             {/* Tech Pattern Background */}
             <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <div className="text-neon-red text-6xl font-bold opacity-20 uppercase tracking-widest mb-2 select-none">OFFLINE</div>
             <div className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Visual Uplink Required</div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-6 w-full pointer-events-none">
        <h2 className="text-4xl font-bold text-white uppercase tracking-tighter drop-shadow-lg mb-1">{district.name}</h2>
        <p className="text-neon-blue text-sm uppercase tracking-widest max-w-xl drop-shadow-md bg-black/60 inline-block px-2 py-1">{district.description}</p>
      </div>
    </div>
  );
};

// --- PLAYER CARD ---
interface PlayerCardProps {
  player: Player;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const xpProgress = (player.xp / (Math.round(100 * Math.pow(player.level, 1.4)))) * 100;
  
  // Attribute config for cleaner mapping
  const attributes = [
    { label: 'ATTACK POWER', code: 'ATK', val: player.stats.atk, color: 'text-neon-red', icon: '🎯' },
    { label: 'DEFENSE RATING', code: 'DEF', val: player.stats.def, color: 'text-neon-blue', icon: '🛡️' },
    { label: 'MAX ENERGY', code: 'ENR', val: `${player.stats.enr}/${player.stats.maxEnr}`, color: 'text-yellow-400', icon: '⚡' },
    { label: 'MAX STAMINA', code: 'STA', val: `${player.stats.sta}/${player.stats.maxSta}`, color: 'text-orange-400', icon: '✨' },
    { label: 'MAX HEALTH', code: 'HP', val: `${player.stats.hp}/${player.stats.maxHp}`, color: 'text-red-600', icon: '❤️' },
    { label: 'LUCK FACTOR', code: 'LCK', val: player.stats.lck, color: 'text-cyan-400', icon: '🎲' },
    { label: 'CRYPTO-INTEL', code: 'C-INT', val: player.stats.cInt, color: 'text-teal-400', icon: '🧠' },
  ];

  return (
    <div className="space-y-4">
      {/* HEADER SECTION */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 flex gap-4 items-center shadow-lg backdrop-blur-sm">
        <div className="w-20 h-20 rounded-full border-2 border-neon-blue overflow-hidden shrink-0 relative bg-black">
          {player.portraitUrl ? (
            <img src={player.portraitUrl} alt="Player" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs bg-zinc-800">
              <span className="opacity-50">NO IMG</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
             <h3 className="text-xl font-bold text-white truncate">{player.name}</h3>
             <span className="text-xs text-neon-green font-bold">LVL {player.level}</span>
          </div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>{player.faction}</span>
            <span className="text-zinc-700">•</span>
            <span className="text-neon-blue font-bold">{player.profession}</span>
          </div>
          
          <div className="flex-1">
             <span className="text-zinc-600 uppercase text-[10px] block mb-1">Reputation (XP)</span>
             <div className="h-1.5 bg-zinc-800 w-full rounded-full overflow-hidden">
                <div className="h-full bg-neon-purple" style={{ width: `${Math.min(100, xpProgress)}%` }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* CORE ATTRIBUTES GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {attributes.map((attr) => (
            <div key={attr.code} className="bg-black/40 border border-zinc-800 p-3 rounded flex flex-col justify-between hover:border-zinc-700 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded bg-zinc-900/50 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                        {attr.icon}
                    </div>
                    <span className={`text-xl font-bold ${attr.color} tracking-tighter`}>
                        {attr.code}
                    </span>
                </div>
                <div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold mb-0.5">{attr.label}</div>
                    <div className="text-white text-lg font-mono">{attr.val}</div>
                </div>
            </div>
         ))}
      </div>
    </div>
  );
};

// --- REWARD MODAL ---
interface RewardModalProps {
  result: DailyRewardResult;
  onClose: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border-2 border-neon-green rounded-xl p-8 max-w-sm w-full relative overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.2)]">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #00ff41 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent"></div>
        
        <div className="relative z-10 text-center">
          <div className="text-neon-green font-bold uppercase tracking-[0.2em] text-sm mb-6 animate-pulse">
             Supply Drop Secured
          </div>

          <div className="mb-8 scale-150 transform transition-all duration-500">
             {result.reward?.gang && <div className="text-5xl mb-2">💵</div>}
             {result.reward?.energy && <div className="text-5xl mb-2">⚡</div>}
             {result.reward?.badge && <div className="text-5xl mb-2">🏆</div>}
          </div>

          <div className="space-y-2 mb-8">
             {result.reward?.gang && (
                <div className="text-3xl font-bold text-white tracking-wider animate-in slide-in-from-bottom-2">
                   +${result.reward.gang}
                </div>
             )}
             {result.reward?.energy && (
                <div className="text-xl font-bold text-neon-blue tracking-wider animate-in slide-in-from-bottom-4">
                   MAX ENERGY UPGRADE
                </div>
             )}
             {result.reward?.badge && (
                <div className="text-lg font-bold text-yellow-400 border border-yellow-500/50 bg-yellow-500/10 px-3 py-1 rounded-full inline-block animate-in zoom-in duration-500">
                   BADGE UNLOCKED: {result.reward.badge}
                </div>
             )}
          </div>

          <div className="bg-black/40 rounded p-4 mb-6 border border-zinc-800">
             <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Login Streak</div>
             <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-white">{result.streak}</span>
                <span className="text-sm text-zinc-400">DAYS</span>
             </div>
             <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-neon-green h-full transition-all duration-1000" style={{ width: `${(result.streak % 7 === 0 ? 7 : result.streak % 7) / 7 * 100}%` }}></div>
             </div>
          </div>

          <button 
             onClick={onClose}
             className="w-full py-3 bg-neon-green text-black font-bold uppercase tracking-widest rounded hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,65,0.5)] transition-all"
          >
             Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// --- DAILY REWARDS CARD ---
interface DailyRewardsCardProps {
  player: Player;
  onClaim: () => void;
  processing: boolean;
}

export const DailyRewardsCard: React.FC<DailyRewardsCardProps> = ({ player, onClaim, processing }) => {
  const today = new Date().toISOString().split('T')[0];
  const isClaimed = player.lastLoginDate === today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Calculate visual state
  let activeDayInCycle = 1; 
  
  if (isClaimed) {
      activeDayInCycle = ((player.loginStreak - 1) % 7) + 1;
  } else {
      if (player.lastLoginDate === yesterday) {
          activeDayInCycle = (player.loginStreak % 7) + 1;
      } else {
          // Reset visually implies next is Day 1
          activeDayInCycle = 1;
      }
  }

  const rewards = [
      { day: 1, label: "$50", icon: "💵" },
      { day: 2, label: "$75", icon: "💵" },
      { day: 3, label: "$100", icon: "💵" },
      { day: 4, label: "+1 ENR", icon: "⚡" },
      { day: 5, label: "$150", icon: "💵" },
      { day: 6, label: "+1 ENR", icon: "⚡" },
      { day: 7, label: "$300 + 🏆", icon: "🎁" },
  ];

  const hoursRemaining = 24 - new Date().getUTCHours();

  return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-6xl text-neon-green select-none pointer-events-none">
              DAY {activeDayInCycle}
          </div>
          
          <div className="flex justify-between items-end mb-6 relative z-10">
              <div>
                  <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                      <span className="text-neon-green">Daily Supply Drop</span>
                      {isClaimed && <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded border border-zinc-700">CLAIMED</span>}
                  </h3>
                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                      Current Streak: <span className="text-white font-bold">{player.loginStreak} Days</span>
                      {!isClaimed && <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>}
                  </div>
              </div>
              <button
                  onClick={onClaim}
                  disabled={isClaimed || processing}
                  className={`px-6 py-2 text-xs font-bold uppercase rounded tracking-widest transition-all shadow-lg ${
                      isClaimed 
                      ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                      : 'bg-neon-green text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,65,0.6)] animate-pulse'
                  }`}
              >
                  {isClaimed ? `RETURNING IN ${hoursRemaining}H` : 'SECURE PACKAGE'}
              </button>
          </div>

          <div className="grid grid-cols-7 gap-2 relative z-10">
              {rewards.map((r) => {
                  const isActive = r.day === activeDayInCycle;
                  const isPast = isClaimed ? r.day <= activeDayInCycle : r.day < activeDayInCycle;
                  const isReadyToClaim = isActive && !isClaimed;
                  
                  return (
                      <div 
                          key={r.day} 
                          className={`
                              relative border rounded p-2 flex flex-col items-center justify-center min-h-[80px] transition-all duration-300
                              ${isActive 
                                  ? `border-neon-green bg-neon-green/10 shadow-[0_0_10px_rgba(0,255,65,0.15)] scale-105 z-10 ${isReadyToClaim ? 'border-2 shadow-[0_0_15px_rgba(0,255,65,0.3)]' : ''}` 
                                  : isPast 
                                      ? 'border-zinc-800 bg-zinc-900/50 opacity-40' 
                                      : 'border-zinc-800 bg-black/40'
                              }
                          `}
                      >
                          <div className={`text-[10px] absolute top-1 left-2 ${isActive ? 'text-neon-green' : 'text-zinc-600'}`}>0{r.day}</div>
                          <div className="text-xl mb-1 filter drop-shadow-md">{r.icon}</div>
                          <div className={`text-[9px] font-bold text-center leading-tight uppercase ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                              {r.label}
                          </div>
                          
                          {isPast && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded backdrop-blur-[1px]">
                                  <span className="text-neon-green font-bold text-lg">✓</span>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>
  );
}

// --- MISSION CARD ---
interface MissionCardProps {
  mission: Mission;
  player: Player;
  onRun: (mission: Mission) => void;
  cooldownTime: number;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, player, onRun, cooldownTime }) => {
  const factors = getMissionFactors(player, mission);
  const oddsPercent = Math.min(95, Math.max(5, (factors.factors.base * 100 + factors.factors.atk * 100 + factors.factors.def * 100 + factors.factors.crew * 100 + factors.factors.lck * 100 + factors.factors.heat * 100 + factors.factors.skills * 100)));
  const isLocked = player.level < mission.minLevel;
  const isOnCooldown = cooldownTime > 0;

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

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col group transition-all duration-300 hover:border-zinc-500 hover:shadow-xl hover:shadow-neon-blue/10 relative hover:z-50 ${isLocked ? 'opacity-50 grayscale' : ''}`}>
      {/* HEADER IMAGE AREA */}
      <div className="h-32 bg-black relative overflow-hidden shrink-0 rounded-t-lg">
        {mission.imageUrl ? (
          <img src={mission.imageUrl} alt={mission.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
        ) : (
          <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center border-b border-zinc-800">
             <div className="text-zinc-800 font-bold uppercase tracking-widest text-[10px] mb-1">NO SIGNAL</div>
             <div className="w-6 h-6 border-2 border-zinc-800 rounded-full border-t-zinc-600 animate-spin opacity-20"></div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
        
        {/* Type & Lock Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
            <div className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded shadow-md backdrop-blur-sm ${
                mission.type === MissionType.STORY ? 'bg-yellow-500/80 text-black' : 
                mission.type === MissionType.CONTRACT ? 'bg-red-500/80 text-white' : 
                'bg-neon-blue/80 text-black'
            }`}>
                {mission.type.replace('_', ' ')}
            </div>
            {isLocked && (
                <div className="px-2 py-0.5 text-[10px] font-bold uppercase rounded shadow-md bg-zinc-900/80 text-zinc-400 border border-zinc-700">
                    LVL {mission.minLevel}
                </div>
            )}
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="text-white font-bold text-sm uppercase tracking-wider leading-tight mb-2 truncate">{mission.title}</h4>
        
        <p className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1 leading-relaxed min-h-[2.5em]">{mission.description}</p>
        
        {/* REFINED STATS GRID (2x2) */}
        <div className="grid grid-cols-2 gap-px bg-zinc-800/50 border border-zinc-800 rounded mb-4">
            {/* Energy */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors rounded-tl">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Energy</span>
                <span className="text-neon-blue font-bold text-sm">-{mission.costEnr} ⚡</span>
            </div>
            {/* Payout */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors rounded-tr">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Payout</span>
                <span className="text-neon-green font-bold text-sm">${mission.baseReward}</span>
            </div>
            {/* Odds with Tooltip */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors relative group/tooltip cursor-help rounded-bl">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Success</span>
                <span className={`font-bold text-sm ${getOddsColor(oddsPercent)}`}>{oddsPercent.toFixed(0)}%</span>
                
                {/* TOOLTIP */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 border border-zinc-700 p-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-[100] backdrop-blur-md">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 border-b border-zinc-800 pb-1 text-center">Success Factors</div>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between"><span>Base Chance</span> <span className="text-zinc-300">{(factors.factors.base * 100).toFixed(0)}%</span></div>
                        {factors.factors.atk > 0 && <div className="flex justify-between"><span>Attack Bonus</span> <span className="text-neon-red">+{(factors.factors.atk * 100).toFixed(0)}%</span></div>}
                        {factors.factors.def > 0 && <div className="flex justify-between"><span>Defense Bonus</span> <span className="text-neon-blue">+{(factors.factors.def * 100).toFixed(0)}%</span></div>}
                        {factors.factors.crew > 0 && <div className="flex justify-between"><span>Crew Bonus</span> <span className="text-neon-purple">+{(factors.factors.crew * 100).toFixed(0)}%</span></div>}
                        {factors.factors.lck > 0 && <div className="flex justify-between"><span>Luck Bonus</span> <span className="text-yellow-500">+{(factors.factors.lck * 100).toFixed(0)}%</span></div>}
                        {factors.factors.heat !== 0 && <div className="flex justify-between"><span>Heat Penalty</span> <span className="text-red-500">{(factors.factors.heat * 100).toFixed(0)}%</span></div>}
                        {factors.factors.skills !== 0 && (
                            <div className="flex justify-between"><span>Skills</span> <span className="text-neon-green">{factors.factors.skills > 0 ? '+' : ''}{(factors.factors.skills * 100).toFixed(0)}%</span></div>
                        )}
                         <div className="mt-1 pt-1 border-t border-zinc-800 flex justify-between font-bold"><span>Total</span> <span className={getOddsColor(oddsPercent)}>{oddsPercent.toFixed(0)}%</span></div>
                    </div>
                </div>
            </div>
            {/* Risk with Tooltip */}
            <div className="bg-zinc-900/40 p-2 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors relative group/tooltip-risk cursor-help rounded-br">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Risk</span>
                <span className={`font-bold text-sm ${getRiskColor(mission.risk)}`}>{mission.risk}</span>

                {/* RISK TOOLTIP */}
                <div className="absolute bottom-full right-0 mb-2 w-40 bg-zinc-950 border border-zinc-700 p-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] opacity-0 group-hover/tooltip-risk:opacity-100 transition-opacity pointer-events-none z-[100] backdrop-blur-md">
                     <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 border-b border-zinc-800 pb-1 text-right">Failure Penalties</div>
                     <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between"><span>HP Loss</span> <span className="text-red-500">~{factors.estHpLoss}</span></div>
                        <div className="flex justify-between"><span>Heat Gain</span> <span className="text-orange-500">+{factors.estHeatGain}</span></div>
                        <div className="text-[9px] text-zinc-500 italic mt-1 text-right">Only applied on failure</div>
                     </div>
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

// --- MISSION GRID ---
interface MissionGridProps {
  children: React.ReactNode;
}

export const MissionGrid: React.FC<MissionGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {children}
    </div>
  );
};

// --- ACTIVE MISSION SCREEN ---
interface ActiveMissionProps {
  mission: Mission;
  runId: string;
  onResolve: (decisionId?: string) => void;
}

export const ActiveMission: React.FC<ActiveMissionProps> = ({ mission, runId, onResolve }) => {
  const [phase, setPhase] = useState<'LOADING' | 'DECISION' | 'EXECUTING'>('LOADING');
  const [narrative, setNarrative] = useState<string>('');
  const [choices, setChoices] = useState<MissionDecision[]>([]);

  useEffect(() => {
      const loadScenario = async () => {
          // Delay for suspense
          await new Promise(r => setTimeout(r, 1500));
          const res = await api.missions.getScenario(runId);
          if (res.success && res.data) {
              setNarrative(res.data.narrative);
              setChoices(res.data.choices);
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
      <div className="max-w-3xl w-full bg-zinc-900/90 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl relative backdrop-blur-md">
         
         {/* Background Image with Overlay */}
         <div className="absolute inset-0 z-0">
             {mission.imageUrl ? (
                 <img src={mission.imageUrl} className="w-full h-full object-cover opacity-20 grayscale" />
             ) : (
                 <div className="w-full h-full bg-black opacity-80" />
             )}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black" />
         </div>

         <div className="relative z-10 p-8">
            <div className="text-center mb-8">
                <div className="text-neon-blue text-xs uppercase tracking-[0.3em] font-bold mb-2">Tactical Decision Required</div>
                <h2 className="text-3xl text-white font-bold uppercase tracking-widest mb-4">{mission.title}</h2>
                <div className="bg-black/60 border border-zinc-800 p-6 rounded-lg text-left">
                    <p className="text-zinc-300 font-mono leading-relaxed text-sm md:text-base">
                        <span className="text-neon-blue mr-2">{'>'}</span>
                        {narrative}
                    </p>
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

// --- RESULT SCREEN ---
interface MissionResultProps {
  result: MissionOutcome;
  mission: Mission;
  onClose: () => void;
}

export const MissionResult: React.FC<MissionResultProps> = ({ result, mission, onClose }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in fade-in zoom-in duration-300">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl relative">
         <div className={`h-48 relative ${result.success ? 'border-b-4 border-neon-green' : 'border-b-4 border-red-500'}`}>
            {mission.imageUrl ? (
                <img src={mission.imageUrl} className={`w-full h-full object-cover ${!result.success && 'grayscale contrast-125'}`} />
            ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-zinc-800 font-bold uppercase tracking-widest">
                   PROCESSING IMAGE
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-4 left-0 w-full text-center">
                <h2 className={`text-3xl font-bold tracking-widest uppercase drop-shadow-lg ${result.success ? 'text-neon-green' : 'text-red-500'}`}>
                    {result.success ? 'MISSION SUCCESS' : 'MISSION FAILED'}
                </h2>
            </div>
         </div>

         <div className="p-6">
            <p className="text-sm text-zinc-300 italic text-center mb-6 leading-relaxed">
                "{result.narrative}"
            </p>

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
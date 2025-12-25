
import React, { useState, useEffect } from 'react';
import { Player, Skill, ProfessionId } from '../types';
import { api } from '../services/api';

interface SkillTreeUIProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onLog: (msg: string, type: 'SUCCESS' | 'FAILURE') => void;
}

export const SkillTreeUI: React.FC<SkillTreeUIProps> = ({ player, onUpdate, onLog }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeTab, setActiveTab] = useState<'PROFESSION' | 'COMBAT' | 'OPERATIONS'>('PROFESSION');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const loadSkills = async () => {
      const allSkills = await api.skills.getAll();
      setSkills(allSkills);
    };
    loadSkills();
  }, []);

  const handleUnlock = async (skillId: string) => {
    setProcessing(skillId);
    const res = await api.skills.unlock(skillId);
    if (res.success && res.data) {
      onUpdate(res.data);
      onLog(res.message || "Skill Unlocked", 'SUCCESS');
    } else {
      onLog(res.message || "Unlock Failed", 'FAILURE');
    }
    setProcessing(null);
  };

  // Filter skills for the current view
  const professionSkills = skills.filter(s => s.tree === 'PROFESSION' && s.requiredProfession === player.profession);
  const combatSkills = skills.filter(s => s.tree === 'COMBAT');
  const opsSkills = skills.filter(s => s.tree === 'OPERATIONS');

  const renderSkillNode = (skill: Skill) => {
    const isUnlocked = player.unlockedSkills.includes(skill.id);
    const canAfford = player.skillPoints >= skill.cost;
    const isLocked = !isUnlocked && !canAfford;
    const isActiveAbility = skill.effect.type === 'COMBAT_ABILITY';

    return (
      <div 
        key={skill.id}
        className={`relative p-5 border-2 rounded-lg flex flex-col justify-between h-48 transition-all duration-300 group
          ${isUnlocked 
            ? 'border-neon-green bg-zinc-900 shadow-[0_0_15px_rgba(0,255,65,0.1)]' 
            : canAfford 
              ? 'border-neon-blue bg-zinc-900/50 hover:bg-zinc-900 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] cursor-pointer' 
              : 'border-zinc-800 bg-black/50 opacity-60 grayscale'
          }
        `}
        onClick={() => !isUnlocked && canAfford && !processing ? handleUnlock(skill.id) : null}
      >
        {isActiveAbility && (
            <div className="absolute top-2 right-2 text-[10px] bg-red-900 text-red-100 px-2 py-0.5 rounded font-bold border border-red-500/50">
                ACTIVE ABILITY
            </div>
        )}

        <div>
          <div className="flex justify-between items-start mb-2 mt-2">
             <div className={`font-bold uppercase tracking-wider ${isUnlocked ? 'text-neon-green' : 'text-white'}`}>
                {skill.name}
             </div>
             {isUnlocked ? (
                 <span className="text-[10px] bg-neon-green text-black px-2 py-0.5 font-bold rounded">OWNED</span>
             ) : (
                 <span className={`text-xs font-bold ${canAfford ? 'text-neon-blue' : 'text-zinc-600'}`}>
                    {skill.cost} SP
                 </span>
             )}
          </div>
          <div className="text-xs text-zinc-400 leading-relaxed mb-4">{skill.description}</div>
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-800/50">
           <div className="text-[10px] uppercase text-zinc-500 mb-1">Effect</div>
           <div className={`text-sm font-mono ${isUnlocked ? 'text-neon-green' : 'text-zinc-300'}`}>
              {skill.effect.type === 'STAT_FLAT' && `+${skill.effect.value} ${skill.effect.target.toUpperCase()}`}
              {skill.effect.type === 'MISSION_BONUS' && (
                  skill.effect.target === 'success_chance' ? `+${(skill.effect.value * 100)}% Success Chance` :
                  skill.effect.target === 'money_reward' ? `+${(skill.effect.value * 100)}% Payouts` :
                  skill.effect.target === 'heat_reduction' ? `-${(skill.effect.value * 100)}% Heat Gain` : ''
              )}
              {skill.effect.type === 'COMBAT_ABILITY' && (
                  <span className="text-yellow-400 font-bold">Unlocks Combat Action (CD: {skill.effect.cooldown}T)</span>
              )}
           </div>
        </div>

        {/* Purchase Overlay */}
        {!isUnlocked && canAfford && (
            <div className="absolute inset-0 bg-neon-blue/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-neon-blue text-black font-bold uppercase tracking-widest px-4 py-2 rounded shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                   {processing === skill.id ? 'Unlocking...' : 'Unlock'}
                </span>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-1">Neural Upgrades</h2>
              <div className="text-xs text-zinc-500 uppercase">Available Skill Points</div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="text-5xl font-bold text-neon-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                  {player.skillPoints}
              </div>
              <div className="text-right text-xs text-zinc-500">
                  <div>NEXT PT: LVL {Math.ceil((player.level + 1) / 5) * 5}</div>
                  <div>CURRENT: LVL {player.level}</div>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
          <button 
             onClick={() => setActiveTab('PROFESSION')}
             className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'PROFESSION' ? 'text-white border-b-2 border-neon-purple bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
             {player.profession} (Unique)
          </button>
          <button 
             onClick={() => setActiveTab('COMBAT')}
             className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'COMBAT' ? 'text-white border-b-2 border-neon-red bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
             Combat
          </button>
          <button 
             onClick={() => setActiveTab('OPERATIONS')}
             className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'OPERATIONS' ? 'text-white border-b-2 border-neon-green bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
             Operations
          </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'PROFESSION' && professionSkills.map(renderSkillNode)}
          {activeTab === 'COMBAT' && combatSkills.map(renderSkillNode)}
          {activeTab === 'OPERATIONS' && opsSkills.map(renderSkillNode)}
          
          {activeTab === 'PROFESSION' && professionSkills.length === 0 && (
              <div className="col-span-3 text-center p-12 text-zinc-600 italic border border-dashed border-zinc-800 rounded">
                  No unique skills data available for this class yet.
              </div>
          )}
      </div>

    </div>
  );
};

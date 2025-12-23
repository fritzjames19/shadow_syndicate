
import React, { useState } from 'react';
import { Player, CrewMember } from '../types';
import { api } from '../services/api';

interface CrewUIProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onLog: (msg: string, type: 'SUCCESS' | 'FAILURE' | 'INFO') => void;
}

// Display data matches backend CREW_TEMPLATES
const RECRUITMENT_OPTIONS = [
  { 
    type: 'Thug', 
    name: 'Street Thug', 
    description: 'Cheap muscle. Good for numbers, bad for subtlety.',
    atk: 5, 
    def: 0, 
    cost: 500, 
    upkeep: 10,
    icon: '👊'
  },
  { 
    type: 'Soldier', 
    name: 'Soldier', 
    description: 'Trained combatant with military-grade discipline.',
    atk: 15, 
    def: 5, 
    cost: 2500, 
    upkeep: 25,
    icon: '🔫'
  },
  { 
    type: 'Enforcer', 
    name: 'Enforcer', 
    description: 'Elite shock trooper. High damage, high intimidation.',
    atk: 35, 
    def: 10, 
    cost: 10000, 
    upkeep: 50,
    icon: '🛡️'
  }
];

export const CrewUI: React.FC<CrewUIProps> = ({ player, onUpdate, onLog }) => {
  const activeTabState = useState<'ROSTER' | 'RECRUIT'>('ROSTER');
  const activeTab = activeTabState[0];
  const setActiveTab = activeTabState[1];
  const [processing, setProcessing] = useState<string | null>(null);

  const handleHire = async (type: string, name: string) => {
    setProcessing(`hire_${type}`);
    // @ts-ignore
    const res = await api.crew.hire(type);
    if (res.success && res.data) {
      onUpdate(res.data);
      onLog(`Recruited ${name} to the syndicate.`, 'SUCCESS');
    } else {
      onLog(res.message || "Hiring failed.", 'FAILURE');
    }
    setProcessing(null);
  };

  const handleToggle = async (crewId: string) => {
    setProcessing(`toggle_${crewId}`);
    const res = await api.crew.toggle(crewId);
    if (res.success && res.data) {
      onUpdate(res.data);
      // Find the member to see new status
      const member = res.data.crew.find(c => c.id === crewId);
      const status = member?.isActive ? "Active Duty" : "Reserve";
      onLog(`Crew member moved to ${status}.`, 'INFO');
    }
    setProcessing(null);
  };

  const totalUpkeep = player.crew.reduce((sum, c) => sum + c.upkeep, 0);
  const activeCrewCount = player.crew.filter(c => c.isActive).length;
  const totalCrewAtk = player.crew.filter(c => c.isActive).reduce((sum, c) => sum + c.atk, 0);
  const totalCrewDef = player.crew.filter(c => c.isActive).reduce((sum, c) => sum + c.def, 0);

  const renderRecruitment = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-3 mb-2 bg-zinc-900/50 p-4 rounded border border-zinc-800 flex items-start gap-3">
          <div className="text-2xl">🎲</div>
          <div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-1">Recruitment Protocol</div>
              <p className="text-sm text-zinc-500">
                  New hires come with random <span className="text-white font-bold">Traits</span>. 
                  Traits can modify stats (ATK/DEF), upkeep costs, or provide special operational bonuses like reduced Heat or extra Loot.
              </p>
          </div>
      </div>
      {RECRUITMENT_OPTIONS.map((opt) => {
        const canAfford = player.wallet >= opt.cost;
        return (
          <div key={opt.type} className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 flex flex-col relative overflow-hidden group hover:border-zinc-500 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">{opt.icon}</div>
             
             <div className="mb-4 relative z-10">
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">{opt.name}</h3>
                <div className="text-xs text-zinc-500 uppercase tracking-widest">{opt.type} Class</div>
             </div>
             
             <p className="text-zinc-400 text-sm mb-6 h-12 relative z-10">{opt.description}</p>
             
             <div className="space-y-2 mb-6 relative z-10 bg-black/20 p-3 rounded">
                <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 uppercase">Base Attack</span>
                    <span className="text-neon-red font-bold">+{opt.atk}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 uppercase">Base Defense</span>
                    <span className="text-neon-blue font-bold">+{opt.def}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-zinc-700 pt-2 mt-2">
                    <span className="text-zinc-500 uppercase">Daily Upkeep</span>
                    <span className="text-yellow-400 font-bold">${opt.upkeep}/day</span>
                </div>
             </div>

             <button
               onClick={() => handleHire(opt.type, opt.name)}
               disabled={!canAfford || !!processing}
               className={`mt-auto w-full py-3 font-bold uppercase tracking-widest text-sm relative z-10 transition-all ${
                 canAfford 
                   ? 'bg-white text-black hover:bg-neon-green hover:shadow-[0_0_15px_rgba(0,255,65,0.4)]' 
                   : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
               }`}
             >
                {processing === `hire_${opt.type}` ? 'Processing...' : `Hire $${opt.cost}`}
             </button>
          </div>
        );
      })}
    </div>
  );

  const renderRoster = () => (
    <div className="space-y-6">
       {/* SUMMARY STATS */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-900/50 p-4 border border-zinc-800 rounded-lg">
          <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Crew</div>
              <div className="text-xl text-white font-bold">{player.crew.length} <span className="text-xs text-zinc-600 font-normal">({activeCrewCount} Active)</span></div>
          </div>
          <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Daily Upkeep</div>
              <div className="text-xl text-yellow-500 font-bold">-${totalUpkeep}</div>
          </div>
          <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Squad ATK</div>
              <div className="text-xl text-neon-red font-bold">+{totalCrewAtk}</div>
          </div>
          <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Squad DEF</div>
              <div className="text-xl text-neon-blue font-bold">+{totalCrewDef}</div>
          </div>
       </div>

       {player.crew.length === 0 ? (
         <div className="text-center py-12 border border-dashed border-zinc-800 rounded text-zinc-600">
            <div className="text-4xl mb-4 opacity-30">👥</div>
            <p>Your syndicate has no soldiers.</p>
            <button onClick={() => setActiveTab('RECRUIT')} className="mt-4 text-neon-blue hover:text-white underline uppercase text-xs font-bold">Go to Recruitment</button>
         </div>
       ) : (
         <div className="grid grid-cols-1 gap-3">
            {player.crew.map((member) => (
              <div key={member.id} className={`flex items-center justify-between p-4 border rounded transition-all ${member.isActive ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-zinc-900 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center rounded bg-black border ${member.isActive ? 'border-zinc-600 text-white' : 'border-zinc-800 text-zinc-700'}`}>
                          {member.type === 'Thug' ? '👊' : member.type === 'Soldier' ? '🔫' : '🛡️'}
                      </div>
                      <div>
                          <div className={`font-bold text-sm uppercase ${member.isActive ? 'text-white' : 'text-zinc-500'}`}>{member.name} <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{member.type}</span></div>
                          <div className="text-xs text-zinc-500 flex flex-wrap gap-3 mt-1">
                              <span className="text-neon-red">ATK: {member.atk}</span>
                              <span className="text-neon-blue">DEF: {member.def}</span>
                              <span className="text-yellow-600/80">Cost: ${member.upkeep}/day</span>
                          </div>
                          
                          {/* Trait Badge */}
                          {member.trait && (
                            <div className="mt-2 group relative inline-block cursor-help">
                                <span className="text-[9px] font-bold uppercase bg-white/10 text-white px-2 py-0.5 rounded border border-white/20">
                                    {member.trait}
                                </span>
                                {/* Tooltip */}
                                <div className="absolute left-0 bottom-full mb-1 w-48 bg-zinc-950 border border-zinc-700 p-2 text-[10px] text-zinc-300 rounded shadow-xl hidden group-hover:block z-10">
                                    {member.traitDescription || "Special trait effects."}
                                </div>
                            </div>
                          )}
                      </div>
                  </div>
                  
                  <button 
                    onClick={() => handleToggle(member.id)}
                    disabled={!!processing}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors min-w-[100px] ${
                        member.isActive 
                        ? 'bg-green-900/20 text-green-500 border-green-900 hover:bg-green-900/40' 
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                      {processing === `toggle_${member.id}` ? '...' : member.isActive ? 'Active' : 'Reserve'}
                  </button>
              </div>
            ))}
         </div>
       )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-zinc-800 pb-4">
            <div>
                <h2 className="text-2xl text-white font-bold uppercase tracking-widest">Syndicate Crew</h2>
                <div className="text-xs text-zinc-500 mt-1">Manage your organization's manpower.</div>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
                <button 
                    onClick={() => setActiveTab('ROSTER')}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${activeTab === 'ROSTER' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
                >
                    Roster ({player.crew.length})
                </button>
                <button 
                    onClick={() => setActiveTab('RECRUIT')}
                    className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${activeTab === 'RECRUIT' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
                >
                    Recruitment
                </button>
            </div>
        </div>

        {activeTab === 'ROSTER' ? renderRoster() : renderRecruitment()}
    </div>
  );
};

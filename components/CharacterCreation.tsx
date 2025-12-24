
import React, { useState } from 'react';
import { FactionId, Faction, ProfessionId, Profession } from '../types';

interface Props {
  onComplete: (name: string, faction: FactionId, profession: ProfessionId) => void;
}

const FACTIONS: Faction[] = [
  {
    id: FactionId.IRON_WOLVES,
    name: "Iron Wolves",
    description: "Brutal pragmatists controlling the industrial sector.",
    bonusDescription: "+10% Mission Income"
  },
  {
    id: FactionId.JADE_SERPENTS,
    name: "Jade Serpents",
    description: "Secretive information brokers and smugglers.",
    bonusDescription: "+10% Loot Chance (LCK)"
  },
  {
    id: FactionId.CRIMSON_VEIL,
    name: "Crimson Veil",
    description: "Blood-sworn assassins with a code of honor.",
    bonusDescription: "Reduced Failure Penalties"
  },
  {
    id: FactionId.CHROME_SAINTS,
    name: "Chrome Saints",
    description: "Tech-worshipping transhumanist gangsters.",
    bonusDescription: "+10% Max Energy"
  }
];

const PROFESSIONS: Profession[] = [
  {
    id: ProfessionId.ENFORCER,
    name: "Enforcer",
    role: "The Muscle",
    description: "Enforcers excel at direct combat and intimidation tactics.",
    bonuses: ["+20% base ATK", "+15% max HP"],
    uniqueAbility: "Unique: Bone Breaker",
    color: "text-neon-red border-neon-red"
  },
  {
    id: ProfessionId.HACKER,
    name: "Hacker",
    role: "The Digital Ghost",
    description: "Hackers manipulate systems and gather intelligence.",
    bonuses: ["+30% base C-INT", "+20% max Energy"],
    uniqueAbility: "Unique: System Breach",
    color: "text-neon-blue border-neon-blue"
  },
  {
    id: ProfessionId.FIXER,
    name: "Fixer",
    role: "The Connector",
    description: "Fixers know everyone and can make anything happen.",
    bonuses: ["+25% base LCK", "+20% Trade profits"],
    uniqueAbility: "Unique: I Know A Guy",
    color: "text-yellow-400 border-yellow-400"
  },
  {
    id: ProfessionId.SMUGGLER,
    name: "Smuggler",
    role: "The Survivor",
    description: "Smugglers specialize in logistics and escape plans.",
    bonuses: ["+15% base DEF", "+30% max Stamina"],
    uniqueAbility: "Unique: Ghost Protocol",
    color: "text-orange-500 border-orange-500"
  }
];

const CharacterCreation: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Faction, 2: Profession
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<ProfessionId | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedFaction && selectedProfession) {
      onComplete(name, selectedFaction, selectedProfession);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 font-mono relative overflow-hidden">
      {/* Tech Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
      }}></div>
      
      <div className="w-full max-w-4xl bg-panel-bg border border-zinc-800 p-6 md:p-8 shadow-2xl relative z-10">
        <div className="flex justify-between items-start mb-8 border-b border-zinc-800 pb-4">
            <div>
                <h1 className="text-2xl md:text-4xl text-white font-bold tracking-tighter mb-1">SHADOW<span className="text-neon-red">SYNDICATE</span></h1>
                <h2 className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.3em]">Identity Protocol // v3.0</h2>
            </div>
            <div className="text-right">
                <div className="text-[10px] md:text-xs text-zinc-600 uppercase mb-1">PROGRESS</div>
                <div className="flex gap-1 justify-end">
                    <div className={`w-6 h-1.5 md:w-8 md:h-2 ${step >= 1 ? 'bg-neon-blue' : 'bg-zinc-800'}`}></div>
                    <div className={`w-6 h-1.5 md:w-8 md:h-2 ${step >= 2 ? 'bg-neon-blue' : 'bg-zinc-800'}`}></div>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 min-h-[400px]">
          
          {/* STEP 1: ALIAS & FACTION */}
          {step === 1 && (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="mb-6 md:mb-8">
                    <label className="block text-neon-blue mb-2 text-xs md:text-sm uppercase font-bold tracking-widest">Identify Yourself</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-800 p-3 md:p-4 text-white focus:border-neon-blue outline-none transition-colors text-base md:text-lg tracking-wider font-bold"
                    placeholder="ENTER ALIAS..."
                    maxLength={15}
                    autoFocus
                    />
                </div>

                <div>
                    <label className="block text-neon-blue mb-4 text-xs md:text-sm uppercase font-bold tracking-widest">Select Allegiance</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FACTIONS.map((f) => (
                        <div
                        key={f.id}
                        onClick={() => setSelectedFaction(f.id)}
                        className={`cursor-pointer border-2 p-4 transition-all hover:bg-zinc-900 group relative overflow-hidden ${
                            selectedFaction === f.id 
                            ? 'border-neon-green bg-zinc-900 shadow-[0_0_15px_rgba(0,255,65,0.2)]' 
                            : 'border-zinc-800 text-zinc-500'
                        }`}
                        >
                            <div className="relative z-10">
                                <div className={`font-bold text-lg mb-1 uppercase ${selectedFaction === f.id ? 'text-white' : 'group-hover:text-white'}`}>{f.name}</div>
                                <div className="text-xs mb-3 min-h-[2.5em]">{f.description}</div>
                                <div className="text-[10px] bg-black/50 inline-block px-2 py-1 border border-zinc-700 rounded text-neon-green font-bold uppercase tracking-wider">{f.bonusDescription}</div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
             </div>
          )}

          {/* STEP 2: PROFESSION */}
          {step === 2 && (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                 <h3 className="text-neon-blue mb-4 text-xs md:text-sm uppercase font-bold tracking-widest">Choose Your Path</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {PROFESSIONS.map((p) => {
                         const isSelected = selectedProfession === p.id;
                         const borderColor = isSelected ? p.color.split(' ')[1] : 'border-zinc-800';
                         const textColor = p.color.split(' ')[0];

                         return (
                            <div
                                key={p.id}
                                onClick={() => setSelectedProfession(p.id)}
                                className={`cursor-pointer border-2 p-4 md:p-5 transition-all hover:bg-zinc-900 relative group ${borderColor} ${isSelected ? 'bg-zinc-900 shadow-lg' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`font-bold text-lg md:text-xl uppercase tracking-tighter ${isSelected ? 'text-white' : textColor}`}>
                                        {p.name}
                                    </div>
                                    {isSelected && <div className="text-[10px] bg-white text-black px-2 py-0.5 font-bold">SELECTED</div>}
                                </div>
                                <div className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-3">{p.role}</div>
                                <p className="text-xs md:text-sm text-zinc-400 mb-4 h-10 leading-relaxed">{p.description}</p>
                                
                                <div className="space-y-1">
                                    {p.bonuses.map((b, i) => (
                                        <div key={i} className="text-xs flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-zinc-600'}`}></span>
                                            <span className={isSelected ? 'text-white' : 'text-zinc-500'}>{b}</span>
                                        </div>
                                    ))}
                                    <div className={`text-xs mt-2 font-bold ${textColor}`}>{p.uniqueAbility}</div>
                                </div>
                            </div>
                         );
                     })}
                 </div>
             </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-zinc-800">
            {step === 2 && (
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 p-3 md:p-4 border border-zinc-700 text-zinc-500 font-bold uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors text-sm"
                >
                    Back
                </button>
            )}
            
            {step === 1 ? (
                <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!name || !selectedFaction}
                    className={`flex-1 p-3 md:p-4 font-bold text-black uppercase tracking-widest transition-all text-sm ${
                        name && selectedFaction 
                        ? 'bg-white hover:bg-neon-blue' 
                        : 'bg-zinc-800 cursor-not-allowed text-zinc-600'
                    }`}
                >
                    Next Step
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={!selectedProfession}
                    className={`flex-[2] p-3 md:p-4 font-bold text-black uppercase tracking-widest transition-all shadow-lg text-sm ${
                        selectedProfession 
                        ? 'bg-neon-blue hover:bg-white hover:shadow-[0_0_20px_rgba(0,243,255,0.6)]' 
                        : 'bg-zinc-800 cursor-not-allowed text-zinc-600'
                    }`}
                >
                    Initialize Interface
                </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreation;

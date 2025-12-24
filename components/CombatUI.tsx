
import React, { useEffect, useRef, useState } from 'react';
import { Player, CombatState, CombatLog, Skill } from '../types';
import { api } from '../services/api';

interface CombatUIProps {
  player: Player;
  combatState: CombatState;
  onAction: (action: 'ATTACK' | 'HEAVY' | 'DEFEND' | 'FLEE' | 'USE_SKILL', skillId?: string) => void;
}

interface FloatingText {
    id: string;
    text: string;
    target: 'PLAYER' | 'ENEMY';
    color: string;
}

export const CombatUI: React.FC<CombatUIProps> = ({ player, combatState, onAction }) => {
  const logRef = useRef<HTMLDivElement>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const lastLogLen = useRef(combatState.logs.length);
  const [combatSkills, setCombatSkills] = useState<Skill[]>([]);

  // Load skills
  useEffect(() => {
      const load = async () => {
          const allSkills = await api.skills.getAll();
          const unlockedCombatSkills = allSkills.filter(s => 
              player.unlockedSkills.includes(s.id) && s.effect.type === 'COMBAT_ABILITY'
          );
          setCombatSkills(unlockedCombatSkills);
      };
      load();
  }, [player.unlockedSkills]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [combatState.logs]);

  // Handle new logs for effects
  useEffect(() => {
      if (combatState.logs.length > lastLogLen.current) {
          const newLogs = combatState.logs.slice(lastLogLen.current);
          
          newLogs.forEach(log => {
              if (log.damage) {
                  const id = Math.random().toString();
                  const isPlayerHit = log.type === 'ENEMY_HIT'; // Enemy hit player
                  const target = isPlayerHit ? 'PLAYER' : 'ENEMY';
                  const color = log.message.includes('CRITICAL') ? 'text-yellow-400 text-2xl font-black' : isPlayerHit ? 'text-red-500 font-bold' : 'text-white font-bold';
                  const text = log.message.includes('CRITICAL') ? `CRIT! -${log.damage}` : `-${log.damage}`;
                  
                  // Trigger Shake
                  if (isPlayerHit) {
                      setShakePlayer(true);
                      setTimeout(() => setShakePlayer(false), 500);
                  } else {
                      setShakeEnemy(true);
                      setTimeout(() => setShakeEnemy(false), 500);
                  }

                  // Add Floating Text
                  setFloatingTexts(prev => [...prev, { id, text, target, color }]);
                  setTimeout(() => {
                      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
                  }, 1000);
              }
              
              if (log.type === 'ABILITY') {
                  const id = Math.random().toString();
                  setFloatingTexts(prev => [...prev, { id, text: "SKILL USED", target: 'PLAYER', color: 'text-blue-400 font-bold' }]);
                  setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 1000);
              }
          });

          lastLogLen.current = combatState.logs.length;
      }
  }, [combatState.logs]);

  const enemy = combatState.enemy;
  const hpPercent = (player.stats.hp / player.stats.maxHp) * 100;
  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
  const staPercent = (player.stats.sta / player.stats.maxSta) * 100;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-4xl mx-auto w-full relative overflow-hidden pb-12 md:pb-0">
        <style>{`
            @keyframes shake {
                0% { transform: translate(1px, 1px) rotate(0deg); }
                10% { transform: translate(-1px, -2px) rotate(-1deg); }
                20% { transform: translate(-3px, 0px) rotate(1deg); }
                30% { transform: translate(3px, 2px) rotate(0deg); }
                40% { transform: translate(1px, -1px) rotate(1deg); }
                50% { transform: translate(-1px, 2px) rotate(-1deg); }
                60% { transform: translate(-3px, 1px) rotate(0deg); }
                70% { transform: translate(3px, 1px) rotate(-1deg); }
                80% { transform: translate(-1px, -1px) rotate(1deg); }
                90% { transform: translate(1px, 2px) rotate(0deg); }
                100% { transform: translate(1px, -2px) rotate(-1deg); }
            }
            .shake-anim { animation: shake 0.5s; }
            
            @keyframes floatUp {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
            }
            .float-anim { animation: floatUp 0.8s ease-out forwards; }

            @keyframes scanline {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            .scanline-effect::after {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(to bottom, transparent 50%, rgba(0, 243, 255, 0.05) 50%);
                background-size: 100% 4px;
                pointer-events: none;
            }
        `}</style>
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 md:mb-6 border-b-2 border-red-600/50 pb-2 relative">
            <h2 className="text-xl md:text-2xl font-bold text-red-600 uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                COMBAT PROTOCOL
            </h2>
            <div className="text-xs font-mono text-red-400 border border-red-900 px-2 py-1 rounded bg-red-950/20">TURN {combatState.turnCount}</div>
        </div>

        {/* BATTLEFIELD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-6 flex-1 relative min-h-0">
            
            {/* PLAYER CARD */}
            <div className={`relative transition-transform duration-100 ${shakePlayer ? 'shake-anim border-red-500' : 'border-neon-blue'} bg-zinc-900 border p-4 md:p-6 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden order-2 md:order-1`}>
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-white uppercase mb-1 tracking-tighter">{player.name}</h3>
                            <div className="text-[10px] text-neon-blue mb-4 uppercase tracking-[0.2em] font-bold">{player.profession}</div>
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">LVL {player.level}</div>
                    </div>
                    
                    {/* HP BAR */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-zinc-400">INTEGRITY</span>
                            <span className={hpPercent < 30 ? 'text-red-500 animate-pulse' : 'text-neon-green'}>{player.stats.hp}/{player.stats.maxHp}</span>
                        </div>
                        <div className={`h-4 bg-black border border-zinc-700 rounded overflow-hidden relative ${hpPercent < 30 ? 'shadow-[0_0_10px_rgba(255,0,0,0.5)]' : ''}`}>
                            <div className={`h-full transition-all duration-300 ${hpPercent < 30 ? 'bg-red-600' : 'bg-neon-green'}`} style={{ width: `${hpPercent}%` }}></div>
                            {/* Glitch lines if low hp */}
                            {hpPercent < 30 && <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>}
                        </div>
                    </div>

                    {/* STA BAR */}
                    <div className="mb-2">
                         <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-zinc-500">STAMINA</span>
                            <span className="text-yellow-400">{player.stats.sta}/{player.stats.maxSta}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded overflow-hidden">
                            <div className="h-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]" style={{ width: `${staPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-4 text-xs font-mono text-zinc-500 border-t border-zinc-800 pt-3 relative z-10">
                    <div className="bg-black/50 px-2 py-1 rounded border border-zinc-800">ATK <span className="text-white font-bold ml-1">{player.stats.atk}</span></div>
                    <div className="bg-black/50 px-2 py-1 rounded border border-zinc-800">DEF <span className="text-white font-bold ml-1">{player.stats.def}</span></div>
                </div>

                {/* FLOATING TEXT OVERLAY */}
                {floatingTexts.filter(t => t.target === 'PLAYER').map(ft => (
                    <div key={ft.id} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none float-anim ${ft.color} text-4xl font-black drop-shadow-md`}>
                        {ft.text}
                    </div>
                ))}
            </div>

            {/* ENEMY CARD */}
            <div className={`relative transition-transform duration-100 ${shakeEnemy ? 'shake-anim bg-red-950/20' : ''} bg-zinc-900 border border-red-600/50 p-4 md:p-6 rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.1)] flex flex-col justify-between overflow-hidden scanline-effect order-1 md:order-2`}>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                         <div className="text-xs text-red-900 uppercase tracking-widest font-bold border border-red-900/30 px-2 py-1 rounded bg-black/40">Hostile Signal</div>
                         <h3 className="text-lg md:text-xl font-bold text-red-500 uppercase mb-1 text-right tracking-tighter">{enemy.name}</h3>
                    </div>
                    <div className="text-[10px] text-red-800/80 mb-6 uppercase tracking-[0.3em] text-right font-bold">{enemy.type} UNIT</div>

                    {/* ENEMY HP */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-red-500">{enemy.hp}/{enemy.maxHp}</span>
                            <span className="text-red-500">THREAT LEVEL</span>
                        </div>
                        <div className="h-4 bg-black border border-red-900/50 rounded overflow-hidden relative">
                             <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.6)]" style={{ width: `${enemyHpPercent}%` }}></div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-4 text-xs font-mono text-red-900/50 relative z-10">
                     <div className="bg-red-950/30 px-2 py-1 rounded border border-red-900/20">PWR: {enemy.atk}</div>
                     <div className="bg-red-950/30 px-2 py-1 rounded border border-red-900/20">ARM: {enemy.def}</div>
                </div>

                {/* FLOATING TEXT OVERLAY */}
                {floatingTexts.filter(t => t.target === 'ENEMY').map(ft => (
                    <div key={ft.id} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none float-anim ${ft.color} text-4xl font-black drop-shadow-md`}>
                        {ft.text}
                    </div>
                ))}
            </div>
        </div>

        {/* COMBAT LOG */}
        <div className="bg-black/80 backdrop-blur-sm border border-zinc-800 p-4 rounded h-24 md:h-32 overflow-y-auto font-mono text-[10px] md:text-xs mb-4 md:mb-6 scrollbar-thin scrollbar-thumb-zinc-700 shadow-inner relative" ref={logRef}>
            <div className="absolute top-0 right-0 p-1">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            </div>
            {combatState.logs.map((log, i) => (
                <div key={i} className={`mb-1 border-l-2 pl-2 ${
                    log.type === 'PLAYER_HIT' ? 'border-neon-green text-neon-green bg-green-900/10' : 
                    log.type === 'ENEMY_HIT' ? 'border-red-500 text-red-500 bg-red-900/10 font-bold' : 
                    log.type === 'ABILITY' ? 'border-blue-500 text-blue-400 bg-blue-900/10' :
                    log.type === 'FAILURE' ? 'border-orange-500 text-orange-500' :
                    'border-zinc-700 text-zinc-500'
                }`}>
                    <span className="text-zinc-700 mr-2 opacity-50">[{log.turn.toString().padStart(2, '0')}]</span>
                    {log.message}
                </div>
            ))}
        </div>

        {/* SKILLS BAR */}
        {combatSkills.length > 0 && (
            <div className="flex gap-2 mb-4 bg-zinc-900/50 p-2 rounded border border-zinc-800/50 overflow-x-auto scrollbar-none">
                {combatSkills.map(skill => {
                    const cooldown = combatState.abilityCooldowns[skill.id] || 0;
                    const onCooldown = cooldown > 0;
                    return (
                        <button
                            key={skill.id}
                            onClick={() => !onCooldown && onAction('USE_SKILL', skill.id)}
                            disabled={onCooldown}
                            className={`flex-shrink-0 px-4 py-3 rounded border text-xs font-bold uppercase transition-all whitespace-nowrap ${
                                onCooldown 
                                ? 'bg-black border-zinc-800 text-zinc-600 cursor-not-allowed' 
                                : 'bg-blue-900/20 border-blue-500 text-blue-400 hover:bg-blue-900/40 hover:text-white hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            }`}
                        >
                            <div className="mb-1">{skill.name}</div>
                            <div className="text-[10px] font-normal">
                                {onCooldown ? `CD (${cooldown})` : 'READY'}
                            </div>
                        </button>
                    );
                })}
            </div>
        )}

        {/* BASIC CONTROLS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pb-4">
            <button 
                onClick={() => onAction('ATTACK')}
                className="group bg-zinc-900 hover:bg-white border border-zinc-700 hover:border-white text-white hover:text-black font-bold py-3 md:py-4 rounded uppercase tracking-widest transition-all shadow-lg hover:shadow-white/20 active:translate-y-1 text-sm"
            >
                <div className="text-base md:text-lg mb-1">⚔️</div>
                Attack
            </button>
            <button 
                onClick={() => onAction('HEAVY')}
                disabled={player.stats.sta < 10}
                className={`group border font-bold py-3 md:py-4 rounded uppercase tracking-widest transition-all flex flex-col items-center justify-center shadow-lg active:translate-y-1 text-sm ${
                    player.stats.sta >= 10 
                    ? 'bg-zinc-900 hover:bg-red-600 border-zinc-700 hover:border-red-500 text-white hover:shadow-red-600/30' 
                    : 'bg-black border-zinc-800 text-zinc-700 cursor-not-allowed grayscale'
                }`}
            >
                <div className="text-base md:text-lg mb-1 group-hover:scale-110 transition-transform">💥</div>
                <span>Heavy</span>
                <span className={`text-[9px] mt-1 font-normal ${player.stats.sta >= 10 ? 'text-zinc-500 group-hover:text-red-200' : 'text-zinc-800'}`}>-10 STA</span>
            </button>
            <button 
                onClick={() => onAction('DEFEND')}
                className="group bg-zinc-900 hover:bg-neon-blue border border-zinc-700 hover:border-neon-blue text-white hover:text-black font-bold py-3 md:py-4 rounded uppercase tracking-widest transition-all shadow-lg hover:shadow-neon-blue/20 active:translate-y-1 text-sm"
            >
                <div className="text-base md:text-lg mb-1">🛡️</div>
                Defend
            </button>
            <button 
                onClick={() => onAction('FLEE')}
                className="group bg-zinc-900 hover:bg-yellow-500 border border-zinc-700 hover:border-yellow-500 text-zinc-400 hover:text-black font-bold py-3 md:py-4 rounded uppercase tracking-widest transition-all shadow-lg hover:shadow-yellow-500/20 active:translate-y-1 text-sm"
            >
                <div className="text-base md:text-lg mb-1">🏃</div>
                Flee
            </button>
        </div>
    </div>
  );
};

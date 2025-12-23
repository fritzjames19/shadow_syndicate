
import { 
  Player, FactionId, Mission, MissionType, Item, ItemType, ItemRarity, 
  CrewMember, ApiResponse, MissionOutcome, District, MissionRun, HeatEvent,
  AdminMetrics, AdminAuditLog, DistrictMeta, DailyRewardResult, PlayerStats, ProfessionId, Skill,
  MissionScenario, MissionDecision, MarketState, MarketItem, Equipment, CombatState, Enemy, CombatLog
} from '../types';
import { generateMissionNarrative, generateNewsUpdate, generateMissionBriefing, generateMarketReport } from './geminiService';
import { getRateLimitStats } from './aiRateLimit';

// --- STATIC DATA ---
const SKILL_DATABASE: Skill[] = [
  // COMBAT TREE (Shared)
  { id: 'c_assault', name: 'Assault', tree: 'COMBAT', description: 'Raw damage training. +5 ATK.', cost: 1, effect: { type: 'STAT_FLAT', target: 'atk', value: 5 } },
  { id: 'c_fortification', name: 'Fortification', tree: 'COMBAT', description: 'Defense and damage mitigation. +5 DEF.', cost: 1, effect: { type: 'STAT_FLAT', target: 'def', value: 5 } },
  { id: 'c_tactics', name: 'Tactics', tree: 'COMBAT', description: 'Battle positioning. +5 Max Stamina.', cost: 1, effect: { type: 'STAT_FLAT', target: 'maxSta', value: 5 } },
  // OPERATIONS TREE (Shared)
  { id: 'o_infiltration', name: 'Infiltration', tree: 'OPERATIONS', description: 'Stealth mastery. +5% Mission Success Chance.', cost: 1, effect: { type: 'MISSION_BONUS', target: 'success_chance', value: 0.05 } },
  { id: 'o_acquisition', name: 'Acquisition', tree: 'OPERATIONS', description: 'Better looting. +5% Cash Rewards.', cost: 1, effect: { type: 'MISSION_BONUS', target: 'money_reward', value: 0.05 } },
  { id: 'o_influence', name: 'Influence', tree: 'OPERATIONS', description: 'NPC relations. -5% Heat Accumulation.', cost: 1, effect: { type: 'MISSION_BONUS', target: 'heat_reduction', value: 0.05 } },
  // PROFESSION UNIQUE
  { id: 'p_bone_breaker', name: 'Bone Breaker', tree: 'PROFESSION', requiredProfession: ProfessionId.ENFORCER, description: 'The Enforcer\'s signature. +15 ATK.', cost: 1, effect: { type: 'STAT_FLAT', target: 'atk', value: 15 } },
  { id: 'p_system_breach', name: 'System Breach', tree: 'PROFESSION', requiredProfession: ProfessionId.HACKER, description: 'The Hacker\'s signature. +15 Crypto-Intel.', cost: 1, effect: { type: 'STAT_FLAT', target: 'cInt', value: 15 } },
  { id: 'p_know_a_guy', name: 'I Know A Guy', tree: 'PROFESSION', requiredProfession: ProfessionId.FIXER, description: 'The Fixer\'s signature. +15 Luck.', cost: 1, effect: { type: 'STAT_FLAT', target: 'lck', value: 15 } },
  { id: 'p_ghost_protocol', name: 'Ghost Protocol', tree: 'PROFESSION', requiredProfession: ProfessionId.SMUGGLER, description: 'The Smuggler\'s signature. +15 DEF.', cost: 1, effect: { type: 'STAT_FLAT', target: 'def', value: 15 } }
];

const ITEM_DATABASE: Item[] = [
    { id: 'w_knuckles', name: 'Brass Knuckles', type: ItemType.WEAPON, rarity: ItemRarity.COMMON, bonus: 5, cost: 250, description: '+5 ATK. Basic melee.', imageUrl: undefined },
    { id: 'w_baton', name: 'Stun Baton', type: ItemType.WEAPON, rarity: ItemRarity.UNCOMMON, bonus: 8, cost: 450, description: '+8 ATK. Non-lethal option.', imageUrl: undefined },
    { id: 'w_pistol', name: 'Tanto 9mm', type: ItemType.WEAPON, rarity: ItemRarity.UNCOMMON, bonus: 12, cost: 600, description: '+12 ATK. Reliable sidearm.', imageUrl: undefined },
    { id: 'w_shotgun', name: 'Street Sweeper', type: ItemType.WEAPON, rarity: ItemRarity.RARE, bonus: 20, cost: 1500, description: '+20 ATK. Close quarters dominance.', imageUrl: undefined },
    { id: 'w_rifle', name: 'Arasaka AR', type: ItemType.WEAPON, rarity: ItemRarity.EPIC, bonus: 30, cost: 3200, description: '+30 ATK. Military grade precision.', imageUrl: undefined },
    { id: 'w_smg', name: "Tommy's Revenge", type: ItemType.WEAPON, rarity: ItemRarity.LEGENDARY, bonus: 45, cost: 5000, description: '+45 ATK. "Spray & Pray".', imageUrl: undefined },
    { id: 'a_vest', name: 'Kevlar Vest', type: ItemType.ARMOR, rarity: ItemRarity.COMMON, bonus: 8, cost: 400, description: '+8 DEF. Standard issue.', imageUrl: undefined },
    { id: 'a_jacket', name: 'Synth-Leather Jacket', type: ItemType.ARMOR, rarity: ItemRarity.UNCOMMON, bonus: 12, cost: 800, description: '+12 DEF. Stylish protection.', imageUrl: undefined },
    { id: 'a_dermal', name: 'Subdermal Plating', type: ItemType.ARMOR, rarity: ItemRarity.EPIC, bonus: 15, cost: 1200, description: '+15 DEF. Military grade.', imageUrl: undefined },
    { id: 'c_stim', name: 'Adrenaline Shot', type: ItemType.CONSUMABLE, rarity: ItemRarity.COMMON, bonus: 30, cost: 75, description: 'Heals 30 HP.', imageUrl: undefined },
    { id: 'c_nano', name: 'Nanite Injector', type: ItemType.CONSUMABLE, rarity: ItemRarity.RARE, bonus: 60, cost: 200, description: 'Heals 60 HP rapidly.', imageUrl: undefined },
    { id: 'g_deck', name: 'Script Kiddie Deck', type: ItemType.GADGET, rarity: ItemRarity.COMMON, bonus: 5, cost: 300, description: '+5 C-INT. Entry level cyberdeck.', imageUrl: undefined },
    { id: 'g_jammer', name: 'Signal Jammer', type: ItemType.GADGET, rarity: ItemRarity.UNCOMMON, bonus: 8, cost: 600, description: '+8 C-INT. Blocks local comms.', imageUrl: undefined },
];

const DISTRICTS_DATA: DistrictMeta[] = [
    { id: District.DOCKS, name: 'The Docks', description: 'Smuggling operations in a fog-drenched industrial port.', imageUrl: undefined },
    { id: District.NEON_ROW, name: 'Neon Row', description: 'Entertainment & vice. Blinding neon signs and crowded streets.', imageUrl: undefined },
    { id: District.FURNACE, name: 'The Furnace', description: 'Industrial sabotage sector. Molten metal and heavy machinery.', imageUrl: undefined },
    { id: District.GILDED_HEIGHTS, name: 'Gilded Heights', description: 'High society heists. Sleek corporate skyscrapers.', imageUrl: undefined },
    { id: District.SPRAWL, name: 'The Sprawl', description: 'Street gang warfare. Endless blocks of decaying mega-towers.', imageUrl: undefined },
    { id: District.CIRCUIT_BAY, name: 'Circuit Bay', description: 'Tech crimes hub. Server farms and drone traffic.', imageUrl: undefined },
    { id: District.OLD_TOWN, name: 'Old Town', description: 'Traditional mob ops. Speakeasies and classic crime.', imageUrl: undefined },
    { id: District.UNDERCITY, name: 'The Undercity', description: 'Black market deals. Subterranean ruins.', imageUrl: undefined },
    { id: District.CORPORATE_PLAZA, name: 'Corporate Plaza', description: 'White collar crime. Glass towers and boardrooms.', imageUrl: undefined },
    { id: District.SHADOWS, name: 'The Shadows', description: 'Espionage sector. Restricted zones.', imageUrl: undefined },
    { id: District.GOVERNMENT, name: 'Government District', description: 'Political corruption. Brutalist architecture.', imageUrl: undefined },
    { id: District.NEXUS, name: 'The Nexus', description: 'Endgame content. The central AI core.', imageUrl: undefined },
];

const MISSIONS_DATA: Mission[] = [
    { id: 'm_docks_1', title: 'Container Raid', description: 'Smuggle contraband off a cargo ship.', district: District.DOCKS, minLevel: 1, type: MissionType.SIDE_JOB, difficulty: 1, risk: 'Low', costEnr: 5, baseReward: 100, baseXp: 50, objectives: ["Locate Container 404", "Bypass electronic lock", "Extract goods undetected"], baseSuccessChance: 0.85 },
    { id: 'm_docks_2', title: 'Union Bribe', description: 'Ensure the dock workers look the other way.', district: District.DOCKS, minLevel: 3, type: MissionType.STORY, difficulty: 2, risk: 'Low', costEnr: 10, baseReward: 250, baseXp: 100, objectives: ["Identify Union Rep", "Deliver 'package'", "Secure silence"], baseSuccessChance: 0.80 },
    { id: 'm_neon_1', title: 'Club Protection', description: 'Collect dues from the "Velvet Lounge".', district: District.NEON_ROW, minLevel: 5, type: MissionType.SIDE_JOB, difficulty: 4, risk: 'Medium', costEnr: 8, baseReward: 400, baseXp: 150, objectives: ["Intimidate Manager", "Neutralize bouncer intervention", "Collect weekly dues"], baseSuccessChance: 0.65 },
    { id: 'm_neon_2', title: 'VIP Extraction', description: 'Get a high-profile target out of a rival club.', district: District.NEON_ROW, minLevel: 8, type: MissionType.CONTRACT, difficulty: 5, risk: 'High', costEnr: 25, baseReward: 800, baseXp: 300, objectives: ["Infiltrate VIP Lounge", "Secure Target", "Escape via back alley"], baseSuccessChance: 0.50 },
    { id: 'm_furn_1', title: 'Factory Sabotage', description: 'Disable the automated assembly line.', district: District.FURNACE, minLevel: 10, type: MissionType.STORY, difficulty: 6, risk: 'High', costEnr: 15, baseReward: 1200, baseXp: 500, objectives: ["Plant EMP charge", "Hack security mainframe", "Evacuate before detonation"], baseSuccessChance: 0.45 },
    { id: 'm_gilded_1', title: 'Penthouse Heist', description: 'Crack a CEO\'s safe during a gala.', district: District.GILDED_HEIGHTS, minLevel: 15, type: MissionType.SIDE_JOB, difficulty: 7, risk: 'High', costEnr: 12, baseReward: 2000, baseXp: 800, objectives: ["Bypass biometric scans", "Blend in with guests", "Crack the vault"], baseSuccessChance: 0.40 },
    { id: 'm_sprawl_1', title: 'Turf War', description: 'Defend a stash house from rival gangs.', district: District.SPRAWL, minLevel: 20, type: MissionType.CONTRACT, difficulty: 7, risk: 'High', costEnr: 35, baseReward: 3000, baseXp: 1200, objectives: ["Fortify position", "Repel wave of attackers", "Secure the product"], baseSuccessChance: 0.35 },
    { id: 'm_circuit_1', title: 'Data Center Hack', description: 'Steal proprietary algorithms.', district: District.CIRCUIT_BAY, minLevel: 25, type: MissionType.SIDE_JOB, difficulty: 8, risk: 'Medium', costEnr: 15, baseReward: 4500, baseXp: 1500, objectives: ["Infiltrate server farm", "Deploy ice-breaker virus", "Download petabytes"], baseSuccessChance: 0.30 },
    { id: 'm_old_1', title: 'Don\'s Favor', description: 'Recover a stolen heirloom.', district: District.OLD_TOWN, minLevel: 30, type: MissionType.STORY, difficulty: 8, risk: 'Medium', costEnr: 20, baseReward: 6000, baseXp: 2000, objectives: ["Investigate pawn shops", "Interrogate fences", "Retrieve the item"], baseSuccessChance: 0.40 },
    { id: 'm_under_1', title: 'Fungal Harvest', description: 'Collect rare bio-luminescent spores.', district: District.UNDERCITY, minLevel: 35, type: MissionType.SIDE_JOB, difficulty: 9, risk: 'High', costEnr: 15, baseReward: 8000, baseXp: 2500, objectives: ["Navigate toxic tunnels", "Avoid mutants", "Harvest spores"], baseSuccessChance: 0.25 },
    { id: 'm_corp_1', title: 'Executive Extraction', description: 'Kidnap a high-value target.', district: District.CORPORATE_PLAZA, minLevel: 40, type: MissionType.CONTRACT, difficulty: 9, risk: 'Extreme', costEnr: 45, baseReward: 12000, baseXp: 3500, objectives: ["Disable building security", "Sedate target", "Escape via air-car"], baseSuccessChance: 0.20 },
    { id: 'm_shadow_1', title: 'Black Site Infiltration', description: 'Break into a government black site.', district: District.SHADOWS, minLevel: 45, type: MissionType.STORY, difficulty: 10, risk: 'Extreme', costEnr: 25, baseReward: 18000, baseXp: 5000, objectives: ["Avoid thermal cameras", "Hack mainframe", "Wipe identity data"], baseSuccessChance: 0.15 },
    { id: 'm_gov_1', title: 'Election Rigging', description: 'Ensure the "right" candidate wins.', district: District.GOVERNMENT, minLevel: 50, type: MissionType.SIDE_JOB, difficulty: 10, risk: 'High', costEnr: 15, baseReward: 25000, baseXp: 7000, objectives: ["Hack voting machines", "Blackmail officials", "Plant evidence"], baseSuccessChance: 0.10 },
    { id: 'm_nexus_1', title: 'Core Override', description: 'Seize control of the city AI.', district: District.NEXUS, minLevel: 60, type: MissionType.STORY, difficulty: 10, risk: 'Extreme', costEnr: 30, baseReward: 50000, baseXp: 15000, objectives: ["Breach the firewall", "Upload consciousness", "Become the city"], baseSuccessChance: 0.05 },
];

const ENEMY_DATABASE: Omit<Enemy, 'id'>[] = [
    { name: 'Dockyard Enforcer', hp: 80, maxHp: 80, atk: 15, def: 5, type: 'HUMAN', district: District.DOCKS },
    { name: 'Neon Triad Assassin', hp: 100, maxHp: 100, atk: 25, def: 10, type: 'HUMAN', district: District.NEON_ROW },
    { name: 'Scavenger Bot', hp: 150, maxHp: 150, atk: 10, def: 20, type: 'MECH', district: District.FURNACE },
    { name: 'Corporate Sec-Guard', hp: 120, maxHp: 120, atk: 20, def: 15, type: 'HUMAN', district: District.GILDED_HEIGHTS },
    { name: 'Sprawl Ganger', hp: 90, maxHp: 90, atk: 18, def: 8, type: 'HUMAN', district: District.SPRAWL },
    { name: 'Security Drone', hp: 60, maxHp: 60, atk: 30, def: 5, type: 'MECH', district: District.CIRCUIT_BAY },
    { name: 'Mob Hitman', hp: 140, maxHp: 140, atk: 35, def: 12, type: 'HUMAN', district: District.OLD_TOWN },
    { name: 'Mutant Scav', hp: 180, maxHp: 180, atk: 40, def: 5, type: 'HUMAN', district: District.UNDERCITY },
    { name: 'Elite Corpguard', hp: 200, maxHp: 200, atk: 45, def: 25, type: 'CYBORG', district: District.CORPORATE_PLAZA },
    { name: 'Black Ops Agent', hp: 250, maxHp: 250, atk: 60, def: 20, type: 'HUMAN', district: District.SHADOWS },
    { name: 'Fed Cyborg', hp: 300, maxHp: 300, atk: 70, def: 40, type: 'CYBORG', district: District.GOVERNMENT },
    { name: 'AI Defense Avatar', hp: 500, maxHp: 500, atk: 100, def: 50, type: 'MECH', district: District.NEXUS },
    // Generic
    { name: 'Street Thug', hp: 50, maxHp: 50, atk: 10, def: 0, type: 'HUMAN' },
];

// NEW: Crew Traits
const CREW_TRAITS = [
    { name: 'Trigger Happy', desc: '+5 ATK, -2 DEF', atk: 5, def: -2, costMult: 1 },
    { name: 'Meat Shield', desc: '+10 DEF, -2 ATK', atk: -2, def: 10, costMult: 1 },
    { name: 'Ex-Corpo', desc: 'Reduces Heat Gain by 5%, +10% Upkeep Cost', atk: 0, def: 0, costMult: 1.1 },
    { name: 'Scavenger', desc: '+5% Mission Cash', atk: 0, def: 0, costMult: 1 },
    { name: 'Psycho', desc: '+8 ATK, Increases Heat Gain', atk: 8, def: 0, costMult: 1 },
    { name: 'Veteran', desc: '+3 ATK, +3 DEF', atk: 3, def: 3, costMult: 1.2 },
    { name: 'Reliable', desc: 'No Stat Changes. -10% Upkeep.', atk: 0, def: 0, costMult: 0.9 },
    { name: 'Rookie', desc: '-2 ATK, -2 DEF. Cheap labor (-20% Cost).', atk: -2, def: -2, costMult: 0.8 },
];

// --- MOCK DATABASE & PERSISTENCE ---

const STORAGE_KEY = 'SHADOW_SYNDICATE_DATA_V1';

const DB = {
  player: null as Player | null,
  missionRuns: [] as MissionRun[],
  heatEvents: [] as HeatEvent[],
  adminAudit: [] as AdminAuditLog[],
  districts: DISTRICTS_DATA,
  missions: MISSIONS_DATA,
  items: ITEM_DATABASE,
  market: {
      items: [],
      lastUpdate: 0,
      news: "Market stable."
  } as MarketState
};

// Persistence Helpers
const saveState = () => {
    try {
        const payload = {
            player: DB.player,
            missionRuns: DB.missionRuns,
            heatEvents: DB.heatEvents,
            market: DB.market,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error("Failed to save game state:", e);
    }
};

const loadState = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (data.player) DB.player = data.player;
            if (data.missionRuns) DB.missionRuns = data.missionRuns;
            if (data.heatEvents) DB.heatEvents = data.heatEvents;
            if (data.market) DB.market = data.market;
            console.log("Save data loaded.");
            return true;
        }
    } catch (e) {
        console.error("Failed to load save data:", e);
        return false;
    }
    return false;
};

// --- LOGIC HELPERS ---

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const calculateTotalStats = (player: Player) => {
  const activeCrew = player.crew.filter(c => c.isActive);
  const crewAtk = activeCrew.reduce((s, c) => s + c.atk, 0);
  const crewDef = activeCrew.reduce((s, c) => s + c.def, 0);
  const weaponAtk = player.equipment.weapon?.bonus || 0;
  const armorDef = player.equipment.armor?.bonus || 0;
  const gadgetInt = player.equipment.gadget?.bonus || 0;
  
  let skillAtk = 0;
  let skillDef = 0;
  let skillInt = 0;
  
  player.unlockedSkills.forEach(skillId => {
      const skill = SKILL_DATABASE.find(s => s.id === skillId);
      if (skill && skill.effect.type === 'STAT_FLAT') {
          if (skill.effect.target === 'atk') skillAtk += skill.effect.value;
          if (skill.effect.target === 'def') skillDef += skill.effect.value;
          if (skill.effect.target === 'cInt') skillInt += skill.effect.value;
      }
  });

  return {
    atk: player.stats.atk + crewAtk + weaponAtk + skillAtk,
    def: player.stats.def + crewDef + armorDef + skillDef,
    cInt: player.stats.cInt + gadgetInt + skillInt,
    crewPower: crewAtk + crewDef 
  };
};

export const getBaseHeatForRisk = (risk: string) => {
    switch(risk) {
        case 'Low': return 5;
        case 'Medium': return 10;
        case 'High': return 15;
        case 'Extreme': return 25;
        default: return 5;
    }
};

export const getMissionFactors = (player: Player, mission: Mission) => {
  const totals = calculateTotalStats(player);
  const atkFactor = clamp(totals.atk / 100, 0, 0.30);
  const defFactor = clamp(totals.def / 120, 0, 0.20);
  const crewFactor = clamp(totals.crewPower / 150, 0, 0.25);
  const luckFactor = clamp(player.stats.lck / 200, 0, 0.10);
  const heatPenalty = clamp(player.stats.heat / 200, 0, 0.30);

  let skillBonus = 0;
  player.unlockedSkills.forEach(skillId => {
      const skill = SKILL_DATABASE.find(s => s.id === skillId);
      if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'success_chance') {
          skillBonus += skill.effect.value;
      }
  });

  const baseChance = mission.baseSuccessChance;
  let estHpLoss = Math.max(1, Math.round((5 + mission.costEnr * 0.8) - (totals.def / 5)));
  let estHeatGain = 5 + getBaseHeatForRisk(mission.risk);
  if (player.stats.heat > 50) estHeatGain += 5;
  
  // Apply Crew Traits (Dynamic)
  player.crew.filter(c => c.isActive).forEach(c => {
      if (c.trait === 'Ex-Corpo') {
          estHeatGain = Math.floor(estHeatGain * 0.95); // 5% reduction per corpo
      }
      if (c.trait === 'Psycho') {
          estHeatGain += 2; // Increases heat
      }
  });
  
  player.unlockedSkills.forEach(skillId => {
    const skill = SKILL_DATABASE.find(s => s.id === skillId);
    if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'heat_reduction') {
        estHeatGain = Math.floor(estHeatGain * (1 - skill.effect.value));
    }
  });

  if (player.faction === FactionId.CRIMSON_VEIL) {
      estHeatGain = Math.floor(estHeatGain * 0.9);
      estHpLoss = Math.floor(estHpLoss * 0.9);
  }

  return {
    factors: {
        base: baseChance,
        atk: atkFactor,
        def: defFactor,
        crew: crewFactor,
        lck: luckFactor,
        heat: -heatPenalty,
        skills: skillBonus
    },
    estHpLoss,
    estHeatGain
  };
};

export const calculateMissionOdds = (player: Player, mission: Mission, modifiers: { successBonus?: number, heatPenalty?: number } = {}) => {
  const { factors } = getMissionFactors(player, mission);
  const decisionBonus = modifiers.successBonus || 0;
  const total = factors.base + factors.atk + factors.def + factors.crew + factors.lck + factors.skills + factors.heat + decisionBonus;
  return clamp(total, 0.05, 0.95);
};

// NEW HELPER: Define mastery rewards centrally
export const getMissionMasteryReward = (mission: Mission) => {
    if (mission.type === MissionType.STORY) return { type: 'MAX_HP', value: 20, label: 'Titan Heart (+20 Max HP)' };
    if (mission.risk === 'Extreme') return { type: 'ATK', value: 3, label: 'Apex Predator (+3 ATK)' };
    if (mission.risk === 'High') return { type: 'ATK', value: 2, label: 'Street King (+2 ATK)' };
    if (mission.type === MissionType.CONTRACT) return { type: 'DEF', value: 2, label: 'Iron Skin (+2 DEF)' };
    return { type: 'MAX_ENR', value: 2, label: 'Endurance (+2 Max ENR)' };
};

const checkLevelUp = (player: Player): { leveledUp: boolean, newPlayer: Player, spGained: number } => {
  let p = { ...player };
  const reqXp = Math.round(100 * Math.pow(p.level, 1.4));
  let spGained = 0;
  
  if (p.xp >= reqXp) {
    p.level += 1;
    p.xp -= reqXp;
    p.stats.atk += 2;
    p.stats.def += 2;
    p.stats.maxHp += 5;
    p.stats.maxEnr += 2;
    p.stats.maxSta += 1;
    if (p.level % 5 === 0) {
        p.skillPoints += 1;
        spGained = 1;
    }
    p.stats.hp = p.stats.maxHp;
    p.stats.enr = p.stats.maxEnr;
    p.stats.sta = p.stats.maxSta;
    return { leveledUp: true, newPlayer: p, spGained: 1 };
  }
  return { leveledUp: false, newPlayer: p, spGained: 0 };
};

const CREW_TEMPLATES: Record<string, Omit<CrewMember, 'id' | 'isActive' | 'trait' | 'traitDescription'>> = {
  'Thug': { name: 'Street Thug', type: 'Thug', atk: 5, def: 0, cost: 500, upkeep: 10 },
  'Soldier': { name: 'Soldier', type: 'Soldier', atk: 15, def: 5, cost: 2500, upkeep: 25 },
  'Enforcer': { name: 'Enforcer', type: 'Enforcer', atk: 35, def: 10, cost: 10000, upkeep: 50 }
};

// Generate Enemy Helper
const spawnEnemy = (mission: Mission, playerLevel: number): Enemy => {
    const templates = ENEMY_DATABASE.filter(e => e.district === mission.district);
    const template = templates.length > 0 ? templates[Math.floor(Math.random() * templates.length)] : ENEMY_DATABASE[ENEMY_DATABASE.length - 1]; // Fallback to Thug
    
    // Scale enemy
    const scaling = 1 + (playerLevel * 0.1);
    
    return {
        id: crypto.randomUUID(),
        name: template.name,
        hp: Math.round(template.hp * scaling),
        maxHp: Math.round(template.hp * scaling),
        atk: Math.round(template.atk * scaling),
        def: Math.round(template.def * scaling),
        type: template.type,
        district: template.district
    };
};

const initMarket = () => {
    if (DB.market.items.length === 0) {
        const marketItems: MarketItem[] = ITEM_DATABASE.map(item => ({
            ...item,
            currentPrice: item.cost,
            trend: 'STABLE',
            trendValue: 1.0
        }));
        DB.market.items = marketItems;
        DB.market.lastUpdate = Date.now();
    }
};

loadState();
initMarket();

// --- API ROUTES ---

export const api = {
  
  // ... PLAYER, MARKET, SKILLS, CREW ENDPOINTS (UNCHANGED) ...
  player: {
    create: async (name: string, faction: FactionId, profession: ProfessionId): Promise<ApiResponse<Player>> => {
      const baseStats: PlayerStats = { atk: 10, def: 5, hp: 100, maxHp: 100, enr: 100, maxEnr: 100, sta: 100, maxSta: 100, lck: 5, cInt: 10, heat: 0 };
      if (faction === FactionId.JADE_SERPENTS) baseStats.lck = 15;
      if (faction === FactionId.CHROME_SAINTS) { baseStats.maxEnr = 110; baseStats.enr = 110; }
      switch(profession) {
          case ProfessionId.ENFORCER: baseStats.atk = Math.round(baseStats.atk * 1.20); baseStats.maxHp = Math.round(baseStats.maxHp * 1.15); baseStats.hp = baseStats.maxHp; break;
          case ProfessionId.HACKER: baseStats.cInt = Math.round(baseStats.cInt * 1.30); baseStats.maxEnr = Math.round(baseStats.maxEnr * 1.20); baseStats.enr = baseStats.maxEnr; break;
          case ProfessionId.FIXER: baseStats.lck = Math.round(baseStats.lck * 1.25); break;
          case ProfessionId.SMUGGLER: baseStats.def = Math.round(baseStats.def * 1.15); baseStats.maxSta = Math.round(baseStats.maxSta * 1.30); baseStats.sta = baseStats.maxSta; break;
      }
      const now = Date.now();
      const newPlayer: Player = { id: crypto.randomUUID(), name, faction, profession, level: 1, xp: 0, stats: baseStats, wallet: 1000, crew: [], day: 1, inventory: [], equipment: { weapon: null, armor: null, gadget: null }, skillPoints: 0, unlockedSkills: [], lastEnergyUpdate: now, lastStaminaUpdate: now, lastHeatUpdate: now, missionCooldowns: {}, missionMastery: {}, currentNews: "Welcome to the shadows. Stay low.", loginStreak: 0, lastLoginDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], badges: [] };
      DB.player = newPlayer; DB.missionRuns = []; DB.heatEvents = []; DB.adminAudit = []; initMarket(); saveState();
      return { success: true, data: newPlayer, message: "Encrypted connection established." };
    },
    getDashboard: async (): Promise<ApiResponse<Player>> => { if (!DB.player) return { success: false, message: "Session expired." }; return { success: true, data: DB.player }; },
    claimDailyReward: async (): Promise<ApiResponse<Player> & { dailyResult: DailyRewardResult }> => { if (!DB.player) return { success: false, message: "Session invalid", dailyResult: { claimed: false, streak: 0, message: "Error" } }; let p = { ...DB.player }; const today = new Date().toISOString().split('T')[0]; if (p.lastLoginDate === today) return { success: true, data: p, dailyResult: { claimed: false, streak: p.loginStreak, message: "Daily reward already claimed today." } }; const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]; if (p.lastLoginDate === yesterday) p.loginStreak += 1; else p.loginStreak = 1; p.lastLoginDate = today; const cycleDay = ((p.loginStreak - 1) % 7) + 1; const result: DailyRewardResult = { claimed: true, streak: p.loginStreak, message: "", reward: {} }; switch(cycleDay) { case 1: p.wallet += 50; result.reward!.gang = 50; result.message = "Login Bonus: +50 $GANG"; break; case 2: p.wallet += 75; result.reward!.gang = 75; result.message = "Login Bonus: +75 $GANG"; break; case 3: p.wallet += 100; result.reward!.gang = 100; result.message = "Login Bonus: +100 $GANG"; break; case 4: p.stats.maxEnr += 1; p.stats.enr = p.stats.maxEnr; result.reward!.energy = 1; result.message = "Login Bonus: +1 MAX ENERGY & REFILL"; break; case 5: p.wallet += 150; result.reward!.gang = 150; result.message = "Login Bonus: +150 $GANG"; break; case 6: p.stats.maxEnr += 1; p.stats.enr = p.stats.maxEnr; result.reward!.energy = 1; result.message = "Login Bonus: +1 MAX ENERGY & REFILL"; break; case 7: p.wallet += 300; result.reward!.gang = 300; if (!p.badges.includes('LOYAL_OPERATIVE')) { p.badges.push('LOYAL_OPERATIVE'); result.reward!.badge = 'LOYAL_OPERATIVE'; result.message = "WEEKLY STREAK: +300 $GANG & 'Loyal Operative' Badge!"; } else { result.message = "WEEKLY STREAK: +300 $GANG"; } break; } DB.player = p; saveState(); return { success: true, data: p, message: result.message, dailyResult: result }; },
    rest: async (): Promise<ApiResponse<Player>> => { if (!DB.player) return { success: false }; let p = { ...DB.player }; const healAmount = 20; const heatReduction = 5; const stamCost = 10; if (p.stats.sta < stamCost) return { success: false, message: "Not enough Stamina to organize a safehouse rest." }; const oldHeat = p.stats.heat; p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + healAmount); p.stats.heat = Math.max(0, p.stats.heat - heatReduction); p.stats.sta -= stamCost; if (p.stats.heat !== oldHeat) DB.heatEvents.push({ id: crypto.randomUUID(), playerId: p.id, heatBefore: oldHeat, heatAfter: p.stats.heat, reason: 'REST', narrative: 'Player rested at safehouse.', timestamp: Date.now() }); DB.player = p; saveState(); return { success: true, data: p, message: `Rested at Safehouse. HP +${healAmount}, Heat -${heatReduction} (Cost: ${stamCost} STA).` }; },
    performMaintenance: async (): Promise<ApiResponse<Player>> => { if (!DB.player) return { success: false }; let p = { ...DB.player }; const dailyUpkeep = p.crew.reduce((sum, c) => sum + c.upkeep, 0) + 50; let paid = false; let penaltyMsg = ""; if (p.wallet >= dailyUpkeep) { p.wallet -= dailyUpkeep; paid = true; } else { p.wallet = 0; if (p.crew.length > 0) { const randomIndex = Math.floor(Math.random() * p.crew.length); const deserter = p.crew[randomIndex]; p.crew.splice(randomIndex, 1); penaltyMsg = ` Couldn't pay upkeep. ${deserter.name} left. ATK penalized.`; } else { penaltyMsg = " Reputation damaged due to missed payments."; } p.stats.atk = Math.max(1, p.stats.atk - 1); } p.day += 1; p.stats.heat = Math.max(0, p.stats.heat - 10); const news = await generateNewsUpdate(p); p.currentNews = news; DB.player = p; const status = paid ? "Daily upkeep paid." : "DEFAULTED ON UPKEEP."; saveState(); return { success: true, data: p, message: `Day ${p.day} Begin. ${status} (-$${dailyUpkeep})${penaltyMsg}` }; },
  },
  
  skills: { 
    getAll: async () => SKILL_DATABASE, 
    unlock: async (id: string): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        let p = DB.player; 
        const s = SKILL_DATABASE.find(x => x.id === id); 
        if (!s) return { success: false, message: "Skill not found" }; 
        if (p.skillPoints < s.cost) return { success: false, message: "Not enough Skill Points" }; 
        p.skillPoints -= s.cost; 
        p.unlockedSkills.push(id); 
        if (s.effect.type === 'STAT_FLAT') { 
            if (s.effect.target === 'maxHp') { p.stats.maxHp += s.effect.value; p.stats.hp += s.effect.value; } 
            else if (s.effect.target === 'maxEnr') { p.stats.maxEnr += s.effect.value; p.stats.enr += s.effect.value; } 
            else if (s.effect.target === 'maxSta') { p.stats.maxSta += s.effect.value; p.stats.sta += s.effect.value; } 
        } 
        saveState(); 
        return { success: true, data: p, message: "Skill unlocked successfully" }; 
    } 
  },
  
  market: { 
    get: async () => DB.market, 
    refresh: async () => { const fluc = []; const ni = DB.market.items.map(i => { const r = Math.random(); let c = 0; let t: any = 'STABLE'; if (r > 0.8) { c = (Math.random() * 0.4) + 0.1; if (Math.random() > 0.5) { i.currentPrice = Math.floor(i.cost * (1 + c)); i.trendValue = 1 + c; t = 'UP'; } else { i.currentPrice = Math.floor(i.cost * (1 - c)); i.trendValue = 1 - c; t = 'DOWN'; } fluc.push({ item: i.name, direction: t }); } else { c = (Math.random() * 0.05); const d = Math.random() > 0.5 ? 1 : -1; i.currentPrice = Math.floor(i.currentPrice * (1 + (c * d))); i.trendValue = i.currentPrice / i.cost; } i.trend = t; return i; }); let n = "Quiet."; if (fluc.length) n = await generateMarketReport(fluc.slice(0, 3)); DB.market.items = ni; DB.market.lastUpdate = Date.now(); DB.market.news = n; saveState(); return DB.market; }, 
    buy: async (id: string): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        const m = DB.market.items.find(i => i.id === id); 
        if (!m || DB.player.wallet < m.currentPrice) return { success: false, message: "Insufficient funds or item unavailable" }; 
        DB.player.wallet -= m.currentPrice; 
        DB.player.inventory.push({ ...m, id: crypto.randomUUID() }); 
        saveState(); 
        return { success: true, data: DB.player, message: "Item purchased" }; 
    }, 
    sell: async (id: string): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        const idx = DB.player.inventory.findIndex(i => i.id === id); 
        if (idx === -1) return { success: false, message: "Item not found" }; 
        const i = DB.player.inventory[idx]; 
        const mr = DB.market.items.find(m => m.name === i.name); 
        const p = mr ? mr.currentPrice : i.cost; 
        const sp = Math.floor(p * 0.6); 
        DB.player.inventory.splice(idx, 1); 
        DB.player.wallet += sp; 
        saveState(); 
        return { success: true, data: DB.player, message: "Item sold" }; 
    } 
  },
  
  items: { 
    buy: async (id: string) => api.market.buy(id), 
    equip: async (id: string): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        const idx = DB.player.inventory.findIndex(i => i.id === id); 
        if (idx === -1) return { success: false, message: "Item not found in inventory" }; 
        const item = DB.player.inventory[idx]; 
        const slot = item.type === ItemType.WEAPON ? 'weapon' : item.type === ItemType.ARMOR ? 'armor' : item.type === ItemType.GADGET ? 'gadget' : null; 
        if (!slot) return { success: false, message: "Item cannot be equipped" }; 
        DB.player.inventory.splice(idx, 1); 
        if (DB.player.equipment[slot]) DB.player.inventory.push(DB.player.equipment[slot]!); 
        DB.player.equipment[slot] = item; 
        saveState(); 
        return { success: true, data: DB.player, message: "Item equipped" }; 
    }, 
    unequip: async (slot: any): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        if (DB.player.equipment[slot]) { 
            DB.player.inventory.push(DB.player.equipment[slot]!); 
            DB.player.equipment[slot] = null; 
            saveState(); 
            return { success: true, data: DB.player, message: "Item unequipped" }; 
        } 
        return { success: false, message: "Nothing to unequip" }; 
    }, 
    use: async (id: string): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        const idx = DB.player.inventory.findIndex(i => i.id === id); 
        if (idx === -1) return { success: false, message: "Item not found" }; 
        const item = DB.player.inventory[idx]; 
        if (item.type !== ItemType.CONSUMABLE) return { success: false, message: "Not a consumable" }; 
        DB.player.stats.hp = Math.min(DB.player.stats.maxHp, DB.player.stats.hp + item.bonus); 
        DB.player.inventory.splice(idx, 1); 
        saveState(); 
        return { success: true, data: DB.player, message: "Item used" }; 
    } 
  },
  
  crew: { 
    hire: async (t: any): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        const temp = CREW_TEMPLATES[t]; 
        if (!temp) return { success: false, message: "Invalid type" };
        
        // Random Trait Generation
        const trait = CREW_TRAITS[Math.floor(Math.random() * CREW_TRAITS.length)];
        const modifiedCost = Math.floor(temp.cost * trait.costMult);
        
        // Re-check cost with modification
        if (DB.player.wallet < modifiedCost) return { success: false, message: `Insufficient funds (Trait Adjustment: ${modifiedCost})` };

        DB.player.wallet -= modifiedCost; 
        
        let finalUpkeep = temp.upkeep;
        if (trait.name === 'Reliable') finalUpkeep = Math.floor(finalUpkeep * 0.9);
        if (trait.name === 'Ex-Corpo') finalUpkeep = Math.floor(finalUpkeep * 1.1);

        DB.player.crew.push({ 
            ...temp, 
            id: crypto.randomUUID(), 
            isActive: true, 
            type: t,
            // Apply immediate flat stat modifiers
            atk: Math.max(0, temp.atk + trait.atk),
            def: Math.max(0, temp.def + trait.def),
            // Persist the trait name for mission logic and display
            trait: trait.name,
            traitDescription: trait.desc,
            upkeep: finalUpkeep
        }); 
        saveState(); 
        return { success: true, data: DB.player, message: `Hired ${t} with trait: ${trait.name}` }; 
    }, 
    toggle: async (id: string): Promise<ApiResponse<Player>> => { 
        if (!DB.player) return { success: false, message: "Session expired" }; 
        const m = DB.player.crew.find(c => c.id === id); 
        if (m) { 
            m.isActive = !m.isActive; 
            saveState(); 
            return { success: true, data: DB.player, message: "Status updated" }; 
        } 
        return { success: false, message: "Crew member not found" }; 
    } 
  },
  
  system: { tick: async () => { if (!DB.player) return { success: false }; if (DB.player.stats.enr < DB.player.stats.maxEnr) { DB.player.stats.enr += 1; saveState(); } return { success: true, data: DB.player }; }, getStaticData: async () => ({ success: true, data: { missions: DB.missions, items: DB.items, districts: DB.districts } }), getPendingMission: async (pid: string) => { const r = DB.missionRuns.find(x => x.playerId === pid && (x.narrative === 'PENDING' || (x.combatState && x.combatState.isActive))); return r ? r.id : null; } },
  admin: { 
      verifyKey: (k: string) => k === 'admin-secret', 
      getOverview: async () => {
          const stats = getRateLimitStats();
          return { 
            success: true, 
            data: { 
                totalPlayers: DB.player ? 1 : 0, 
                activePlayers24h: 1, 
                missionsRun24h: DB.missionRuns.filter(r => r.timestamp > Date.now() - 86400000).length, 
                geminiCalls24h: stats.globalUsage, 
                errorRate: 0 
            } 
          };
      }, 
      getPlayerDetails: async () => ({ success: true, data: DB.player }), 
      resetCooldowns: async (k: string) => {
          if (k !== 'admin-secret' || !DB.player) return { success: false };
          DB.player.missionCooldowns = {};
          saveState();
          return { success: true, data: DB.player };
      },
      adjustPlayer: async (k: string, p: any) => { if (k !== 'admin-secret' || !DB.player) return { success: false }; if (p.gangDelta) DB.player.wallet += p.gangDelta; if (p.xpDelta) { DB.player.xp += p.xpDelta; const c = checkLevelUp(DB.player); if (c.leveledUp) DB.player = c.newPlayer; } if (p.resetSave) { localStorage.removeItem(STORAGE_KEY); DB.player = null; window.location.reload(); return { success: true }; } saveState(); return { success: true, data: DB.player }; } 
  },
  
  // ... MISSIONS + COMBAT (UNCHANGED) ...
  missions: {
    start: async (missionId: string): Promise<ApiResponse<{ missionRunId: string }>> => {
       if (!DB.player) return { success: false, message: "Unauthorized" };
       const mission = DB.missions.find(m => m.id === missionId);
       if (!mission) return { success: false, message: "Mission not found" };

       let p = { ...DB.player };
       const hasPending = DB.missionRuns.some(r => r.playerId === p.id && (r.narrative === 'PENDING' || r.combatState?.isActive));
       if (hasPending) {
           return { success: false, message: "Operation in progress." };
       }

       if (p.level < mission.minLevel) return { success: false, message: "Level too low." };
       if (p.stats.enr < mission.costEnr) return { success: false, message: "No Energy." };
       
       const now = Date.now();
       if (p.missionCooldowns[mission.type] && p.missionCooldowns[mission.type] > now) return { success: false, message: "Cooldown active." };

       p.stats.enr -= mission.costEnr;
       const runId = crypto.randomUUID();
       DB.missionRuns.push({ id: runId, playerId: p.id, missionId: mission.id, success: false, xpGained: 0, gangGained: 0, hpChange: 0, heatChange: 0, narrative: "PENDING", timestamp: now });

       DB.player = p;
       saveState();
       return { success: true, data: { missionRunId: runId } };
    },

    getScenario: async (missionRunId: string): Promise<ApiResponse<MissionScenario>> => {
        if (!DB.player) return { success: false, message: "Unauthorized" };
        const run = DB.missionRuns.find(r => r.id === missionRunId);
        if (!run) return { success: false, message: "Run not found" };
        const mission = DB.missions.find(m => m.id === run.missionId);
        if (!mission) return { success: false };

        if (run.combatState && run.combatState.isActive) {
             return { success: true, data: { narrative: "COMBAT IN PROGRESS", choices: [], objectives: [] }, combatState: run.combatState };
        }

        const baseChoices: MissionDecision[] = [
            { id: 'aggressive', label: 'Direct Assault', description: 'Hit them hard and fast. Combat likely.', type: 'AGGRESSIVE', riskModifier: 1.2, rewardModifier: 1.1 },
            { id: 'balanced', label: 'Standard Protocol', description: 'Stick to the plan. Balanced risk.', type: 'BALANCED', riskModifier: 1.0, rewardModifier: 1.0 }
        ];

        const p = DB.player;
        if (p.profession === ProfessionId.HACKER || p.stats.cInt > 30) {
            baseChoices.push({ id: 'tech', label: 'Cyberwarfare', description: 'Disable systems. Low heat.', type: 'TECH', riskModifier: 0.8, rewardModifier: 1.2 });
        } else if (p.profession === ProfessionId.FIXER || p.wallet > 500) {
             baseChoices.push({ id: 'bribe', label: 'Grease Palms', description: 'Pay off insider. $200.', type: 'DIPLOMATIC', riskModifier: 0.5, rewardModifier: 0.8, cost: 200 });
        } else if (p.profession === ProfessionId.SMUGGLER || p.stats.def > 30) {
             baseChoices.push({ id: 'stealth', label: 'Ghost Entry', description: 'Avoid detection. High risk.', type: 'STEALTH', riskModifier: 1.3, rewardModifier: 1.5 });
        }

        let narrative = `Infiltration of ${mission.district} commenced.`;
        if (run.objectives) {
             narrative = "Mission objectives confirmed. Awaiting command.";
        } else {
            const briefing = await generateMissionBriefing(p, mission);
            if (briefing) {
                narrative = briefing.narrative;
                run.objectives = briefing.objectives;
                saveState();
            }
        }

        return { success: true, data: { narrative, choices: baseChoices, objectives: run.objectives || mission.objectives } };
    },

    resolve: async (missionRunId: string, decisionId?: string): Promise<ApiResponse<Player> & { missionResult?: MissionOutcome }> => {
      if (!DB.player) return { success: false, message: "Unauthorized" };
      const runIndex = DB.missionRuns.findIndex(r => r.id === missionRunId);
      if (runIndex === -1) return { success: false, message: "Invalid Run ID" };
      const run = DB.missionRuns[runIndex];
      
      if (run.combatState && run.combatState.isActive) {
          // Clone state to trigger reactivity
          return { success: true, data: DB.player, combatState: { ...run.combatState, enemy: {...run.combatState.enemy}, logs: [...run.combatState.logs] } };
      }

      const mission = DB.missions.find(m => m.id === run.missionId);
      if (!mission) return { success: false, message: "Mission Data Lost" };

      let p = { ...DB.player };
      const startHeat = p.stats.heat;

      let triggerCombat = false;
      if (decisionId === 'aggressive') triggerCombat = true;
      if (mission.risk === 'Extreme' || (mission.risk === 'High' && Math.random() > 0.5)) triggerCombat = true;

      let successBonus = 0;
      let heatModifier = 1.0;
      
      if (decisionId === 'stealth') { successBonus = -0.1; heatModifier = 0.5; } 
      else if (decisionId === 'bribe') {
          if (p.wallet >= 200) { p.wallet -= 200; successBonus = 0.2; heatModifier = 0.2; triggerCombat = false; } 
          else { return { success: false, message: "Insufficient funds for bribe." }; }
      } else if (decisionId === 'tech') {
          if (p.stats.cInt > 20) successBonus = 0.15; else successBonus = -0.05;
      }

      const successChance = calculateMissionOdds(p, mission, { successBonus, heatPenalty: 0 });
      const roll = Math.random();

      // If failed but close, trigger combat
      if (!triggerCombat && roll > successChance && roll < successChance + 0.15) {
          triggerCombat = true;
      }

      // INITIALIZE COMBAT
      if (triggerCombat) {
          const enemy = spawnEnemy(mission, p.level);
          run.combatState = {
              isActive: true,
              turnCount: 1,
              enemy,
              logs: [{ turn: 1, message: `Hostile contact! ${enemy.name} engages you.`, type: 'INFO' }],
              playerDefending: false
          };
          run.narrative = "COMBAT_STARTED";
          saveState();
          return { success: true, data: p, combatState: { ...run.combatState, enemy: { ...enemy }, logs: [...run.combatState.logs] } };
      }

      const isSuccess = roll <= successChance;

      let rewards = { money: 0, exp: 0 };
      let penalties = { hpLoss: 0, heatGain: 0 };

      // CHECK FOR MASTERY BONUS (Passive)
      const isMastered = (p.missionMastery[mission.id] || 0) >= 100;
      const masteryMultiplier = isMastered ? 1.25 : 1.0; // 25% Bonus for mastered missions

      if (isSuccess) {
        let diffMult = mission.difficulty <= 3 ? 0.8 : mission.difficulty >= 7 ? 1.3 : 1.0;
        const riskMult = mission.risk === 'Low' ? 0.9 : mission.risk === 'High' ? 1.4 : 1.0;
        const luckBonus = 1 + clamp(p.stats.lck / 300, 0, 0.15);

        rewards.money = Math.round(mission.baseReward * diffMult * riskMult * luckBonus * masteryMultiplier);
        rewards.exp = Math.round(mission.baseXp * diffMult * (1 + p.level / 200) * masteryMultiplier);

        if (p.faction === FactionId.IRON_WOLVES) rewards.money = Math.floor(rewards.money * 1.1);
        if (p.profession === ProfessionId.FIXER) rewards.money = Math.floor(rewards.money * 1.2);

        // CREW TRAIT: SCAVENGER
        p.crew.filter(c => c.isActive && c.trait === 'Scavenger').forEach(() => {
            rewards.money = Math.floor(rewards.money * 1.05); // +5% per scavenger
        });

        p.unlockedSkills.forEach(skillId => {
            const skill = SKILL_DATABASE.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'money_reward') {
                rewards.money = Math.floor(rewards.money * (1 + skill.effect.value));
            }
        });

        penalties.heatGain = Math.round(getBaseHeatForRisk(mission.risk) * heatModifier);
        
        // CREW TRAIT: EX-CORPO / PSYCHO
        p.crew.filter(c => c.isActive).forEach(c => {
           if (c.trait === 'Ex-Corpo') penalties.heatGain = Math.floor(penalties.heatGain * 0.95);
           if (c.trait === 'Psycho') penalties.heatGain += 1;
        });

        p.unlockedSkills.forEach(skillId => {
            const skill = SKILL_DATABASE.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'heat_reduction') {
                penalties.heatGain = Math.floor(penalties.heatGain * (1 - skill.effect.value));
            }
        });

        const ONE_DAY = 24 * 60 * 60 * 1000;
        const recentRuns = DB.missionRuns.filter(r => r.playerId === p.id && r.timestamp > (Date.now() - ONE_DAY));
        const dailyIncome = recentRuns.reduce((sum, r) => sum + r.gangGained, 0);
        const MAX_DAILY_GANG = 5000;

        if (dailyIncome >= MAX_DAILY_GANG) rewards.money = 0;
        else if (dailyIncome + rewards.money > MAX_DAILY_GANG) rewards.money = MAX_DAILY_GANG - dailyIncome;

      } else {
        rewards.exp = Math.floor(mission.baseXp * 0.1);
        const totals = calculateTotalStats(p);
        penalties.hpLoss = Math.max(1, Math.round((5 + mission.costEnr * 0.8) - (totals.def / 5)));
        penalties.heatGain = Math.round((5 + getBaseHeatForRisk(mission.risk)) * heatModifier);
        
        if (p.stats.heat > 50) penalties.heatGain += 5;
        if (p.faction === FactionId.CRIMSON_VEIL) {
            penalties.heatGain = Math.floor(penalties.heatGain * 0.9);
            penalties.hpLoss = Math.floor(penalties.hpLoss * 0.9);
        }

        // CREW TRAIT: EX-CORPO / PSYCHO (Apply to failure too)
        p.crew.filter(c => c.isActive).forEach(c => {
           if (c.trait === 'Ex-Corpo') penalties.heatGain = Math.floor(penalties.heatGain * 0.95);
           if (c.trait === 'Psycho') penalties.heatGain += 1;
        });
      }

      p.wallet += rewards.money;
      p.xp += rewards.exp;
      p.stats.hp = Math.max(0, p.stats.hp - penalties.hpLoss);
      p.stats.heat += penalties.heatGain;

      // MASTERY UPDATE LOGIC
      const currentMastery = p.missionMastery[mission.id] || 0;
      let masteryMsg = "";
      if (currentMastery < 100) {
          const gain = isSuccess ? 5 : 2; // Increased from 3/1 to 5/2 for faster feedback
          const newMastery = Math.min(100, currentMastery + gain);
          p.missionMastery[mission.id] = newMastery;
          
          if (currentMastery < 100 && newMastery === 100) {
              const reward = getMissionMasteryReward(mission);
              
              if (reward.type === 'MAX_HP') {
                  p.stats.maxHp += reward.value;
                  p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + reward.value);
              } else if (reward.type === 'ATK') {
                  p.stats.atk += reward.value;
              } else if (reward.type === 'DEF') {
                  p.stats.def += reward.value;
              } else if (reward.type === 'MAX_ENR') {
                  p.stats.maxEnr += reward.value;
                  p.stats.enr = Math.min(p.stats.maxEnr, p.stats.enr + reward.value);
              }
              
              const badgeId = `MASTER_${mission.id}`;
              if (!p.badges.includes(badgeId)) {
                  p.badges.push(badgeId);
              }

              masteryMsg = ` 🏆 MASTERY UNLOCKED: ${reward.label}`;
          }
      } else if (isSuccess) {
          masteryMsg = " (Mastery Bonus Active: +25% Reward)";
      }

      const COOLDOWNS_MS = { [MissionType.SIDE_JOB]: 5 * 60 * 1000, [MissionType.CONTRACT]: 30 * 60 * 1000, [MissionType.STORY]: 15 * 60 * 1000 };
      p.missionCooldowns[mission.type] = Date.now() + (COOLDOWNS_MS[mission.type] || 60000);

      const lvlCheck = checkLevelUp(p);
      let levelMsg = "";
      if (lvlCheck.leveledUp) {
        p = lvlCheck.newPlayer;
        levelMsg = ` LEVEL UP! You are now Level ${p.level}.`;
        if (lvlCheck.spGained > 0) levelMsg += ` (+${lvlCheck.spGained} Skill Point)`;
      }

      const usedObjectives = run.objectives || mission.objectives;

      const outcomeData: Omit<MissionOutcome, 'narrative'> = { 
          success: isSuccess, 
          rewards, 
          penalties, 
          missionId: mission.id,
          objectives: usedObjectives
      };
      // @ts-ignore
      if (isSuccess && rewards.money === 0) outcomeData.capReached = true; 

      const narrative = await generateMissionNarrative(p, mission, outcomeData);

      run.success = isSuccess;
      run.xpGained = rewards.exp;
      run.gangGained = rewards.money;
      run.hpChange = -penalties.hpLoss;
      run.heatChange = penalties.heatGain;
      run.narrative = narrative;

      if (p.stats.heat !== startHeat) {
          DB.heatEvents.push({
              id: crypto.randomUUID(),
              playerId: p.id,
              heatBefore: startHeat,
              heatAfter: p.stats.heat,
              reason: `MISSION_${mission.id}_${isSuccess ? 'SUCCESS' : 'FAIL'}`,
              narrative: isSuccess ? 'Operational heat' : 'Failed operation heat spike',
              timestamp: Date.now()
          });
      }

      DB.player = p;
      saveState();
      return { success: isSuccess, data: p, message: `${isSuccess ? "Contract Fulfilled." : "Operation Failed."}${levelMsg}${masteryMsg}`, narrative, missionResult: { ...outcomeData, narrative } };
    },
  },

  combat: {
      action: async (runId: string, actionType: 'ATTACK' | 'HEAVY' | 'DEFEND' | 'FLEE'): Promise<ApiResponse<Player>> => {
          if (!DB.player) return { success: false };
          const run = DB.missionRuns.find(r => r.id === runId);
          if (!run || !run.combatState || !run.combatState.isActive) return { success: false, message: "No active combat." };
          
          let p = { ...DB.player };
          const cs = run.combatState;
          const enemy = cs.enemy;
          const stats = calculateTotalStats(p);
          
          let playerDmg = 0;
          let playerMsg = "";
          let playerHit = false;

          // PLAYER TURN
          if (actionType === 'DEFEND') {
              cs.playerDefending = true;
              playerMsg = "You take a defensive stance.";
              cs.logs.push({ turn: cs.turnCount, message: playerMsg, type: 'INFO' });
          } else if (actionType === 'FLEE') {
              const escapeChance = 0.4 + (p.stats.lck * 0.01) + (p.profession === ProfessionId.SMUGGLER ? 0.2 : 0);
              if (Math.random() <= escapeChance) {
                  // ESCAPE SUCCESS
                  cs.isActive = false;
                  run.narrative = "Escaped from combat.";
                  run.success = false;
                  run.hpChange = p.stats.hp - DB.player.stats.hp; // Delta
                  DB.player = p;
                  saveState();
                  return { 
                      success: true, 
                      data: p, 
                      missionResult: { 
                          success: false, 
                          narrative: `You managed to lose the ${enemy.name} in the shadows, but the mission is blown.`, 
                          rewards: { money: 0, exp: 0 }, 
                          penalties: { hpLoss: 0, heatGain: 0 },
                          missionId: run.missionId
                      } 
                  };
              } else {
                  playerMsg = "Escape failed! You are cornered.";
                  cs.logs.push({ turn: cs.turnCount, message: playerMsg, type: 'FAILURE' });
              }
          } else {
              // ATTACK
              let mult = 1.0;
              if (actionType === 'HEAVY') {
                  if (p.stats.sta >= 10) {
                      p.stats.sta -= 10;
                      mult = 1.5;
                      playerMsg = "Heavy Strike!";
                  } else {
                      playerMsg = "Not enough Stamina! Weak swing.";
                      mult = 0.5;
                  }
              } else {
                  playerMsg = "You attack.";
              }
              
              const baseDmg = stats.atk * mult;
              const variance = (Math.random() * 0.4) + 0.8; // 0.8 to 1.2
              playerDmg = Math.max(1, Math.round((baseDmg * variance) - (enemy.def * 0.5)));
              
              // Crit check
              if (Math.random() < 0.05 + (stats.cInt * 0.005)) {
                  playerDmg = Math.round(playerDmg * 2);
                  playerMsg += " CRITICAL HIT!";
              }

              enemy.hp -= playerDmg;
              cs.logs.push({ turn: cs.turnCount, message: `${playerMsg} Dealt ${playerDmg} DMG.`, type: 'PLAYER_HIT', damage: playerDmg });
          }

          // CHECK ENEMY DEATH
          if (enemy.hp <= 0) {
              cs.isActive = false;
              // Victory Rewards
              const mission = DB.missions.find(m => m.id === run.missionId)!;
              const isMastered = (p.missionMastery[mission.id] || 0) >= 100;
              const masteryMultiplier = isMastered ? 1.25 : 1.0;

              const money = Math.round(mission.baseReward * 1.2 * masteryMultiplier); // Combat bonus
              const exp = Math.round(mission.baseXp * 1.5 * masteryMultiplier);
              
              p.wallet += money;
              p.xp += exp;
              
              const lvl = checkLevelUp(p);
              if (lvl.leveledUp) p = lvl.newPlayer;
              
              DB.player = p;
              run.success = true;
              run.narrative = `Defeated ${enemy.name}.`;
              saveState();
              
              return { 
                  success: true, 
                  data: p, 
                  missionResult: { 
                      success: true, 
                      narrative: `Target neutralized. The ${enemy.name} lies defeated. You secure the objective and vanish.`, 
                      rewards: { money, exp }, 
                      penalties: { hpLoss: 0, heatGain: 10 },
                      missionId: run.missionId
                  } 
              };
          }

          // ENEMY TURN
          if (actionType !== 'FLEE' || (actionType === 'FLEE')) { // Enemy attacks if you defend, attack, or fail flee
             let enemyDmg = Math.max(1, Math.round((enemy.atk * ((Math.random() * 0.4) + 0.8)) - (stats.def * 0.5)));
             if (cs.playerDefending) {
                 enemyDmg = Math.max(1, Math.round(enemyDmg * 0.5));
                 cs.playerDefending = false; // Reset stance
             }
             
             p.stats.hp -= enemyDmg;
             cs.logs.push({ turn: cs.turnCount, message: `${enemy.name} attacks! You took ${enemyDmg} DMG.`, type: 'ENEMY_HIT', damage: enemyDmg });
          }

          // CHECK PLAYER DEATH
          if (p.stats.hp <= 0) {
              cs.isActive = false;
              p.stats.hp = 0;
              // Penalty
              const moneyLoss = Math.floor(p.wallet * 0.2);
              p.wallet -= moneyLoss;
              p.stats.heat += 20;

              DB.player = p;
              run.success = false;
              run.narrative = "KIA (Almost)";
              saveState();

              return { 
                  success: true, 
                  data: p, 
                  missionResult: { 
                      success: false, 
                      narrative: `CRITICAL FAILURE. You were taken down by the ${enemy.name}. Med-evac cost you $${moneyLoss}.`, 
                      rewards: { money: 0, exp: 0 }, 
                      penalties: { hpLoss: 100, heatGain: 20 },
                      missionId: run.missionId
                  } 
              };
          }

          cs.turnCount++;
          DB.player = p;
          saveState();
          
          // CRITICAL FIX: Return a new object reference for React to pick up changes
          return { 
              success: true, 
              data: p, 
              combatState: { 
                  ...cs, 
                  enemy: { ...cs.enemy }, // Clone enemy so HP updates trigger re-render
                  logs: [...cs.logs]      // Clone logs array so UI updates
              } 
          };
      }
  }
};

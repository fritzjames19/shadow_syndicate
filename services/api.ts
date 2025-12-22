import { 
  Player, FactionId, Mission, MissionType, Item, ItemType, ItemRarity, 
  CrewMember, ApiResponse, MissionOutcome, District, MissionRun, HeatEvent,
  AdminMetrics, AdminAuditLog, DistrictMeta, DailyRewardResult, PlayerStats, ProfessionId, Skill,
  MissionScenario, MissionDecision
} from '../types';
import { generateMissionNarrative, generateNewsUpdate, generateGameImage } from './geminiService';

// --- STATIC DATA ---

const SKILL_DATABASE: Skill[] = [
  // COMBAT TREE (Shared)
  {
    id: 'c_assault',
    name: 'Assault',
    tree: 'COMBAT',
    description: 'Raw damage training. +5 ATK.',
    cost: 1,
    effect: { type: 'STAT_FLAT', target: 'atk', value: 5 }
  },
  {
    id: 'c_fortification',
    name: 'Fortification',
    tree: 'COMBAT',
    description: 'Defense and damage mitigation. +5 DEF.',
    cost: 1,
    effect: { type: 'STAT_FLAT', target: 'def', value: 5 }
  },
  {
    id: 'c_tactics',
    name: 'Tactics',
    tree: 'COMBAT',
    description: 'Battle positioning. +5 Max Stamina.',
    cost: 1,
    effect: { type: 'STAT_FLAT', target: 'maxSta', value: 5 }
  },
  
  // OPERATIONS TREE (Shared)
  {
    id: 'o_infiltration',
    name: 'Infiltration',
    tree: 'OPERATIONS',
    description: 'Stealth mastery. +5% Mission Success Chance.',
    cost: 1,
    effect: { type: 'MISSION_BONUS', target: 'success_chance', value: 0.05 }
  },
  {
    id: 'o_acquisition',
    name: 'Acquisition',
    tree: 'OPERATIONS',
    description: 'Better looting. +5% Cash Rewards.',
    cost: 1,
    effect: { type: 'MISSION_BONUS', target: 'money_reward', value: 0.05 }
  },
  {
    id: 'o_influence',
    name: 'Influence',
    tree: 'OPERATIONS',
    description: 'NPC relations. -5% Heat Accumulation.',
    cost: 1,
    effect: { type: 'MISSION_BONUS', target: 'heat_reduction', value: 0.05 }
  },

  // PROFESSION UNIQUE
  {
    id: 'p_bone_breaker',
    name: 'Bone Breaker',
    tree: 'PROFESSION',
    requiredProfession: ProfessionId.ENFORCER,
    description: 'The Enforcer\'s signature. +15 ATK.',
    cost: 1,
    effect: { type: 'STAT_FLAT', target: 'atk', value: 15 }
  },
  {
    id: 'p_system_breach',
    name: 'System Breach',
    tree: 'PROFESSION',
    requiredProfession: ProfessionId.HACKER,
    description: 'The Hacker\'s signature. +15 Crypto-Intel.',
    cost: 1,
    effect: { type: 'STAT_FLAT', target: 'cInt', value: 15 }
  },
  {
    id: 'p_know_a_guy',
    name: 'I Know A Guy',
    tree: 'PROFESSION',
    requiredProfession: ProfessionId.FIXER,
    description: 'The Fixer\'s signature. +15 Luck.',
    cost: 1,
    effect: { type: 'STAT_FLAT', target: 'lck', value: 15 }
  },
  {
    id: 'p_ghost_protocol',
    name: 'Ghost Protocol',
    tree: 'PROFESSION',
    requiredProfession: ProfessionId.SMUGGLER,
    description: 'The Smuggler\'s signature. +15 DEF.',
    cost: 1,
    effect: { type: 'STAT_FLAT', target: 'def', value: 15 }
  }
];

// --- MOCK DATABASE (Simulating Schema from Section 17) ---
const DB = {
  player: null as Player | null,
  
  // Audit Tables (Section 17)
  missionRuns: [] as MissionRun[],
  heatEvents: [] as HeatEvent[],
  adminAudit: [] as AdminAuditLog[],
  
  districts: [
    { 
      id: District.DOCKS, 
      name: 'The Docks', 
      description: 'Smuggling operations in a fog-drenched industrial port. Rusting shipping containers stacked high.', 
      imageUrl: undefined 
    },
    { 
      id: District.NEON_ROW, 
      name: 'Neon Row', 
      description: 'Entertainment & vice. Blinding neon signs, holographic ads, and crowded streets.', 
      imageUrl: undefined 
    },
    { 
      id: District.FURNACE, 
      name: 'The Furnace', 
      description: 'Industrial sabotage sector. Molten metal, oppressive heat, and heavy machinery.', 
      imageUrl: undefined 
    },
    { 
      id: District.GILDED_HEIGHTS, 
      name: 'Gilded Heights', 
      description: 'High society heists. Sleek corporate skyscrapers, pristine walkways, and sterile wealth.', 
      imageUrl: undefined 
    },
    { 
      id: District.SPRAWL, 
      name: 'The Sprawl', 
      description: 'Street gang warfare. Endless blocks of decaying residential mega-towers.', 
      imageUrl: undefined 
    },
    { 
      id: District.CIRCUIT_BAY, 
      name: 'Circuit Bay', 
      description: 'Tech crimes hub. Server farms, drone traffic, and high-tech manufacturing.', 
      imageUrl: undefined 
    },
    { 
      id: District.OLD_TOWN, 
      name: 'Old Town', 
      description: 'Traditional mob ops. Brick buildings, speakeasies, and classic organized crime.', 
      imageUrl: undefined 
    },
    { 
      id: District.UNDERCITY, 
      name: 'The Undercity', 
      description: 'Black market deals. Subterranean ruins, bioluminescent fungi, and forgotten people.', 
      imageUrl: undefined 
    },
    { 
      id: District.CORPORATE_PLAZA, 
      name: 'Corporate Plaza', 
      description: 'White collar crime. Glass towers, boardrooms, and high-stakes corporate espionage.', 
      imageUrl: undefined 
    },
    { 
      id: District.SHADOWS, 
      name: 'The Shadows', 
      description: 'Espionage sector. Restricted zones, surveillance blind spots, and secret facilities.', 
      imageUrl: undefined 
    },
    { 
      id: District.GOVERNMENT, 
      name: 'Government District', 
      description: 'Political corruption. Brutalist architecture, heavy security, and backroom deals.', 
      imageUrl: undefined 
    },
    { 
      id: District.NEXUS, 
      name: 'The Nexus', 
      description: 'Endgame content. The central AI core and ultimate seat of power in Neo-Chicago.', 
      imageUrl: undefined 
    },
  ] as DistrictMeta[],

  // GDD Page 14: District Progression
  // UPDATED COSTS TO MATCH MISSION STRUCTURE DOCS:
  // Side Jobs: 5-15 Energy
  // Story: 10-30 Energy
  // Contract: 25-50 Energy
  missions: [
    // THE DOCKS (Lv 1-10)
    { 
      id: 'm_docks_1', 
      title: 'Container Raid', 
      description: 'Smuggle contraband off a cargo ship.', 
      district: District.DOCKS, 
      minLevel: 1, 
      type: MissionType.SIDE_JOB, 
      difficulty: 1, 
      risk: 'Low', 
      costEnr: 5, 
      baseReward: 100, 
      baseXp: 50,
      objectives: ["Locate Container 404", "Bypass electronic lock", "Extract goods undetected"],
      baseSuccessChance: 0.85,
      imageUrl: undefined
    },
    { 
      id: 'm_docks_2', 
      title: 'Union Bribe', 
      description: 'Ensure the dock workers look the other way.', 
      district: District.DOCKS, 
      minLevel: 3, 
      type: MissionType.STORY, 
      difficulty: 2, 
      risk: 'Low', 
      costEnr: 10, 
      baseReward: 250, 
      baseXp: 100,
      objectives: ["Identify Union Rep", "Deliver 'package'", "Secure silence"],
      baseSuccessChance: 0.80
    },
    
    // NEON ROW (Lv 5-15)
    { 
      id: 'm_neon_1', 
      title: 'Club Protection', 
      description: 'Collect dues from the "Velvet Lounge".', 
      district: District.NEON_ROW, 
      minLevel: 5, 
      type: MissionType.SIDE_JOB, 
      difficulty: 4, 
      risk: 'Medium', 
      costEnr: 8, 
      baseReward: 400, 
      baseXp: 150,
      objectives: ["Intimidate Manager", "Neutralize bouncer intervention", "Collect weekly dues"],
      baseSuccessChance: 0.65
    },
    { 
      id: 'm_neon_2', 
      title: 'VIP Extraction', 
      description: 'Get a high-profile target out of a rival club.', 
      district: District.NEON_ROW, 
      minLevel: 8, 
      type: MissionType.CONTRACT, 
      difficulty: 5, 
      risk: 'High', 
      costEnr: 25, 
      baseReward: 800, 
      baseXp: 300,
      objectives: ["Infiltrate VIP Lounge", "Secure Target", "Escape via back alley"],
      baseSuccessChance: 0.50
    },

    // THE FURNACE (Lv 10-20)
    { 
      id: 'm_furn_1', 
      title: 'Factory Sabotage', 
      description: 'Disable the automated assembly line.', 
      district: District.FURNACE, 
      minLevel: 10, 
      type: MissionType.STORY, 
      difficulty: 6, 
      risk: 'High', 
      costEnr: 15, 
      baseReward: 1200, 
      baseXp: 500,
      objectives: ["Plant EMP charge", "Hack security mainframe", "Evacuate before detonation"],
      baseSuccessChance: 0.45
    },

    // GILDED HEIGHTS (Lv 15-25)
    { 
      id: 'm_gilded_1', 
      title: 'Penthouse Heist', 
      description: 'Crack a CEO\'s safe during a gala.', 
      district: District.GILDED_HEIGHTS, 
      minLevel: 15, 
      type: MissionType.SIDE_JOB, 
      difficulty: 7, 
      risk: 'High', 
      costEnr: 12, 
      baseReward: 2000, 
      baseXp: 800,
      objectives: ["Bypass biometric scans", "Blend in with guests", "Crack the vault"],
      baseSuccessChance: 0.40
    },

    // THE SPRAWL (Lv 20-30)
    { 
      id: 'm_sprawl_1', 
      title: 'Turf War', 
      description: 'Defend a stash house from rival gangs.', 
      district: District.SPRAWL, 
      minLevel: 20, 
      type: MissionType.CONTRACT, 
      difficulty: 7, 
      risk: 'High', 
      costEnr: 35, 
      baseReward: 3000, 
      baseXp: 1200,
      objectives: ["Fortify position", "Repel wave of attackers", "Secure the product"],
      baseSuccessChance: 0.35
    },

    // CIRCUIT BAY (Lv 25-35)
    { 
      id: 'm_circuit_1', 
      title: 'Data Center Hack', 
      description: 'Steal proprietary algorithms directly from the source.', 
      district: District.CIRCUIT_BAY, 
      minLevel: 25, 
      type: MissionType.SIDE_JOB, 
      difficulty: 8, 
      risk: 'Medium', 
      costEnr: 15, 
      baseReward: 4500, 
      baseXp: 1500,
      objectives: ["Infiltrate server farm", "Deploy ice-breaker virus", "Download petabytes"],
      baseSuccessChance: 0.30
    },

    // OLD TOWN (Lv 30-40)
    { 
      id: 'm_old_1', 
      title: 'Don\'s Favor', 
      description: 'Recover a stolen heirloom for a crime family head.', 
      district: District.OLD_TOWN, 
      minLevel: 30, 
      type: MissionType.STORY, 
      difficulty: 8, 
      risk: 'Medium', 
      costEnr: 20, 
      baseReward: 6000, 
      baseXp: 2000,
      objectives: ["Investigate pawn shops", "Interrogate fences", "Retrieve the item"],
      baseSuccessChance: 0.40
    },

    // THE UNDERCITY (Lv 35-45)
    { 
      id: 'm_under_1', 
      title: 'Fungal Harvest', 
      description: 'Collect rare bio-luminescent spores for illicit drugs.', 
      district: District.UNDERCITY, 
      minLevel: 35, 
      type: MissionType.SIDE_JOB, 
      difficulty: 9, 
      risk: 'High', 
      costEnr: 15, 
      baseReward: 8000, 
      baseXp: 2500,
      objectives: ["Navigate toxic tunnels", "Avoid mutants", "Harvest spores"],
      baseSuccessChance: 0.25
    },

    // CORPORATE PLAZA (Lv 40-50)
    { 
      id: 'm_corp_1', 
      title: 'Executive Extraction', 
      description: 'Kidnap a high-value target from a secure office.', 
      district: District.CORPORATE_PLAZA, 
      minLevel: 40, 
      type: MissionType.CONTRACT, 
      difficulty: 9, 
      risk: 'Extreme', 
      costEnr: 45, 
      baseReward: 12000, 
      baseXp: 3500,
      objectives: ["Disable building security", "Sedate target", "Escape via air-car"],
      baseSuccessChance: 0.20
    },

    // THE SHADOWS (Lv 45-55)
    { 
      id: 'm_shadow_1', 
      title: 'Black Site Infiltration', 
      description: 'Break into a government black site to erase records.', 
      district: District.SHADOWS, 
      minLevel: 45, 
      type: MissionType.STORY, 
      difficulty: 10, 
      risk: 'Extreme', 
      costEnr: 25, 
      baseReward: 18000, 
      baseXp: 5000,
      objectives: ["Avoid thermal cameras", "Hack mainframe", "Wipe identity data"],
      baseSuccessChance: 0.15
    },

    // GOVERNMENT DISTRICT (Lv 50-60)
    { 
      id: 'm_gov_1', 
      title: 'Election Rigging', 
      description: 'Ensure the "right" candidate wins the district seat.', 
      district: District.GOVERNMENT, 
      minLevel: 50, 
      type: MissionType.SIDE_JOB, 
      difficulty: 10, 
      risk: 'High', 
      costEnr: 15, 
      baseReward: 25000, 
      baseXp: 7000,
      objectives: ["Hack voting machines", "Blackmail officials", "Plant evidence"],
      baseSuccessChance: 0.10
    },

    // THE NEXUS (Lv 60+)
    { 
      id: 'm_nexus_1', 
      title: 'Core Override', 
      description: 'The ultimate heist: seize control of the city AI.', 
      district: District.NEXUS, 
      minLevel: 60, 
      type: MissionType.STORY, 
      difficulty: 10, 
      risk: 'Extreme', 
      costEnr: 30, 
      baseReward: 50000, 
      baseXp: 15000,
      objectives: ["Breach the firewall", "Upload consciousness", "Become the city"],
      baseSuccessChance: 0.05
    },
  ] as Mission[],

  items: [
    { id: 'w_knuckles', name: 'Brass Knuckles', type: ItemType.WEAPON, rarity: ItemRarity.COMMON, bonus: 5, cost: 250, description: '+5 ATK. Basic melee.', imageUrl: undefined },
    { id: 'w_pistol', name: 'Tanto 9mm', type: ItemType.WEAPON, rarity: ItemRarity.UNCOMMON, bonus: 12, cost: 600, description: '+12 ATK. Reliable sidearm.', imageUrl: undefined },
    { id: 'w_smg', name: "Tommy's Revenge", type: ItemType.WEAPON, rarity: ItemRarity.LEGENDARY, bonus: 45, cost: 5000, description: '+45 ATK. "Spray & Pray".', imageUrl: undefined },
    { id: 'a_vest', name: 'Kevlar Vest', type: ItemType.ARMOR, rarity: ItemRarity.COMMON, bonus: 8, cost: 400, description: '+8 DEF. Standard issue.', imageUrl: undefined },
    { id: 'a_dermal', name: 'Subdermal Plating', type: ItemType.ARMOR, rarity: ItemRarity.EPIC, bonus: 15, cost: 1200, description: '+15 DEF. Military grade.', imageUrl: undefined },
    { id: 'c_stim', name: 'Adrenaline Shot', type: ItemType.CONSUMABLE, rarity: ItemRarity.COMMON, bonus: 30, cost: 75, description: 'Heals 30 HP.', imageUrl: undefined },
  ] as Item[],
};

// --- LOGIC HELPERS ---

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const calculateTotalStats = (player: Player) => {
  // Only count active crew
  const activeCrew = player.crew.filter(c => c.isActive);
  const crewAtk = activeCrew.reduce((s, c) => s + c.atk, 0);
  const crewDef = activeCrew.reduce((s, c) => s + c.def, 0);
  const weaponAtk = player.equipment.weapon?.bonus || 0;
  const armorDef = player.equipment.armor?.bonus || 0;
  
  // Calculate Skill Bonuses (Flat Stats)
  let skillAtk = 0;
  let skillDef = 0;
  
  player.unlockedSkills.forEach(skillId => {
      const skill = SKILL_DATABASE.find(s => s.id === skillId);
      if (skill && skill.effect.type === 'STAT_FLAT') {
          if (skill.effect.target === 'atk') skillAtk += skill.effect.value;
          if (skill.effect.target === 'def') skillDef += skill.effect.value;
      }
  });

  return {
    atk: player.stats.atk + crewAtk + weaponAtk + skillAtk,
    def: player.stats.def + crewDef + armorDef + skillDef,
    crewPower: crewAtk + crewDef // Simplified Crew Power for formula
  };
};

export const calculateMissionOdds = (player: Player, mission: Mission, modifiers: { successBonus?: number, heatPenalty?: number } = {}) => {
  const totals = calculateTotalStats(player);
  
  // Factors from Section 20
  const atkFactor = clamp(totals.atk / 100, 0, 0.30);
  const defFactor = clamp(totals.def / 120, 0, 0.20);
  const crewFactor = clamp(totals.crewPower / 150, 0, 0.25);
  const luckFactor = clamp(player.stats.lck / 200, 0, 0.10);
  const heatPenalty = clamp(player.stats.heat / 200, 0, 0.30);
  
  // Skill Bonuses (Success Chance)
  let skillBonus = 0;
  player.unlockedSkills.forEach(skillId => {
      const skill = SKILL_DATABASE.find(s => s.id === skillId);
      if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'success_chance') {
          skillBonus += skill.effect.value;
      }
  });

  // Apply modifiers from decision
  const decisionBonus = modifiers.successBonus || 0;

  const successChance = clamp(
    mission.baseSuccessChance + atkFactor + defFactor + crewFactor + luckFactor + skillBonus + decisionBonus - heatPenalty,
    0.05,
    0.95
  );
  
  return successChance;
};

// Detailed breakdown for UI Tooltips
export const getMissionFactors = (player: Player, mission: Mission) => {
  const totals = calculateTotalStats(player);
  
  const atkFactor = clamp(totals.atk / 100, 0, 0.30);
  const defFactor = clamp(totals.def / 120, 0, 0.20);
  const crewFactor = clamp(totals.crewPower / 150, 0, 0.25);
  const luckFactor = clamp(player.stats.lck / 200, 0, 0.10);
  const heatPenalty = clamp(player.stats.heat / 200, 0, 0.30);

  // Skill Bonuses (Success Chance)
  let skillBonus = 0;
  player.unlockedSkills.forEach(skillId => {
      const skill = SKILL_DATABASE.find(s => s.id === skillId);
      if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'success_chance') {
          skillBonus += skill.effect.value;
      }
  });

  const baseChance = mission.baseSuccessChance;
  
  // Estimate penalties (approximate logic from resolve function)
  let estHpLoss = Math.max(1, Math.round((5 + mission.costEnr * 0.8) - (totals.def / 5)));
  
  let estHeatGain = Math.round(5 + (mission.risk === 'High' ? 10 : 5));
  if (player.stats.heat > 50) estHeatGain += 5;
  
  // Apply Skill Influence Bonus (Heat Reduction)
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

// GDD Page 33 & Section 20 Formula 6
const checkLevelUp = (player: Player): { leveledUp: boolean, newPlayer: Player, spGained: number } => {
  let p = { ...player };
  const reqXp = Math.round(100 * Math.pow(p.level, 1.4));
  let spGained = 0;
  
  if (p.xp >= reqXp) {
    p.level += 1;
    p.xp -= reqXp;
    
    // Level Up Bonuses (Section 20)
    p.stats.atk += 2;
    p.stats.def += 2;
    p.stats.maxHp += 5;
    p.stats.maxEnr += 2;
    p.stats.maxSta += 1; // Stamina grows slowly
    
    // Skill Point every 5 levels
    if (p.level % 5 === 0) {
        p.skillPoints += 1;
        spGained = 1;
    }
    
    // Full heal on level up
    p.stats.hp = p.stats.maxHp;
    p.stats.enr = p.stats.maxEnr;
    p.stats.sta = p.stats.maxSta;

    return { leveledUp: true, newPlayer: p, spGained };
  }
  return { leveledUp: false, newPlayer: p, spGained: 0 };
};

const CREW_TEMPLATES: Record<string, Omit<CrewMember, 'id' | 'isActive' | 'trait'>> = {
  'Thug': { name: 'Street Thug', type: 'Thug', atk: 5, def: 0, cost: 500, upkeep: 10 },
  'Soldier': { name: 'Soldier', type: 'Soldier', atk: 15, def: 5, cost: 2500, upkeep: 25 },
  'Enforcer': { name: 'Enforcer', type: 'Enforcer', atk: 35, def: 10, cost: 10000, upkeep: 50 }
};

// --- API ROUTES ---

export const api = {
  
  player: {
    create: async (name: string, faction: FactionId, profession: ProfessionId): Promise<ApiResponse<Player>> => {
      // Base Stats
      const baseStats: PlayerStats = { 
        atk: 10, 
        def: 5, 
        hp: 100, 
        maxHp: 100, 
        enr: 100, 
        maxEnr: 100, 
        sta: 100, 
        maxSta: 100, 
        lck: 5, 
        cInt: 10, 
        heat: 0 
      };
      
      // Faction Bonuses
      if (faction === FactionId.JADE_SERPENTS) baseStats.lck = 15;
      if (faction === FactionId.CHROME_SAINTS) {
        baseStats.maxEnr = 110;
        baseStats.enr = 110;
      }
      
      // Profession Bonuses
      switch(profession) {
          case ProfessionId.ENFORCER:
              baseStats.atk = Math.round(baseStats.atk * 1.20);
              baseStats.maxHp = Math.round(baseStats.maxHp * 1.15);
              baseStats.hp = baseStats.maxHp;
              break;
          case ProfessionId.HACKER:
              baseStats.cInt = Math.round(baseStats.cInt * 1.30);
              baseStats.maxEnr = Math.round(baseStats.maxEnr * 1.20);
              baseStats.enr = baseStats.maxEnr;
              break;
          case ProfessionId.FIXER:
              baseStats.lck = Math.round(baseStats.lck * 1.25);
              break;
          case ProfessionId.SMUGGLER:
              baseStats.def = Math.round(baseStats.def * 1.15);
              baseStats.maxSta = Math.round(baseStats.maxSta * 1.30);
              baseStats.sta = baseStats.maxSta;
              break;
      }

      const now = Date.now();
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        faction,
        profession,
        level: 1,
        xp: 0,
        stats: baseStats,
        wallet: 1000,
        crew: [],
        day: 1,
        inventory: [],
        equipment: { weapon: null, armor: null },
        
        skillPoints: 0,
        unlockedSkills: [],

        lastEnergyUpdate: now,
        lastStaminaUpdate: now,
        lastHeatUpdate: now,
        missionCooldowns: {},
        missionMastery: {},
        currentNews: "Welcome to the shadows. Stay low.",
        loginStreak: 0,
        lastLoginDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        badges: []
      };
      
      DB.player = newPlayer;
      // Reset Audit Tables for new game
      DB.missionRuns = [];
      DB.heatEvents = [];
      DB.adminAudit = [];
      
      return { success: true, data: newPlayer, message: "Encrypted connection established." };
    },
    
    getDashboard: async (): Promise<ApiResponse<Player>> => {
      if (!DB.player) return { success: false, message: "Session expired." };
      return { success: true, data: DB.player };
    },

    // PHASE 2: DAILY LOGIN
    claimDailyReward: async (): Promise<ApiResponse<Player> & { dailyResult: DailyRewardResult }> => {
      if (!DB.player) return { success: false, message: "Session invalid", dailyResult: { claimed: false, streak: 0, message: "Error" } };
      
      let p = { ...DB.player };
      const today = new Date().toISOString().split('T')[0];
      
      if (p.lastLoginDate === today) {
        return { 
          success: true, 
          data: p, 
          dailyResult: { 
            claimed: false, 
            streak: p.loginStreak, 
            message: "Daily reward already claimed today." 
          } 
        };
      }

      // Calculate Streak
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (p.lastLoginDate === yesterday) {
        p.loginStreak += 1;
      } else {
        p.loginStreak = 1; // Reset streak
      }
      
      p.lastLoginDate = today;

      // Determine Reward (Cyclic 1-7)
      const cycleDay = ((p.loginStreak - 1) % 7) + 1;
      const result: DailyRewardResult = { claimed: true, streak: p.loginStreak, message: "", reward: {} };
      
      switch(cycleDay) {
        case 1: 
          p.wallet += 50; 
          result.reward!.gang = 50; 
          result.message = "Login Bonus: +50 $GANG";
          break;
        case 2: 
          p.wallet += 75; 
          result.reward!.gang = 75; 
          result.message = "Login Bonus: +75 $GANG";
          break;
        case 3: 
          p.wallet += 100; 
          result.reward!.gang = 100; 
          result.message = "Login Bonus: +100 $GANG";
          break;
        case 4: 
          p.stats.maxEnr += 1; // Permanent Boost
          p.stats.enr = p.stats.maxEnr; // Full Refill
          result.reward!.energy = 1; 
          result.message = "Login Bonus: +1 MAX ENERGY & REFILL";
          break;
        case 5: 
          p.wallet += 150; 
          result.reward!.gang = 150; 
          result.message = "Login Bonus: +150 $GANG";
          break;
        case 6: 
          p.stats.maxEnr += 1; // Permanent Boost
          p.stats.enr = p.stats.maxEnr;
          result.reward!.energy = 1; 
          result.message = "Login Bonus: +1 MAX ENERGY & REFILL";
          break;
        case 7: 
          p.wallet += 300; 
          result.reward!.gang = 300; 
          if (!p.badges.includes('LOYAL_OPERATIVE')) {
            p.badges.push('LOYAL_OPERATIVE');
            result.reward!.badge = 'LOYAL_OPERATIVE';
            result.message = "WEEKLY STREAK: +300 $GANG & 'Loyal Operative' Badge!";
          } else {
            result.message = "WEEKLY STREAK: +300 $GANG";
          }
          break;
      }

      DB.player = p;
      return { success: true, data: p, message: result.message, dailyResult: result };
    },

    rest: async (): Promise<ApiResponse<Player>> => {
      if (!DB.player) return { success: false };
      let p = { ...DB.player };

      // Effects: Heal 20 HP, Reduce Heat 5
      const healAmount = 20;
      const heatReduction = 5;
      const stamCost = 10;

      if (p.stats.sta < stamCost) {
          return { success: false, message: "Not enough Stamina to organize a safehouse rest." };
      }

      const oldHeat = p.stats.heat;
      p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + healAmount);
      p.stats.heat = Math.max(0, p.stats.heat - heatReduction);
      p.stats.sta -= stamCost;

      if (p.stats.heat !== oldHeat) {
          DB.heatEvents.push({
              id: crypto.randomUUID(),
              playerId: p.id,
              heatBefore: oldHeat,
              heatAfter: p.stats.heat,
              reason: 'REST',
              narrative: 'Player rested at safehouse.',
              timestamp: Date.now()
          });
      }

      DB.player = p;
      return { 
        success: true, 
        data: p, 
        message: `Rested at Safehouse. HP +${healAmount}, Heat -${heatReduction} (Cost: ${stamCost} STA).` 
      };
    },

    performMaintenance: async (): Promise<ApiResponse<Player>> => {
      if (!DB.player) return { success: false };
      
      let p = { ...DB.player };
      const dailyUpkeep = p.crew.reduce((sum, c) => sum + c.upkeep, 0) + 50; 

      let paid = false;
      let penaltyMsg = "";

      if (p.wallet >= dailyUpkeep) {
        p.wallet -= dailyUpkeep;
        paid = true;
      } else {
        p.wallet = 0;
        if (p.crew.length > 0) {
          const randomIndex = Math.floor(Math.random() * p.crew.length);
          const deserter = p.crew[randomIndex];
          p.crew.splice(randomIndex, 1);
          penaltyMsg = ` Couldn't pay upkeep. ${deserter.name} left. ATK penalized.`;
        } else {
          penaltyMsg = " Reputation damaged due to missed payments.";
        }
        p.stats.atk = Math.max(1, p.stats.atk - 1);
      }

      p.day += 1;
      // Removed instant HP/Energy refill here as per new regeneration rules.
      // Health only regenerates via items/rest.
      // Energy regenerates via time (1/min).
      
      p.stats.heat = Math.max(0, p.stats.heat - 10); 
      
      const news = await generateNewsUpdate(p);
      p.currentNews = news;

      DB.player = p;
      
      const status = paid ? "Daily upkeep paid." : "DEFAULTED ON UPKEEP.";
      return { 
        success: true, 
        data: p, 
        message: `Day ${p.day} Begin. ${status} (-$${dailyUpkeep})${penaltyMsg}` 
      };
    },
  },

  skills: {
      getAll: async (): Promise<Skill[]> => {
          return SKILL_DATABASE;
      },
      
      unlock: async (skillId: string): Promise<ApiResponse<Player>> => {
          if (!DB.player) return { success: false, message: "Unauthorized" };
          let p = { ...DB.player };

          // Checks
          const skill = SKILL_DATABASE.find(s => s.id === skillId);
          if (!skill) return { success: false, message: "Skill not found." };
          if (p.unlockedSkills.includes(skillId)) return { success: false, message: "Already unlocked." };
          if (p.skillPoints < skill.cost) return { success: false, message: "Insufficient Skill Points." };
          if (skill.requiredProfession && skill.requiredProfession !== p.profession) return { success: false, message: "Profession mismatch." };

          // Execute
          p.skillPoints -= skill.cost;
          p.unlockedSkills.push(skillId);

          // Apply Passive Stat Bonus immediately if it's a flat stat boost
          // Note: MISSION_BONUS are applied during calculation dynamically
          if (skill.effect.type === 'STAT_FLAT') {
              // We also need to update Max values if applicable
              if (skill.effect.target === 'maxHp') {
                  p.stats.maxHp += skill.effect.value;
                  p.stats.hp += skill.effect.value;
              } else if (skill.effect.target === 'maxEnr') {
                   p.stats.maxEnr += skill.effect.value;
                   p.stats.enr += skill.effect.value;
              } else if (skill.effect.target === 'maxSta') {
                  p.stats.maxSta += skill.effect.value;
                  p.stats.sta += skill.effect.value;
              }
          }

          DB.player = p;
          return { success: true, data: p, message: `Unlocked ${skill.name}.` };
      }
  },

  missions: {
    // STEP 1: START MISSION (Cooldown & Energy Check)
    start: async (missionId: string): Promise<ApiResponse<{ missionRunId: string }>> => {
       if (!DB.player) return { success: false, message: "Unauthorized" };
       const mission = DB.missions.find(m => m.id === missionId);
       if (!mission) return { success: false, message: "Mission not found" };

       let p = { ...DB.player };

       // Phase 1 Guard: Check for pending missions (Anti-Spam)
       const hasPending = DB.missionRuns.some(r => r.playerId === p.id && r.narrative === 'PENDING');
       if (hasPending) {
           return { success: false, message: "Operation already in progress. Check dashboard." };
       }

       // Constraints
       if (p.level < mission.minLevel) return { success: false, message: `Access Denied. Min Level ${mission.minLevel} required.` };
       if (p.stats.enr < mission.costEnr) return { success: false, message: "Insufficient Energy." };
       
       // COOLDOWN CHECK
       const cooldownKey = mission.type;
       const now = Date.now();
       if (p.missionCooldowns[cooldownKey] && p.missionCooldowns[cooldownKey] > now) {
         const remaining = Math.ceil((p.missionCooldowns[cooldownKey] - now) / 1000);
         return { success: false, message: `Mission type on cooldown. Wait ${remaining}s.` };
       }

       // Deduct Energy
       p.stats.enr -= mission.costEnr;
       
       // Create Pending Run
       const runId = crypto.randomUUID();
       DB.missionRuns.push({
           id: runId,
           playerId: p.id,
           missionId: mission.id,
           success: false, // Pending
           xpGained: 0,
           gangGained: 0,
           hpChange: 0,
           heatChange: 0,
           narrative: "PENDING",
           timestamp: now
       });

       DB.player = p;

       return {
           success: true,
           data: { missionRunId: runId },
           message: "Mission Initiated. Awaiting Resolution..."
       };
    },

    // STEP 1.5: GET DECISION SCENARIO
    getScenario: async (missionRunId: string): Promise<ApiResponse<MissionScenario>> => {
        if (!DB.player) return { success: false, message: "Unauthorized" };
        const run = DB.missionRuns.find(r => r.id === missionRunId);
        if (!run) return { success: false, message: "Run not found" };
        
        const mission = DB.missions.find(m => m.id === run.missionId);
        if (!mission) return { success: false, message: "Mission Data Lost" };

        // Generate choices based on Mission Type & Profession
        const p = DB.player;
        
        const baseChoices: MissionDecision[] = [
            { 
                id: 'aggressive', 
                label: 'Direct Assault', 
                description: 'Hit them hard and fast. High risk, heavy collateral.', 
                type: 'AGGRESSIVE', 
                riskModifier: 1.2, 
                rewardModifier: 1.1 
            },
            { 
                id: 'balanced', 
                label: 'Standard Protocol', 
                description: 'Stick to the plan. Balanced risk and reward.', 
                type: 'BALANCED', 
                riskModifier: 1.0, 
                rewardModifier: 1.0 
            }
        ];

        // Specialized choice based on Stats/Profession
        if (p.profession === ProfessionId.HACKER || p.stats.cInt > 30) {
            baseChoices.push({
                id: 'tech',
                label: 'Cyberwarfare',
                description: 'Disable security systems remotely. Low heat, requires C-INT.',
                type: 'TECH',
                riskModifier: 0.8,
                rewardModifier: 1.2,
                reqSkill: 'p_system_breach'
            });
        } else if (p.profession === ProfessionId.FIXER || p.wallet > 500) {
             baseChoices.push({
                id: 'bribe',
                label: 'Grease Palms',
                description: 'Pay off a key insider. Zero combat risk, costs $200.',
                type: 'DIPLOMATIC',
                riskModifier: 0.5,
                rewardModifier: 0.8,
                cost: 200
            });
        } else if (p.profession === ProfessionId.SMUGGLER || p.stats.def > 30) {
             baseChoices.push({
                id: 'stealth',
                label: 'Ghost Entry',
                description: 'In and out without a trace. High risk of failure if spotted.',
                type: 'STEALTH',
                riskModifier: 1.3,
                rewardModifier: 1.5
            });
        }

        const scenario: MissionScenario = {
            narrative: `You've arrived at the ${mission.district}. ${mission.objectives[0]} is within reach, but security is tighter than expected. How do you proceed?`,
            choices: baseChoices
        };

        return { success: true, data: scenario };
    },

    // STEP 2: RESOLVE MISSION (Economy, AI, Cooldown Set)
    resolve: async (missionRunId: string, decisionId?: string): Promise<ApiResponse<Player> & { missionResult?: MissionOutcome }> => {
      if (!DB.player) return { success: false, message: "Unauthorized" };
      
      const runIndex = DB.missionRuns.findIndex(r => r.id === missionRunId);
      if (runIndex === -1) return { success: false, message: "Invalid Run ID" };
      const run = DB.missionRuns[runIndex];
      
      // Prevent re-resolving an already resolved mission
      if (run.narrative !== 'PENDING') {
          return { success: false, message: "Mission already resolved." };
      }
      
      const mission = DB.missions.find(m => m.id === run.missionId);
      if (!mission) return { success: false, message: "Mission Data Lost" };

      let p = { ...DB.player };
      const startHeat = p.stats.heat;

      // Handle Decision Costs
      let successBonus = 0;
      let heatModifier = 1.0;
      
      if (decisionId === 'aggressive') {
          successBonus = 0.1; // +10% Success
          heatModifier = 1.5; // +50% Heat
      } else if (decisionId === 'stealth') {
          successBonus = -0.1; // Harder
          heatModifier = 0.5; // Half Heat
      } else if (decisionId === 'bribe') {
          if (p.wallet >= 200) {
              p.wallet -= 200;
              successBonus = 0.2; // Much easier
              heatModifier = 0.2; // Very low heat
          } else {
              return { success: false, message: "Insufficient funds for bribe." };
          }
      } else if (decisionId === 'tech') {
          // Tech check
          if (p.stats.cInt > 20) successBonus = 0.15;
          else successBonus = -0.05;
      }

      // 1. Calculate Success
      const successChance = calculateMissionOdds(p, mission, { successBonus, heatPenalty: 0 }); // heat calc separately
      const isSuccess = Math.random() <= successChance;

      // 2. Economy
      let rewards = { money: 0, exp: 0 };
      let penalties = { hpLoss: 0, heatGain: 0 };

      if (isSuccess) {
        let diffMult = mission.difficulty <= 3 ? 0.8 : mission.difficulty >= 7 ? 1.3 : 1.0;
        const riskMult = mission.risk === 'Low' ? 0.9 : mission.risk === 'High' ? 1.4 : 1.0;
        const luckBonus = 1 + clamp(p.stats.lck / 300, 0, 0.15);

        rewards.money = Math.round(mission.baseReward * diffMult * riskMult * luckBonus);
        rewards.exp = Math.round(mission.baseXp * diffMult * (1 + p.level / 200));

        if (p.faction === FactionId.IRON_WOLVES) rewards.money = Math.floor(rewards.money * 1.1);
        if (p.profession === ProfessionId.FIXER) rewards.money = Math.floor(rewards.money * 1.2); // Fixer Bonus

        // Apply Skill Acquisition Bonus (Money)
        p.unlockedSkills.forEach(skillId => {
            const skill = SKILL_DATABASE.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'money_reward') {
                rewards.money = Math.floor(rewards.money * (1 + skill.effect.value));
            }
        });

        penalties.heatGain = Math.round((mission.risk === 'High' ? 5 : 2) * heatModifier);

        // Apply Skill Influence Bonus (Heat Reduction)
        p.unlockedSkills.forEach(skillId => {
            const skill = SKILL_DATABASE.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'MISSION_BONUS' && skill.effect.target === 'heat_reduction') {
                penalties.heatGain = Math.floor(penalties.heatGain * (1 - skill.effect.value));
            }
        });

        // Phase 1 Guard: Daily Income Cap ($5000)
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const recentRuns = DB.missionRuns.filter(r => r.playerId === p.id && r.timestamp > (Date.now() - ONE_DAY));
        const dailyIncome = recentRuns.reduce((sum, r) => sum + r.gangGained, 0);
        const MAX_DAILY_GANG = 5000;

        if (dailyIncome >= MAX_DAILY_GANG) {
             rewards.money = 0;
        } else if (dailyIncome + rewards.money > MAX_DAILY_GANG) {
             rewards.money = MAX_DAILY_GANG - dailyIncome;
        }

      } else {
        rewards.exp = Math.floor(mission.baseXp * 0.1);
        const totals = calculateTotalStats(p);
        penalties.hpLoss = Math.max(1, Math.round((5 + mission.costEnr * 0.8) - (totals.def / 5)));
        penalties.heatGain = Math.round((5 + (mission.risk === 'High' ? 10 : 5)) * heatModifier);
        if (p.stats.heat > 50) penalties.heatGain += 5;
        if (p.faction === FactionId.CRIMSON_VEIL) {
            penalties.heatGain = Math.floor(penalties.heatGain * 0.9);
            penalties.hpLoss = Math.floor(penalties.hpLoss * 0.9);
        }
      }

      // 3. Apply Economy
      p.wallet += rewards.money;
      p.xp += rewards.exp;
      p.stats.hp = Math.max(0, p.stats.hp - penalties.hpLoss);
      p.stats.heat += penalties.heatGain;

      // 4. Mission Mastery & Trophies
      const currentMastery = p.missionMastery[mission.id] || 0;
      let masteryMsg = "";
      
      if (currentMastery < 100) {
          const gain = isSuccess ? 3 : 1;
          const newMastery = Math.min(100, currentMastery + gain);
          p.missionMastery[mission.id] = newMastery;

          if (currentMastery < 100 && newMastery === 100) {
              // Trophy Unlocked - Permanent Stat Boost
              let trophyName = "";
              if (mission.type === MissionType.STORY) {
                   p.stats.maxHp += 20;
                   p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + 20); // Heal the amount gained
                   trophyName = "Titan Heart (+20 HP)";
              } else if (mission.risk === 'High') {
                   p.stats.atk += 2;
                   trophyName = "Street King (+2 ATK)";
              } else if (mission.type === MissionType.CONTRACT) {
                   p.stats.def += 2;
                   trophyName = "Iron Skin (+2 DEF)";
              } else {
                   p.stats.maxEnr += 2;
                   p.stats.enr = Math.min(p.stats.maxEnr, p.stats.enr + 2);
                   trophyName = "Endurance (+2 ENR)";
              }
              masteryMsg = ` TROPHY UNLOCKED: ${trophyName}`;
          }
      }

      // 5. Set Cooldown
      // Updated cooldowns to match the feel of "Completion Time"
      const COOLDOWNS_MS = {
        [MissionType.SIDE_JOB]: 5 * 60 * 1000, // 5 min
        [MissionType.CONTRACT]: 30 * 60 * 1000, // 30 min
        [MissionType.STORY]: 15 * 60 * 1000, // 15 min
      };
      p.missionCooldowns[mission.type] = Date.now() + (COOLDOWNS_MS[mission.type] || 60000);

      // 6. Level Up
      const lvlCheck = checkLevelUp(p);
      let levelMsg = "";
      if (lvlCheck.leveledUp) {
        p = lvlCheck.newPlayer;
        levelMsg = ` LEVEL UP! You are now Level ${p.level}.`;
        if (lvlCheck.spGained > 0) {
            levelMsg += ` (+${lvlCheck.spGained} Skill Point)`;
        }
      }

      // 7. Narrative (Gemini)
      const context = decisionId 
        ? `Mission: ${mission.title}. Approach: ${decisionId} (${isSuccess ? 'Successful' : 'Failed'}).` 
        : `Mission: ${mission.title} (${mission.district}).`;

      const outcomeData: Omit<MissionOutcome, 'narrative'> = {
        success: isSuccess,
        rewards,
        penalties,
        missionId: mission.id 
      };
      
      if (isSuccess && rewards.money === 0) {
          // @ts-ignore adding context dynamically
          outcomeData.capReached = true; 
      }

      const narrative = await generateMissionNarrative(p, mission, outcomeData);

      // 8. Update Audit Log
      run.success = isSuccess;
      run.xpGained = rewards.exp;
      run.gangGained = rewards.money;
      run.hpChange = -penalties.hpLoss;
      run.heatChange = penalties.heatGain;
      run.narrative = narrative;

      // Audit Heat
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

      const fullOutcome: MissionOutcome = { ...outcomeData, narrative };

      return {
        success: isSuccess,
        data: p,
        message: `${isSuccess ? "Contract Fulfilled." : "Operation Failed."}${levelMsg}${masteryMsg}`,
        narrative,
        missionResult: fullOutcome
      };
    },
  },

  crew: {
    hire: async (type: 'Thug' | 'Soldier' | 'Enforcer'): Promise<ApiResponse<Player>> => {
      if (!DB.player) return { success: false, message: "No session" };
      const template = CREW_TEMPLATES[type];
      if (!template) return { success: false, message: "Invalid type" };
      
      if (DB.player.wallet < template.cost) {
        return { success: false, message: "Insufficient funds" };
      }

      DB.player.wallet -= template.cost;
      const newCrew: CrewMember = {
        ...template,
        id: crypto.randomUUID(),
        isActive: true,
        type: type // Explicit cast if needed by TS
      };
      DB.player.crew.push(newCrew);
      
      return { success: true, data: DB.player, message: `${template.name} recruited.` };
    },

    toggle: async (crewId: string): Promise<ApiResponse<Player>> => {
      if (!DB.player) return { success: false };
      const member = DB.player.crew.find(c => c.id === crewId);
      if (member) {
        member.isActive = !member.isActive;
      }
      return { success: true, data: DB.player };
    }
  },

  items: {
    buy: async (itemId: string): Promise<ApiResponse<Player>> => {
        if (!DB.player) return { success: false, message: "No session" };
        const item = DB.items.find(i => i.id === itemId);
        if (!item) return { success: false, message: "Item unknown" };
        if (DB.player.wallet < item.cost) return { success: false, message: "Insufficient funds" };
        
        DB.player.wallet -= item.cost;
        DB.player.inventory.push({ ...item, id: crypto.randomUUID() }); // Unique instance
        return { success: true, data: DB.player, message: `Purchased ${item.name}` };
    },

    equip: async (itemId: string): Promise<ApiResponse<Player>> => {
        if (!DB.player) return { success: false };
        const idx = DB.player.inventory.findIndex(i => i.id === itemId);
        if (idx === -1) return { success: false, message: "Item not in inventory" };
        const item = DB.player.inventory[idx];
        
        const slot = item.type === ItemType.WEAPON ? 'weapon' : item.type === ItemType.ARMOR ? 'armor' : null;
        if (!slot) return { success: false, message: "Cannot equip this type" };
        
        // Remove from inventory
        DB.player.inventory.splice(idx, 1);

        // Unequip current if exists
        if (DB.player.equipment[slot]) {
            DB.player.inventory.push(DB.player.equipment[slot]!);
        }
        
        DB.player.equipment[slot] = item;
        
        return { success: true, data: DB.player, message: `Equipped ${item.name}` };
    },

    unequip: async (slot: 'weapon' | 'armor'): Promise<ApiResponse<Player>> => {
        if (!DB.player) return { success: false };
        if (DB.player.equipment[slot]) {
            DB.player.inventory.push(DB.player.equipment[slot]!);
            DB.player.equipment[slot] = null;
            return { success: true, data: DB.player, message: `Unequipped ${slot}` };
        }
        return { success: false, message: "Slot empty" };
    },

    use: async (itemId: string): Promise<ApiResponse<Player>> => {
        if (!DB.player) return { success: false };
        const idx = DB.player.inventory.findIndex(i => i.id === itemId);
        if (idx === -1) return { success: false, message: "Item not found" };
        
        const item = DB.player.inventory[idx];
        if (item.type !== ItemType.CONSUMABLE) return { success: false, message: "Not usable" };

        DB.player.stats.hp = Math.min(DB.player.stats.maxHp, DB.player.stats.hp + item.bonus);
        DB.player.inventory.splice(idx, 1);

        return { success: true, data: DB.player, message: `Used ${item.name}. HP Restored.` };
    }
  },

  system: {
     tick: async (): Promise<ApiResponse<Player>> => {
        if (!DB.player) return { success: false };
        // Passive Energy Regen
        if (DB.player.stats.enr < DB.player.stats.maxEnr) {
             DB.player.stats.enr += 1;
        }
        return { success: true, data: DB.player };
     },
     getStaticData: async (): Promise<ApiResponse<{ missions: Mission[], items: Item[], districts: DistrictMeta[] }>> => {
        return { 
          success: true, 
          data: { 
            missions: DB.missions, 
            items: DB.items, 
            districts: DB.districts 
          } 
        };
     },
     getPendingMission: async (playerId: string): Promise<string | null> => {
        const run = DB.missionRuns.find(r => r.playerId === playerId && r.narrative === 'PENDING');
        return run ? run.id : null;
     }
  },

  admin: {
     verifyKey: (key: string) => key === 'admin-secret',
     getOverview: async (): Promise<ApiResponse<AdminMetrics>> => {
         const now = Date.now();
         const oneDay = 24 * 60 * 60 * 1000;
         const runs24 = DB.missionRuns.filter(r => (now - r.timestamp) < oneDay);
         
         const metrics: AdminMetrics = {
             totalPlayers: DB.player ? 1 : 0,
             activePlayers24h: DB.player ? 1 : 0,
             missionsRun24h: runs24.length,
             geminiCalls24h: runs24.length + 5, // Approx
             errorRate: 0
         };
         return { success: true, data: metrics };
     },
     getPlayerDetails: async (): Promise<ApiResponse<Player>> => {
         return { success: true, data: DB.player || undefined };
     },
     adjustPlayer: async (key: string, payload: any): Promise<ApiResponse<Player>> => {
         if (key !== 'admin-secret') return { success: false };
         if (!DB.player) return { success: false };
         
         if (payload.gangDelta) DB.player.wallet += payload.gangDelta;
         if (payload.xpDelta) {
             DB.player.xp += payload.xpDelta;
             const check = checkLevelUp(DB.player);
             if (check.leveledUp) DB.player = check.newPlayer;
         }
         return { success: true, data: DB.player };
     },
     generateMissionImage: async (key: string, missionId: string, size: '1K' | '2K' | '4K'): Promise<ApiResponse<any>> => {
         if (key !== 'admin-secret') return { success: false };
         const m = DB.missions.find(mi => mi.id === missionId);
         if (!m) return { success: false };
         const url = await generateGameImage('mission', `Mission: ${m.title} in ${m.district}. ${m.description}`, size);
         if (url) {
             m.imageUrl = url;
             return { success: true };
         }
         return { success: false, message: "Generation failed" };
     },
     generateItemImage: async (key: string, itemId: string, size: '1K' | '2K' | '4K'): Promise<ApiResponse<any>> => {
         if (key !== 'admin-secret') return { success: false };
         const i = DB.items.find(it => it.id === itemId);
         if (!i) return { success: false };
         const url = await generateGameImage('item', `Item: ${i.name}. ${i.description}`, size);
         if (url) {
             i.imageUrl = url;
             return { success: true };
         }
         return { success: false, message: "Generation failed" };
     },
     generateDistrictImage: async (key: string, districtId: District, size: '1K' | '2K' | '4K'): Promise<ApiResponse<any>> => {
         if (key !== 'admin-secret') return { success: false };
         const d = DB.districts.find(di => di.id === districtId);
         if (!d) return { success: false };
         const url = await generateGameImage('district', `District: ${d.name}. ${d.description}`, size);
         if (url) {
             d.imageUrl = url;
             return { success: true };
         }
         return { success: false, message: "Generation failed" };
     },
     generatePlayerPortrait: async (key: string, size: '1K' | '2K' | '4K'): Promise<ApiResponse<string>> => {
         if (key !== 'admin-secret' || !DB.player) return { success: false };
         const p = DB.player;
         const url = await generateGameImage('player_portrait', `${p.profession} of the ${p.faction}`, size);
         if (url) {
             p.portraitUrl = url;
             return { success: true, data: url };
         }
         return { success: false, message: "Generation failed" };
     }
  }
};
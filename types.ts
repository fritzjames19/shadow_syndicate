
export enum FactionId {
  IRON_WOLVES = 'IRON_WOLVES',
  JADE_SERPENTS = 'JADE_SERPENTS',
  CRIMSON_VEIL = 'CRIMSON_VEIL',
  CHROME_SAINTS = 'CHROME_SAINTS',
}

export enum ProfessionId {
  ENFORCER = 'ENFORCER',
  HACKER = 'HACKER',
  FIXER = 'FIXER',
  SMUGGLER = 'SMUGGLER',
}

export interface Faction {
  id: FactionId;
  name: string;
  description: string;
  bonusDescription: string;
}

export interface Profession {
  id: ProfessionId;
  name: string;
  description: string;
  role: string; // e.g. "The Muscle"
  bonuses: string[];
  uniqueAbility: string;
  color: string; // Tailwind color class for borders/text
}

export interface CrewMember {
  id: string;
  name: string;
  type: 'Thug' | 'Soldier' | 'Enforcer';
  atk: number;
  def: number;
  cost: number; // Hire cost
  upkeep: number; // Daily upkeep
  trait?: string; // Schema placeholder
  isActive: boolean; // For toggling participation
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  CONSUMABLE = 'CONSUMABLE',
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  bonus: number;
  cost: number;
  description: string;
  imageUrl?: string; // Phase 3 Asset
}

export interface PlayerStats {
  atk: number; // Attack Power
  def: number; // Defense Rating
  hp: number;  // Health
  maxHp: number;
  enr: number; // Energy
  maxEnr: number;
  sta: number; // Stamina (New)
  maxSta: number;
  lck: number; // Luck
  cInt: number; // Crypto-Intel (New)
  heat: number;
}

export interface Skill {
  id: string;
  name: string;
  tree: 'COMBAT' | 'OPERATIONS' | 'PROFESSION';
  description: string;
  cost: number;
  // Effect definition for logic application
  effect: {
    type: 'STAT_FLAT' | 'STAT_PERCENT' | 'MISSION_BONUS';
    target: keyof PlayerStats | 'success_chance' | 'money_reward' | 'heat_reduction';
    value: number;
  };
  requiredProfession?: ProfessionId; // If null, available to all
}

export interface Player {
  id: string;
  name: string;
  faction: FactionId;
  profession: ProfessionId;
  level: number;
  xp: number;
  stats: PlayerStats;
  wallet: number; // $GANG
  crew: CrewMember[];
  day: number;
  inventory: Item[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
  };
  
  // Skills System
  skillPoints: number;
  unlockedSkills: string[]; // Array of Skill IDs

  lastEnergyUpdate: number; // Timestamp for regeneration (1/min)
  lastStaminaUpdate: number; // Timestamp for regeneration (1/5min)
  lastHeatUpdate: number; // Timestamp for heat decay
  missionCooldowns: { [key: string]: number }; // Mission ID -> Unlock Timestamp
  missionMastery: { [missionId: string]: number }; // Mission ID -> Mastery XP (0-100)
  currentNews: string; // World flavor text
  
  // Phase 2: Retention
  loginStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  badges: string[]; // Cosmetic achievements

  // Phase 3: Assets
  portraitUrl?: string; // AI Generated Avatar
}

// Section 17: Database Schema - Mission Runs
export interface MissionRun {
  id: string;
  playerId: string;
  missionId: string;
  success: boolean;
  xpGained: number;
  gangGained: number;
  hpChange: number;
  heatChange: number;
  narrative: string;
  timestamp: number;
}

// Section 17: Database Schema - Heat Events
export interface HeatEvent {
  id: string;
  playerId: string;
  heatBefore: number;
  heatAfter: number;
  reason: string;
  narrative: string;
  timestamp: number;
}

// Section 26: Admin / Debug
export interface AdminMetrics {
  totalPlayers: number;
  activePlayers24h: number;
  missionsRun24h: number;
  geminiCalls24h: number;
  errorRate: number;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  targetId: string;
  payload: any;
  timestamp: number;
}

export interface AdminAdjustment {
  gangDelta?: number;
  xpDelta?: number;
  heatDelta?: number;
  hpDelta?: number;
}

export interface DailyRewardResult {
  claimed: boolean;
  streak: number;
  reward?: {
    gang?: number;
    energy?: number;
    badge?: string;
  };
  message: string;
}

export enum MissionType {
  STORY = 'STORY',
  SIDE_JOB = 'SIDE_JOB',
  CONTRACT = 'CONTRACT',
}

export enum District {
  DOCKS = 'The Docks', // Lv 1-10
  NEON_ROW = 'Neon Row', // Lv 5-15
  FURNACE = 'The Furnace', // Lv 10-20
  GILDED_HEIGHTS = 'Gilded Heights', // Lv 15-25
  SPRAWL = 'The Sprawl', // Lv 20-30
  CIRCUIT_BAY = 'Circuit Bay', // Lv 25-35
  OLD_TOWN = 'Old Town', // Lv 30-40
  UNDERCITY = 'The Undercity', // Lv 35-45
  CORPORATE_PLAZA = 'Corporate Plaza', // Lv 40-50
  SHADOWS = 'The Shadows', // Lv 45-55
  GOVERNMENT = 'Government District', // Lv 50-60
  NEXUS = 'The Nexus', // Lv 60+
}

export interface DistrictMeta {
  id: District;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  district: District;
  minLevel: number;
  type: MissionType;
  difficulty: number; // 1-10
  risk: 'Low' | 'Medium' | 'High' | 'Extreme';
  costEnr: number;
  baseReward: number;
  baseXp: number;
  objectives: string[]; // Specific goals for the AI to reference
  baseSuccessChance: number; // 0.0 - 1.0 (Decimal)
  
  // Phase 3: Assets
  imageUrl?: string; 
}

export interface MissionOutcome {
  success: boolean;
  narrative: string;
  rewards: {
    money: number;
    exp: number;
  };
  penalties: {
    hpLoss: number;
    heatGain: number;
  };
  missionId?: string;
}

export interface MissionDecision {
  id: string;
  label: string; // e.g., "Kick down the door"
  description: string;
  type: 'AGGRESSIVE' | 'STEALTH' | 'DIPLOMATIC' | 'TECH' | 'BALANCED';
  riskModifier: number; // 1.0 = base, 1.2 = higher risk
  rewardModifier: number;
  cost?: number; // Optional $GANG cost for bribes
  reqSkill?: string; // Optional skill ID required
}

export interface MissionScenario {
  narrative: string; // The situation description
  choices: MissionDecision[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  narrative?: string;
  missionResult?: MissionOutcome;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'FAILURE' | 'DANGER' | 'NARRATIVE';
  message: string;
}

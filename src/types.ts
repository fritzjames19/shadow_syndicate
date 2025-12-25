
export enum FactionId {
  IRON_WOLVES = 'IRON_WOLVES',
  JADE_SERPENTS = 'JADE_SERPENTS',
  CRIMSON_VEIL = 'CRIMSON_VEIL',
  CHROME_SAINTS = 'CHROME_SAINTS'
}

export enum ProfessionId {
  ENFORCER = 'ENFORCER',
  HACKER = 'HACKER',
  FIXER = 'FIXER',
  SMUGGLER = 'SMUGGLER'
}

export enum District {
  DOCKS = 'DOCKS',
  NEON_ROW = 'NEON_ROW',
  FURNACE = 'FURNACE',
  GILDED_HEIGHTS = 'GILDED_HEIGHTS',
  SPRAWL = 'SPRAWL',
  CIRCUIT_BAY = 'CIRCUIT_BAY',
  OLD_TOWN = 'OLD_TOWN',
  UNDERCITY = 'UNDERCITY',
  CORPORATE_PLAZA = 'CORPORATE_PLAZA',
  SHADOWS = 'SHADOWS',
  GOVERNMENT = 'GOVERNMENT',
  NEXUS = 'NEXUS'
}

export enum MissionType {
  STORY = 'STORY',
  SIDE_JOB = 'SIDE_JOB',
  CONTRACT = 'CONTRACT'
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  CONSUMABLE = 'CONSUMABLE',
  GADGET = 'GADGET'
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export interface PlayerStats {
  atk: number;
  def: number;
  hp: number;
  maxHp: number;
  enr: number;
  maxEnr: number;
  sta: number;
  maxSta: number;
  lck: number;
  cInt: number;
  heat: number;
}

export interface CrewMember {
  id: string;
  name: string;
  type: string;
  atk: number;
  def: number;
  cost: number;
  upkeep: number;
  isActive: boolean;
  trait?: string;
  traitDescription?: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  bonus: number;
  cost: number;
  description: string;
  imageUrl?: string;
}

export interface MarketItem extends Item {
  currentPrice: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendValue: number; // e.g., 1.2 for +20%
}

export interface MarketState {
  items: MarketItem[];
  lastUpdate: number;
  news: string;
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  gadget: Item | null;
}

export interface Player {
  id: string;
  name: string;
  faction: FactionId;
  profession: ProfessionId;
  level: number;
  xp: number;
  stats: PlayerStats;
  wallet: number;
  crew: CrewMember[];
  day: number;
  inventory: Item[];
  equipment: Equipment;
  
  skillPoints: number;
  unlockedSkills: string[];

  lastEnergyUpdate: number;
  lastStaminaUpdate: number;
  lastHeatUpdate: number;
  
  missionCooldowns: Record<string, number>;
  missionMastery: Record<string, number>;
  
  currentNews: string;
  
  // Daily Reward System
  loginStreak: number;
  lastLoginDate: string; // ISO Date "YYYY-MM-DD"
  badges: string[];

  // Social / System
  redeemedCodes: string[];
  
  portraitUrl?: string;
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
  role: string;
  description: string;
  bonuses: string[];
  uniqueAbility: string;
  color: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  district: District;
  minLevel: number;
  type: MissionType;
  difficulty: number;
  risk: 'Low' | 'Medium' | 'High' | 'Extreme';
  costEnr: number;
  baseReward: number;
  baseXp: number;
  objectives: string[];
  baseSuccessChance: number;
  imageUrl?: string;
}

export interface DistrictMeta {
  id: District;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface SkillEffect {
  type: 'STAT_FLAT' | 'MISSION_BONUS' | 'COMBAT_ABILITY';
  target: string;
  value: number;
  cooldown?: number;
}

export interface Skill {
  id: string;
  name: string;
  tree: 'PROFESSION' | 'COMBAT' | 'OPERATIONS';
  requiredProfession?: ProfessionId;
  description: string;
  cost: number;
  effect: SkillEffect;
}

// COMBAT TYPES
export interface Enemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    type: 'HUMAN' | 'MECH' | 'CYBORG';
    district?: District; // If null, generic enemy
}

export interface CombatLog {
    turn: number;
    message: string;
    type: 'PLAYER_HIT' | 'ENEMY_HIT' | 'INFO' | 'FAILURE' | 'ABILITY';
    damage?: number;
}

export interface CombatState {
    isActive: boolean;
    turnCount: number;
    enemy: Enemy;
    logs: CombatLog[];
    playerDefending: boolean;
    activeEffects: Record<string, number>;
    abilityCooldowns: Record<string, number>;
}

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
  objectives?: string[]; // Dynamic objectives generated during briefing
  
  // New Combat Field
  combatState?: CombatState;
}

export interface HeatEvent {
  id: string;
  playerId: string;
  heatBefore: number;
  heatAfter: number;
  reason: string;
  narrative: string;
  timestamp: number;
}

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
  timestamp: number;
}

export interface DailyRewardResult {
  claimed: boolean;
  streak: number;
  message: string;
  reward?: {
    gang?: number;
    energy?: number;
    badge?: string;
  };
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
  capReached?: boolean;
  objectives?: string[]; // To display which objectives were cleared/failed
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
  objectives?: string[]; // Dynamic objectives generated by AI
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  narrative?: string;
  missionResult?: MissionOutcome;
  combatState?: CombatState;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'FAILURE' | 'DANGER' | 'NARRATIVE';
  message: string;
}

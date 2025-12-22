export const AI_LIMITS = {
  MAX_GLOBAL_CALLS_PER_HOUR: 300,   // Hard safety limit
  MAX_PLAYER_CALLS_PER_HOUR: 30,    // Per-user fairness limit
  CACHE_TTL_SECONDS: 60 * 60,       // 1 hour cache for identical scenarios
  MODEL: "gemini-3-flash-preview"
};
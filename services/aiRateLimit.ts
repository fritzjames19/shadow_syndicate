
import { AI_LIMITS } from "../config/aiLimits";

const globalCalls: number[] = [];
const playerCalls = new Map<string, number[]>();

function pruneOld(arr: number[], windowMs: number) {
  const now = Date.now();
  // Remove timestamps older than the window
  while (arr.length > 0 && now - arr[0] > windowMs) {
    arr.shift();
  }
}

export function canCallGemini(playerId: string): boolean {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;

  // 1. Global Checks
  pruneOld(globalCalls, HOUR);
  if (globalCalls.length >= AI_LIMITS.MAX_GLOBAL_CALLS_PER_HOUR) {
    console.warn("Global AI Rate Limit Hit");
    return false;
  }

  // 2. Player Checks
  if (!playerCalls.has(playerId)) {
    playerCalls.set(playerId, []);
  }
  const calls = playerCalls.get(playerId)!;
  pruneOld(calls, HOUR);

  if (calls.length >= AI_LIMITS.MAX_PLAYER_CALLS_PER_HOUR) {
    console.warn(`Player ${playerId} AI Rate Limit Hit`);
    return false;
  }

  // 3. Record Call
  globalCalls.push(now);
  calls.push(now);
  
  return true;
}

export function getRateLimitStats() {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  
  // Prune before returning stats to ensure accuracy
  pruneOld(globalCalls, HOUR);
  
  let maxPlayerCalls = 0;
  let activeUsers = 0;
  
  playerCalls.forEach((calls, pid) => {
      pruneOld(calls, HOUR);
      if (calls.length > 0) activeUsers++;
      if (calls.length > maxPlayerCalls) maxPlayerCalls = calls.length;
  });

  return {
    globalUsage: globalCalls.length,
    globalLimit: AI_LIMITS.MAX_GLOBAL_CALLS_PER_HOUR,
    maxPlayerUsage: maxPlayerCalls,
    playerLimit: AI_LIMITS.MAX_PLAYER_CALLS_PER_HOUR,
    activeAiUsers: activeUsers
  };
}

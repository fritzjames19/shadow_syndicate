
import { GoogleGenAI } from "@google/genai";
import { Player, Mission, MissionOutcome, MissionType } from "../types";
import { canCallGemini } from "./aiRateLimit";
import { getCached, setCached } from "./aiCache";
import { AI_LIMITS } from "../config/aiLimits";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

interface NarrativeInput {
  success: boolean;
  missionType: MissionType;
  playerStats: {
    atk: number;
    def: number;
    lck: number;
    heat: number;
  };
  context: string;
  objectives: string[];
}

/**
 * Generates the initial mission briefing and refined objectives.
 */
export const generateMissionBriefing = async (
  player: Player, 
  mission: Mission
): Promise<{ narrative: string, objectives: string[] } | null> => {
  if (!process.env.API_KEY) return null;

  const inputData = {
    mission: mission.title,
    district: mission.district,
    description: mission.description,
    staticObjectives: mission.objectives,
    playerClass: player.profession,
    playerFaction: player.faction
  };

  const cached = getCached({ type: 'BRIEFING', ...inputData });
  if (cached) return cached;

  if (!canCallGemini(player.id)) return null;

  const prompt = `
    You are a cyberpunk handler giving a mission briefing.
    
    CONTEXT:
    Mission: ${mission.title} in ${mission.district}.
    Description: ${mission.description}
    Agent: ${player.profession} of ${player.faction}.

    TASK:
    1. Write a short, immersive briefing (max 40 words). Gritty tone.
    2. Rewrite the provided static objectives to fit the specific generated scenario (make them sound tactical/active).

    INPUT OBJECTIVES:
    ${JSON.stringify(mission.objectives)}

    OUTPUT JSON FORMAT:
    {
      "narrative": "string",
      "objectives": ["string", "string", "string"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_LIMITS.MODEL,
      contents: prompt,
      config: { temperature: 0.9, responseMimeType: "application/json" }
    });

    const text = response.text?.trim() || "{}";
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.narrative && Array.isArray(parsed.objectives)) {
      setCached({ type: 'BRIEFING', ...inputData }, parsed);
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn("Briefing generation failed", e);
    return null;
  }
};

/**
 * Generates narrative flavor text based on a mission result.
 * Includes Caching, Rate Limiting, and robust Fallbacks.
 */
export const generateMissionNarrative = async (
  player: Player,
  mission: Mission,
  outcome: Omit<MissionOutcome, 'narrative'>
): Promise<string> => {
  
  // 0. Fallback immediately if no API Key (Local/Dev)
  if (!process.env.API_KEY) {
    return outcome.success 
      ? `[OFFLINE MODE] You executed the ${mission.title} perfectly. The payout was secured.`
      : `[OFFLINE MODE] The ${mission.title} went sideways. You took some hits and had to bail.`;
  }

  // Use the objectives passed in outcome, fallback to mission static objectives
  const objectivesToUse = outcome.objectives || mission.objectives;

  // Prepare Payload for AI & Cache Key
  const inputData: NarrativeInput = {
    success: outcome.success,
    missionType: mission.type,
    playerStats: {
      atk: player.stats.atk,
      def: player.stats.def,
      lck: player.stats.lck,
      heat: player.stats.heat
    },
    context: `Mission: ${mission.title} (${mission.district}).`,
    objectives: objectivesToUse
  };

  // 1. Cache Check
  const cachedNarrative = getCached(inputData);
  if (cachedNarrative) {
    return cachedNarrative;
  }

  // 2. Rate Limit Check
  if (!canCallGemini(player.id)) {
    return "The job resolves quickly. No witnesses, no complications. Another line added to your reputation.";
  }

  // 3. Construct Prompt
  const prompt = `
    Role: Cyberpunk Game Master.
    Task: Write a 1-2 sentence resolution for a mission (Max 45 words).
    
    CONTEXT:
    Mission: ${mission.title}
    Success: ${inputData.success ? 'YES' : 'NO'}
    
    KEY OBJECTIVES:
    ${objectivesToUse.map((o, i) => `${i+1}. ${o}`).join('\n')}
    
    INSTRUCTIONS:
    - Focus on ONE specific objective from the list above.
    - If SUCCESS: Narrate the specific action the agent took to complete that objective.
    - If FAILURE: Narrate exactly how that objective failed (e.g. alarm tripped, target escaped).
    - Tone: Gritty, fast-paced. Do not simply list results.
    
    INPUT DATA:
    ${JSON.stringify(inputData)}
    
    OUTPUT JSON:
    { "narrative": "string" }
  `;

  // 4. Call API
  try {
    const response = await ai.models.generateContent({
      model: AI_LIMITS.MODEL,
      contents: prompt,
      config: {
        temperature: 0.9,
      },
    });

    const text = response.text?.trim() || "{}";
    // Clean up if the model adds markdown despite instructions
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let resultNarrative = "Transmission garbled.";

    try {
      const parsed = JSON.parse(cleanJson);
      if (parsed.narrative) {
        resultNarrative = parsed.narrative;
        // 5. Cache Success
        setCached(inputData, resultNarrative);
      }
    } catch (e) {
      console.warn("Failed to parse AI JSON:", text);
      // Fallback to raw text if it looks like a sentence, otherwise generic
      if (!text.includes('{') && text.length > 10) {
        resultNarrative = text;
      }
    }
    
    return resultNarrative;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // 6. Hard Fallback
    return "The operation concludes without incident. The city forgets, but your crew remembers.";
  }
};

/**
 * Generates atmospheric world news or police scanner updates.
 * Also Rate Limited/Cached.
 */
export const generateNewsUpdate = async (player: Player): Promise<string> => {
    if (!process.env.API_KEY) return "Scanner chatter indicates increased patrols in Sector 4.";

    const inputData = {
      type: 'NEWS_UPDATE',
      heat: Math.floor(player.stats.heat / 10) * 10, // Round to nearest 10 for better caching
      faction: player.faction
    };

    const cached = getCached(inputData);
    if (cached) return cached;

    if (!canCallGemini(player.id)) return "System update: Network traffic nominal.";

    const prompt = `
      Generate a single, short (10-15 words) cyberpunk news headline or police scanner alert.
      Context: Player Heat is ${player.stats.heat}% (${player.stats.heat > 50 ? 'High' : 'Low'}).
      Faction: ${player.faction}.
      Tone: Gritty, Urgent.
    `;

    try {
        const response = await ai.models.generateContent({
            model: AI_LIMITS.MODEL,
            contents: prompt,
            config: { temperature: 1.0 }
        });
        const news = response.text?.trim() || "System update received.";
        setCached(inputData, news);
        return news;
    } catch (e) {
        return "Network interference detected.";
    }
}

/**
 * Generates a market report explaining price fluctuations.
 */
export const generateMarketReport = async (trends: { item: string, direction: 'UP' | 'DOWN' }[]): Promise<string> => {
    if (!process.env.API_KEY) return "Market volatility detected due to local disturbances.";

    const prompt = `
      Write a short (15-20 words) cyberpunk black market news flash explaining these price shifts:
      ${trends.map(t => `${t.item} price went ${t.direction}`).join(', ')}.
      Tone: Underground economic report.
    `;

    try {
        const response = await ai.models.generateContent({
            model: AI_LIMITS.MODEL,
            contents: prompt,
            config: { temperature: 0.8 }
        });
        return response.text?.trim() || "Market prices fluctuating due to corporate intervention.";
    } catch (e) {
        return "Market data link unstable.";
    }
};

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
    objectives: mission.objectives
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
    You are the mission resolution engine for a text-based cyberpunk mafia game.

    RULES:
    - Output JSON only
    - No markdown formatting (no \`\`\`json blocks)
    - Keep narrative gritty, noir-cyberpunk, under 45 words.
    - Use provided input values to color the story.
    - If successful, mention completing specific objectives from the list.
    - If failed, describe how a specific objective was compromised or failed.

    INPUT:
    ${JSON.stringify(inputData)}

    OUTPUT FORMAT:
    {
      "narrative": "string"
    }
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

export type AssetType = 'mission' | 'district' | 'player_portrait' | 'achievement' | 'item';

/**
 * Generates Game Assets (Missions, Players, Districts, Items).
 * USES Gemini 3 Pro Image Preview. High Cost - Admin Only.
 */
export const generateGameImage = async (type: AssetType, context: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key for image generation");
    return null;
  }

  // Specific Prompt Templates per Asset Type
  let prompt = '';
  switch(type) {
      case 'mission':
          prompt = `
Cyberpunk crime management game illustration.
Scene context: ${context}.
Perspective: Cinematic shot or Isometric view suitable for a mission card.
Style: High-fidelity digital art, atmospheric, gritty.
Lighting: Dramatic, reflecting the district's mood (e.g., neon for city, industrial glow for factories).
No text, no UI elements.
`;
          break;
      case 'district':
          prompt = `
Cyberpunk city district environment concept art.
Location: ${context}.
Atmosphere: Immersive, moody, cinematic lighting, volumetric fog.
Style: Realistic digital painting, neon-noir, architectural depth, 8k resolution.
Perspective: Wide angle establishing shot.
No text, no UI, no watermarks, no people.
`;
          break;
      case 'player_portrait':
          prompt = `
Cyberpunk criminal portrait.
${context}.
Character facing forward.
Gritty, realistic, cinematic lighting.
Neon cyberpunk background.
No text, no logos.
`;
          break;
      case 'achievement':
          prompt = `
Cyberpunk achievement trophy icon.
${context}.
Symbolic, futuristic, glowing.
Dark background, neon accents.
Centered object, no text.
`;
          break;
      case 'item':
          prompt = `
Cyberpunk game item icon.
${context}.
Isolated on dark background.
High detail, glowing neon accents.
Digital art style.
No text.
`;
          break;
      default:
          prompt = `Cyberpunk style art. ${context}`;
  }

  try {
    console.log(`Generating [${type}] image with prompt (${size}):`, prompt);
    
    // Use gemini-3-pro-image-preview for high quality images
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size
        }
      }
    });

    // Extract Base64 from content parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        // Return as proper data URI
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("No image data found in response");
    return null;

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    return null;
  }
};
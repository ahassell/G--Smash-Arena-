import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMatchCommentary = async (logs: string[]): Promise<string> => {
  if (logs.length === 0) return "The match is heating up!";

  const recentLogs = logs.slice(-5); // Only take the last 5 events to keep it relevant
  const prompt = `
    You are a high-energy Esports Shoutcaster for a fighting game called "Gemini Smash Arena".
    Based on the following recent match events, provide a short, 1-sentence hype commentary to display on screen.
    Make it sound exciting, like a Smash Bros or Street Fighter announcer.
    
    Events:
    ${recentLogs.map(l => `- ${l}`).join('\n')}

    Keep it under 20 words. ALL CAPS is optional but encouraged for big hits.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "UNBELIEVABLE ACTION!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "TECHNICAL DIFFICULTIES!";
  }
};

export const generateCharacterTrashTalk = async (winnerName: string, loserName: string): Promise<string> => {
  const prompt = `
    Write a short, witty victory quote for a fighting game character named ${winnerName} who just defeated ${loserName}.
    ${winnerName} is a ${winnerName.includes('Neon') ? 'fast cyber-ninja' : 'heavy mecha-robot'}.
    Keep it under 15 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "GG EZ";
  } catch (error) {
    return "Victory is mine!";
  }
};

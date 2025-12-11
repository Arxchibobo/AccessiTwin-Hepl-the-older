import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DeviceAnalysis, ControlType, ControlCategory, ChatMessage, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    deviceName: { type: Type.STRING, description: "Simple name of the device" },
    summary: { type: Type.STRING, description: "One simple sentence about what this is." },
    safetyWarning: { type: Type.STRING, description: "Short, urgent safety warning if needed. Max 10 words." },
    controls: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING, description: "Very short label (1-3 words max)." },
          type: { 
            type: Type.STRING, 
            enum: [
              ControlType.BUTTON,
              ControlType.KNOB,
              ControlType.SWITCH,
              ControlType.DISPLAY
            ] 
          },
          description: { type: Type.STRING, description: "Simple location description (e.g. 'Big red button')." },
          category: { 
            type: Type.STRING, 
            enum: [
              ControlCategory.PRIMARY,
              ControlCategory.SECONDARY,
              ControlCategory.ADVANCED,
              ControlCategory.DANGER
            ] 
          },
          detailText: { type: Type.STRING, description: "Extremely short instruction. ABSOLUTE MAXIMUM 2 LINES. Use simple verbs." }
        },
        required: ["id", "label", "type", "description", "category", "detailText"]
      }
    }
  },
  required: ["deviceName", "summary", "controls"]
};

export const analyzeDeviceImage = async (base64Image: string, mimeType: string = 'image/jpeg', lang: Language = 'en'): Promise<DeviceAnalysis> => {
  const maxRetries = 3;
  let attempt = 0;

  // Adjust system prompt based on language
  const langInstruction = lang === 'zh' ? "OUTPUT IN CHINESE (Simplified)." : 
                          lang === 'es' ? "OUTPUT IN SPANISH." : 
                          "OUTPUT IN ENGLISH.";

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            },
            {
              text: `You are a friendly guide for an elderly person. ${langInstruction}
              
              YOUR GOAL: Simplify a complex device into 1-2 easy steps.

              RULES:
              1. **MAXIMUM 2 SHORT LINES** per instruction. 
              2. Tone: Warm, patient, encouraging. Like a grandchild explaining to a grandparent.
              3. NO JARGON. Use "Press", "Turn", "Stop".
              4. SAFETY: Identify hazards (heat, sharp, electric) immediately.
              
              Tasks:
              1. Identify controls.
              2. For 'detailText': Give the ONE main thing to do with this button.
              3. Categorize: PRIMARY (Start/Stop), DANGER (Reset/Delete), SECONDARY (Everything else).
              `
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          temperature: 0.1 
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      
      return JSON.parse(text) as DeviceAnalysis;

    } catch (error) {
      console.error(`Gemini Analysis Error (Attempt ${attempt + 1}/${maxRetries}):`, error);
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw new Error("Failed to analyze image after multiple attempts");
};

export const chatWithDeviceExpert = async (
  history: ChatMessage[], 
  userMessage: string, 
  analysisContext: DeviceAnalysis,
  lang: Language
): Promise<string> => {
  
  const contextString = JSON.stringify(analysisContext);
  const langInstruction = lang === 'zh' ? "Respond in Chinese (Simplified)." : 
                          lang === 'es' ? "Respond in Spanish." : 
                          "Respond in English.";

  const systemInstruction = `
    You are a helpful, patient AI assistant for an elderly person.
    You have analyzed the device in the photo. Here is the data: ${contextString}.
    
    The user is asking a question about this device.
    ${langInstruction}
    
    Rules:
    1. Keep answers SHORT (max 2-3 sentences).
    2. Be very comforting and clear.
    3. If they ask "What does this button do?", refer to your analysis data.
    4. Do not use technical jargon.
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview', // Using the high-intelligence model as requested
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // Replay history if needed, but for now we just send the new message with context
    // In a real app we might construct the full history object for the chat
    
    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I am sorry, I didn't quite catch that.";

  } catch (error) {
    console.error("Chat Error:", error);
    return "I am having a little trouble thinking right now. Please try again.";
  }
};
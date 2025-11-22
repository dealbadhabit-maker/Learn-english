import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VocabItem } from "../types";
import { decodeBase64, decodeAudioData, playAudioBuffer } from "./audioUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Cache to store decoded audio buffers to avoid repeated API calls
const audioCache = new Map<string, AudioBuffer>();
// Track in-flight requests to deduplicate calls
const pendingRequests = new Map<string, Promise<AudioBuffer>>();

// Singleton AudioContext
let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export const parseVocabularyInput = async (input: string): Promise<VocabItem[]> => {
  if (!apiKey) throw new Error("API Key not found");

  const prompt = `
    Analyze the following text input provided by a user who wants to learn English.
    The input might be a list of words, comma-separated values, or lines containing English and optionally Vietnamese.
    
    Your task:
    1. Extract English phrases/words.
    2. If the Vietnamese meaning is provided, use it.
    3. If the Vietnamese meaning is missing, translate the English phrase to Vietnamese.
    4. Return a clean JSON list.
    
    Input text:
    """
    ${input}
    """
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING },
            vietnamese: { type: Type.STRING }
          },
          required: ["english", "vietnamese"]
        }
      }
    }
  });

  const rawData = JSON.parse(response.text || "[]");
  
  return rawData.map((item: any) => ({
    id: crypto.randomUUID(),
    english: item.english,
    vietnamese: item.vietnamese
  }));
};

// Helper to fetch and decode audio without playing it
async function fetchAudioForText(text: string): Promise<AudioBuffer> {
  if (!apiKey) throw new Error("API Key not found");
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("No audio data returned from Gemini");
  }

  const ctx = getAudioContext();
  const audioBytes = decodeBase64(base64Audio);
  return await decodeAudioData(audioBytes, ctx, 24000, 1);
}

export const prefetchPronunciation = async (text: string): Promise<void> => {
  if (audioCache.has(text)) return;
  
  // Return existing promise if request is already in flight
  if (pendingRequests.has(text)) {
    try {
        await pendingRequests.get(text);
    } catch (e) {
        // Ignore error in duplicate prefetch
    }
    return;
  }
  
  const promise = fetchAudioForText(text)
    .then(buffer => {
        audioCache.set(text, buffer);
        pendingRequests.delete(text);
        return buffer;
    })
    .catch(err => {
        pendingRequests.delete(text);
        throw err;
    });
    
  pendingRequests.set(text, promise);
  
  try {
    await promise;
  } catch (e) {
    console.warn(`Background prefetch failed for: ${text}`, e);
  }
};

export const prefetchAllPronunciations = (items: VocabItem[]) => {
    // Run in background
    (async () => {
        const limit = Math.min(items.length, 20);
        for (let i = 0; i < limit; i++) {
            // Chain requests with small delay to respect rate limits and network priority
            await prefetchPronunciation(items[i].english);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    })();
};

export const playPronunciation = async (text: string): Promise<void> => {
  const ctx = getAudioContext();
  let audioBuffer: AudioBuffer;

  // Check cache first for instant playback
  if (audioCache.has(text)) {
    audioBuffer = audioCache.get(text)!;
  } else if (pendingRequests.has(text)) {
    // Wait for pending request
    audioBuffer = await pendingRequests.get(text)!;
  } else {
    // Fetch explicitly if not cached or pending
    const promise = fetchAudioForText(text)
        .then(buffer => {
            audioCache.set(text, buffer);
            pendingRequests.delete(text);
            return buffer;
        })
        .catch(err => {
            pendingRequests.delete(text);
            throw err;
        });
    pendingRequests.set(text, promise);
    audioBuffer = await promise;
  }

  await playAudioBuffer(audioBuffer, ctx);
};
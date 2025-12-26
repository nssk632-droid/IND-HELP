
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ChatMessage, AspectRatio } from "../types";

// Base decoding/encoding utilities
export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const getSafetyAdvice = async (message: string, useThinking: boolean = false) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: "You are 'Indie', a professional safety and emergency expert in India. Provide concise, lifesaving steps.",
    tools: useThinking ? [] : [{ googleSearch: {} }]
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model,
    contents: message,
    config,
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const getQuickTip = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: "Give a one-sentence safety tip for a random emergency scenario in India (e.g., heatstroke, monsoon safety, road safety). Be very brief.",
  });
  return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: `Safety illustration for: ${prompt}. Cinematic style.` }] },
    config: { imageConfig: { aspectRatio, imageSize: "1K" } },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const generateVideo = async (imageB64: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || 'Animate this safety procedure realistically',
    image: { imageBytes: imageB64.split(',')[1], mimeType: 'image/png' },
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const link = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${link}&key=${process.env.API_KEY}`;
};

export const generateTTS = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const transcribeAudio = async (base64Audio: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'audio/pcm;rate=16000', data: base64Audio } },
        { text: "Transcribe this audio exactly. If empty, say 'No audio detected'." }
      ]
    },
  });
  return response.text;
};

export const findNearbyServices = async (serviceType: string, location: { lat: number; lng: number } | null) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const config: any = { tools: [{ googleMaps: {} }] };
  if (location) {
    config.toolConfig = { retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } } };
  }
  
  // Enhanced prompt to get numbers and verify 'live' proximity
  const prompt = `Strictly find the 3 closest official ${serviceType} facilities near me in India. For each, identify their official emergency phone number and current operational status. Emphasize tracking for medical emergencies.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });
  
  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

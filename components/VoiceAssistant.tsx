
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { ICONS } from '../constants';
import { decode, decodeAudioData, encode } from '../services/geminiService';

const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const b64 = encode(new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: b64, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsActive(true);
          },
          onmessage: async (msg: any) => {
            const audioB64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioB64) {
              const buf = await decodeAudioData(decode(audioB64), outputCtx, 24000, 1);
              const src = outputCtx.createBufferSource();
              src.buffer = buf;
              src.connect(outputCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              src.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buf.duration;
              sourcesRef.current.add(src);
              src.onended = () => sourcesRef.current.delete(src);
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are a helpful emergency voice assistant. Keep answers brief and calm.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsActive(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-6 bg-slate-900 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Live Voice Help</h2>
        <p className="text-slate-400 text-sm mt-2">Natural conversation for urgent help</p>
      </div>

      <div className="relative">
        <div className={`absolute -inset-8 rounded-full bg-red-600/20 blur-2xl animate-pulse ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
        <button 
          onClick={isActive ? stopSession : startSession}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${isActive ? 'bg-red-600' : 'bg-slate-800 border-2 border-slate-700'}`}
        >
          {isActive ? <ICONS.Stop className="w-12 h-12" /> : <ICONS.Mic className="w-12 h-12 text-red-500" />}
        </button>
      </div>

      <div className="text-center space-y-2">
        <p className={`font-medium ${isActive ? 'text-red-500' : 'text-slate-500'}`}>
          {isActive ? 'Listening...' : 'Tap to start conversation'}
        </p>
        {isActive && (
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-1 bg-red-500 rounded-full animate-bounce h-4`} style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-xs bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
        <p className="text-xs text-slate-400 italic">"Indie, I have a cut on my leg, what should I do?"</p>
      </div>
    </div>
  );
};

export default VoiceAssistant;

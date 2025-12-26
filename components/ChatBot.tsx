
import React, { useState, useRef, useEffect } from 'react';
import { getSafetyAdvice, generateTTS, decode, decodeAudioData } from '../services/geminiService';
import { ChatMessage, GroundingChunk } from '../types';
import { ICONS } from '../constants';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<(ChatMessage & { grounding?: GroundingChunk[] })[]>([
    { role: 'model', text: "Hello! I'm Indie. How can I help? I can now use 'Thinking Mode' for complex questions." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { text, grounding } = await getSafetyAdvice(input, useThinking);
      setMessages(prev => [...prev, { role: 'model', text, grounding, isThinking: useThinking }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Error. Please call 112." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      const data = await generateTTS(text);
      if (data) {
        const ctx = new AudioContext();
        const buf = await decodeAudioData(decode(data), ctx, 24000, 1);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center">
          <div className="bg-red-100 p-2 rounded-lg mr-3"><ICONS.Bot className="text-red-600" /></div>
          <div>
            <h2 className="font-bold text-slate-800">Indie AI</h2>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        <button 
          onClick={() => setUseThinking(!useThinking)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${useThinking ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
        >
          <ICONS.Brain className="w-3.5 h-3.5" />
          <span>{useThinking ? 'Thinking ON' : 'Thinking Mode'}</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl text-sm ${
              m.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 shadow-sm'
            }`}>
              {m.isThinking && <div className="text-[10px] text-indigo-500 font-bold mb-1 flex items-center"><ICONS.Sparkle className="w-3 h-3 mr-1" /> ANALYZED WITH DEEP REASONING</div>}
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {m.grounding && m.grounding.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sources</p>
                  {m.grounding.map((chunk, ci) => chunk.web && (
                    <a key={ci} href={chunk.web.uri} target="_blank" className="block text-[10px] text-blue-600 underline truncate">
                      {chunk.web.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'model' && (
              <button onClick={() => speakText(m.text)} className="mt-1 p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                <ICONS.Speaker className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="bg-white/50 p-4 rounded-xl border border-slate-100 flex items-center space-x-3">
             <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-xs text-slate-500 italic">{useThinking ? 'Reasoning through complexity...' : 'Fetching latest data...'}</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t pb-24">
        <div className="flex items-center space-x-2 bg-slate-100 rounded-2xl px-4">
          <input
            type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent py-4 focus:outline-none text-sm"
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-2 bg-red-600 text-white rounded-xl active:scale-95 transition-all">
            <ICONS.Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

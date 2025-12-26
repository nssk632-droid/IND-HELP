
import React, { useState } from 'react';
import { generateImage, generateVideo } from '../services/geminiService';
import { ICONS } from '../constants';
import { AspectRatio } from '../types';

const MediaLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const ratios: AspectRatio[] = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

  const handleGenerateImage = async () => {
    setLoading(true);
    try {
      if (!(window as any).aistudio?.hasSelectedApiKey()) {
        await (window as any).aistudio?.openSelectKey();
      }
      const res = await generateImage(prompt, aspectRatio);
      setImage(res);
      setStep(2);
    } catch (e) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
        await (window as any).aistudio?.openSelectKey();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnimate = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const res = await generateVideo(image, prompt);
      setVideo(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 pb-24 space-y-6">
      <div className="text-center py-4">
        <h2 className="text-xl font-bold text-slate-900">Safety Media Lab</h2>
        <p className="text-xs text-slate-500">Create visual aids with AI</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Describe the safety scene</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 ring-red-100 outline-none h-24"
            placeholder="E.g., Proper way to wrap a bandage around a forearm..."
          />
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {ratios.map(r => (
                <button
                  key={r} onClick={() => setAspectRatio(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${aspectRatio === r ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={!prompt.trim() || loading}
            onClick={handleGenerateImage}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ICONS.Sparkle className="w-5 h-5" />}
            <span>{loading ? 'Generating...' : 'Generate Illustration'}</span>
          </button>
        </div>

        {image && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <img src={image} className="w-full rounded-xl shadow-md" alt="Generated safety aid" />
            {!video && (
              <button 
                onClick={handleAnimate} disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                <ICONS.Movie className="w-5 h-5" />
                <span>Animate with Veo AI</span>
              </button>
            )}
          </div>
        )}

        {video && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 animate-in fade-in">
            <label className="text-xs font-bold text-indigo-600 uppercase">Procedural Video</label>
            <video src={video} controls className="w-full rounded-xl shadow-md" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLab;

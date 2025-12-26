
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import { EMERGENCY_NUMBERS, ICONS } from './constants';
import EmergencyCard from './components/EmergencyCard';
import ChatBot from './components/ChatBot';
import NearbyServices from './components/NearbyServices';
import VoiceAssistant from './components/VoiceAssistant';
import MediaLab from './components/MediaLab';
import { getQuickTip } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [sosActive, setSosActive] = useState(false);
  const [quickTip, setQuickTip] = useState('Safety First.');

  useEffect(() => {
    getQuickTip().then(setQuickTip).catch(console.error);
  }, []);

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `EMERGENCY! I need help. My current location is: ${mapsUrl}`;
        // In a real app we'd use SMS API or a contact picker, for now SMS link
        window.location.href = `sms:?body=${encodeURIComponent(message)}`;
      }, (err) => alert("Please enable GPS for location sharing."));
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <div className="p-4 pb-32 space-y-6">
            <div className="flex justify-between items-center py-2">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">IND HELP</h1>
                <p className="text-xs font-medium text-red-500 italic">{quickTip}</p>
              </div>
              <button 
                onClick={handleShareLocation}
                className="w-12 h-12 bg-white shadow-md border border-slate-100 rounded-2xl flex items-center justify-center text-red-600 active:scale-90 transition-transform"
                title="Share Location"
              >
                <ICONS.Location className="w-6 h-6" />
              </button>
            </div>

            <div className="relative py-6 flex justify-center">
              <button 
                onMouseDown={() => setSosActive(true)}
                onMouseUp={() => setSosActive(false)}
                onTouchStart={() => setSosActive(true)}
                onTouchEnd={() => setSosActive(false)}
                className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl active:scale-90 ${
                  sosActive ? 'bg-red-700 scale-95 ring-8 ring-red-100' : 'bg-red-600'
                }`}
              >
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                <span className="text-white text-5xl font-black mb-1">SOS</span>
                <span className="text-red-100 text-[10px] font-bold uppercase tracking-widest">Hold to Alert</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setCurrentView(AppView.VOICE_LIVE)}
                className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg cursor-pointer flex flex-col items-center justify-center space-y-2 border border-slate-700"
              >
                <ICONS.Mic className="w-8 h-8 text-red-500" />
                <span className="text-xs font-bold">Live Voice</span>
              </div>
              <div 
                onClick={() => setCurrentView(AppView.MEDIA_LAB)}
                className="bg-white text-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <ICONS.Sparkle className="w-8 h-8 text-indigo-600" />
                <span className="text-xs font-bold">Media Lab</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Quick Dialer</h2>
              <div className="grid gap-3">
                {EMERGENCY_NUMBERS.slice(0, 4).map(num => <EmergencyCard key={num.id} data={num} />)}
              </div>
            </div>
          </div>
        );
      case AppView.AI_ASSISTANT: return <ChatBot />;
      case AppView.VOICE_LIVE: return <VoiceAssistant />;
      case AppView.NEARBY: return <NearbyServices />;
      case AppView.MEDIA_LAB: return <MediaLab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto bg-slate-50">{renderContent()}</div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-200 px-4 py-4 flex justify-between items-center z-50 rounded-t-3xl shadow-xl">
        <button onClick={() => setCurrentView(AppView.DASHBOARD)} className={`flex flex-col items-center space-y-1 ${currentView === AppView.DASHBOARD ? 'text-red-600' : 'text-slate-400'}`}>
          <ICONS.Home className="w-6 h-6" /><span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setCurrentView(AppView.AI_ASSISTANT)} className={`flex flex-col items-center space-y-1 ${currentView === AppView.AI_ASSISTANT ? 'text-red-600' : 'text-slate-400'}`}>
          <ICONS.Bot className="w-6 h-6" /><span className="text-[10px] font-bold">Indie AI</span>
        </button>
        <button onClick={() => setCurrentView(AppView.VOICE_LIVE)} className={`flex flex-col items-center space-y-1 ${currentView === AppView.VOICE_LIVE ? 'text-red-600' : 'text-slate-400'}`}>
          <ICONS.Mic className="w-6 h-6" /><span className="text-[10px] font-bold">Live</span>
        </button>
        <button onClick={() => setCurrentView(AppView.NEARBY)} className={`flex flex-col items-center space-y-1 ${currentView === AppView.NEARBY ? 'text-red-600' : 'text-slate-400'}`}>
          <ICONS.Map className="w-6 h-6" /><span className="text-[10px] font-bold">Nearby</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

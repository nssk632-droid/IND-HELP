
import React, { useState, useEffect } from 'react';
import { findNearbyServices } from '../services/geminiService';
import { ICONS } from '../constants';
import { GroundingChunk } from '../types';

const NearbyServices: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<{ text: string; links: GroundingChunk[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Hospital' | 'Police Station' | 'Pharmacy'>('Hospital');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error("Geolocation denied", err),
      { enableHighAccuracy: true }
    );
  }, []);

  const handleSearch = async (type: string) => {
    setLoading(true);
    setResults(null);
    try {
      const data = await findNearbyServices(type, location);
      setResults({ text: data.text, links: data.groundingChunks });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(activeTab);
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">LIVE TRACKER</h2>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Real-time Emergency Locators</p>
          </div>
          {location && (
            <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] font-bold text-green-700 uppercase">GPS Active</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {(['Hospital', 'Police Station', 'Pharmacy'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                activeTab === tab 
                ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-200' 
                : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
        {!location && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3">
            <ICONS.AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">GPS Access Required</p>
              <p className="text-[10px] text-amber-700">Enable location for accurate tracking of the nearest {activeTab.toLowerCase()}s.</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute top-0 w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning Nearby {activeTab}s...</p>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">AI Status Report</h3>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {results.text}
              </div>
            </div>

            {/* Structured Cards */}
            {results.links.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">Verified Locations</h3>
                {results.links.map((chunk, i) => chunk.maps && (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-3xl border-2 border-slate-50 shadow-md hover:border-red-100 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                           <div className="w-8 h-8 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                              {activeTab === 'Hospital' ? '🏥' : activeTab === 'Pharmacy' ? '💊' : '👮'}
                           </div>
                           <h4 className="font-black text-slate-800 leading-tight truncate max-w-[180px]">{chunk.maps.title}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Verified</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`tel:112`} // Fallback to 112 as official number extraction is context-heavy
                        className="flex items-center justify-center py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase space-x-2 active:scale-95 transition-transform"
                      >
                        <ICONS.Phone className="w-4 h-4" />
                        <span>Call Service</span>
                      </a>
                      <a
                        href={chunk.maps.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center py-3 bg-red-600 text-white rounded-2xl text-[10px] font-bold uppercase space-x-2 active:scale-95 transition-transform shadow-lg shadow-red-200"
                      >
                        <ICONS.Map className="w-4 h-4" />
                        <span>Live Track</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <ICONS.Search className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Select category to scan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyServices;

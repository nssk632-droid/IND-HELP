
import React from 'react';
import { EmergencyNumber } from '../types';
import { ICONS } from '../constants';

interface Props {
  data: EmergencyNumber;
}

const EmergencyCard: React.FC<Props> = ({ data }) => {
  const handleCall = () => {
    window.location.href = `tel:${data.number}`;
  };

  return (
    <div 
      onClick={handleCall}
      className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-red-200 transition-all cursor-pointer group active:scale-95"
    >
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl ${data.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
        {data.icon}
      </div>
      <div className="ml-4 flex-1">
        <h3 className="font-bold text-slate-800">{data.name}</h3>
        <p className="text-xs text-slate-500">{data.description}</p>
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-slate-900">{data.number}</span>
        <div className="flex items-center justify-end text-red-500 mt-1">
          <ICONS.Phone className="w-4 h-4 mr-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Call Now</span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCard;

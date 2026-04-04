import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const DisruptionMap: React.FC = () => {
  const navigate = useNavigate();
  const zones = [
    { name: 'Velachery', d: 'M180 200 L240 195 L250 240 L200 250 L175 235 Z', fill: '#1D4ED8', opacity: 0.7, events: 2, workers: 12, active: true },
    { name: 'Adyar', d: 'M120 230 L175 235 L170 270 L125 268 Z', fill: '#3B82F6', opacity: 0.5, events: 1, workers: 7 },
    { name: 'T Nagar', d: 'M140 150 L200 148 L205 195 L140 200 Z', fill: '#7C3AED', opacity: 0.4, events: 0, workers: 0 },
    { name: 'Anna Nagar', d: 'M60 60 L140 55 L145 140 L60 145 Z', fill: '#E5E1FF', opacity: 0.8, events: 0, workers: 0 },
    { name: 'Guindy', d: 'M145 170 L200 168 L205 200 L148 200 Z', fill: '#E5E1FF', opacity: 0.8, events: 0, workers: 0 },
    { name: 'Sholinganallur', d: 'M250 200 L310 195 L315 240 L255 245 Z', fill: '#E5E1FF', opacity: 0.8, events: 0, workers: 0 },
    { name: 'Tambaram', d: 'M175 270 L250 268 L252 300 L177 302 Z', fill: '#E5E1FF', opacity: 0.8, events: 0, workers: 0 },
    { name: 'Perambur', d: 'M240 50 L310 48 L312 130 L242 132 Z', fill: '#E5E1FF', opacity: 0.8, events: 0, workers: 0 },
    { name: 'Porur', d: 'M60 150 L135 148 L140 200 L65 200 Z', fill: '#E5E1FF', opacity: 0.8, events: 0, workers: 0 },
    { name: 'Chromepet', d: 'M120 268 L175 268 L175 305 L122 305 Z', fill: '#E5E1FF', opacity: 0.8, events: 0, workers: 0 },
  ];

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/claims')} aria-label="Back" className="w-10 h-10 rounded-full hover:bg-background flex items-center justify-center"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-textPrimary">Disruption Map</h1>
          <p className="text-xs text-textSecondary">Chennai — Real-time zone status</p>
        </div>
        <span className="bg-danger text-white text-xs font-bold px-2 py-1 rounded-pill">2 active</span>
      </div>

      {/* SVG Map */}
      <div className="bg-white rounded-card shadow-card overflow-hidden mb-4">
        <svg viewBox="0 0 380 330" width="100%" height="260" className="block">
          {zones.map(z => (
            <g key={z.name}>
              <path d={z.d} fill={z.fill} fillOpacity={z.opacity} stroke="white" strokeWidth="1.5" />
              <text x={0} y={0} fontSize="9" fill="#1A1033" textAnchor="middle" dominantBaseline="middle" transform={`translate(${z.d.match(/\d+/g)!.map(Number).filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / (z.d.match(/\d+/g)!.length / 2)}, ${z.d.match(/\d+/g)!.map(Number).filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) / (z.d.match(/\d+/g)!.length / 2)})`}>
                {z.name}
              </text>
            </g>
          ))}
          {/* Worker marker — Velachery pulsing dot */}
          <motion.circle cx="212" cy="222" r="8" fill="#FF5722" fillOpacity={0.3}
            animate={{ r: [8, 13, 8] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <circle cx="212" cy="222" r="5" fill="#FF5722" />
        </svg>
      </div>

      {/* Active Events */}
      <div className="space-y-2 mb-4">
        {[
          { type: 'STFI', zone: 'Velachery', level: 'Flood Level 4', status: 'Active' },
          { type: 'STFI', zone: 'Adyar', level: 'Flood Level 2', status: 'Active' },
        ].map((e, i) => (
          <div key={i} className="bg-white rounded-card shadow-card p-3 flex justify-between items-center">
            <div>
              <span className={`text-xs font-bold mr-2 px-2 py-0.5 rounded-pill ${e.type === 'STFI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{e.type}</span>
              <span className="text-sm font-semibold text-textPrimary">{e.zone}</span>
              <p className="text-xs text-textSecondary mt-0.5">{e.level}</p>
            </div>
            <span className="bg-danger/10 text-danger text-xs font-bold px-2 py-1 rounded-pill">{e.status}</span>
          </div>
        ))}
      </div>

      {/* Data sources */}
      <div className="flex gap-3 flex-wrap">
        {['OpenMeteo ✓', 'NDMA ✓', 'NewsAPI ✓', 'Google Maps ✓'].map(s => (
          <span key={s} className="text-xs bg-success/10 text-success font-medium px-2 py-1 rounded-pill border border-success">{s}</span>
        ))}
      </div>
    </div>
  );
};

export default DisruptionMap;

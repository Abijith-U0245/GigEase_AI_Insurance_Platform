import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Zap, Calendar, CloudRain, Newspaper, Crosshair } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Load token from environment variable (never hardcode secrets)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const ZONES = {
  VELACHERY: { lat: 12.9782, lon: 80.2209 },
  T_NAGAR: { lat: 13.0418, lon: 80.2341 },
  ADYAR: { lat: 13.0012, lon: 80.2565 },
  SHOLINGANALLUR: { lat: 12.9010, lon: 80.2279 },
  GUINDY: { lat: 13.0067, lon: 80.2206 },
  ANNA_NAGAR: { lat: 13.0850, lon: 80.2101 },
  TAMBARAM: { lat: 12.9249, lon: 80.1000 },
  PORUR: { lat: 13.0359, lon: 80.1566 }
};

export default function PremiumToggle() {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SIMULATE'>('LIVE');
  const [state] = useState('Tamil Nadu');
  const [city] = useState('Chennai');
  const [zoneId, setZoneId] = useState('VELACHERY');
  const [simMonth, setSimMonth] = useState<number>(new Date().getMonth() + 1);

  const [hasCalculated, setHasCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [newsData, setNewsData] = useState<any>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const coords = ZONES[zoneId as keyof typeof ZONES];
    if (activeTab === 'LIVE') {
      if (mapContainer.current && !map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [coords.lon, coords.lat],
          zoom: 14,
          interactive: false
        });
        marker.current = new mapboxgl.Marker({ color: '#FF5722' })
          .setLngLat([coords.lon, coords.lat])
          .addTo(map.current);
          
        map.current.on('load', () => {
          map.current?.resize();
        });
      } else if (map.current) {
        // Just panning to new coords
        map.current.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
        marker.current?.setLngLat([coords.lon, coords.lat]);
        // Slight delay to ensure resize works after becoming visible
        setTimeout(() => map.current?.resize(), 100);
      }
    }
  }, [activeTab, zoneId]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'LIVE'
        ? `http://localhost:8000/api/realtime/premium/${zoneId}`
        : `http://localhost:8000/api/simulation/premium/${zoneId}/${simMonth}`;
      
      const res = await fetch(url);
      if (res.ok) setData(await res.json());

      const newsRes = await fetch(`http://localhost:8000/api/news/zone/${zoneId}`);
      if (newsRes.ok) setNewsData(await newsRes.json());
      
      setHasCalculated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 w-full p-4 h-full">
      {/* LEFT PANEL: INPUT FORM */}
      <div className="w-1/3 bg-[#121212] border border-white/10 rounded-2xl flex flex-col overflow-hidden h-[85vh]">
        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'LIVE' ? 'bg-[#FF5722]/10 text-[#FF5722] border-b-2 border-[#FF5722]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Zap size={16} /> REAL-TIME
          </button>
          <button
            onClick={() => setActiveTab('SIMULATE')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'SIMULATE' ? 'bg-[#2196F3]/10 text-[#2196F3] border-b-2 border-[#2196F3]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Calendar size={16} /> SIMULATE
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <label className="text-xs text-zinc-400 font-bold uppercase block mb-1">State</label>
              <select className="w-full bg-[#1A1A1A] border border-white/10 rounded p-3 text-white appearance-none cursor-not-allowed opacity-80" disabled>
                <option>{state}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-bold uppercase block mb-1">City</label>
              <select className="w-full bg-[#1A1A1A] border border-white/10 rounded p-3 text-white appearance-none cursor-not-allowed opacity-80" disabled>
                <option>{city}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-bold uppercase block mb-1">Region / Zone</label>
              <select 
                value={zoneId} 
                onChange={e => setZoneId(e.target.value)} 
                className="w-full bg-[#1A1A1A] border border-white/30 rounded p-3 text-white"
              >
                {Object.keys(ZONES).map(z => <option key={z} value={z}>{z.replace('_', ' ')}</option>)}
              </select>
            </div>

            {activeTab === 'SIMULATE' && (
              <div>
                <label className="text-xs text-zinc-400 font-bold uppercase block mb-1">Select Month</label>
                <select 
                  value={simMonth} 
                  onChange={e => setSimMonth(Number(e.target.value))} 
                  className="w-full bg-[#1A1A1A] border border-[#2196F3]/50 rounded p-3 text-white"
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Map Preview for Realtime */}
            <div className={`mt-4 ${activeTab === 'LIVE' ? 'block' : 'hidden'}`}>
              <label className="text-xs text-zinc-400 font-bold flex items-center justify-between uppercase mb-1">
                <span>Current GPS Coordinates</span>
                <Crosshair size={12} className="text-[#FF5722]" />
              </label>
              <div className="w-full h-32 rounded-lg overflow-hidden border border-white/10 mb-2 relative">
                <div ref={mapContainer} className="w-full h-full" />
              </div>
              <div className="flex gap-4 text-xs font-mono text-zinc-500">
                <span>Lat: {ZONES[zoneId as keyof typeof ZONES].lat.toFixed(4)}</span>
                <span>Lon: {ZONES[zoneId as keyof typeof ZONES].lon.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleCalculate}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-colors text-white ${activeTab === 'LIVE' ? 'bg-[#FF5722] hover:bg-[#E64A19]' : 'bg-[#2196F3] hover:bg-[#1976D2]'}`}
          >
            {loading ? "CALCULATING..." : "CALCULATE ML PREMIUM"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: OUTPUT */}
      <div className="w-2/3 bg-[#121212] border border-white/10 rounded-2xl p-6 overflow-y-auto h-[85vh]">
        {!hasCalculated ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600">
            <Zap size={48} className="mb-4 opacity-20" />
            <h2 className="text-xl font-medium text-zinc-400">Waiting for calculation</h2>
            <p className="text-sm mt-2">Select your inputs on the left and click calculate to view ML model outputs.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="flex justify-between items-start border-b border-white/10 pb-6">
              <div>
                <h3 className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mb-1">
                  {activeTab === 'LIVE' ? 'Real-Time Evaluated Premium' : `Simulated Projection: ${data?.month_name}`}
                </h3>
                <div className="flex items-end gap-3 mt-2">
                  <span className="text-5xl font-bold font-mono text-white">₹{data?.weekly_premium_inr}</span>
                  <span className="text-zinc-500 text-sm mb-2 line-through">₹{data?.base_premium || 150}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-4 py-1.5 rounded text-sm font-bold inline-flex mb-2 ${data?.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : data?.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'}`}>
                  {data?.risk_level} RISK ZONE
                </div>
                <div className="text-sm text-zinc-400">ML Risk Score: <span className="font-mono text-white">{data?.risk_score?.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left col: Weather details */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                <h4 className="flex items-center gap-2 font-medium text-white mb-4"><CloudRain size={18} className="text-[#2196F3]" /> Weather Parameters</h4>
                
                {activeTab === 'LIVE' ? (
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Current Temp</span><span className="text-white">{data?.weather_live?.temp_avg_celsius}°C</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Humidity</span><span className="text-white">{data?.weather_live?.humidity_avg_pct}%</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">1H Rainfall</span><span className="text-white">{data?.weather_live?.rainfall_1h_mm} mm</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Wind Speed</span><span className="text-white">{data?.weather_live?.wind_speed_kmh || data?.weather_live?.wind_speed_avg_kmh} km/h</span></div>
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Avg Month Temp</span><span className="text-white">{data?.historical_weather?.temp_avg_celsius}°C</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Avg Humidity</span><span className="text-white">{data?.historical_weather?.humidity_avg_pct}%</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Accum Rainfall</span><span className="text-white">{data?.historical_weather?.rainfall_mm} mm</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Max Daily Rain</span><span className="text-white">{data?.historical_weather?.max_daily_rainfall_mm?.toFixed(1)} mm</span></div>
                  </div>
                )}
              </div>

              {/* Right col: ML Explanation */}
              <div className="bg-[#FF5722]/5 border border-[#FF5722]/20 rounded-xl p-5">
                <h4 className="flex items-center gap-2 font-medium text-[#FF5722] mb-3"><Zap size={18} /> RAG Analysis</h4>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">{data?.llm_explanation}</p>
                
                <h5 className="text-xs font-semibold text-zinc-500 uppercase">SHAP Importance</h5>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data?.shap_explanation?.map((feat: string, i: number) => (
                    <span key={i} className="bg-white/10 text-xs px-2 py-1 rounded text-white font-mono">{feat}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* News API Feed */}
            {newsData && (
              <div className="mt-6 border border-white/10 rounded-xl p-5 bg-[#171717]">
                <h4 className="flex items-center justify-between font-medium text-white mb-4">
                  <span className="flex items-center gap-2"><Newspaper size={18} className="text-zinc-400" /> Regional News ({zoneId})</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${newsData.rsmd_alert ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>RSMD Score: {(newsData.rsmd_news_score * 100).toFixed(0)}%</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newsData.articles?.slice(0, 4).map((a: any, i: number) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block bg-[#222] hover:bg-[#2A2A2A] transition p-3 rounded-lg border border-white/5">
                      <p className="text-sm font-medium text-white mb-1 line-clamp-1">{a.title}</p>
                      <p className="text-xs text-zinc-500 line-clamp-2">{a.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

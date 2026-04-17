import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Activity, User, AlertTriangle } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Make sure token is set
mapboxgl.accessToken = 'pk.eyJ1IjoidGFydW5hYWRhcnNoIiwiYSI6ImNtbzMwYm1lOTBjdTgycXNsdmo3ZXltcm0ifQ.YghjqpNKKh2qySKyB6wnYw';

interface RoutePoint {
  lat: number;
  lon: number;
  timestamp: number;
  computed_speed_kmh: number;
  is_speed_violation: boolean;
  is_jump: boolean;
}

export default function FraudMapAdmin() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [workers, setWorkers] = useState<any[]>([]);
  const [activeWorker, setActiveWorker] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isSpoofing, setIsSpoofing] = useState(false);
  
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Fetch active workers
  useEffect(() => {
    fetch(`http://localhost:8000/api/fraud-map/active-workers`)
      .then(res => res.json())
      .then(data => {
        setWorkers(data.workers);
        if (data.workers.length > 0) setActiveWorker(data.workers[0].worker_id);
      })
      .catch(e => console.error(e));
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [80.2209, 12.9782],
      zoom: 13
    });

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      map.current?.remove(); 
    };
  }, []);

  // Fetch and draw route when worker changes
  useEffect(() => {
    if (!activeWorker || !map.current) return;

    const fetchRoute = async () => {
      try {
        setIsSpoofing(false);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

        // Fetch demo route with jumps if this worker has a high fraud score
        const workerData = workers.find(w => w.worker_id === activeWorker);
        const useFraud = workerData?.fraud_score > 0.5;
        
        const res = await fetch(`http://localhost:8000/api/fraud-map/worker-path/${activeWorker}?fraud_demo=${useFraud}`);
        const data = await res.json();
        setRouteInfo(data);

        const path: RoutePoint[] = data.path;
        if (!path || path.length === 0) return;

        // Draw the static polyline
        const routeCoordinates = path.map(p => [p.lon, p.lat]);
        if (map.current!.getSource('route')) {
          (map.current!.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: routeCoordinates },
            properties: {}
          });
        } else {
          map.current!.addSource('route', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoordinates }, properties: {} }
          });
          map.current!.addLayer({
            id: 'route', type: 'line', source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#2196F3', 'line-width': 4, 'line-opacity': 0.8 }
          });
        }

        map.current!.flyTo({ center: routeCoordinates[0] as [number, number], zoom: 14 });

        // Add the animated scooter marker
        if (markerRef.current) markerRef.current.remove();
        const el = document.createElement('div');
        el.className = 'w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[0_0_10px_#FF5722]';
        el.innerHTML = '<div class="w-2.5 h-2.5 bg-[#FF5722] rounded-full"></div>';
        markerRef.current = new mapboxgl.Marker(el).setLngLat(routeCoordinates[0] as [number, number]).addTo(map.current!);

        // Animate movement along the polyline
        startAnimation(path);
      } catch (e) {
        console.error(e);
      }
    };
    
    // Wait for map style to load if it's fresh
    if (map.current.isStyleLoaded()) {
      fetchRoute();
    } else {
      map.current.once('styledata', fetchRoute);
    }
  }, [activeWorker, workers]);

  const startAnimation = (path: RoutePoint[]) => {
    let currentSegment = 0;
    let progress = 0;
    const speed = 0.02; // progress per frame

    const animate = () => {
      if (currentSegment >= path.length - 1) {
        // restart logic for continuous demo
        currentSegment = 0;
        progress = 0;
        setIsSpoofing(false);
      }

      const p1 = path[currentSegment];
      const p2 = path[currentSegment + 1];

      // Detect spoofing on this segment
      if (p2.is_jump || p2.computed_speed_kmh > 150) {
        setIsSpoofing(true);
        // jump immediately
        progress = 1;
      }

      // Calculate intermediate lat/lon
      const t = progress;
      const lon = p1.lon + (p2.lon - p1.lon) * t;
      const lat = p1.lat + (p2.lat - p1.lat) * t;

      markerRef.current?.setLngLat([lon, lat]);

      progress += speed;
      if (progress >= 1) {
        currentSegment++;
        progress = 0;
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();
  };

  return (
    <div className="flex h-full bg-[#080808] h-[85vh]">
      {/* Sidebar List of Workers */}
      <div className="w-80 bg-[#121212] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <ShieldAlert size={20} className="text-[#FF5722]" /> Fraud Monitor
          </h2>
          <p className="text-zinc-500 text-sm">Active Riders: {workers.length}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {workers.map((w) => (
            <button
              key={w.worker_id}
              onClick={() => setActiveWorker(w.worker_id)}
              className={`w-full text-left p-4 border-b border-white/5 flex items-center gap-3 transition-colors ${activeWorker === w.worker_id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${w.fraud_score > 0.5 ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-green-500 text-green-500 bg-green-500/10'}`}>
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate">{w.worker_name} <span className="text-zinc-500 text-xs font-mono ml-1">({w.worker_id})</span></div>
                <div className="text-zinc-500 text-xs">{w.zone_id} • Score: {w.fraud_score.toFixed(2)}</div>
              </div>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${w.fraud_action === 'AUTO_APPROVE' ? 'text-green-500' : 'text-red-500'}`}>
                {w.fraud_action.replace('_', '\\n')} {/* Replace to split line, handled by css or we just leave space */}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Fraudulent Action Alert Overlay */}
        {isSpoofing && (
          <div className="absolute top-6 right-6 bg-red-500 text-white px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center gap-3 animate-pulse border-2 border-red-400 z-10">
            <AlertTriangle size={24} />
            <div className="font-bold">
              <div className="text-lg">FRAUDULENT ACTION MADE</div>
              <div className="text-xs text-red-200">GPS spoofing / Teleportation detected</div>
            </div>
          </div>
        )}

        {/* Overlay Info Panel */}
        {routeInfo && (
          <div className="absolute bottom-6 left-6 w-80 bg-[#121212]/90 backdrop-blur border border-white/10 rounded-2xl p-5 shadow-2xl z-10">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Activity size={18} className="text-[#2196F3]" /> Trip Analytics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-zinc-400">Rider ID</span><span className="text-white font-mono">{routeInfo.worker_id}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-zinc-400">Avg Speed</span><span className="text-white font-mono">42 km/h</span>
              </div>
              <div className="flex justify-between text-sm pb-1">
                <span className="text-zinc-400">Spoofing Probability</span>
                <span className={`font-bold font-mono ${routeInfo.fraud_score > 0.5 ? 'text-red-400' : 'text-green-400'}`}>{(routeInfo.fraud_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

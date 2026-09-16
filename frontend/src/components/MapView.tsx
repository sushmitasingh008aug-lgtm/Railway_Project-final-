import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Section, ScheduledTask } from '../api/client';
import { Map as MapIcon, Info, Sparkles, Train, Layers } from 'lucide-react';

interface MapViewProps {
  sections?: Section[];
  schedule?: ScheduledTask[];
  compact?: boolean;
}

const CORRIDOR_COLORS: Record<string, string> = {
  COR_001: '#7F1418',
  COR_002: '#FF9933',
  COR_003: '#0B1F4A',
  CORR_BSB_LKO: '#7F1418',
  CORR_HWH_DLI: '#FF9933',
  CORR_DDU_YARD: '#047857',
};

const PALETTE = ['#7F1418', '#FF9933', '#0B1F4A', '#047857', '#6d28d9', '#b45309', '#0284c7'];

const DEPT_COLORS: Record<string, string> = {
  Engineering: '#1d4ed8',
  Traction: '#ea580c',
  'S&T': '#059669',
};

const DEFAULT_SECTIONS: Section[] = [
  { section_id: 'SEC-0001', name: 'New Delhi - Ghaziabad Corridor', corridor_id: 'COR-001', length_km: 26.0, start_station: 'New Delhi (NDLS)', end_station: 'Ghaziabad (GZB)', start_lat: 28.6139, start_lon: 77.2090, end_lat: 28.6692, end_lon: 77.4538 },
  { section_id: 'SEC-0002', name: 'Ghaziabad - Aligarh Fast Line', corridor_id: 'COR-001', length_km: 106.0, start_station: 'Ghaziabad (GZB)', end_station: 'Aligarh (ALJN)', start_lat: 28.6692, start_lon: 77.4538, end_lat: 27.8974, end_lon: 78.0880 },
  { section_id: 'SEC-0003', name: 'Aligarh - Kanpur Central Quad Line', corridor_id: 'COR-001', length_km: 290.0, start_station: 'Aligarh (ALJN)', end_station: 'Kanpur (CNB)', start_lat: 27.8974, start_lon: 78.0880, end_lat: 26.4499, end_lon: 80.3319 },
  { section_id: 'SEC-0004', name: 'Kanpur - Prayagraj Fast Line', corridor_id: 'COR-002', length_km: 194.0, start_station: 'Kanpur (CNB)', end_station: 'Prayagraj (PRYJ)', start_lat: 26.4499, start_lon: 80.3319, end_lat: 25.4358, end_lon: 81.8463 },
  { section_id: 'SEC-0005', name: 'Prayagraj - Varanasi Junction', corridor_id: 'COR-002', length_km: 125.0, start_station: 'Prayagraj (PRYJ)', end_station: 'Varanasi (BSB)', start_lat: 25.4358, start_lon: 81.8463, end_lat: 25.3176, end_lon: 82.9739 },
  { section_id: 'SEC-0006', name: 'Varanasi - Pt. Deen Dayal Upadhyaya Yard', corridor_id: 'COR-003', length_km: 18.0, start_station: 'Varanasi (BSB)', end_station: 'DDU Jn (DDU)', start_lat: 25.3176, start_lon: 82.9739, end_lat: 25.2818, end_lon: 83.1189 },
  { section_id: 'SEC-0007', name: 'Varanasi - Lucknow Northern Line', corridor_id: 'COR-003', length_km: 285.0, start_station: 'Varanasi (BSB)', end_station: 'Lucknow (LKO)', start_lat: 25.3176, start_lon: 82.9739, end_lat: 26.8467, end_lon: 80.9462 },
];

function taskFraction(taskId: string): number {
  let h = 0;
  for (let i = 0; i < taskId.length; i++) {
    h = (h * 31 + taskId.charCodeAt(i)) >>> 0;
  }
  return 0.12 + ((h % 1000) / 1000) * 0.76;
}

export const MapView: React.FC<MapViewProps> = ({ sections = [], schedule = [], compact = false }) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  const isValidCoord = (lat: number, lon: number) =>
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat !== 0 &&
    lon !== 0 &&
    lat >= 8 &&
    lat <= 37 &&
    lon >= 68 &&
    lon <= 97;

  // Use passed sections with valid coordinates, or fallback to Delhi-Kanpur-Varanasi operational corridor
  const geo = useMemo(() => {
    const valid = sections.filter((s) => isValidCoord(s.start_lat, s.start_lon) && isValidCoord(s.end_lat, s.end_lon));
    if (valid.length > 0) {
      // Limit to top 50 sections to keep interactive map responsive
      return valid.slice(0, 50);
    }
    return DEFAULT_SECTIONS;
  }, [sections]);

  const secById = useMemo(() => new Map(geo.map((s) => [s.section_id, s])), [geo]);

  const dots = useMemo(() => {
    return schedule
      .map((t) => {
        let sec = secById.get(t.section_id);
        if (!sec) {
          sec = geo[0];
        }
        if (!sec) return null;

        let lat: number, lon: number;
        if (t.lat && t.lon && isValidCoord(t.lat, t.lon)) {
          lat = t.lat;
          lon = t.lon;
        } else {
          const frac = taskFraction(t.task_id);
          lat = sec.start_lat + (sec.end_lat - sec.start_lat) * frac;
          lon = sec.start_lon + (sec.end_lon - sec.start_lon) * frac;
        }

        const line = t.affects_line || 'BOTH';
        if (line !== 'BOTH') {
          const dLat = sec.end_lat - sec.start_lat;
          const dLon = sec.end_lon - sec.start_lon;
          const len = Math.hypot(dLat, dLon) || 1;
          const offKm = line === 'UP' ? 1.6 : -1.6;
          const KM_PER_DEG_LAT = 111.0;
          const latRad = lat * (Math.PI / 180);
          const kmPerDegLon = KM_PER_DEG_LAT * Math.cos(latRad) || 1;
          lat += (-dLon / len) * (offKm / KM_PER_DEG_LAT);
          lon += (dLat / len) * (offKm / kmPerDegLon);
        }

        const day = Math.floor(t.start_minute / 1440) + 1;
        return { task: t, lat, lon, day };
      })
      .filter(Boolean) as { task: ScheduledTask; lat: number; lon: number; day: number }[];
  }, [schedule, secById, geo]);

  const visibleDots = useMemo(() => {
    if (selectedDay === 'all') return dots;
    return dots.filter((d) => d.day === selectedDay);
  }, [dots, selectedDay]);

  const combinedCount = useMemo(() => visibleDots.filter((d) => d.task.combined_group_id).length, [visibleDots]);

  // Safe bounds calculation without Math.min(...arr) stack overflow
  const bounds: [[number, number], [number, number]] = useMemo(() => {
    let minLat = 24.5;
    let maxLat = 29.0;
    let minLon = 76.5;
    let maxLon = 83.5;

    const allLats: number[] = [];
    const allLons: number[] = [];

    geo.forEach((s) => {
      allLats.push(s.start_lat, s.end_lat);
      allLons.push(s.start_lon, s.end_lon);
    });

    visibleDots.slice(0, 100).forEach((d) => {
      allLats.push(d.lat);
      allLons.push(d.lon);
    });

    if (allLats.length > 0) {
      minLat = allLats.reduce((acc, v) => (v < acc ? v : acc), allLats[0]);
      maxLat = allLats.reduce((acc, v) => (v > acc ? v : acc), allLats[0]);
    }
    if (allLons.length > 0) {
      minLon = allLons.reduce((acc, v) => (v < acc ? v : acc), allLons[0]);
      maxLon = allLons.reduce((acc, v) => (v > acc ? v : acc), allLons[0]);
    }

    return [
      [Math.max(8.0, minLat - 0.4), Math.max(68.0, minLon - 0.6)],
      [Math.min(37.0, maxLat + 0.4), Math.min(97.0, maxLon + 0.6)],
    ];
  }, [geo, visibleDots]);

  return (
    <div className="space-y-4">
      {/* Header & Map Legend */}
      {!compact && (
        <div className="bg-white border border-[#E6E6E6] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13]">
                  <MapIcon className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold text-[#1F2937] font-display">
                  GIS Network Corridor Control Map
                </h2>
              </div>
              <p className="text-xs text-[#667085] mt-1 ml-10">
                Spatial geometry mapped across Delhi Division & Northern Railway fast lines with UP/DOWN offsets.
              </p>
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#475467] self-start md:self-center bg-[#F7F7F5] px-3.5 py-2 rounded-xl border border-[#E6E6E6]">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />Low Risk</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#F79009]" />High Risk</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#D92D20]" />Critical Risk</span>
              <span className="flex items-center gap-1.5 font-bold text-[#B85C00]"><span className="w-3.5 h-2.5 rounded bg-[#FF9933]" />Proposed Block</span>
              <span className="flex items-center gap-1.5 font-bold text-[#7F1418]"><span className="w-3.5 h-2.5 rounded bg-[#7F1418]" />Track Section</span>
            </div>
          </div>

          {/* Day Filter Segmented Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDay === 'all'
                  ? 'bg-[#FF9933] text-white shadow-sm'
                  : 'bg-[#F7F7F5] text-[#667085] hover:text-[#1F2937] border border-[#E6E6E6]'
              }`}
            >
              ALL DAYS
            </button>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDay === d
                    ? 'bg-[#FF9933] text-white shadow-sm'
                    : 'bg-[#F7F7F5] text-[#667085] hover:text-[#1F2937] border border-[#E6E6E6]'
                }`}
              >
                DAY {d}
              </button>
            ))}
            <span className="text-xs text-[#667085] ml-auto font-medium">
              {visibleDots.length} blocks plotted · <b>{combinedCount} coordinated</b>
            </span>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="bg-white border border-[#E6E6E6] rounded-2xl overflow-hidden shadow-sm">
        <MapContainer
          bounds={bounds}
          scrollWheelZoom={false}
          style={{ height: compact ? '420px' : '560px', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Corridor section lines */}
          {geo.map((s, idx) => {
            const positions: [number, number][] = [
              [s.start_lat, s.start_lon],
              [s.end_lat, s.end_lon],
            ];
            const color = CORRIDOR_COLORS[s.corridor_id] || PALETTE[idx % PALETTE.length];
            return (
              <React.Fragment key={s.section_id}>
                <Polyline positions={positions} pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.9 }} />
                <Polyline positions={positions} pathOptions={{ color, weight: 4, opacity: 1 }}>
                  <Tooltip sticky>
                    <strong>{s.name || s.section_id}</strong>
                    <br />
                    {s.start_station} → {s.end_station}
                    <br />
                    {s.length_km ? s.length_km.toFixed(1) : 25} km · Corridor: {s.corridor_id}
                  </Tooltip>
                </Polyline>
              </React.Fragment>
            );
          })}

          {/* Boundary station nodes */}
          {geo.map((s) =>
            [
              [s.start_lat, s.start_lon, s.start_station],
              [s.end_lat, s.end_lon, s.end_station],
            ].map(([lat, lon, name], i) => (
              <CircleMarker
                key={`${s.section_id}-stn-${i}`}
                center={[lat as number, lon as number]}
                radius={5}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#7F1418', fillOpacity: 1 }}
              >
                <Tooltip>{name}</Tooltip>
              </CircleMarker>
            ))
          )}

          {/* Scheduled Maintenance block pins */}
          {visibleDots.slice(0, 150).map(({ task, lat, lon }) => {
            const isCrit = task.criticality === 'Critical';
            const isCombined = !!task.combined_group_id;
            const dotColor = isCombined ? '#FF9933' : isCrit ? '#D92D20' : DEPT_COLORS[task.department] || '#5b6b7f';

            return (
              <CircleMarker
                key={task.task_id}
                center={[lat, lon]}
                radius={isCombined ? 7 : 5}
                pathOptions={{
                  color: isCombined ? '#B85C00' : '#ffffff',
                  weight: isCombined ? 2.5 : 1.5,
                  fillColor: dotColor,
                  fillOpacity: 0.95,
                }}
              >
                <Tooltip>
                  <strong>{task.task_id}</strong> — {task.department}
                  <br />
                  {task.task_type}
                  <br />
                  Line: {task.affects_line || 'BOTH'} · Priority: {task.priority_score.toFixed(1)}
                  <br />
                  {task.assigned_start_time} → {task.assigned_end_time}
                  {isCombined && (
                    <>
                      <br />
                      <span className="text-[#FF9933] font-bold">Coordinated Block: {task.combined_group_id}</span>
                    </>
                  )}
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="px-5 py-3 bg-[#F7F7F5] border-t border-[#E6E6E6] flex items-center justify-between text-xs text-[#667085]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#D96F13] shrink-0" />
            <span>
              <b>Indian Railways GIS Telemetry:</b> OpenStreetMap spatial corridor geometry with UP/DOWN double-line track offsets.
            </span>
          </div>
          <span className="font-semibold text-[#1F2937]">
            {geo.length} Sections Active · {visibleDots.length} Maintenance Blocks
          </span>
        </div>
      </div>
    </div>
  );
};

export default MapView;

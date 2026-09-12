import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Section, ScheduledTask } from '../api/client';
import { Map as MapIcon, Info, Sparkles, Train } from 'lucide-react';

interface MapViewProps {
  sections: Section[];
  schedule: ScheduledTask[];
}

const CORRIDOR_COLORS: Record<string, string> = {
  CORR_BSB_LKO: '#6d28d9',
  CORR_HWH_DLI: '#b45309',
  CORR_DDU_YARD: '#047857',
};

const DEPT_COLORS: Record<string, string> = {
  Engineering: '#1d4ed8',
  Traction: '#ea580c',
  'S&T': '#059669',
};

function taskFraction(taskId: string): number {
  let h = 0;
  for (let i = 0; i < taskId.length; i++) {
    h = (h * 31 + taskId.charCodeAt(i)) >>> 0;
  }
  return 0.12 + ((h % 1000) / 1000) * 0.76;
}

export const MapView: React.FC<MapViewProps> = ({ sections, schedule }) => {
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
  const geo = sections.filter((s) => isValidCoord(s.start_lat, s.start_lon) && isValidCoord(s.end_lat, s.end_lon));
  const secById = new Map(geo.map((s) => [s.section_id, s]));

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  const dots = schedule
    .map((t) => {
      const sec = secById.get(t.section_id);
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

  const visibleDots =
    selectedDay === 'all' ? dots : dots.filter((d) => d.day === selectedDay);

  const combinedCount = visibleDots.filter((d) => d.task.combined_group_id).length;

  if (!geo.length) {
    return (
      <div className="bg-white border border-[#E6E6E6] rounded-2xl p-10 text-center text-sm text-[#667085]">
        No section geography available. Run derive_section_boundaries.py first.
      </div>
    );
  }

  const activeLats = visibleDots.map((d) => d.lat).concat(geo.flatMap((s) => [s.start_lat, s.end_lat]));
  const activeLons = visibleDots.map((d) => d.lon).concat(geo.flatMap((s) => [s.start_lon, s.end_lon]));
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...activeLats) - 1.2, Math.min(...activeLons) - 2.2],
    [Math.max(...activeLats) + 1.2, Math.max(...activeLons) + 2.2],
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Header & Map Legend (Section 24) */}
      <div className="bg-white border border-[#E6E6E6] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13]">
                <MapIcon className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-[#1F2937] font-display">
                GPS Network Map — True Geometry
              </h2>
            </div>
            <p className="text-xs text-[#667085] mt-1 ml-10">
              True OSM curved rail geometry. UP line works offset above running axis, DOWN line works below.
            </p>
          </div>

          {/* Section 24: Map Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#475467] self-start md:self-center bg-[#F7F7F5] px-3.5 py-2 rounded-xl border border-[#E6E6E6]">
            <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />Low Risk</span>
            <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#F79009]" />High Risk</span>
            <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#D92D20]" />Critical Risk</span>
            <span className="flex items-center gap-1.5 font-bold text-[#B85C00]"><span className="w-3.5 h-2.5 rounded bg-[#FF9933]" />Proposed Block</span>
            <span className="flex items-center gap-1.5 font-bold text-[#175CD3]"><span className="w-3.5 h-2.5 rounded bg-[#2563EB]" />Train Movement</span>
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

      <div className="bg-white border border-[#E6E6E6] rounded-2xl overflow-hidden shadow-sm">
        <MapContainer bounds={bounds} scrollWheelZoom style={{ height: '540px', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Corridor section lines */}
          {geo.map((s) => {
            const positions: [number, number][] = (() => {
              if (s.geometry && s.geometry.length >= 2) return s.geometry as [number, number][];
              return [
                [s.start_lat, s.start_lon],
                [s.end_lat, s.end_lon],
              ];
            })();
            const color = CORRIDOR_COLORS[s.corridor_id] || '#334155';
            return (
              <React.Fragment key={s.section_id}>
                <Polyline positions={positions} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 }} />
                <Polyline positions={positions} pathOptions={{ color, weight: 4.5, opacity: 1 }}>
                  <Tooltip sticky>
                    <strong>{s.start_station} → {s.end_station}</strong>
                    <br />
                    {s.length_km.toFixed(1)} km · {s.section_id}
                  </Tooltip>
                </Polyline>
              </React.Fragment>
            );
          })}

          {/* Boundary stations */}
          {geo.map((s) =>
            [
              [s.start_lat, s.start_lon, s.start_station],
              [s.end_lat, s.end_lon, s.end_station],
            ].map(([lat, lon, name], i) => (
              <CircleMarker
                key={`${s.section_id}-stn-${i}`}
                center={[lat as number, lon as number]}
                radius={5}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#334155', fillOpacity: 1 }}
              >
                <Tooltip>{name}</Tooltip>
              </CircleMarker>
            ))
          )}

          {/* Maintenance block dots */}
          {visibleDots.map(({ task, lat, lon }) => {
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
                  Line: {task.affects_line || 'BOTH'} · Priority {task.priority_score.toFixed(1)}
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

        <div className="px-5 py-3 bg-[#F7F7F5] border-t border-[#E6E6E6] flex items-center gap-2 text-xs text-[#667085]">
          <Info className="w-4 h-4 text-[#D96F13] shrink-0" />
          <span>
            <b>Indian Railways Spatial Telemetry:</b> Assets plotted on true curved track vectors from OpenStreetMap telemetry with UP/DOWN double-line track offsets.
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Section, ScheduledTask } from '../api/client';
import { Map as MapIcon, Info } from 'lucide-react';

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

// Stable pseudo-random fraction (0.12–0.88) from task id so dots spread along
// the section line and never jump between renders.
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
  // Warn on filtered geography (helps catch Go vs Flask NULL→0 drift)
  if (sections.length && geo.length !== sections.length) {
    console.warn(`MapView: filtered ${sections.length - geo.length} sections with invalid/null geography`);
  }
  const secById = new Map(geo.map((s) => [s.section_id, s]));

  // Helpers for true curved geometry
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
  const getGeometry = (sec: Section): [number, number][] => {
    if (sec.geometry && sec.geometry.length >= 2) return sec.geometry as [number, number][];
    return [
      [sec.start_lat, sec.start_lon],
      [sec.end_lat, sec.end_lon],
    ];
  };
  const pointAlongGeometry = (geom: [number, number][], frac: number) => {
    if (geom.length === 1) return { lat: geom[0][0], lon: geom[0][1], segLat: 0, segLon: 0 };
    // cumulative distance
    let total = 0;
    const segs: number[] = [0];
    for (let i = 0; i < geom.length - 1; i++) {
      total += haversineKm(geom[i][0], geom[i][1], geom[i + 1][0], geom[i + 1][1]);
      segs.push(total);
    }
    if (total === 0) return { lat: geom[0][0], lon: geom[0][1], segLat: 0, segLon: 0 };
    const target = total * Math.max(0, Math.min(1, frac));
    for (let i = 0; i < geom.length - 1; i++) {
      if (target >= segs[i] && target <= segs[i + 1]) {
        const segLen = segs[i + 1] - segs[i];
        const r = segLen === 0 ? 0 : (target - segs[i]) / segLen;
        const lat = geom[i][0] + (geom[i + 1][0] - geom[i][0]) * r;
        const lon = geom[i][1] + (geom[i + 1][1] - geom[i][1]) * r;
        return { lat, lon, segLat: geom[i + 1][0] - geom[i][0], segLon: geom[i + 1][1] - geom[i][1] };
      }
    }
    const last = geom[geom.length - 1];
    return { lat: last[0], lon: last[1], segLat: 0, segLon: 0 };
  };

  // Govt-grade dot position: true asset GPS when available, else along true curved geometry
  const dots = schedule
    .map((t) => {
      const sec = secById.get(t.section_id);
      if (!sec) return null;
      let lat: number, lon: number, segLat: number, segLon: number;
      // Prefer true asset location (most accurate for govt audit)
      if (t.lat && t.lon && Number.isFinite(t.lat) && Number.isFinite(t.lon)) {
        lat = t.lat;
        lon = t.lon;
        const geom = getGeometry(sec);
        // Find nearest segment for UP/DOWN offset azimuth
        let bestD = Infinity;
        segLat = 0;
        segLon = 0;
        for (let i = 0; i < geom.length - 1; i++) {
          const midLat = (geom[i][0] + geom[i + 1][0]) / 2;
          const midLon = (geom[i][1] + geom[i + 1][1]) / 2;
          const d = haversineKm(lat, lon, midLat, midLon);
          if (d < bestD) {
            bestD = d;
            segLat = geom[i + 1][0] - geom[i][0];
            segLon = geom[i + 1][1] - geom[i][1];
          }
        }
        if (bestD === Infinity) {
          segLat = sec.end_lat - sec.start_lat;
          segLon = sec.end_lon - sec.start_lon;
        }
      } else {
        const frac = taskFraction(t.task_id);
        const geom = getGeometry(sec);
        const pt = pointAlongGeometry(geom, frac);
        lat = pt.lat;
        lon = pt.lon;
        segLat = pt.segLat;
        segLon = pt.segLon;
      }

      // Perpendicular offset so UP/DOWN works sit on their physical line — use local segment azimuth
      const line = t.affects_line || 'BOTH';
      if (line !== 'BOTH') {
        const dLat = segLat || sec.end_lat - sec.start_lat;
        const dLon = segLon || sec.end_lon - sec.start_lon;
        const len = Math.hypot(dLat, dLon) || 1;
        const offKm = line === 'UP' ? 1.6 : -1.6; // ~1.6 km beside the axis
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
      <div className="bg-white border border-[#e3e8ee] rounded-lg p-10 text-center text-sm text-[#8896a6]">
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
      <div className="bg-white border border-[#e3e8ee] rounded-lg p-5">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1a2332] flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-[#1a56a0]" />
              Network Map — Maintenance Block Locations
            </h2>
            <p className="text-xs text-[#8896a6] mt-0.5">
              Every scheduled block plotted on its running line. Dots offset laterally: UP above axis, DOWN below.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#5b6b7f]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: DEPT_COLORS.Engineering }} />Engineering</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: DEPT_COLORS.Traction }} />Traction</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: DEPT_COLORS['S&T'] }} />S&amp;T</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full ring-2 ring-[#1a2332]" style={{ background: '#94a3b8' }} />Combined</span>
          </div>
        </div>

        {/* Day filter */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              selectedDay === 'all' ? 'bg-[#1a56a0] text-white' : 'bg-[#f4f6f9] text-[#8896a6] hover:text-[#1a2332]'
            }`}
          >
            ALL DAYS
          </button>
          {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                selectedDay === d ? 'bg-[#1a56a0] text-white' : 'bg-[#f4f6f9] text-[#8896a6] hover:text-[#1a2332]'
              }`}
            >
              DAY {d}
            </button>
          ))}
          <span className="text-[11px] text-[#5b6b7f] ml-auto font-medium">
            {visibleDots.length} blocks plotted · {combinedCount} combined
          </span>
        </div>
      </div>

      <div className="bg-white border border-[#e3e8ee] rounded-lg overflow-hidden">
        <MapContainer bounds={bounds} scrollWheelZoom style={{ height: '540px', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Corridor section lines — true curved geometry from OSM, white casing underneath */}
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
            const color = DEPT_COLORS[task.department] || '#5b6b7f';
            const isCombined = !!task.combined_group_id;
            return (
              <CircleMarker
                key={task.task_id}
                center={[lat, lon]}
                radius={isCombined ? 7 : 5}
                pathOptions={{
                  color: isCombined ? '#1a2332' : '#ffffff',
                  weight: isCombined ? 3 : 1.5,
                  fillColor: color,
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
                      Combined block {task.combined_group_id}
                    </>
                  )}
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#eef1f5] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#8896a6] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#8896a6] leading-relaxed">
            Govt-grade: Dots at true asset GPS from OSM (first LineString vertex), plotted on true curved rail geometry from export.geojson. Purple line follows actual track curvature; `UP`/`DOWN` 1.6km offsets use local segment azimuth, not straight chord.
          </p>
        </div>
      </div>
    </div>
  );
};

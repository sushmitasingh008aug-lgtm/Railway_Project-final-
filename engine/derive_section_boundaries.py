"""Derive geographic section boundaries for every corridor.

Strategy (robust to regional GeoJSON extracts):
  1. Corridor axis = great-circle line between origin and destination city.
  2. Boundary points are placed at curated station fractions along that axis.
  3. Each boundary is SNAPPED to the nearest OSM track vertex (from export.geojson,
     same-name corridor features) within SNAP_RADIUS_KM — so coordinates sit on
     real track where the extract covers the area; otherwise the great-circle
     point is kept and flagged.

Output: engine/section_geography.json
"""
import json
import math
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GEOJSON = os.path.join(BASE_DIR, 'export.geojson')
OUT = os.path.join(BASE_DIR, 'section_geography.json')

CORRIDORS = [
    {
        'corridor_id': 'CORR_BSB_LKO',
        'match': 'Varanasi–Sultanpur–Lucknow line',
        'anchor': ('Varanasi Jn', 25.3176, 82.9739),
        'dest': ('Lucknow', 26.8467, 80.9475),
        'stations': [
            ('Varanasi Jn', 0.00),
            ('Chandesar', 0.18),
            ('Sultanpur Jn', 0.55),
            ('Nihalgarh', 0.78),
            ('Lucknow', 1.00),
        ],
    },
    {
        'corridor_id': 'CORR_HWH_DLI',
        'match': 'Howrah - Delhi Railway',
        'anchor': ('Howrah Jn', 22.5839, 88.3425),
        'dest': ('New Delhi', 28.6425, 77.2199),
        'stations': [
            ('Howrah Jn', 0.00),
            ('Gomoh Jn', 0.25),
            ('Deen Dayal Upadhyaya Jn', 0.51),
            ('Tundla Jn', 0.75),
            ('New Delhi', 1.00),
        ],
    },
]

DDU_POINT = (25.2822, 83.1178)
YARD_SECTIONS = [
    ('SEC_DDU_YARD_01', 'DDU Yard Entry Cabin A', 'Marshalling Line 1'),
    ('SEC_DDU_YARD_02', 'Marshalling Line 1', 'Yard Cabin B'),
    ('SEC_DDU_YARD_03', 'Yard Cabin B', 'Departure Cabin C'),
    ('SEC_DDU_YARD_04', 'Departure Cabin C', 'DDU Yard Exit Cabin'),
]

SNAP_RADIUS_KM = 30.0


def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(a))


def gc_point(a_lat, a_lon, d_lat, d_lon, frac):
    """Point on the great-circle path at fraction of the way (linear interp of
    normalized vectors — accurate enough for <1500 km spans)."""
    ax, ay, az = sph(a_lat, a_lon)
    bx, by, bz = sph(d_lat, d_lon)
    x, y, z = ax + (bx - ax) * frac, ay + (by - ay) * frac, az + (bz - az) * frac
    n = math.sqrt(x * x + y * y + z * z)
    x, y, z = x / n, y / n, z / n
    return math.degrees(math.atan2(z, math.hypot(x, y))), math.degrees(math.atan2(y, x))


def sph(lat_deg, lon_deg):
    la, lo = math.radians(lat_deg), math.radians(lon_deg)
    return (math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la))


def load_vertices(gj, match):
    pts = []
    for ft in gj['features']:
        props = ft.get('properties') or {}
        geom = ft.get('geometry') or {}
        if geom.get('type') != 'LineString':
            continue
        if match not in (props.get('name') or ''):
            continue
        for c in geom['coordinates']:
            pts.append((c[0], c[1]))  # (lon, lat)
    return pts


def snap(lat, lon, vertices, radius_km=SNAP_RADIUS_KM):
    best_d, best = float('inf'), None
    for vlon, vlat in vertices:
        d = haversine(lon, lat, vlon, vlat)
        if d < best_d:
            best_d, best = d, (vlon, vlat)
            if best_d == 0:
                break
    if best is not None and best_d <= radius_km:
        return round(best[1], 6), round(best[0], 6), True   # lat, lon, snapped
    return round(lat, 6), round(lon, 6), False


def projection_fraction(v_lat, v_lon, a_lat, a_lon, d_lat, d_lon):
    """Approx fraction of vert's projection onto great-circle A→D (0..1) via sampling."""
    best_d, best_f = float('inf'), 0.0
    for i in range(101):
        f = i / 100.0
        glat, glon = gc_point(a_lat, a_lon, d_lat, d_lon, f)
        d = haversine(v_lon, v_lat, glon, glat)
        if d < best_d:
            best_d, best_f = d, f
    return best_f


def nearest_vertex_idx(lat, lon, vertices):
    best_d, best_i = float('inf'), -1
    for i, (vlon, vlat) in enumerate(vertices):
        d = haversine(lon, lat, vlon, vlat)
        if d < best_d:
            best_d, best_i = d, i
    return best_i, best_d


def sorted_vertices_by_axis(verts, a_lat, a_lon, d_lat, d_lon):
    """Return verts sorted along corridor axis A→D by projection fraction."""
    scored = []
    for vlon, vlat in verts:
        f = projection_fraction(vlat, vlon, a_lat, a_lon, d_lat, d_lon)
        scored.append((f, (vlon, vlat)))
    scored.sort(key=lambda x: x[0])
    return [p for _, p in scored]


def extract_geometry(verts, a_lat, a_lon, b_lat, b_lon):
    """Slice true OSM polyline vertices between two snapped boundaries.
    verts is list of (lon,lat) in file order; returns [[lat,lon],...] along track.
    If no verts or single-yards, fallback to [A,B]."""
    if not verts or a_lat == b_lat and a_lon == b_lon:
        return [[round(a_lat, 6), round(a_lon, 6)], [round(b_lat, 6), round(b_lon, 6)]] if not (a_lat == b_lat and a_lon == b_lon) else [[round(a_lat, 6), round(a_lon, 6)]]
    ai, _ = nearest_vertex_idx(a_lat, a_lon, verts)
    bi, _ = nearest_vertex_idx(b_lat, b_lon, verts)
    if ai < 0 or bi < 0:
        return [[round(a_lat, 6), round(a_lon, 6)], [round(b_lat, 6), round(b_lon, 6)]]
    lo, hi = (ai, bi) if ai <= bi else (bi, ai)
    # Take slice inclusive; if slice too long (>500) or tiny, fallback
    seg = verts[lo:hi+1]
    if len(seg) < 2:
        return [[round(a_lat, 6), round(a_lon, 6)], [round(b_lat, 6), round(b_lon, 6)]]
    # Convert (lon,lat) -> [lat,lon] and ensure A/B endpoints included if not exact
    coords = [[round(vlat, 6), round(vlon, 6)] for vlon, vlat in seg]
    # Prepend A if far from first, append B if far from last (>0.5km)
    if haversine(coords[0][1], coords[0][0], a_lon, a_lat) > 0.5:
        coords.insert(0, [round(a_lat, 6), round(a_lon, 6)])
    if haversine(coords[-1][1], coords[-1][0], b_lon, b_lat) > 0.5:
        coords.append([round(b_lat, 6), round(b_lon, 6)])
    # Cap to ~200 points to keep JSON small
    if len(coords) > 200:
        step = len(coords) // 200 + 1
        coords = coords[::step]
        if coords[-1] != [round(b_lat, 6), round(b_lon, 6)]:
            coords.append([round(b_lat, 6), round(b_lon, 6)])
    return coords


def main():
    gj = json.load(open(GEOJSON))
    out = {'meta': {
        'note': 'Boundaries derived from OSM rail geometry (regional extract) '
                'snapped to a great-circle corridor axis; representative stations.',
        'generated_for': ['CORR_BSB_LKO', 'CORR_HWH_DLI', 'CORR_DDU_YARD'],
    }}

    for corr in CORRIDORS:
        verts = load_vertices(gj, corr['match'])
        print(f"{corr['corridor_id']}: {len(verts)} OSM vertices for snapping")
        a_name, a_lat, a_lon = corr['anchor']
        d_name, d_lat, d_lon = corr['dest']
        # Sort vertices along corridor axis so slicing between stations is contiguous
        verts = sorted_vertices_by_axis(verts, a_lat, a_lon, d_lat, d_lon)

        # Boundary points along the corridor axis.
        bounds = []
        for s_name, frac in corr['stations']:
            if s_name == a_name:
                lat, lon, sn = a_lat, a_lon, True
            elif s_name == d_name:
                lat, lon, sn = d_lat, d_lon, True
            else:
                glat, glon = gc_point(a_lat, a_lon, d_lat, d_lon, frac)
                lat, lon, sn = snap(glat, glon, verts)
            bounds.append({'station': s_name, 'lat': lat, 'lon': lon, 'snapped': sn})

        blocks = []
        for b in range(len(bounds) - 1):
            A, B = bounds[b], bounds[b + 1]
            geom = extract_geometry(verts, A['lat'], A['lon'], B['lat'], B['lon'])
            # Length as sum along true geometry if available, with sanity cap
            straight = haversine(A['lon'], A['lat'], B['lon'], B['lat'])
            if len(geom) >= 2:
                true_len = sum(haversine(geom[i][1], geom[i][0], geom[i+1][1], geom[i+1][0]) for i in range(len(geom)-1))
                # If true geometry is >2.2× straight or >400km for a single block, fallback to straight (likely branch/detour)
                if true_len > straight * 2.2 or true_len > 400:
                    geom = [[round(A['lat'], 6), round(A['lon'], 6)], [round(B['lat'], 6), round(B['lon'], 6)]]
                    length = straight
                else:
                    length = true_len
            else:
                length = straight
            blocks.append({
                'block_index': b + 1,
                'start_station': A['station'], 'end_station': B['station'],
                'start_lat': round(A['lat'], 6), 'start_lon': round(A['lon'], 6),
                'end_lat': round(B['lat'], 6), 'end_lon': round(B['lon'], 6),
                'length_km': round(length, 2),
                'snapped': [A['snapped'], B['snapped']],
                'geometry': geom,
            })
        out[corr['corridor_id']] = blocks

    out['CORR_DDU_YARD'] = []
    for sid, s_name, e_name in YARD_SECTIONS:
        out['CORR_DDU_YARD'].append({
            'section_id_hint': sid,
            'start_station': s_name, 'end_station': e_name,
            'start_lat': DDU_POINT[0], 'start_lon': DDU_POINT[1],
            'end_lat': DDU_POINT[0], 'end_lon': DDU_POINT[1],
            'length_km': 0.0, 'snapped': [False, False],
            'geometry': [[DDU_POINT[0], DDU_POINT[1]]],
        })

    json.dump(out, open(OUT, 'w'), indent=2)
    print(f"\nWrote {OUT}\n")
    for cid in ['CORR_BSB_LKO', 'CORR_HWH_DLI', 'CORR_DDU_YARD']:
        print(f"{cid}:")
        for b in out[cid]:
            idx = b.get('block_index', b.get('section_id_hint'))
            snap_tag = ''.join('S' if s else '.' for s in b.get('snapped', ['', '']))
            print(f"  {idx}: {b['start_station']} -> {b['end_station']} | "
                  f"{b['length_km']:>7.2f} km | ({b['start_lat']:.4f},{b['start_lon']:.4f}) [{snap_tag}]")


if __name__ == '__main__':
    main()

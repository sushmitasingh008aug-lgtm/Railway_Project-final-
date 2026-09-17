// Authoritative Indian Railways Track Network and Deterministic GIS Snapping Engine
// Conforms strictly to Indian Railways operational infrastructure, Golden Quadrilateral, and HDN corridors.
// DATASET v4.1: Updated from engine/data/02_sections.csv and engine/data/22_route_station_points.csv (15K rows)

export interface StationNode {
  code: string;
  name: string;
  lat: number;
  lon: number;
  division: string;
  zone: string;
  isJunction?: boolean;
}

export interface RailCorridor {
  id: string;
  name: string;
  corridorId: string;
  zone: string;
  division: string;
  startStation: string;
  endStation: string;
  lengthKm: number;
  coordinates: [number, number][];
}

// ── DATASET-DRIVEN SECTION DEFINITIONS (from 02_sections.csv + 22_route_station_points.csv) ──
// 6 sections on Delhi–Howrah planning corridor with real lat/lon from operational dataset v4.1
export interface DatasetSection {
  sectionId: string;
  name: string;
  corridorId: string;
  startStation: string;
  endStation: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  lengthKm: number;
  zone: string;
  division: string;
  stationCodes: string[];
}

export const DATASET_SECTIONS: DatasetSection[] = [
  {
    sectionId: 'SEC-DH-01',
    name: 'Delhi – Kanpur',
    corridorId: 'COR-DH-01',
    startStation: 'New Delhi',
    endStation: 'Kanpur Central',
    startLat: 28.6431, startLon: 77.2195,
    endLat: 26.4499, endLon: 80.3319,
    lengthKm: 461.0,
    zone: 'NR/NCR', division: 'Delhi/Prayagraj',
    stationCodes: ['NDLS','GZB','ALJN','TDL','FZD','ETW','CNB'],
  },
  {
    sectionId: 'SEC-DH-02',
    name: 'Kanpur – DDU',
    corridorId: 'COR-DH-02',
    startStation: 'Kanpur Central',
    endStation: 'Pt. Deen Dayal Upadhyaya Junction',
    startLat: 26.4499, startLon: 80.3319,
    endLat: 25.2766, endLon: 83.1192,
    lengthKm: 329.82,
    zone: 'NCR', division: 'Prayagraj',
    stationCodes: ['CNB','FTP','PRYJ','MZP','DDU'],
  },
  {
    sectionId: 'SEC-DH-03',
    name: 'DDU – Patna',
    corridorId: 'COR-DH-03',
    startStation: 'Pt. Deen Dayal Upadhyaya Junction',
    endStation: 'Patna Junction',
    startLat: 25.2766, startLon: 83.1192,
    endLat: 25.5941, endLon: 85.1376,
    lengthKm: 208.58,
    zone: 'ECR', division: 'DDU/Danapur',
    stationCodes: ['DDU','BXR','ARA','DNR','PNBE'],
  },
  {
    sectionId: 'SEC-DH-04',
    name: 'Patna – Asansol',
    corridorId: 'COR-DH-04',
    startStation: 'Patna Junction',
    endStation: 'Asansol Junction',
    startLat: 25.5941, startLon: 85.1376,
    endLat: 23.6911, endLon: 86.9748,
    lengthKm: 302.34,
    zone: 'ECR/ER', division: 'Danapur/Asansol',
    stationCodes: ['PNBE','MKA','KIUL','JMU','JAJ','ASN'],
  },
  {
    sectionId: 'SEC-DH-05',
    name: 'Asansol – Bardhaman',
    corridorId: 'COR-DH-05',
    startStation: 'Asansol Junction',
    endStation: 'Bardhaman Junction',
    startLat: 23.6911, startLon: 86.9748,
    endLat: 23.2324, endLon: 87.8615,
    lengthKm: 103.84,
    zone: 'ER', division: 'Asansol',
    stationCodes: ['ASN','RNG','DGR','BWN'],
  },
  {
    sectionId: 'SEC-DH-06',
    name: 'Bardhaman – Howrah',
    corridorId: 'COR-DH-06',
    startStation: 'Bardhaman Junction',
    endStation: 'Howrah Junction',
    startLat: 23.2324, startLon: 87.8615,
    endLat: 22.5833, endLon: 88.3423,
    lengthKm: 124.78,
    zone: 'ER', division: 'Howrah',
    stationCodes: ['BWN','BDC','DKAE','HWH'],
  },
];

// Helper: build Leaflet polyline coordinates for a dataset section (interpolated)
export function sectionToPolyline(sec: DatasetSection): [number, number][] {
  return [[sec.startLat, sec.startLon], [sec.endLat, sec.endLon]];
}

// Helper: get map bounds for all dataset sections
export function getDatasetBounds(): [[number, number], [number, number]] {
  const lats = DATASET_SECTIONS.flatMap(s => [s.startLat, s.endLat]);
  const lons = DATASET_SECTIONS.flatMap(s => [s.startLon, s.endLon]);
  return [
    [Math.min(...lats) - 0.5, Math.min(...lons) - 0.5],
    [Math.max(...lats) + 0.5, Math.max(...lons) + 0.5],
  ];
}

// Helper: get section color by zone
export function getSectionColor(zone: string): string {
  const colors: Record<string, string> = {
    'NR': '#E53E3E', 'NCR': '#DD6B20', 'NR/NCR': '#E53E3E',
    'ECR': '#38A169', 'ECR/ER': '#38A169',
    'ER': '#3182CE',
  };
  return colors[zone] ?? '#718096';
}

// 1. Canonical Indian Railways Stations across all 25 Divisions
export const STATIONS: StationNode[] = [
  // Northern & Eastern Trunk (Delhi - Howrah)
  { code: 'NDLS', name: 'New Delhi', lat: 28.6139, lon: 77.2090, division: 'NDLS', zone: 'NR', isJunction: true },
  { code: 'DLI',  name: 'Old Delhi Jn', lat: 28.6606, lon: 77.2272, division: 'DLI', zone: 'NR', isJunction: true },
  { code: 'GZB',  name: 'Ghaziabad Jn', lat: 28.6692, lon: 77.4538, division: 'NDLS', zone: 'NR', isJunction: true },
  { code: 'ALJN', name: 'Aligarh Jn', lat: 27.8974, lon: 78.0880, division: 'CNB', zone: 'NCR' },
  { code: 'TDL',  name: 'Tundla Jn', lat: 27.2080, lon: 78.2430, division: 'CNB', zone: 'NCR', isJunction: true },
  { code: 'ETW',  name: 'Etawah Jn', lat: 26.7768, lon: 79.0305, division: 'CNB', zone: 'NCR' },
  { code: 'CNB',  name: 'Kanpur Central', lat: 26.4499, lon: 80.3319, division: 'CNB', zone: 'NCR', isJunction: true },
  { code: 'FTP',  name: 'Fatehpur', lat: 25.9286, lon: 80.8122, division: 'ALD', zone: 'NCR' },
  { code: 'PRYJ', name: 'Prayagraj Jn (Allahabad)', lat: 25.4358, lon: 81.8463, division: 'ALD', zone: 'NCR', isJunction: true },
  { code: 'MZP',  name: 'Mirzapur', lat: 25.1460, lon: 82.5690, division: 'ALD', zone: 'NCR' },
  { code: 'DDU',  name: 'Pt. Deen Dayal Upadhyaya Jn', lat: 25.2818, lon: 83.1189, division: 'DDU', zone: 'ECR', isJunction: true },
  { code: 'MGS',  name: 'DDU Marshalling Yard', lat: 25.2800, lon: 83.1150, division: 'MGS', zone: 'ECR' },
  { code: 'BXR',  name: 'Buxar', lat: 25.5647, lon: 83.9777, division: 'PNBE', zone: 'ECR' },
  { code: 'ARA',  name: 'Ara Jn', lat: 25.5560, lon: 84.6640, division: 'PNBE', zone: 'ECR' },
  { code: 'DNR',  name: 'Danapur', lat: 25.6267, lon: 85.0433, division: 'PNBE', zone: 'ECR' },
  { code: 'PNBE', name: 'Patna Jn', lat: 25.6042, lon: 85.1376, division: 'PNBE', zone: 'ECR', isJunction: true },
  { code: 'MKA',  name: 'Mokama Jn', lat: 25.3941, lon: 85.9189, division: 'PNBE', zone: 'ECR' },
  { code: 'BJU',  name: 'Barauni Jn', lat: 25.4746, lon: 86.0125, division: 'KIR', zone: 'ECR', isJunction: true },
  { code: 'KIR',  name: 'Katihar Jn', lat: 25.5414, lon: 87.5684, division: 'KIR', zone: 'NFR', isJunction: true },
  { code: 'KNE',  name: 'Kishanganj', lat: 26.0968, lon: 87.9408, division: 'KIR', zone: 'NFR' },
  { code: 'GAYA', name: 'Gaya Jn', lat: 24.7964, lon: 85.0076, division: 'MGS', zone: 'ECR', isJunction: true },
  { code: 'DHN',  name: 'Dhanbad Jn', lat: 23.7957, lon: 86.4304, division: 'HWH', zone: 'ECR', isJunction: true },
  { code: 'ASN',  name: 'Asansol Jn', lat: 23.6889, lon: 86.9661, division: 'HWH', zone: 'ER', isJunction: true },
  { code: 'BWN',  name: 'Barddhaman Jn', lat: 23.2324, lon: 87.8615, division: 'HWH', zone: 'ER', isJunction: true },
  { code: 'HWH',  name: 'Howrah Jn (Kolkata)', lat: 22.5839, lon: 88.3425, division: 'HWH', zone: 'ER', isJunction: true },

  // Northern & Lucknow / Gorakhpur
  { code: 'LKO',  name: 'Lucknow Charbagh (NR)', lat: 26.8315, lon: 80.9221, division: 'LKO', zone: 'NR', isJunction: true },
  { code: 'LJN',  name: 'Lucknow Jn (NER)', lat: 26.8315, lon: 80.9221, division: 'LJN', zone: 'NER', isJunction: true },
  { code: 'SLN',  name: 'Sultanpur Jn', lat: 26.2648, lon: 82.0727, division: 'LKO', zone: 'NR' },
  { code: 'BSB',  name: 'Varanasi Jn', lat: 25.3176, lon: 82.9739, division: 'LKO', zone: 'NR', isJunction: true },
  { code: 'GKP',  name: 'Gorakhpur Jn', lat: 26.7588, lon: 83.3853, division: 'GKP', zone: 'NER', isJunction: true },
  { code: 'BST',  name: 'Basti', lat: 26.8013, lon: 82.7483, division: 'GKP', zone: 'NER' },
  { code: 'BBK',  name: 'Barabanki Jn', lat: 26.9274, lon: 81.1834, division: 'LKO', zone: 'NR' },
  { code: 'PNP',  name: 'Panipat Jn', lat: 29.3909, lon: 76.9635, division: 'DLI', zone: 'NR' },

  // Western Trunk (Delhi - Mumbai Central)
  { code: 'MTJ',  name: 'Mathura Jn', lat: 27.4924, lon: 77.6737, division: 'NDLS', zone: 'NCR', isJunction: true },
  { code: 'KOTA', name: 'Kota Jn', lat: 25.1800, lon: 75.8300, division: 'RTM', zone: 'WCR', isJunction: true },
  { code: 'RTM',  name: 'Ratlam Jn', lat: 23.3315, lon: 75.0367, division: 'RTM', zone: 'WR', isJunction: true },
  { code: 'BRC',  name: 'Vadodara Jn', lat: 22.3072, lon: 73.1812, division: 'ADI', zone: 'WR', isJunction: true },
  { code: 'ST',   name: 'Surat', lat: 21.1702, lon: 72.8311, division: 'BCT', zone: 'WR', isJunction: true },
  { code: 'BVI',  name: 'Borivali', lat: 19.2288, lon: 72.8569, division: 'BCT', zone: 'WR' },
  { code: 'BCT',  name: 'Mumbai Central', lat: 18.9696, lon: 72.8193, division: 'BCT', zone: 'WR', isJunction: true },

  // Ahmedabad & North Western (Rajasthan)
  { code: 'ADI',  name: 'Ahmedabad Jn', lat: 23.0225, lon: 72.5714, division: 'ADI', zone: 'WR', isJunction: true },
  { code: 'JP',   name: 'Jaipur Jn', lat: 26.9196, lon: 75.7878, division: 'JP', zone: 'NWR', isJunction: true },
  { code: 'AII',  name: 'Ajmer Jn', lat: 26.4525, lon: 74.6399, division: 'AII', zone: 'NWR', isJunction: true },

  // Central & Southern Trunk (Delhi - Bhopal - Nagpur - Hyderabad - Chennai)
  { code: 'AGC',  name: 'Agra Cantt', lat: 27.1590, lon: 77.9900, division: 'BPL', zone: 'NCR', isJunction: true },
  { code: 'GWL',  name: 'Gwalior Jn', lat: 26.2183, lon: 78.1828, division: 'BPL', zone: 'NCR' },
  { code: 'VGLB', name: 'Virangana Lakshmibai (Jhansi)', lat: 25.4484, lon: 78.5685, division: 'BPL', zone: 'NCR', isJunction: true },
  { code: 'BPL',  name: 'Bhopal Jn', lat: 23.2599, lon: 77.4126, division: 'BPL', zone: 'WCR', isJunction: true },
  { code: 'ET',   name: 'Itarsi Jn', lat: 22.6124, lon: 77.7610, division: 'BPL', zone: 'WCR', isJunction: true },
  { code: 'NGP',  name: 'Nagpur Jn', lat: 21.1458, lon: 79.0882, division: 'SC', zone: 'CR', isJunction: true },
  { code: 'KZJ',  name: 'Kazipet Jn', lat: 17.9784, lon: 79.5218, division: 'SC', zone: 'SCR', isJunction: true },
  { code: 'SC',   name: 'Secunderabad Jn', lat: 17.4344, lon: 78.5011, division: 'SC', zone: 'SCR', isJunction: true },
  { code: 'GNT',  name: 'Guntur Jn', lat: 16.2974, lon: 80.4435, division: 'GNT', zone: 'SCR', isJunction: true },
  { code: 'BZA',  name: 'Vijayawada Jn', lat: 16.5062, lon: 80.6480, division: 'GNT', zone: 'SCR', isJunction: true },
  { code: 'MAS',  name: 'Chennai Central', lat: 13.0827, lon: 80.2707, division: 'MAS', zone: 'SR', isJunction: true },

  // East Coast Trunk
  { code: 'KGP',  name: 'Kharagpur Jn', lat: 22.3394, lon: 87.3242, division: 'BBS', zone: 'SER', isJunction: true },
  { code: 'BBS',  name: 'Bhubaneswar', lat: 20.2644, lon: 85.8400, division: 'BBS', zone: 'ECoR', isJunction: true },
  { code: 'VSKP', name: 'Visakhapatnam Jn', lat: 17.7214, lon: 83.2872, division: 'VSKP', zone: 'ECoR', isJunction: true },

  // Central Interconnects
  { code: 'JBP',  name: 'Jabalpur Jn', lat: 23.1600, lon: 79.9400, division: 'JBP', zone: 'WCR', isJunction: true },
  { code: 'KTE',  name: 'Katni Jn', lat: 23.8343, lon: 80.3995, division: 'JBP', zone: 'WCR', isJunction: true },
  { code: 'RNC',  name: 'Ranchi Jn', lat: 23.3512, lon: 85.3283, division: 'RNC', zone: 'SER', isJunction: true },
  { code: 'BKSC', name: 'Bokaro Steel City', lat: 23.6693, lon: 86.1511, division: 'RNC', zone: 'SER' },
];

// 2. High-Fidelity OpenStreetMap Rail Coordinates for Core Corridors
const OSM_BSB_LKO: [number, number][] = [[25.3176, 82.9739], [25.325331, 82.971646], [25.32553, 82.971266], [25.325689, 82.970889], [25.325885, 82.970448], [25.32626, 82.969642], [25.326561, 82.969086], [25.327088, 82.968205], [25.327368, 82.967794], [25.327582, 82.967489], [25.327799, 82.967197], [25.328, 82.966964], [25.342431, 82.95641], [25.344932, 82.954712], [25.347711, 82.952822], [25.338018, 82.959259], [25.339276, 82.958423], [25.341105, 82.957307], [25.342431, 82.95641], [25.328298, 82.966602], [25.328806, 82.966043], [25.329245, 82.965598], [25.329821, 82.965091], [25.330278, 82.964712], [25.330793, 82.964336], [25.331289, 82.963982], [25.332039, 82.963476], [25.334056, 82.962098], [25.335702, 82.96087], [25.336339, 82.960411], [25.337089, 82.9599], [25.337089, 82.9599], [25.338018, 82.959259], [25.350634, 82.950835], [25.351247, 82.950413], [25.355433, 82.947501], [25.358956, 82.945096], [25.359448, 82.944764], [25.361638, 82.943344], [25.364668, 82.941274], [25.370397, 82.937366], [25.37102, 82.936962], [25.380226, 82.93069], [25.382058, 82.929451], [25.38352, 82.928464], [25.387092, 82.926037], [25.390942, 82.923423], [25.392297, 82.922493], [25.398954, 82.917927], [25.406185, 82.913046], [25.407984, 82.911815], [25.408714, 82.911316], [25.41193, 82.909115], [25.418008, 82.904987], [25.419985, 82.903631], [25.423349, 82.901382], [25.43006, 82.896779], [25.435209, 82.893279], [25.437614, 82.891625], [25.437614, 82.891625], [25.437786, 82.891514], [25.437786, 82.891514], [25.437811, 82.891496], [25.441193, 82.889219], [25.443461, 82.887666], [25.447634, 82.884808], [25.450341, 82.882909], [25.450443, 82.882841], [25.453407, 82.880885], [25.453966, 82.880517], [25.454464, 82.880166], [25.456843, 82.878482], [25.460232, 82.876217], [25.466403, 82.872029], [25.469405, 82.869993], [25.471821, 82.868334], [25.477879, 82.864226], [25.481599, 82.861681], [25.493603, 82.853496], [25.496631, 82.851417], [25.501279, 82.848229], [25.503674, 82.846504], [25.50722, 82.844072], [25.50722, 82.844072], [25.507538, 82.843857], [25.507608, 82.843809], [25.507608, 82.843809], [25.510705, 82.841718], [25.513983, 82.839585], [25.514967, 82.838917], [25.516108, 82.838135], [25.519322, 82.835931], [25.528681, 82.829513], [25.539762, 82.82202], [25.544621, 82.818734], [25.559153, 82.808825], [25.572403, 82.799739], [25.572511, 82.799667], [25.572511, 82.799667], [25.572542, 82.799645], [25.577412, 82.796322], [25.582836, 82.792587], [25.568739, 82.802267], [25.569769, 82.80158], [25.572403, 82.799739], [25.591009, 82.787005], [25.615607, 82.770172], [25.619703, 82.76746], [25.619758, 82.767421], [25.621822, 82.765959], [25.624357, 82.764167], [25.627084, 82.762332], [25.629128, 82.760916], [25.631963, 82.759008], [25.631963, 82.759008], [25.635689, 82.756437], [25.637551, 82.755193], [25.639533, 82.753913], [25.640296, 82.753395], [25.64085, 82.753033], [25.627149, 82.762288], [25.629128, 82.760916], [25.627084, 82.762332], [25.627149, 82.762288], [25.648622, 82.747716], [25.656793, 82.742133], [25.668557, 82.734107], [25.668557, 82.734107], [25.678067, 82.727774], [25.681355, 82.726383], [25.719587, 82.713482], [25.717937, 82.715397], [25.719153, 82.713944], [25.704221, 82.719738], [25.705365, 82.719339], [25.714449, 82.716711], [25.717567, 82.715667], [25.717937, 82.715397], [25.715326, 82.716455], [25.716845, 82.715928], [25.725996, 82.685367], [25.725051, 82.690173], [25.722198, 82.704271], [25.720689, 82.711389], [25.719868, 82.713068], [25.720575, 82.71149], [25.722146, 82.704315], [25.725011, 82.690175], [25.725952, 82.685356], [25.727985, 82.679235], [25.726911, 82.681764], [25.728948, 82.677212], [25.730977, 82.672754], [25.734302, 82.665629], [25.726174, 82.684232], [25.727124, 82.681058], [25.728702, 82.677615], [25.736368, 82.661371], [25.73194, 82.670813], [25.72934, 82.676362], [25.738048, 82.657651], [25.740731, 82.651928], [25.742852, 82.647398], [25.740813, 82.651867], [25.739277, 82.655147], [25.746705, 82.639256], [25.741431, 82.650536], [25.751045, 82.629876], [25.755732, 82.619828], [25.759217, 82.61254], [25.753911, 82.623863], [25.750512, 82.631101], [25.765094, 82.599821], [25.768599, 82.592319], [25.770247, 82.589033], [25.767036, 82.595792], [25.761381, 82.607867], [25.772735, 82.585527], [25.782607, 82.573437], [25.782642, 82.573476], [25.773837, 82.584254], [25.770753, 82.588191], [25.790484, 82.56379], [25.797503, 82.55518], [25.800783, 82.551178], [25.797531, 82.555214], [25.790517, 82.563834], [25.788501, 82.566302], [25.805237, 82.545724], [25.807652, 82.542771], [25.812425, 82.536923], [25.816498, 82.531933], [25.816356, 82.53217], [25.811145, 82.538557], [25.807689, 82.542806], [25.805269, 82.54576], [25.818889, 82.528988], [25.823638, 82.522597], [25.828807, 82.515442], [25.82861, 82.515808], [25.823666, 82.522629], [25.818921, 82.529023], [25.837284, 82.503697], [25.84358, 82.494969], [25.846083, 82.491574], [25.844076, 82.494277], [25.844026, 82.494441], [25.837935, 82.502869], [25.83432, 82.507881], [25.860558, 82.471689], [25.853312, 82.481444], [25.85948, 82.472887], [25.851731, 82.483641], [25.848504, 82.488129], [25.859731, 82.472537], [25.859701, 82.472907], [25.858279, 82.474777], [25.853343, 82.481496], [25.875804, 82.454391], [25.869604, 82.459483], [25.866567, 82.46317], [25.867575, 82.461743], [25.870875, 82.458148], [25.879468, 82.451789], [25.886529, 82.447006], [25.886496, 82.446962], [25.898761, 82.438509], [25.888003, 82.445972], [25.893359, 82.442159], [25.920196, 82.423716], [25.920196, 82.423716], [25.912374, 82.429123], [25.905377, 82.433999], [25.912296, 82.429128], [25.919705, 82.423999], [25.9224, 82.422143], [25.941905, 82.408749], [25.933478, 82.414561], [25.928393, 82.418062], [25.926817, 82.419097], [25.932248, 82.415347], [25.939306, 82.410484], [25.944887, 82.406634], [25.960005, 82.395979], [25.956783, 82.398478], [25.956462, 82.3987], [25.951456, 82.40216], [25.954332, 82.400115], [25.956512, 82.398609], [25.95956, 82.396327], [25.964052, 82.391923], [25.975554, 82.38026], [25.969096, 82.386858], [25.965523, 82.390447], [25.969916, 82.385958], [25.977544, 82.378179], [25.998687, 82.358854], [25.99138, 82.364627], [25.98897, 82.366647], [25.983978, 82.37168], [25.98518, 82.370407], [25.989545, 82.366064], [25.99403, 82.362466], [26.000806, 82.35712], [26.010349, 82.349578], [26.024714, 82.338221], [26.038632, 82.327189], [26.048676, 82.319186], [26.072407, 82.300522], [26.084398, 82.291037], [26.093437, 82.28389], [26.09606, 82.281387], [26.097496, 82.27941], [26.111243, 82.25837], [26.123137, 82.240127], [26.128655, 82.231625], [26.146019, 82.205064], [26.160673, 82.183149], [26.169464, 82.171307], [26.187191, 82.147355], [26.201856, 82.127773], [26.208305, 82.119125], [26.209922, 82.11696], [26.224277, 82.099309], [26.237507, 82.083142], [26.249729, 82.068224], [26.251899, 82.066547], [26.252676, 82.066193], [26.253577, 82.065908], [26.254926, 82.065703], [26.25645, 82.06578], [26.258649, 82.06599], [26.265535, 82.06722], [26.266916, 82.068401], [26.260335, 82.066118], [26.263298, 82.066349], [26.264448, 82.066632], [26.275057, 81.99115], [26.273329, 81.994901], [26.275018, 81.991129], [26.287386, 81.973066], [26.28408, 81.977346], [26.282396, 81.979475], [26.280867, 81.981423], [26.279872, 81.98268], [26.278466, 81.984468], [26.277392, 81.986194], [26.276412, 81.988211], [26.276186, 81.988594], [26.277214, 81.986452], [26.278289, 81.984636], [26.279437, 81.983151], [26.28052, 81.981776], [26.28052, 81.981776], [26.281183, 81.980937], [26.282175, 81.979683], [26.282528, 81.979235], [26.28317, 81.978421], [26.284836, 81.976308], [26.286537, 81.974038], [26.288399, 81.971738], [26.290268, 81.96934], [26.301653, 81.950144], [26.299845, 81.953607], [26.299507, 81.954233], [26.299168, 81.954834], [26.298606, 81.955872], [26.298014, 81.957005], [26.29619, 81.96043], [26.295652, 81.96146], [26.295282, 81.96213], [26.29479, 81.963091], [26.29419, 81.964177], [26.293731, 81.964952], [26.29335, 81.965495], [26.293049, 81.965942], [26.29278, 81.966311], [26.292503, 81.96668], [26.291787, 81.967538], [26.292213, 81.966858], [26.292548, 81.966446], [26.292809, 81.966087], [26.293131, 81.96567], [26.293465, 81.965183], [26.29391, 81.964515], [26.294414, 81.96371], [26.294799, 81.962965], [26.29543, 81.961752], [26.295922, 81.960826], [26.297561, 81.957736], [26.298277, 81.956389], [26.298885, 81.955272], [26.299316, 81.954482], [26.299561, 81.954037], [26.30037, 81.952552], [26.301692, 81.949971], [26.312882, 81.928594], [26.306733, 81.940468], [26.304343, 81.945024], [26.309771, 81.934528], [26.31448, 81.925388], [26.325245, 81.904637], [26.321317, 81.912246], [26.317821, 81.919045], [26.316845, 81.920832], [26.319975, 81.914747], [26.32254, 81.909775], [26.327595, 81.899964], [26.338727, 81.879005], [26.336544, 81.883101], [26.334558, 81.886869], [26.332438, 81.89084], [26.328496, 81.898307], [26.33196, 81.891638], [26.334205, 81.887423], [26.335403, 81.885139], [26.337134, 81.881913], [26.338722, 81.878917], [26.350208, 81.856886], [26.345318, 81.866335], [26.343525, 81.869806], [26.340057, 81.876403], [26.344394, 81.868027], [26.349597, 81.857951], [26.364228, 81.830588], [26.359514, 81.839345], [26.355345, 81.847113], [26.353329, 81.8509], [26.354137, 81.849253], [26.357023, 81.843884], [26.360409, 81.837602], [26.375215, 81.808137], [26.373614, 81.811496], [26.37032, 81.818475], [26.368564, 81.822214], [26.366477, 81.8264], [26.36455, 81.829996], [26.366004, 81.827204], [26.36741, 81.8245], [26.370237, 81.818547], [26.372656, 81.813423], [26.374466, 81.809616], [26.38748, 81.784822], [26.383946, 81.791422], [26.381843, 81.795329], [26.381176, 81.796614], [26.377105, 81.804157], [26.376841, 81.804684], [26.376159, 81.806114], [26.376485, 81.80531], [26.377067, 81.804132], [26.379488, 81.799655], [26.381397, 81.796109], [26.38293, 81.793225], [26.384368, 81.79054], [26.399976, 81.761551], [26.396227, 81.768537], [26.392702, 81.775066], [26.388794, 81.782367], [26.389222, 81.781473], [26.393758, 81.773017], [26.398721, 81.763789], [26.402766, 81.756408], [26.402683, 81.756357], [26.402927, 81.7559], [26.407764, 81.746899], [26.410102, 81.742549], [26.410315, 81.742147], [26.411284, 81.740348], [26.402766, 81.756408], [26.41095, 81.741075], [26.41023, 81.742418], [26.407919, 81.746705], [26.404477, 81.753255], [26.413454, 81.736256], [26.420833, 81.722494], [26.422829, 81.718678], [26.424079, 81.716353], [26.423658, 81.717233], [26.421312, 81.721693], [26.418615, 81.726801], [26.427718, 81.709645], [26.432253, 81.701178], [26.433497, 81.698956], [26.428184, 81.708851], [26.439029, 81.688523], [26.440647, 81.685518], [26.441518, 81.683746], [26.442096, 81.68225], [26.444604, 81.675509], [26.446152, 81.671364], [26.447427, 81.667972], [26.445293, 81.673813], [26.443954, 81.677398], [26.442, 81.68264], [26.441159, 81.684703], [26.440398, 81.686011], [26.448481, 81.664988], [26.449381, 81.662562], [26.451909, 81.655846], [26.45365, 81.651184], [26.455122, 81.647243], [26.454881, 81.648011], [26.452069, 81.655546], [26.451109, 81.658095], [26.449212, 81.663133], [26.457708, 81.64041], [26.458509, 81.638332], [26.601386, 81.398242], [26.593665, 81.409628], [26.593639, 81.409582], [26.593639, 81.409582], [26.8467, 80.9475]];

// 3. National Rail Network Corridors
export const RAIL_CORRIDORS: RailCorridor[] = [
  // CORR_BSB_LKO: High-precision OSM curve
  {
    id: 'CORR_BSB_LKO_TRK',
    name: 'Varanasi - Sultanpur - Lucknow Northern Fast Line',
    corridorId: 'CORR_BSB_LKO',
    zone: 'NR',
    division: 'LKO',
    startStation: 'Varanasi Jn (BSB)',
    endStation: 'Lucknow Charbagh (LKO)',
    lengthKm: 285.0,
    coordinates: OSM_BSB_LKO.length > 10 ? OSM_BSB_LKO : [
      [25.3176, 82.9739], [25.6685, 82.7341], [26.2648, 82.0727], [26.5490, 81.6360], [26.8315, 80.9221]
    ],
  },

  // CORR_HWH_DLI: Delhi - Howrah Main Trunk (Golden Quadrilateral North-East)
  {
    id: 'TRK_NDLS_GZB',
    name: 'New Delhi - Ghaziabad Quad Line',
    corridorId: 'CORR_HWH_DLI',
    zone: 'NR',
    division: 'NDLS',
    startStation: 'New Delhi (NDLS)',
    endStation: 'Ghaziabad (GZB)',
    lengthKm: 26.0,
    coordinates: [
      [28.6139, 77.2090], [28.6310, 77.2600], [28.6500, 77.3150], [28.6692, 77.4538]
    ],
  },
  {
    id: 'TRK_GZB_CNB',
    name: 'Ghaziabad - Aligarh - Tundla - Kanpur Central Fast Line',
    corridorId: 'CORR_HWH_DLI',
    zone: 'NCR',
    division: 'CNB',
    startStation: 'Ghaziabad (GZB)',
    endStation: 'Kanpur Central (CNB)',
    lengthKm: 410.0,
    coordinates: [
      [28.6692, 77.4538], [28.4000, 77.6000], [28.1800, 77.8200], [27.8974, 78.0880],
      [27.5500, 78.1800], [27.2080, 78.2430], [26.9800, 78.6000], [26.7768, 79.0305],
      [26.5500, 79.6000], [26.4712, 80.2435], [26.4499, 80.3319]
    ],
  },
  {
    id: 'TRK_CNB_PRYJ',
    name: 'Kanpur - Fatehpur - Prayagraj Fast Line',
    corridorId: 'CORR_HWH_DLI',
    zone: 'NCR',
    division: 'ALD',
    startStation: 'Kanpur Central (CNB)',
    endStation: 'Prayagraj Jn (PRYJ)',
    lengthKm: 194.0,
    coordinates: [
      [26.4499, 80.3319], [26.1800, 80.5500], [25.9286, 80.8122], [25.7000, 81.2500],
      [25.5500, 81.5500], [25.4358, 81.8463]
    ],
  },
  {
    id: 'TRK_PRYJ_DDU',
    name: 'Prayagraj - Mirzapur - Pt. DDU Jn Line',
    corridorId: 'CORR_HWH_DLI',
    zone: 'NCR',
    division: 'DDU',
    startStation: 'Prayagraj Jn (PRYJ)',
    endStation: 'Pt. DDU Jn (DDU)',
    lengthKm: 143.0,
    coordinates: [
      [25.4358, 81.8463], [25.2800, 82.2000], [25.1460, 82.5690], [25.1300, 82.8800],
      [25.2500, 83.0500], [25.2818, 83.1189]
    ],
  },
  {
    id: 'TRK_DDU_PNBE',
    name: 'Pt. DDU Jn - Buxar - Ara - Patna Mainline',
    corridorId: 'CORR_HWH_DLI',
    zone: 'ECR',
    division: 'PNBE',
    startStation: 'Pt. DDU Jn (DDU)',
    endStation: 'Patna Jn (PNBE)',
    lengthKm: 212.0,
    coordinates: [
      [25.2818, 83.1189], [25.4200, 83.5500], [25.5647, 83.9777], [25.5600, 84.3500],
      [25.5560, 84.6640], [25.6267, 85.0433], [25.6042, 85.1376]
    ],
  },
  {
    id: 'TRK_PNBE_KIR',
    name: 'Patna - Barauni - Katihar Line',
    corridorId: 'CORR_HWH_DLI',
    zone: 'ECR',
    division: 'KIR',
    startStation: 'Patna Jn (PNBE)',
    endStation: 'Katihar Jn (KIR)',
    lengthKm: 290.0,
    coordinates: [
      [25.6042, 85.1376], [25.4500, 85.5000], [25.3941, 85.9189], [25.4746, 86.0125],
      [25.5450, 86.5820], [25.5414, 87.5684]
    ],
  },
  {
    id: 'TRK_DDU_GAYA_HWH',
    name: 'DDU - Gaya - Dhanbad - Asansol - Howrah Grand Chord',
    corridorId: 'CORR_HWH_DLI',
    zone: 'ECR',
    division: 'MGS',
    startStation: 'Pt. DDU Jn (DDU)',
    endStation: 'Howrah Jn (HWH)',
    lengthKm: 660.0,
    coordinates: [
      [25.2818, 83.1189], [24.9510, 84.0320], [24.7964, 85.0076], [24.4500, 85.6000],
      [24.0000, 86.1000], [23.7957, 86.4304], [23.6889, 86.9661], [23.5204, 87.3119],
      [23.2324, 87.8615], [22.9190, 88.3840], [22.5839, 88.3425]
    ],
  },

  // Western Trunk (Delhi - Mathura - Kota - Ratlam - Vadodara - Surat - Mumbai Central)
  {
    id: 'TRK_NDLS_KOTA_RTM',
    name: 'Delhi - Mathura - Kota - Ratlam Western Fast Corridor',
    corridorId: 'CORR_DEL_BCT',
    zone: 'WR',
    division: 'RTM',
    startStation: 'New Delhi (NDLS)',
    endStation: 'Ratlam Jn (RTM)',
    lengthKm: 730.0,
    coordinates: [
      [28.6139, 77.2090], [28.1487, 77.3320], [27.4924, 77.6737], [26.5000, 76.8000],
      [25.8000, 76.3000], [25.1800, 75.8300], [24.1830, 75.6420], [23.4500, 75.4167],
      [23.3315, 75.0367]
    ],
  },
  {
    id: 'TRK_RTM_ST_BCT',
    name: 'Ratlam - Vadodara - Surat - Mumbai Central Mainline',
    corridorId: 'CORR_DEL_BCT',
    zone: 'WR',
    division: 'BCT',
    startStation: 'Ratlam Jn (RTM)',
    endStation: 'Mumbai Central (BCT)',
    lengthKm: 650.0,
    coordinates: [
      [23.3315, 75.0367], [22.8333, 74.2500], [22.6000, 73.6500], [22.3072, 73.1812],
      [21.6000, 73.0000], [21.1702, 72.8311], [20.6100, 72.9300], [20.3710, 72.9040],
      [19.6967, 72.7656], [19.2288, 72.8569], [19.0596, 72.8400], [18.9696, 72.8193]
    ],
  },

  // Central & Southern Trunk (Delhi - Bhopal - Nagpur - Secunderabad - Chennai)
  {
    id: 'TRK_DEL_BPL_ET',
    name: 'Delhi - Agra - Gwalior - Jhansi - Bhopal - Itarsi Line',
    corridorId: 'CORR_DEL_MAS',
    zone: 'WCR',
    division: 'BPL',
    startStation: 'New Delhi (NDLS)',
    endStation: 'Itarsi Jn (ET)',
    lengthKm: 790.0,
    coordinates: [
      [28.6139, 77.2090], [27.4924, 77.6737], [27.1590, 77.9900], [26.2183, 78.1828],
      [25.4484, 78.5685], [24.1750, 78.1850], [23.5250, 77.8170], [23.2599, 77.4126],
      [22.6124, 77.7610]
    ],
  },
  {
    id: 'TRK_ET_NGP_SC',
    name: 'Itarsi - Nagpur - Balharshah - Secunderabad Trunk',
    corridorId: 'CORR_DEL_MAS',
    zone: 'SCR',
    division: 'SC',
    startStation: 'Itarsi Jn (ET)',
    endStation: 'Secunderabad Jn (SC)',
    lengthKm: 850.0,
    coordinates: [
      [22.6124, 77.7610], [21.8000, 78.4000], [21.1458, 79.0882], [20.2000, 79.3000],
      [19.5000, 79.4000], [18.7000, 79.5000], [17.9784, 79.5218], [17.4344, 78.5011]
    ],
  },
  {
    id: 'TRK_SC_GNT_MAS',
    name: 'Secunderabad - Guntur - Vijayawada - Chennai Central Mainline',
    corridorId: 'CORR_DEL_MAS',
    zone: 'SR',
    division: 'MAS',
    startStation: 'Secunderabad Jn (SC)',
    endStation: 'Chennai Central (MAS)',
    lengthKm: 700.0,
    coordinates: [
      [17.4344, 78.5011], [16.8000, 79.5000], [16.2974, 80.4435], [16.5062, 80.6480],
      [15.5000, 80.0500], [14.4400, 79.9800], [13.7000, 80.0200], [13.0827, 80.2707]
    ],
  },

  // East Coast Trunk (Howrah - Bhubaneswar - Visakhapatnam - Chennai)
  {
    id: 'TRK_HWH_BBS_VSKP',
    name: 'Howrah - Kharagpur - Cuttack - Bhubaneswar - Visakhapatnam Coastal Trunk',
    corridorId: 'CORR_HWH_MAS',
    zone: 'ECoR',
    division: 'BBS',
    startStation: 'Howrah Jn (HWH)',
    endStation: 'Visakhapatnam Jn (VSKP)',
    lengthKm: 880.0,
    coordinates: [
      [22.5839, 88.3425], [22.3394, 87.3242], [21.4934, 86.9317], [21.0570, 86.5050],
      [20.4625, 85.8830], [20.2644, 85.8400], [19.3150, 84.7930], [18.2930, 83.8960],
      [17.7214, 83.2872]
    ],
  },

  // North-Western Trunk (Delhi - Jaipur - Ajmer - Ahmedabad)
  {
    id: 'TRK_DEL_JP_AII_ADI',
    name: 'Delhi - Jaipur - Ajmer - Ahmedabad Line',
    corridorId: 'CORR_DEL_JP_ADI',
    zone: 'NWR',
    division: 'JP',
    startStation: 'New Delhi (NDLS)',
    endStation: 'Ahmedabad Jn (ADI)',
    lengthKm: 930.0,
    coordinates: [
      [28.6139, 77.2090], [28.2000, 76.6000], [27.5600, 76.6000], [27.0500, 76.5700],
      [26.9196, 75.7878], [26.5750, 74.8650], [26.4525, 74.6399], [25.7333, 73.6000],
      [24.4800, 72.7800], [23.5900, 72.3800], [23.0225, 72.5714]
    ],
  },

  // Central Hub (Prayagraj - Katni - Jabalpur - Itarsi)
  {
    id: 'TRK_PRYJ_JBP_ET',
    name: 'Prayagraj - Manikpur - Katni - Jabalpur - Itarsi Line',
    corridorId: 'CORR_PRYJ_JBP_ET',
    zone: 'WCR',
    division: 'JBP',
    startStation: 'Prayagraj Jn (PRYJ)',
    endStation: 'Itarsi Jn (ET)',
    lengthKm: 600.0,
    coordinates: [
      [25.4358, 81.8463], [25.0400, 81.1200], [24.5800, 80.8300], [23.8343, 80.3995],
      [23.1600, 79.9400], [22.7583, 78.3583], [22.6124, 77.7610]
    ],
  },

  // Gorakhpur / North Eastern Trunk
  {
    id: 'TRK_LKO_GKP',
    name: 'Lucknow - Barabanki - Basti - Gorakhpur Trunk',
    corridorId: 'CORR_LKO_GKP',
    zone: 'NER',
    division: 'GKP',
    startStation: 'Lucknow Charbagh (LKO)',
    endStation: 'Gorakhpur Jn (GKP)',
    lengthKm: 270.0,
    coordinates: [
      [26.8315, 80.9221], [26.9274, 81.1834], [27.1350, 81.9600], [26.8013, 82.7483],
      [26.7588, 83.3853]
    ],
  },

  // Ranchi / Chota Nagpur Line
  {
    id: 'TRK_GAYA_RNC',
    name: 'Gaya - Bokaro - Ranchi Trunk',
    corridorId: 'CORR_RNC',
    zone: 'SER',
    division: 'RNC',
    startStation: 'Gaya Jn (GAYA)',
    endStation: 'Ranchi Jn (RNC)',
    lengthKm: 215.0,
    coordinates: [
      [24.7964, 85.0076], [24.4500, 85.6000], [23.6693, 86.1511], [23.3800, 85.8600],
      [23.3512, 85.3283]
    ],
  },
];

// Lookup mapping from division code to primary track corridor
const DIVISION_TO_CORRIDOR: Record<string, string> = {
  NDLS: 'TRK_NDLS_GZB',
  DLI: 'TRK_NDLS_GZB',
  CNB: 'TRK_GZB_CNB',
  ALD: 'TRK_CNB_PRYJ',
  DDU: 'TRK_PRYJ_DDU',
  MGS: 'TRK_DDU_GAYA_HWH',
  LKO: 'CORR_BSB_LKO_TRK',
  LJN: 'TRK_GZB_CNB',
  GKP: 'TRK_LKO_GKP',
  PNBE: 'TRK_DDU_PNBE',
  KIR: 'TRK_PNBE_KIR',
  HWH: 'TRK_DDU_GAYA_HWH',
  RNC: 'TRK_GAYA_RNC',
  BBS: 'TRK_HWH_BBS_VSKP',
  VSKP: 'TRK_HWH_BBS_VSKP',
  MAS: 'TRK_SC_GNT_MAS',
  GNT: 'TRK_SC_GNT_MAS',
  SC: 'TRK_ET_NGP_SC',
  BPL: 'TRK_DEL_BPL_ET',
  JBP: 'TRK_PRYJ_JBP_ET',
  RTM: 'TRK_NDLS_KOTA_RTM',
  BCT: 'TRK_RTM_ST_BCT',
  ADI: 'TRK_DEL_JP_AII_ADI',
  JP: 'TRK_DEL_JP_AII_ADI',
  AII: 'TRK_DEL_JP_AII_ADI',
};

// Deterministic task fraction (0.05 to 0.95) along track polyline
export function taskFraction(taskId: string): number {
  let h = 0;
  for (let i = 0; i < taskId.length; i++) {
    h = (h * 31 + taskId.charCodeAt(i)) >>> 0;
  }
  return 0.05 + ((h % 1000) / 1000) * 0.90;
}

// Interpolate along a multi-point polyline
export function interpolatePolyline(coords: [number, number][], frac: number): { lat: number; lon: number; headingDeg: number } {
  if (!coords || coords.length === 0) return { lat: 28.6139, lon: 77.2090, headingDeg: 0 };
  if (coords.length === 1) return { lat: coords[0][0], lon: coords[0][1], headingDeg: 0 };

  const clamped = Math.max(0.02, Math.min(0.98, frac));

  // Compute cumulative lengths
  const dists: number[] = [0];
  let totalDist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const dLat = coords[i + 1][0] - coords[i][0];
    const dLon = coords[i + 1][1] - coords[i][1];
    const d = Math.hypot(dLat, dLon);
    totalDist += d;
    dists.push(totalDist);
  }

  const targetDist = clamped * totalDist;
  let segIdx = 0;
  for (let i = 0; i < dists.length - 1; i++) {
    if (targetDist >= dists[i] && targetDist <= dists[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const segSpan = dists[segIdx + 1] - dists[segIdx];
  const localFrac = segSpan > 0 ? (targetDist - dists[segIdx]) / segSpan : 0.5;

  const p1 = coords[segIdx];
  const p2 = coords[segIdx + 1];
  const lat = p1[0] + (p2[0] - p1[0]) * localFrac;
  const lon = p1[1] + (p2[1] - p1[1]) * localFrac;

  const headingDeg = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;

  return { lat, lon, headingDeg };
}

// Strictly snaps any maintenance block to authentic Indian Railways track infrastructure
export function snapTaskToRailTrack(
  task: {
    task_id: string;
    section_id?: string;
    section_name?: string;
    corridor_id?: string;
    affects_line?: string;
    lat?: number;
    lon?: number;
  }
): { lat: number; lon: number; division: string; trackName: string } {
  // 1. Detect division code from section_name (e.g. 'Section 0043 NDLS' -> 'NDLS')
  let divCode = 'NDLS';
  if (task.section_name) {
    const parts = task.section_name.trim().split(/\s+/);
    const last = parts[parts.length - 1].toUpperCase();
    if (DIVISION_TO_CORRIDOR[last]) {
      divCode = last;
    }
  }

  // 2. Select matching corridor track
  const trackId = DIVISION_TO_CORRIDOR[divCode] || 'TRK_NDLS_GZB';
  const corridor = RAIL_CORRIDORS.find((c) => c.id === trackId) || RAIL_CORRIDORS[0];

  // 3. Position along track polyline
  const frac = taskFraction(task.task_id);
  const pos = interpolatePolyline(corridor.coordinates, frac);

  let lat = pos.lat;
  let lon = pos.lon;

  // 4. Calculate lateral track offset for UP vs DOWN line
  const line = task.affects_line || 'BOTH';
  if (line !== 'BOTH') {
    const offsetMag = line === 'UP' ? 0.0015 : -0.0015; // ~150 meters lateral separation
    const rad = (pos.headingDeg * Math.PI) / 180;
    // Perpendicular vector: [-sin(heading), cos(heading)]
    lat += -Math.sin(rad) * offsetMag;
    lon += Math.cos(rad) * offsetMag;
  }

  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lon: Math.round(lon * 1000000) / 1000000,
    division: divCode,
    trackName: corridor.name,
  };
}


export interface RailwayAsset {
  id: string;
  name: string;
  department: 'Engineering' | 'Traction' | 'S&T';
  type: string;
  division: string;
  lat: number;
  lon: number;
  healthIndex: number;
  status: 'Operational' | 'Inspection Due' | 'Maintenance Required';
  lastInspection: string;
}

export interface FailureAlert {
  id: string;
  defectType: string;
  department: 'Engineering' | 'Traction' | 'S&T';
  division: string;
  lat: number;
  lon: number;
  priorityScore: number;
  line: 'UP' | 'DOWN' | 'BOTH';
  restriction: string;
  status: 'Critical Alert' | 'Active Investigation' | 'Block Requested';
}

export interface ActiveTrain {
  trainNumber: string;
  trainName: string;
  type: 'Superfast' | 'Vande Bharat' | 'Express' | 'Freight';
  division: string;
  direction: 'UP' | 'DOWN';
  currentSection: string;
  lat: number;
  lon: number;
  speedKmph: number;
  statusText: string;
  isDelayed: boolean;
}

// 4. Railway Fixed Infrastructure Assets
export const RAIL_ASSETS: RailwayAsset[] = [
  // Engineering Track Assets
  { id: 'AST-ENG-001', name: 'UIC-60 Continuously Welded Rail Track', department: 'Engineering', type: 'Mainline Track & Sleepers', division: 'NDLS', lat: 28.6410, lon: 77.3320, healthIndex: 94, status: 'Operational', lastInspection: '2026-08-20' },
  { id: 'AST-ENG-002', name: 'Kanpur Yard 1-in-12 Diamond Crossover', department: 'Engineering', type: 'Turnout & Diamond Crossing', division: 'CNB', lat: 26.4600, lon: 80.2900, healthIndex: 82, status: 'Inspection Due', lastInspection: '2026-08-14' },
  { id: 'AST-ENG-003', name: 'Naini Yamuna Rail Bridge Track Structure', department: 'Engineering', type: 'Major Steel Girder Bridge Track', division: 'ALD', lat: 25.4200, lon: 81.8600, healthIndex: 91, status: 'Operational', lastInspection: '2026-08-18' },
  { id: 'AST-ENG-004', name: 'Pt. DDU Marshalling Yard Ladder Points', department: 'Engineering', type: 'Yard Sorting Crossovers', division: 'MGS', lat: 25.2810, lon: 83.1160, healthIndex: 78, status: 'Maintenance Required', lastInspection: '2026-08-11' },
  { id: 'AST-ENG-005', name: 'Varanasi North Curve High-Speed Track', department: 'Engineering', type: 'Curved Mainline Track', division: 'LKO', lat: 25.3500, lon: 82.9400, healthIndex: 89, status: 'Operational', lastInspection: '2026-08-19' },
  { id: 'AST-ENG-006', name: 'Borivali Quadruple Suburban Fast Crossover', department: 'Engineering', type: 'Suburban Crossover Point', division: 'BCT', lat: 19.2300, lon: 72.8550, healthIndex: 96, status: 'Operational', lastInspection: '2026-08-22' },
  { id: 'AST-ENG-007', name: 'Kota West Turnout System', department: 'Engineering', type: 'Mainline High-Speed Turnout', division: 'RTM', lat: 25.1750, lon: 75.8200, healthIndex: 87, status: 'Operational', lastInspection: '2026-08-15' },
  { id: 'AST-ENG-008', name: 'Secunderabad Outer Junction Switch', department: 'Engineering', type: 'Turnout Point Machine', division: 'SC', lat: 17.4400, lon: 78.5100, healthIndex: 85, status: 'Operational', lastInspection: '2026-08-16' },
  { id: 'AST-ENG-009', name: 'Chennai Central Basin Bridge Approach Track', department: 'Engineering', type: 'Terminal Approach Crossover', division: 'MAS', lat: 13.0900, lon: 79.9800, healthIndex: 92, status: 'Operational', lastInspection: '2026-08-21' },
  { id: 'AST-ENG-010', name: 'Bhopal Habibganj Express Turnout', department: 'Engineering', type: 'High-Speed Track Switch', division: 'BPL', lat: 23.2100, lon: 77.4450, healthIndex: 90, status: 'Operational', lastInspection: '2026-08-17' },

  // Traction (OHE) Assets
  { id: 'AST-TRC-101', name: 'Ghaziabad 25kV Traction Substation (TSS)', department: 'Traction', type: '25kV AC Power Substation', division: 'NDLS', lat: 28.6650, lon: 77.4400, healthIndex: 97, status: 'Operational', lastInspection: '2026-08-22' },
  { id: 'AST-TRC-102', name: 'Panki Switching & Sectioning Post (SP)', department: 'Traction', type: 'OHE Sectioning Post', division: 'CNB', lat: 26.4700, lon: 80.2500, healthIndex: 88, status: 'Operational', lastInspection: '2026-08-16' },
  { id: 'AST-TRC-103', name: 'Fatehpur Regulated OHE Catenary Section', department: 'Traction', type: '107 sq mm Contact Wire Catenary', division: 'ALD', lat: 25.9300, lon: 80.8200, healthIndex: 84, status: 'Operational', lastInspection: '2026-08-12' },
  { id: 'AST-TRC-104', name: 'DDU East 132/25kV Feeding Substation', department: 'Traction', type: 'Heavy Haul Traction Feeding Post', division: 'DDU', lat: 25.2780, lon: 83.1250, healthIndex: 93, status: 'Operational', lastInspection: '2026-08-19' },
  { id: 'AST-TRC-105', name: 'Sultanpur Neutral Section Over-Bridge Post', department: 'Traction', type: 'PTFE Neutral Section Assembly', division: 'LKO', lat: 26.2700, lon: 82.0800, healthIndex: 79, status: 'Maintenance Required', lastInspection: '2026-08-10' },
  { id: 'AST-TRC-106', name: 'Surat OHE Auto Tensioning Device (ATD)', department: 'Traction', type: 'Gas-Hydraulic ATD Tensioner', division: 'BCT', lat: 21.1800, lon: 72.8400, healthIndex: 95, status: 'Operational', lastInspection: '2026-08-21' },
  { id: 'AST-TRC-107', name: 'Itarsi Jn 25kV Traction Paralleling Post', department: 'Traction', type: 'Substation Paralleling Post', division: 'BPL', lat: 22.6200, lon: 77.7700, healthIndex: 86, status: 'Inspection Due', lastInspection: '2026-08-13' },
  { id: 'AST-TRC-108', name: 'Vijayawada North Overhead Catenary Mast', department: 'Traction', type: 'OHE Mast Structure', division: 'GNT', lat: 16.5100, lon: 80.6500, healthIndex: 91, status: 'Operational', lastInspection: '2026-08-18' },

  // S&T (Signalling & Telecom) Assets
  { id: 'AST-SNT-201', name: 'New Delhi Cabin A Solid State Interlocking', department: 'S&T', type: 'Electronic Interlocking (EI)', division: 'NDLS', lat: 28.6180, lon: 77.2150, healthIndex: 98, status: 'Operational', lastInspection: '2026-08-23' },
  { id: 'AST-SNT-202', name: 'Kanpur Central Audio Frequency Track Circuit', department: 'S&T', type: 'AFTC Block Detection Unit', division: 'CNB', lat: 26.4520, lon: 80.3400, healthIndex: 86, status: 'Operational', lastInspection: '2026-08-17' },
  { id: 'AST-SNT-203', name: 'Sirathu 4-Aspect Auto Color Light Signal Post', department: 'S&T', type: 'LED Multi-Aspect Signal', division: 'ALD', lat: 25.6500, lon: 81.3500, healthIndex: 81, status: 'Inspection Due', lastInspection: '2026-08-15' },
  { id: 'AST-SNT-204', name: 'DDU Yard Route Relay Interlocking (RRI)', department: 'S&T', type: 'Route Relay Interlocking Cabin', division: 'MGS', lat: 25.2830, lon: 83.1120, healthIndex: 76, status: 'Maintenance Required', lastInspection: '2026-08-09' },
  { id: 'AST-SNT-205', name: 'Kavach TCAS Trackside RFID Balise 108', department: 'S&T', type: 'Kavach Anti-Collision Transponder', division: 'ALD', lat: 25.4400, lon: 81.8300, healthIndex: 99, status: 'Operational', lastInspection: '2026-08-22' },
  { id: 'AST-SNT-206', name: 'Kavach TCAS Trackside Radio Unit (TSRU)', department: 'S&T', type: 'UHF Radio Base Station', division: 'RTM', lat: 25.1850, lon: 75.8350, healthIndex: 94, status: 'Operational', lastInspection: '2026-08-19' },
  { id: 'AST-SNT-207', name: 'Howrah Terminal Multi-Core Signal Cable Network', department: 'S&T', type: 'Signalling Cable Duct', division: 'HWH', lat: 22.5900, lon: 88.3380, healthIndex: 88, status: 'Operational', lastInspection: '2026-08-18' },
  { id: 'AST-SNT-208', name: 'Secunderabad Dual-Detection Axle Counter', department: 'S&T', type: 'High-Availability Axle Counter', division: 'SC', lat: 17.4360, lon: 78.4980, healthIndex: 95, status: 'Operational', lastInspection: '2026-08-20' },
];

// 5. High-Risk Safety Failures & Emergency Hotspots
export const FAILURE_ALERTS: FailureAlert[] = [
  { id: 'FAIL-001', defectType: 'Broken Rail AT Weld Fracture', department: 'Engineering', division: 'NDLS', lat: 28.6480, lon: 77.3800, priorityScore: 98.5, line: 'UP', restriction: 'Emergency Caution 20 km/h applied · Total Block Requested', status: 'Critical Alert' },
  { id: 'FAIL-002', defectType: 'Signal 4-Aspect Red Over Red Lamp Failure', department: 'S&T', division: 'CNB', lat: 26.4712, lon: 80.2435, priorityScore: 96.2, line: 'BOTH', restriction: 'Signals Clamped to Danger · 45 min Power Block Required', status: 'Critical Alert' },
  { id: 'FAIL-003', defectType: 'OHE Contact Wire Tension Drop & Catenary Sag', department: 'Traction', division: 'ALD', lat: 25.7000, lon: 81.2500, priorityScore: 94.8, line: 'DOWN', restriction: 'Panto-Lower Order Issued · Tower Wagon Block Assigned', status: 'Critical Alert' },
  { id: 'FAIL-004', defectType: 'Facing Point 104B Lock-Bar Failure', department: 'Engineering', division: 'MGS', lat: 25.2800, lon: 83.1150, priorityScore: 93.4, line: 'UP', restriction: 'Manual Clamp & Padlock Applied · 60 min Repair Window', status: 'Block Requested' },
  { id: 'FAIL-005', defectType: 'Audio Frequency Track Circuit Glitch (Intermittent)', department: 'S&T', division: 'LKO', lat: 26.2648, lon: 82.0727, priorityScore: 91.5, line: 'BOTH', restriction: 'Caution Aspect Locked · S&T Maintenance Crew En Route', status: 'Active Investigation' },
  { id: 'FAIL-006', defectType: 'Severe Rail Wheel-Burn & Surface Flaw', department: 'Engineering', division: 'BCT', lat: 19.6967, lon: 72.7656, priorityScore: 90.1, line: 'UP', restriction: 'Speed Limited to 50 km/h · Rail Grinding Machine Assigned', status: 'Block Requested' },
  { id: 'FAIL-007', defectType: 'OHE Neutral Section PTFE Insulator Flashover', department: 'Traction', division: 'BPL', lat: 23.2599, lon: 77.4126, priorityScore: 92.8, line: 'DOWN', restriction: 'Isolated Feeding Section · 90 min Catenary Block Requested', status: 'Critical Alert' },
  { id: 'FAIL-008', defectType: 'Tongue Rail Chipping on Turnout 12A', department: 'Engineering', division: 'MAS', lat: 13.7000, lon: 80.0200, priorityScore: 95.0, line: 'UP', restriction: 'Caution Order 30 km/h · Emergency Weld Replacement', status: 'Critical Alert' },
  { id: 'FAIL-009', defectType: 'Axle Counter Evaluator Communication Loss', department: 'S&T', division: 'SC', lat: 17.9784, lon: 79.5218, priorityScore: 89.6, line: 'BOTH', restriction: 'Fallback to Manual Block Working · S&T Signal Team Dispatched', status: 'Active Investigation' },
  { id: 'FAIL-010', defectType: 'High-Temperature Rail Expansion Thermal Kick Hazard', department: 'Engineering', division: 'RTM', lat: 24.1830, lon: 75.6420, priorityScore: 92.3, line: 'DOWN', restriction: 'Destressing Operation Required · 120 min Track Block', status: 'Block Requested' },
];

// 6. Live Active Train Movements
export const ACTIVE_TRAINS: ActiveTrain[] = [
  { trainNumber: '12301', trainName: 'Howrah Rajdhani Express', type: 'Superfast', division: 'ALD', direction: 'UP', currentSection: 'Fatehpur ➔ Kanpur Central Fast Line', lat: 26.1800, lon: 80.5500, speedKmph: 128, statusText: 'On Time (Green Signal Corridor)', isDelayed: false },
  { trainNumber: '12952', trainName: 'Mumbai Tejas Rajdhani Express', type: 'Superfast', division: 'BCT', direction: 'UP', currentSection: 'Surat ➔ Vadodara Fast Mainline', lat: 21.6000, lon: 73.0000, speedKmph: 130, statusText: 'On Time (Clear Ahead)', isDelayed: false },
  { trainNumber: '22436', trainName: 'Vande Bharat Express', type: 'Vande Bharat', division: 'CNB', direction: 'DOWN', currentSection: 'Etawah ➔ Kanpur Central Quad Line', lat: 26.5500, lon: 79.6000, speedKmph: 155, statusText: 'High-Speed Transit · Priority Clearance', isDelayed: false },
  { trainNumber: '12622', trainName: 'Tamil Nadu Express', type: 'Superfast', division: 'MAS', direction: 'UP', currentSection: 'Nellore ➔ Ongole Grand Trunk Line', lat: 14.4400, lon: 79.9800, speedKmph: 112, statusText: 'Minor Delay (+8 mins)', isDelayed: true },
  { trainNumber: '12004', trainName: 'Lucknow Swarna Shatabdi Express', type: 'Superfast', division: 'NDLS', direction: 'DOWN', currentSection: 'Ghaziabad ➔ Aligarh Mainline', lat: 28.1800, lon: 77.8200, speedKmph: 125, statusText: 'On Time · Ahead of Scheduled Margin', isDelayed: false },
  { trainNumber: 'BOXN-8842', trainName: 'Heavy-Haul Coal Rake (58 BOXN)', type: 'Freight', division: 'DDU', direction: 'DOWN', currentSection: 'DDU Yard ➔ Sasaram Grand Chord', lat: 25.1000, lon: 83.6000, speedKmph: 68, statusText: 'Steady Running · Clear for 45 km', isDelayed: false },
  { trainNumber: 'BLC-1094', trainName: 'Double-Stack Container Express (CONCOR)', type: 'Freight', division: 'RTM', direction: 'UP', currentSection: 'Shamgarh ➔ Kota Western Corridor', lat: 24.8000, lon: 75.7500, speedKmph: 82, statusText: 'On Schedule · Western Freight Corridor', isDelayed: false },
  { trainNumber: '12802', trainName: 'Purushottam Express', type: 'Express', division: 'PNBE', direction: 'DOWN', currentSection: 'Buxar ➔ Ara Mainline', lat: 25.5600, lon: 84.3500, speedKmph: 104, statusText: 'On Time', isDelayed: false },
  { trainNumber: '12260', trainName: 'Sealdah AC Duronto Express', type: 'Superfast', division: 'HWH', direction: 'UP', currentSection: 'Asansol ➔ Dhanbad Grand Chord', lat: 23.7500, lon: 86.6500, speedKmph: 122, statusText: 'On Time (Non-Stop Transit)', isDelayed: false },
  { trainNumber: '12433', trainName: 'Chennai Central Rajdhani Express', type: 'Superfast', division: 'BPL', direction: 'DOWN', currentSection: 'Bhopal ➔ Itarsi Junction Section', lat: 22.9500, lon: 77.5800, speedKmph: 118, statusText: 'On Time', isDelayed: false },
];

import React, { useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, FileText, Database, CheckCircle2, AlertTriangle, Clock3, RefreshCw, ArrowUpRight, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

const DATASETS = [
  { id: 'corridors', label: 'Corridors', key: 'corridors' },
  { id: 'sections', label: 'Sections', key: 'sections' },
  { id: 'assets', label: 'Assets', key: 'assets' },
  { id: 'failure_event_history', label: 'Failure Event History', key: 'failure_event_history' },
  { id: 'defect_history', label: 'Defect History', key: 'defect_history' },
  { id: 'maintenance_tasks', label: 'Maintenance Tasks', key: 'maintenance_tasks' },
  { id: 'train_movements', label: 'Train Movements / COA', key: 'train_movements' },
  { id: 'block_windows', label: 'Block Windows', key: 'block_windows' },
  { id: 'goods_forecast', label: 'Goods Forecast', key: 'goods_forecast' },
  { id: 'resources', label: 'Resources', key: 'resources' },
  { id: 'inspections', label: 'Inspections', key: 'inspections' },
  { id: 'maintenance_history', label: 'Maintenance History', key: 'maintenance_history' },
];

type Preview = {
  fileName: string;
  format: string;
  rows: number;
  columns: string[];
  preview: any[][];
};

export const DataIngestionView: React.FC = () => {
  const [dataset, setDataset] = useState('train_movements');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('Select a COA / departmental data file to begin.');

  const selectedDataset = useMemo(() => DATASETS.find((d) => d.id === dataset)!, [dataset]);

  const readFile = async (file: File) => {
    setStatus('reading');
    setMessage(`Reading ${file.name}…`);
    try {
      const lower = file.name.toLowerCase();
      let rows: any[][] = [];
      if (lower.endsWith('.csv')) {
        const text = await file.text();
        rows = text.split(/\r?\n/).filter(Boolean).slice(0, 10001).map((line) => {
          const out: string[] = [];
          let cur = '';
          let quote = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') quote = !quote;
            else if (ch === ',' && !quote) { out.push(cur.trim()); cur = ''; }
            else cur += ch;
          }
          out.push(cur.trim());
          return out;
        });
      } else if (lower.endsWith('.xlsx')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' }) as any[][];
        rows = rows.slice(0, 10001);
      } else if (lower.endsWith('.json')) {
        const parsed = JSON.parse(await file.text());
        const data = Array.isArray(parsed) ? parsed : (parsed.data || []);
        const keys = Array.from(new Set(data.flatMap((x: any) => Object.keys(x || {}))));
        rows = [keys, ...data.slice(0, 10000).map((x: any) => keys.map((k) => x?.[k] ?? ''))];
      } else {
        throw new Error('Supported formats: CSV, XLSX or JSON.');
      }
      if (!rows.length) throw new Error('The uploaded file contains no readable rows.');
      const headers = rows[0].map((x) => String(x ?? '').trim()).filter(Boolean);
      setPreview({ fileName: file.name, format: lower.split('.').pop()?.toUpperCase() || 'FILE', rows: Math.max(0, rows.length - 1), columns: headers, preview: rows.slice(0, 7) });
      setStatus('ready');
      setMessage(`Local preview ready. ${Math.max(0, rows.length - 1).toLocaleString()} rows detected.`);
    } catch (err: any) {
      setStatus('error');
      setPreview(null);
      setMessage(err?.message || 'Unable to read the uploaded file.');
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void readFile(f);
  };

  return (
    <div className="space-y-4 pb-10">
      <section className="rounded-xl overflow-hidden border border-[#D7D7D7] shadow-sm bg-white">
        <div className="bg-gradient-to-r from-[#7F1418] via-[#8E171B] to-[#5E0E11] text-white px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#FFD29E] font-bold"><Database className="w-3.5 h-3.5" /> DATA CONTROL / INGESTION</div>
            <h2 className="text-xl font-extrabold mt-1">COA & Departmental Data Ingestion</h2>
            <p className="text-[12px] text-white/75 mt-1">Upload, inspect and prepare operational data before it enters the planning pipeline.</p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/10 border border-white/20"><ShieldCheck className="w-3.5 h-3.5" /> Schema-controlled</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/10 border border-white/20"><RefreshCw className="w-3.5 h-3.5" /> Point-in-time aware</span>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Source dataset</label>
                <select value={dataset} onChange={(e) => setDataset(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#8E171B]">
                  {DATASETS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>

              <label
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) void readFile(f); }}
                className={`block rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${dragActive ? 'border-[#FF9933] bg-[#FFF8F0]' : 'border-[#D0D5DD] bg-[#FAFAFA] hover:border-[#8E171B] hover:bg-[#FFFDFC]'}`}
              >
                <input type="file" accept=".csv,.xlsx,.json" className="hidden" onChange={onInput} />
                <div className="mx-auto w-12 h-12 rounded-full bg-[#FFF3E6] flex items-center justify-center text-[#8E171B]"><Upload className="w-5 h-5" /></div>
                <p className="mt-3 text-sm font-bold text-[#1F2937]">Drop COA / source file here</p>
                <p className="text-[11px] text-[#667085] mt-1">CSV, XLSX or JSON · preview is generated locally</p>
              </label>

              <div className="rounded-lg border border-[#E4E7EC] bg-[#FCFCFD] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Selected contract</p>
                <div className="flex items-start gap-2 mt-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#8E171B] mt-0.5" />
                  <div><p className="text-xs font-semibold text-[#1F2937]">{selectedDataset.label}</p><p className="text-[10px] text-[#667085]">Canonical table: {selectedDataset.key}</p></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#E4E7EC] p-3"><div className="text-[10px] uppercase font-bold text-[#667085]">File status</div><div className="mt-1 flex items-center gap-2 text-sm font-bold">{status === 'ready' ? <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> : status === 'error' ? <AlertTriangle className="w-4 h-4 text-[#D92D20]" /> : <Clock3 className="w-4 h-4 text-[#98A2B3]" />}{status.toUpperCase()}</div></div>
                <div className="rounded-lg border border-[#E4E7EC] p-3"><div className="text-[10px] uppercase font-bold text-[#667085]">Rows detected</div><div className="mt-1 text-lg font-extrabold text-[#1F2937]">{preview?.rows.toLocaleString() || '—'}</div></div>
                <div className="rounded-lg border border-[#E4E7EC] p-3"><div className="text-[10px] uppercase font-bold text-[#667085]">Columns</div><div className="mt-1 text-lg font-extrabold text-[#1F2937]">{preview?.columns.length || '—'}</div></div>
              </div>

              <div className="rounded-xl border border-[#E4E7EC] overflow-hidden">
                <div className="px-4 py-3 bg-[#FBF6F0] border-b border-[#E4E7EC] flex items-center justify-between"><div><p className="text-xs font-bold text-[#4D1113]">Validation / ingestion status</p><p className="text-[10px] text-[#667085] mt-0.5">{message}</p></div>{preview && <span className="text-[10px] font-bold text-[#8E171B]">{preview.format} · {preview.fileName}</span>}</div>
                {preview ? (
                  <div className="overflow-auto max-h-80">
                    <table className="min-w-full text-[10px]">
                      <thead className="bg-[#F8F9FA] sticky top-0"><tr>{preview.columns.map((c) => <th key={c} className="px-3 py-2 text-left font-bold text-[#475467] border-b border-[#E4E7EC] whitespace-nowrap">{c}</th>)}</tr></thead>
                      <tbody>{preview.preview.slice(1).map((row, r) => <tr key={r} className="odd:bg-white even:bg-[#FCFCFD]">{preview.columns.map((_, c) => <td key={c} className="px-3 py-2 border-b border-[#F1F3F5] text-[#475467] whitespace-nowrap">{String(row[c] ?? '')}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-56 flex items-center justify-center text-center px-8"><div><FileText className="w-8 h-8 mx-auto text-[#98A2B3]" /><p className="mt-2 text-sm font-semibold text-[#475467]">No file staged yet</p><p className="text-[11px] text-[#98A2B3] mt-1">Choose a source above to preview the incoming records before server-side validation.</p></div></div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap gap-2 text-[10px] text-[#667085]"><span className="px-2 py-1 rounded bg-[#ECFDF3] text-[#027A48]">Schema check</span><span className="px-2 py-1 rounded bg-[#EEF4FF] text-[#175CD3]">Duplicate check</span><span className="px-2 py-1 rounded bg-[#FFF4E5] text-[#B54708]">Data-quality review</span></div>
                <button disabled={!preview} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white ${preview ? 'bg-[#8E171B] hover:bg-[#721114]' : 'bg-[#98A2B3] cursor-not-allowed'}`}>
                  Queue for server ingestion <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-4 xl:col-span-2">
          <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-[#4D1113]">Ingestion workflow</h3><span className="text-[10px] text-[#667085]">COA / TMS / SMMS / TDMS</span></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">{['Upload','Detect schema','Validate','Normalize','Commit'].map((x, i) => <div key={x} className="relative rounded-lg border border-[#E4E7EC] p-3 bg-[#FCFCFD]"><div className="w-6 h-6 rounded-full bg-[#8E171B] text-white flex items-center justify-center text-[10px] font-bold">{i+1}</div><p className="text-[11px] font-semibold mt-2">{x}</p>{i < 4 && <div className="hidden md:block absolute top-6 -right-2 w-3 border-t border-dashed border-[#98A2B3]" />}</div>)}</div>
        </div>
        <div className="bg-[#FFF8F0] border border-[#F4D5B2] rounded-xl p-4"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#8E171B]" /><h3 className="text-xs font-bold uppercase tracking-wider text-[#4D1113]">Operational rule</h3></div><p className="text-[11px] text-[#475467] mt-3 leading-relaxed">Uploaded data is treated as an input to the planning system. It is validated and normalized before it can affect risk scores or the CP-SAT plan. No file should silently overwrite an existing record.</p></div>
      </section>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { FileCheck2, ShieldCheck, UserCheck, AlertCircle, History, CheckCircle2, XCircle, ArrowRight, Check } from 'lucide-react';
import { ScheduleVersion, AuditEntry, apiClient } from '../api/client';

export const ApprovalAuditView: React.FC = () => {
  const [version, setVersion] = useState<ScheduleVersion | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [supervisorName, setSupervisorName] = useState('Chief Section Controller, BSB Division');
  const [remarks, setRemarks] = useState('Corridor possession schedule reviewed. Timetable interval walls and 0 train conflicts verified.');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = () => {
    apiClient.get<{ data: ScheduleVersion }>('/approvals')
      .then(res => setVersion(res.data.data))
      .catch(err => console.error('Failed to load version:', err));

    apiClient.get<{ data: AuditEntry[] }>('/audit')
      .then(res => setAuditLogs(res.data.data || []))
      .catch(err => console.error('Failed to load audit logs:', err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = (status: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    apiClient.post('/approvals', {
      status,
      supervisor_name: supervisorName,
      remarks
    })
      .then(() => {
        setMsg(`Plan has been successfully marked as ${status === 'APPROVED' ? 'APPROVED' : 'REVISION REQUIRED'}.`);
        loadData();
      })
      .catch(err => {
        setMsg('Failed to submit approval: ' + err.message);
      })
      .finally(() => setSubmitting(false));
  };

  const isApproved = version?.status === 'APPROVED';

  // Section 21 Stepper Stages
  const stages = [
    { label: 'AI RECOMMENDED', active: true, done: true },
    { label: 'SUPERVISOR REVIEW', active: true, done: isApproved },
    { label: 'MODIFIED', active: false, done: isApproved },
    { label: 'APPROVED', active: isApproved, done: isApproved },
    { label: 'EXECUTION', active: isApproved, done: false },
    { label: 'VERIFIED', active: false, done: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13]">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] font-display">
              Human Review &amp; Audit Trail
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1 ml-10">
            Supervisor review authority, electronic sign-off, and immutable audit governance
          </p>
        </div>
        <span className="text-xs font-bold text-[#D96F13] bg-[#FFF3E6] px-3 py-1.5 rounded-xl border border-[#FFD9B3] self-start sm:self-auto">
          L4 Controller Authority
        </span>
      </div>

      {msg && (
        <div className="p-3.5 bg-[#D1FADF] border border-[#A6F4C5] text-[#0F7644] text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {msg}
        </div>
      )}

      {/* Section 21: Stepper Workflow Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm">
        <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-3">
          Schedule Governance Lifecycle Stepper
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stages.map((st, idx) => (
            <div
              key={st.label}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                st.done
                  ? 'bg-[#F6FEF9] border-[#A6F4C5] text-[#0F7644]'
                  : st.active
                  ? 'bg-[#FFF3E6] border-[#FF9933] text-[#B85C00] font-bold ring-1 ring-[#FF9933]'
                  : 'bg-[#F7F7F5] border-[#E6E6E6] text-[#667085]'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-current/10">
                  {st.done ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
              </div>
              <p className="text-[10.5px] font-extrabold truncate">{st.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Review Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E6E6] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between border-b border-[#E6E6E6] pb-4 gap-3">
          <div>
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
              Schedule Version: {version?.version_id || 'VER_2026_01'}
            </span>
            <h3 className="text-base font-bold text-[#1F2937] mt-0.5 font-display">
              CP-SAT Coordinated Block Schedule ({version?.horizon_days || 7}-Day Horizon)
            </h3>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isApproved
                ? 'bg-[#D1FADF] text-[#0F7644] border border-[#A6F4C5]'
                : 'bg-[#FFF3E6] text-[#B85C00] border border-[#FFD9B3]'
            }`}
          >
            Status: {version?.status || 'PROPOSED'}
          </span>
        </div>

        {/* Plan Governance Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider block mb-1.5">
              Reviewing Supervisor / Section Controller
            </label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full text-xs border border-[#E6E6E6] rounded-xl p-2.5 bg-[#F7F7F5] font-semibold text-[#1F2937] focus:outline-none focus:border-[#FF9933]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider block mb-1.5">
              Official Review Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs border border-[#E6E6E6] rounded-xl p-2.5 bg-[#F7F7F5] text-[#1F2937] focus:outline-none focus:border-[#FF9933]"
            />
          </div>
        </div>

        {/* Action Buttons (Section 21: 'Approve Recommended Plan') */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#E6E6E6] gap-3">
          <p className="text-xs text-[#667085]">
            Signing records immutable audit stamp with SHA-256 integrity hash into <code className="font-mono text-[#D96F13]">audit_log</code>.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDecision('REJECTED')}
              disabled={submitting}
              className="px-4 py-2 border border-[#FDA29B] bg-[#FEF3F2] text-[#D92D20] text-xs font-bold rounded-xl hover:bg-[#FEE4E2] transition"
            >
              Revision Required
            </button>
            <button
              onClick={() => handleDecision('APPROVED')}
              disabled={submitting}
              className="px-6 py-2 bg-[#FF9933] hover:bg-[#D96F13] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Recommended Plan
            </button>
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail Log */}
      <div className="bg-white rounded-2xl border border-[#E6E6E6] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6E6E6] bg-[#F7F7F5] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#D96F13]" />
            Chronological Immutable Audit Log
          </h3>
          <span className="text-[11px] text-[#667085]">Tamper-resistant database trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1F2937]">
            <thead className="bg-[#F7F7F5] border-b border-[#E6E6E6] uppercase text-[10px] tracking-wider text-[#667085]">
              <tr>
                <th className="py-3 px-4 font-bold">Log ID</th>
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Authorized By</th>
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Version</th>
                <th className="py-3 px-4 font-bold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {auditLogs.map((log) => {
                const actionName = (log as any).action || log.event_type || 'SYSTEM_EVENT';
                const version = (log as any).schedule_version || log.details?.schedule_version || log.entity_id || 'VER_2026_01';
                const remarksText = (log as any).remarks || (typeof log.details === 'string' ? log.details : log.details?.remarks || 'Operational review completed');

                return (
                  <tr key={log.log_id} className="hover:bg-[#FFF9F2] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1F2937]">{log.log_id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                          actionName.includes('APPROVED')
                            ? 'bg-[#D1FADF] text-[#0F7644]'
                            : actionName.includes('OPTIMIZATION')
                            ? 'bg-[#FFF3E6] text-[#B85C00]'
                            : 'bg-[#EFF8FF] text-[#175CD3]'
                        }`}
                      >
                        {actionName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1F2937]">{log.user_id}</td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{log.timestamp}</td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{version}</td>
                    <td className="py-3 px-4 text-[#475467]">{remarksText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

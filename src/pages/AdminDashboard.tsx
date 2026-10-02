import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flag, 
  FileEdit, 
  Search, 
  History, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Claim, VerdictType, CommunityFlag, AuditLog } from '../types';
import { 
  fetchAllClaims, 
  getStoredFlags, 
  getStoredAuditLogs, 
  overrideClaimVerdict 
} from '../services/verificationService';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [flags, setFlags] = useState<CommunityFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'claims' | 'flags' | 'audits'>('claims');
  
  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');

  // HITL Override Modal State
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [newVerdict, setNewVerdict] = useState<VerdictType>('TRUE');
  const [newConfidence, setNewConfidence] = useState<number>(90);
  const [newSummary, setNewSummary] = useState('');
  const [newKeyFacts, setNewKeyFacts] = useState<string[]>([]);
  const [newFactInput, setNewFactInput] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedClaims = await fetchAllClaims();
    setClaims(loadedClaims);
    setFlags(getStoredFlags());
    setAuditLogs(getStoredAuditLogs());
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleStartEdit = (claim: Claim) => {
    setEditingClaim(claim);
    setNewVerdict(claim.verdict);
    setNewConfidence(claim.confidence);
    setNewSummary(claim.summary);
    setNewKeyFacts([...claim.key_facts]);
    setNewFactInput('');
    setOverrideReason('');
  };

  const handleAddFact = () => {
    if (newFactInput.trim()) {
      setNewKeyFacts([...newKeyFacts, newFactInput.trim()]);
      setNewFactInput('');
    }
  };

  const handleRemoveFact = (index: number) => {
    setNewKeyFacts(newKeyFacts.filter((_, i) => i !== index));
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim || !user) return;

    if (!overrideReason.trim()) {
      alert('A reason is mandatory for human-in-the-loop verdict overrides to preserve audit trails.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await overrideClaimVerdict(
        editingClaim.id,
        {
          verdict: newVerdict,
          confidence: Number(newConfidence),
          summary: newSummary,
          key_facts: newKeyFacts
        },
        user.id,
        user.email || 'editor@checkit.ai',
        overrideReason
      );

      // Refresh list
      setClaims(claims.map((c) => (c.id === updated.id ? updated : c)));
      setAuditLogs(getStoredAuditLogs());
      setEditingClaim(null);
      showToast('Claim verdict overridden and recorded into immutable audit log.');
    } catch (err: any) {
      alert(err.message || 'Failed to override claim verdict.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    const matchesVerdict = filterVerdict === 'ALL' || c.verdict === filterVerdict;
    const matchesSearch = 
      c.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVerdict && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Human-in-the-Loop Admin Portal
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Review AI verdicts, triage community disputes, and author immutable audit overrides
          </p>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'claims' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Claims Moderation ({claims.length})
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'flags' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Community Flags ({flags.length})
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'audits' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CLAIMS MODERATION */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by query or summary..."
                className="w-full bg-[#111625] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              className="bg-[#111625] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Verdicts</option>
              <option value="TRUE">True</option>
              <option value="FALSE">False</option>
              <option value="PARTIALLY_TRUE">Partially True</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-[#111625] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="p-3.5">Query & Summary</th>
                    <th className="p-3.5">Verdict</th>
                    <th className="p-3.5">Confidence</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-800/20 transition">
                      <td className="p-3.5 max-w-md">
                        <div className="font-bold text-white mb-0.5 line-clamp-1">{claim.query}</div>
                        <div className="text-slate-400 line-clamp-2">{claim.summary}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                            claim.verdict === 'TRUE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : claim.verdict === 'FALSE'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : claim.verdict === 'PARTIALLY_TRUE'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          {claim.verdict.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono font-bold text-white">
                        {claim.confidence}%
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {claim.admin_override ? (
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            HITL Override
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">AI Generated</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit(claim)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMMUNITY FLAGS */}
      {activeTab === 'flags' && (
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Community Dispute Submissions</h2>
          </div>

          {flags.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No community disputes submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => {
                const flaggedClaim = claims.find((c) => c.id === flag.claim_id);
                return (
                  <div key={flag.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-indigo-400">{flag.reason}</span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(flag.created_at).toLocaleString()}
                      </span>
                    </div>

                    {flaggedClaim && (
                      <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 mb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Target Claim:
                        </span>
                        <p className="text-slate-200 font-semibold">{flaggedClaim.query}</p>
                      </div>
                    )}

                    {flag.details && (
                      <p className="text-slate-300 mb-2">
                        <span className="text-slate-400">User notes:</span> {flag.details}
                      </p>
                    )}

                    {flaggedClaim && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            setActiveTab('claims');
                            handleStartEdit(flaggedClaim);
                          }}
                          className="px-3 py-1 rounded-lg bg-purple-600 text-white font-semibold text-[11px] hover:bg-purple-500 transition"
                        >
                          Review & Override Claim
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL LOGS */}
      {activeTab === 'audits' && (
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Immutable Editorial Audit Ledger</h2>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No editorial overrides performed yet.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-purple-400 font-bold">{log.admin_email}</span>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 my-1">
                    <span className="text-slate-400">Verdict Transition:</span>
                    <span className="font-bold text-slate-300">{log.previous_verdict}</span>
                    <span>&rarr;</span>
                    <span className="font-bold text-emerald-400">{log.new_verdict}</span>
                  </div>

                  <p className="text-slate-300 mt-1">
                    <span className="text-slate-400 font-medium">Justification:</span> {log.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HITL OVERRIDE MODAL */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111625] border border-slate-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Human Editorial Override</h3>
              </div>
              <button
                onClick={() => setEditingClaim(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Claim Query</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  {editingClaim.query}
                </div>
              </div>

              {/* Verdict & Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">New Verdict</label>
                  <select
                    value={newVerdict}
                    onChange={(e) => setNewVerdict(e.target.value as VerdictType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TRUE">TRUE</option>
                    <option value="FALSE">FALSE</option>
                    <option value="PARTIALLY_TRUE">PARTIALLY TRUE</option>
                    <option value="UNVERIFIED">UNVERIFIED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Confidence ({newConfidence}%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Editorial Summary</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Key Facts list editor */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Verified Key Facts</label>
                <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
                  {newKeyFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                    >
                      <span className="line-clamp-1">{fact}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFact(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFactInput}
                    onChange={(e) => setNewFactInput(e.target.value)}
                    placeholder="Add a verified key fact..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFact();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFact}
                    className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Justification / Override Reason */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mandatory Editorial Justification (Audit Trail)
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this AI verdict is being overridden..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClaim(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving Override...' : 'Commit Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
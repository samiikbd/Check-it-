import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  UploadCloud, 
  Search, 
  Clock, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle,
  X,
  UserCheck
} from 'lucide-react';
import { Claim, VerdictType } from '../types';
import { fetchAllClaims, fetchUserClaims } from '../services/verificationService';
import { useAuth } from '../context/AuthContext';
import { VerdictCard } from '../components/VerdictCard';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewScope, setViewScope] = useState<'all' | 'mine'>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, [viewScope, user]);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      if (viewScope === 'mine' && user?.id) {
        const userList = await fetchUserClaims(user.id);
        setClaims(userList);
      } else {
        const allList = await fetchAllClaims();
        setClaims(allList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictBadge = (verdict: VerdictType) => {
    switch (verdict) {
      case 'TRUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> TRUE
          </span>
        );
      case 'FALSE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> FALSE
          </span>
        );
      case 'PARTIALLY_TRUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-3 h-3" /> PARTIALLY TRUE
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3 h-3" /> UNVERIFIED
          </span>
        );
    }
  };

  const getInputIcon = (type: string) => {
    switch (type) {
      case 'url':
        return <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'image':
        return <UploadCloud className="w-3.5 h-3.5 text-sky-400" />;
      case 'text':
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesFilter = filterVerdict === 'ALL' || claim.verdict === filterVerdict;
    const matchesQuery = 
      claim.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Fact-Check Archive
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse through historical claims verified across web and community sources
          </p>
        </div>

        {/* Scope Toggle: All vs My Checks */}
        {user && (
          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto text-xs">
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewScope === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Public Archive
            </button>
            <button
              onClick={() => setViewScope('mine')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewScope === 'mine' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              My Checks
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims or summaries..."
            className="w-full bg-[#111625] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'TRUE', 'FALSE', 'PARTIALLY_TRUE', 'UNVERIFIED'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterVerdict(v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                filterVerdict === v
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-[#111625] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {v.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading claims archive...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-12 text-center">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No claims found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'Try adjusting your search terms or filters.' : 'No verified claims match this filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => setSelectedClaim(claim)}
              className="bg-[#111625] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded-md bg-slate-800/60">{getInputIcon(claim.input_type)}</span>
                  {getVerdictBadge(claim.verdict)}
                  <span className="text-[11px] text-slate-500">
                    {new Date(claim.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  {claim.admin_override && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      <UserCheck className="w-2.5 h-2.5" /> Human Verified
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-200 group-hover:text-indigo-300 transition line-clamp-2 mb-1">
                  "{claim.query}"
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{claim.summary}</p>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Confidence
                  </span>
                  <span className="text-base font-black text-white">{claim.confidence}%</span>
                </div>
                <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition">
                  View full card &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8">
            <button
              onClick={() => setSelectedClaim(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-slate-900 border border-slate-700 text-slate-400 hover:text-white rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <VerdictCard claim={selectedClaim} onReset={() => setSelectedClaim(null)} />
          </div>
        </div>
      )}
    </div>
  );
};
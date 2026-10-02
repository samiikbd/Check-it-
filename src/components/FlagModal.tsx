import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { CommunityFlag } from '../types';
import { submitFlag } from '../services/verificationService';
import { useAuth } from '../context/AuthContext';

interface FlagModalProps {
  claimId: string;
  claimText: string;
  onClose: () => void;
  onSuccess: (flag: CommunityFlag) => void;
}

export const FlagModal: React.FC<FlagModalProps> = ({ claimId, claimText, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [flagType, setFlagType] = useState<CommunityFlag['flag_type']>('MISSING_CONTEXT');
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasoning.trim()) {
      setError('Please provide detailed reasoning for this flag.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const flag = await submitFlag(
        claimId,
        user?.id || 'anonymous_contributor',
        user?.email || 'contributor@checkit.ai',
        flagType,
        reasoning.trim()
      );
      onSuccess(flag);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit flag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#111625] border border-slate-750 rounded-2xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Report Misinformation</h3>
            <p className="text-xs text-slate-400">Crowdsource factual corrections for editorial review</p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-300">
          <span className="font-semibold text-slate-400 block mb-1">Target Claim:</span>
          <p className="italic line-clamp-2">"{claimText}"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Flag Category
            </label>
            <select
              value={flagType}
              onChange={(e) => setFlagType(e.target.value as any)}
              className="w-full bg-[#161c2d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="MISSING_CONTEXT">Missing Context / Misleading Narrative</option>
              <option value="FABRICATED">Fabricated / AI Hallucination / Deepfake</option>
              <option value="OUTDATED">Outdated Information</option>
              <option value="BIASED_SOURCE">Biased or Unreliable Source</option>
              <option value="OTHER">Other Factual Discrepancy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reasoning & Counter-Evidence Links
            </label>
            <textarea
              rows={4}
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain why this verdict needs human review. Cite authoritative URLs or context..."
              className="w-full bg-[#161c2d] border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition"
            >
              {isSubmitting ? <span>Submitting...</span> : <><Send className="w-4 h-4" /><span>Submit Community Flag</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
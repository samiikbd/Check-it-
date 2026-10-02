import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle, 
  ExternalLink, 
  ThumbsUp, 
  Flag, 
  Download, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Cpu 
} from 'lucide-react';
import { Claim, VerdictType, CommunityFlag } from '../types';
import { upvoteClaim } from '../services/verificationService';
import { FlagModal } from './FlagModal';

interface VerdictCardProps {
  claim: Claim;
  onFlagSubmitted?: (flag: CommunityFlag) => void;
  onReset?: () => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ claim, onFlagSubmitted, onReset }) => {
  const [upvotes, setUpvotes] = useState(claim.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const getVerdictTheme = (verdict: VerdictType) => {
    switch (verdict) {
      case 'TRUE':
        return {
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          gaugeBg: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'VERIFIED TRUE',
          description: 'Substantiated by verified factual records and authoritative consensus.'
        };
      case 'FALSE':
        return {
          text: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          gaugeBg: 'bg-rose-500',
          icon: AlertTriangle,
          label: 'FACTUALLY FALSE',
          description: 'Refuted by empirical evidence, official records, or scientific consensus.'
        };
      case 'MISLEADING':
        return {
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gaugeBg: 'bg-amber-500',
          icon: AlertCircle,
          label: 'MISLEADING',
          description: 'Contains partial truth or authentic footage distorted by absent context.'
        };
      case 'UNVERIFIED':
      default:
        return {
          text: 'text-slate-400',
          badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          gaugeBg: 'bg-slate-400',
          icon: HelpCircle,
          label: 'UNVERIFIED',
          description: 'Insufficient independent authoritative evidence currently available to substantiate.'
        };
    }
  };

  const theme = getVerdictTheme(claim.verdict);
  const VerdictIcon = theme.icon;

  const handleUpvote = async () => {
    if (hasUpvoted) return;
    setHasUpvoted(true);
    setUpvotes(prev => prev + 1);
    await upvoteClaim(claim.id);
  };

  const handleShare = async () => {
    const shareText = `Check It AI Verdict: [${claim.verdict}] - "${claim.claim_text.slice(0, 100)}..." (${claim.confidence}% confidence)`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check It AI Fact Verification',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\nVerified via Check It AI: ${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Copied verdict to clipboard!');
    }
  };

  // High-Resolution 2x Retina PNG Card Generator using HTML5 Canvas
  const downloadVerdictPNG = () => {
    setIsDownloading(true);
    try {
      const scale = 2;
      const width = 1200;
      const height = 630;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Dark Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a0d16');
      bgGrad.addColorStop(1, '#111728');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Outer Border
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Brand Title
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillText('CHECK IT AI', 60, 92);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('VERIFICATION ENGINE • GEMINI 2.5 FLASH SEARCH GROUNDING', 260, 90);

      // Verdict Pill
      let badgeColor = '#10b981';
      if (claim.verdict === 'FALSE') badgeColor = '#ef4444';
      if (claim.verdict === 'MISLEADING') badgeColor = '#f59e0b';
      if (claim.verdict === 'UNVERIFIED') badgeColor = '#64748b';

      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(60, 130, 230, 52, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText(`VERDICT: ${claim.verdict}`, 80, 165);

      // Confidence Pill
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(310, 130, 230, 52, 12);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(`CONFIDENCE: ${claim.confidence}%`, 335, 164);

      // Multi-line wrapped Claim Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 28px system-ui, sans-serif';
      
      const maxTextWidth = 1060;
      const words = claim.claim_text.split(' ');
      let line = '';
      let y = 236;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && n > 0) {
          ctx.fillText(`"${line}"`, 60, y);
          line = words[n] + ' ';
          y += 38;
          if (y > 320) break;
        } else {
          line = testLine;
        }
      }
      if (y <= 320) ctx.fillText(`"${line.trim()}"`, 60, y);

      // Summary preview box
      ctx.fillStyle = '#131b2e';
      ctx.beginPath();
      ctx.roundRect(60, 355, 1080, 160, 16);
      ctx.fill();

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('FACTUAL SUMMARY', 85, 390);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '19px system-ui, sans-serif';
      const summarySnippet = claim.summary.length > 220 ? claim.summary.slice(0, 220) + '...' : claim.summary;
      ctx.fillText(summarySnippet, 85, 430);

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '15px system-ui, sans-serif';
      const dateStr = new Date(claim.created_at).toUTCString();
      ctx.fillText(`Verified by Check It AI • ${dateStr} • Zero-Hallucination Search Grounding`, 60, 565);

      const link = document.createElement('a');
      link.download = `check-it-verdict-${claim.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Canvas export error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="w-full bg-[#111625] border border-slate-800 rounded-2xl p-5 md:p-7 shadow-2xl transition hover:border-slate-700 text-slate-100">
        
        {/* Card Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${theme.badgeBg}`}>
              <VerdictIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base md:text-lg font-black tracking-wide ${theme.text}`}>
                  {theme.label}
                </span>
                {claim.isCached && (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Sparkles className="w-3 h-3" />
                    7-Day Cached
                  </span>
                )}
                {claim.is_admin_overridden && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    HITL Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{theme.description}</p>
            </div>
          </div>

          <div className="flex flex-col items-end min-w-[130px]">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-xs font-semibold text-slate-400">Confidence</span>
              <span className={`text-xl font-black ${theme.text}`}>{claim.confidence}%</span>
            </div>
            <div className="w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className={`h-full transition-all duration-700 ${theme.gaugeBg}`} style={{ width: `${claim.confidence}%` }} />
            </div>
          </div>
        </div>

        {/* Claim Text */}
        <div className="mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Verified Claim
          </span>
          <p className="text-base md:text-lg font-medium text-slate-100 leading-relaxed bg-[#141b2d] p-4 rounded-xl border border-slate-800/80">
            "{claim.claim_text}"
          </p>
        </div>

        {/* Executive Summary */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Factual Synthesis</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {claim.summary}
          </p>
        </div>

        {/* Key Supporting Facts */}
        {claim.key_facts && claim.key_facts.length > 0 && (
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Key Verifiable Facts
            </span>
            <ul className="space-y-2">
              {claim.key_facts.map((fact, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300 bg-[#141b2d]/50 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Live Grounding Web Sources */}
        {claim.sources && claim.sources.length > 0 && (
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Grounding Sources & Evidence (Live Web Cross-Reference)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {claim.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#141a2a] hover:bg-[#1a2236] border border-slate-800 hover:border-indigo-500/50 transition group"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate transition">{source.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{source.url}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 transition" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Card Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              disabled={hasUpvoted}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                hasUpvoted
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{upvotes} Upvotes</span>
            </button>

            <button
              onClick={() => setIsFlagModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Misinformation</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={downloadVerdictPNG}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating...' : 'Download Verdict Card'}</span>
            </button>
          </div>
        </div>
      </div>

      {isFlagModalOpen && (
        <FlagModal
          claimId={claim.id}
          claimText={claim.claim_text}
          onClose={() => setIsFlagModalOpen(false)}
          onSuccess={(flag) => {
            if (onFlagSubmitted) onFlagSubmitted(flag);
            alert('Thank you! Your flag has been submitted for editorial audit.');
          }}
        />
      )}
    </>
  );
};
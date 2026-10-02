import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  UploadCloud, 
  Mic, 
  MicOff, 
  Search, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle,
  X
} from 'lucide-react';
import { InputMode, Claim } from '../types';
import { verifyClaim } from '../services/verificationService';
import { useAuth } from '../context/AuthContext';
import { VerdictCard } from './VerdictCard';

interface FactCheckerProps {
  onVerificationComplete?: (claim: Claim) => void;
}

export const FactChecker: React.FC<FactCheckerProps> = ({ onVerificationComplete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<InputMode>('text');
  const [claimText, setClaimText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ file: File; base64: string; preview: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStage, setVerificationStage] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<Claim | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Web Speech API Voice Dictation
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setClaimText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Media File Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedFile({
        file,
        base64,
        preview: file.type.startsWith('image/') ? base64 : '',
      });
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedFile({
        file,
        base64,
        preview: file.type.startsWith('image/') ? base64 : '',
      });
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVerify = async () => {
    setErrorMsg(null);
    let targetText = '';

    if (activeTab === 'text') {
      targetText = claimText.trim();
      if (!targetText) {
        setErrorMsg('Please enter a claim, quote, or rumor you want to check.');
        return;
      }
    } else if (activeTab === 'link') {
      targetText = linkUrl.trim();
      if (!targetText) {
        setErrorMsg('Please enter an article, video, or social media link.');
        return;
      }
    } else if (activeTab === 'media') {
      if (!selectedFile) {
        setErrorMsg('Please upload an image, screenshot, or video to check.');
        return;
      }
      targetText = claimText.trim() || `Visual analysis of ${selectedFile.file.name}`;
    }

    setIsVerifying(true);
    setVerificationStage('Check It: Sanitizing query & prompt integrity...');

    try {
      setTimeout(() => setVerificationStage('Check It: Checking 7-day exact deduplication cache...'), 350);
      setTimeout(() => setVerificationStage('Check It: Google Search Grounding with Gemini 2.5 Flash...'), 850);
      setTimeout(() => setVerificationStage('Check It: Cross-referencing live web sources & consensus...'), 1300);

      const result = await verifyClaim({
        claimText: targetText,
        imageBase64: selectedFile?.base64,
        inputType: activeTab,
        userId: user?.id,
      });

      setCurrentResult(result);
      if (onVerificationComplete) onVerificationComplete(result);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check connection and try again.');
    } finally {
      setIsVerifying(false);
      setVerificationStage('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-10 text-slate-100">
      
      {/* Title Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Verification Engine</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          Check Any Claim in Seconds
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-lg leading-relaxed">
          Paste text, share a link, or upload media. We cross-reference live web sources for a zero-hallucination verdict.
        </p>
      </div>

      {/* Main Console Box */}
      <div className="bg-[#111625] border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl backdrop-blur-sm">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 pb-3 mb-5">
          <button
            onClick={() => { setActiveTab('text'); setErrorMsg(null); }}
            className={`flex items-center justify-center py-2.5 rounded-xl transition font-medium text-xs md:text-sm ${
              activeTab === 'text'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Text Claim</span>
          </button>

          <button
            onClick={() => { setActiveTab('link'); setErrorMsg(null); }}
            className={`flex items-center justify-center py-2.5 rounded-xl transition font-medium text-xs md:text-sm ${
              activeTab === 'link'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Web Link</span>
          </button>

          <button
            onClick={() => { setActiveTab('media'); setErrorMsg(null); }}
            className={`flex items-center justify-center py-2.5 rounded-xl transition font-medium text-xs md:text-sm ${
              activeTab === 'media'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Upload Media</span>
          </button>
        </div>

        {/* Tab 1: Text Input */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <textarea
              rows={5}
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="Enter a claim, quote, or rumor you want to verify..."
              className="w-full bg-[#141b2d] border border-slate-700/80 rounded-2xl p-4 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
            />
          </div>
        )}

        {/* Tab 2: Link Input */}
        {activeTab === 'link' && (
          <div className="space-y-3">
            <div className="relative flex items-center">
              <LinkIcon className="w-4 h-4 text-slate-500 absolute left-4" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/article or YouTube"
                className="w-full bg-[#141b2d] border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <p className="text-xs text-slate-500 pl-2">
              Supports news articles, YouTube videos, X/Twitter posts, and social media links.
            </p>
          </div>
        )}

        {/* Tab 3: Media Upload Dropzone */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/mp4,video/quicktime"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed ${
                  isDragging ? 'border-indigo-500 bg-[#141b2d]' : 'border-slate-700/80 bg-[#141b2d]/50'
                } hover:border-indigo-500/80 hover:bg-[#141b2d] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center group`}
              >
                <div className="p-3 bg-slate-800 rounded-2xl text-indigo-400 group-hover:scale-110 transition mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-slate-200 mb-1">Drag & drop or click to upload</p>
                <p className="text-xs text-slate-500 mb-4 max-w-xs">Images (.jpg, .png, .webp), screenshots, or video (.mp4, .mov)</p>
                <button type="button" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition">
                  Choose File
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#141b2d] rounded-2xl border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  {selectedFile.preview ? (
                    <img src={selectedFile.preview} alt="preview" className="w-12 h-12 object-cover rounded-xl border border-slate-700" />
                  ) : (
                    <div className="p-3 bg-slate-800 rounded-xl text-indigo-400"><ImageIcon className="w-5 h-5" /></div>
                  )}
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-200 truncate">{selectedFile.file.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.file.size / 1024).toFixed(1)} KB • Ready for OCR / visual check</p>
                  </div>
                </div>
                <button onClick={clearFile} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              type="text"
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="Optional: Context or claim text to verify alongside this media..."
              className="w-full bg-[#141b2d] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Error Box */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-5 flex items-center gap-3">
          {activeTab === 'text' && (
            <button
              onClick={handleToggleVoice}
              title={isRecording ? 'Listening... click to stop' : 'Dictate claim with microphone'}
              className={`p-3 rounded-2xl border transition ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-[#141b2d] text-slate-400 hover:text-slate-200 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 transition active:scale-[0.99]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">{verificationStage || 'Checking Claim...'}</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Verify Claim</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Card Placement */}
      {currentResult && (
        <div ref={resultRef} className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 px-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Check It Factual Verification Report</span>
          </div>
          <VerdictCard claim={currentResult} />
        </div>
      )}
    </div>
  );
};
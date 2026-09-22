import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderDown, 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles,
  Zap,
  Play
} from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { EXPORT_FILES, ProjectFile } from '../data/exportCodeFiles';

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportCodeModal: React.FC<ExportCodeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [packageType, setPackageType] = useState<'working_app' | 'docker_stack'>('working_app');
  const [liveFiles, setLiveFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Load real files of the current working application
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/project-files')
      .then(res => res.json())
      .then(data => {
        if (data.files && data.files.length > 0) {
          setLiveFiles(data.files);
          if (packageType === 'working_app') {
            setSelectedFile(data.files[0]);
          }
        }
      })
      .catch(err => {
        console.warn('Could not load live project files:', err);
      });
  }, [isOpen, packageType]);

  // Set default selected file when switching packages
  useEffect(() => {
    if (packageType === 'working_app') {
      if (liveFiles.length > 0) setSelectedFile(liveFiles[0]);
    } else {
      setSelectedFile(EXPORT_FILES[0]);
    }
  }, [packageType, liveFiles]);

  if (!isOpen) return null;

  const currentFileList = packageType === 'working_app' 
    ? (liveFiles.length > 0 ? liveFiles : [
        {
          path: 'README.md',
          category: 'docs' as const,
          language: 'markdown',
          description: 'Step-by-step local setup guide',
          content: `# TalkCraft AI - Spoken English & Grammar Coach\n\nRun locally in 2 steps:\n1. npm install\n2. npm run dev\n\nOpen http://localhost:3000`
        }
      ])
    : EXPORT_FILES;

  const filteredFiles = activeCategory === 'all'
    ? currentFileList
    : currentFileList.filter(f => f.category === activeCategory);

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  // 1-Click Download for THIS working app
  const handleDownloadWorkingApp = () => {
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = '/api/download-app-zip';
      link.download = 'talkcraft-english-ai-working-app.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Direct download failed, redirecting:', err);
      window.location.href = '/api/download-app-zip';
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  // ZIP generation for alternative Docker stack
  const handleDownloadDockerZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      EXPORT_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });
      zip.file('.env.example', `GEMINI_API_KEY="YOUR_GEMINI_API_KEY"\nDATABASE_URL="postgresql+asyncpg://talkcraft_user:talkcraft_password@localhost:5432/talkcraft_db"\n`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'english-voice-ai-nextjs-fastapi-postgres.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('Could not generate ZIP automatically.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30">
              <FolderDown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Download Project Source Code
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Ready to Run Locally
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Download the complete codebase with all files, dependencies, and zero setup errors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Primary Download Button */}
            {packageType === 'working_app' ? (
              <button
                onClick={handleDownloadWorkingApp}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className={`w-4 h-4 text-amber-300 ${isDownloading ? 'animate-spin' : ''}`} />
                <span>{isDownloading ? 'Preparing ZIP...' : 'Download Working App (.ZIP)'}</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadDockerZip}
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <FolderDown className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Generating ZIP...' : 'Download Docker Stack (.ZIP)'}</span>
              </button>
            )}

            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Package Selector Tabs */}
        <div className="px-5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPackageType('working_app');
                setActiveCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                packageType === 'working_app'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Working App (Express + React 19 + Vite)</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                Recommended
              </span>
            </button>

            <button
              onClick={() => {
                setPackageType('docker_stack');
                setActiveCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                packageType === 'docker_stack'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next.js + FastAPI + Postgres (Docker Stack)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            {packageType === 'working_app' ? 'Runs with: npm install && npm run dev' : 'Runs with: docker compose up --build'}
          </div>
        </div>

        {/* Quick Launch Instruction Banner */}
        <div className="px-5 py-2.5 bg-slate-950/95 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Run in your terminal:</span>
            <code className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-emerald-300 font-bold flex items-center gap-2">
              {packageType === 'working_app' ? 'npm install && npm run dev' : 'docker compose up --build'}
              <button 
                onClick={() => handleCopyCmd(packageType === 'working_app' ? 'npm install && npm run dev' : 'docker compose up --build')}
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy command"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </code>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            {packageType === 'working_app' ? (
              <>
                <span className="text-emerald-400 font-semibold">• Local Port 3000</span>
                <span>• AI Voice Visualizer Included</span>
                <span>• Tamil Explanations Built-in</span>
              </>
            ) : (
              <>
                <span>• Next.js App Router (Port 3000)</span>
                <span>• FastAPI REST (Port 8000)</span>
                <span>• PostgreSQL 16 (Port 5432)</span>
              </>
            )}
          </div>
        </div>

        {/* Main Content: Split File Tree + Code Editor */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left Column: File Tree */}
          <div className="w-full md:w-72 border-r border-slate-800 bg-slate-950/70 p-3 flex flex-col shrink-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Included Files ({filteredFiles.length})
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredFiles.map(file => {
                const isSelected = selectedFile?.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono">{file.path}</div>
                      <div className="text-[10px] text-slate-500 truncate">{file.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 min-h-0">
            {/* File toolbar */}
            <div className="px-5 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {selectedFile ? selectedFile.path : 'Select a file'}
                </span>
                {selectedFile && (
                  <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
                    {selectedFile.language}
                  </span>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              )}
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200 selection:bg-emerald-600/40">
              <pre className="whitespace-pre">{selectedFile ? selectedFile.content : 'No file selected'}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {packageType === 'working_app' 
                ? 'Zip includes all frontend components, backend routes, and voice visualizer.'
                : 'Includes Docker Compose, PostgreSQL schema, and FastAPI backend.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {packageType === 'working_app' ? (
              <button
                onClick={handleDownloadWorkingApp}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>Download .ZIP</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadDockerZip}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>Download .ZIP</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

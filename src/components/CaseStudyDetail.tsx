import React, { useState, useEffect } from 'react';
import { CaseStudy } from '../types/system-design';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { CapacityEstimator } from './CapacityEstimator';
import { ApiViewer, DatabaseViewer } from './ApiViewer';
import { DeepDiveViewer } from './DeepDiveViewer';
import { 
  CheckCircle2, 
  Clock, 
  Layers, 
  Tag, 
  Activity, 
  Database, 
  BookOpen, 
  ShieldCheck,
  Share2,
  Bookmark,
  Check,
  ListOrdered,
  Eye,
  Columns,
  Users,
  Zap,
  HardDrive,
  Wifi,
  Sparkles,
  Copy,
  ExternalLink
} from 'lucide-react';

interface CaseStudyDetailProps {
  caseStudy: CaseStudy;
  onSelectRelated?: (id: string) => void;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  onToggleBookmark?: () => void;
  onToggleComplete?: () => void;
}

export const CaseStudyDetail: React.FC<CaseStudyDetailProps> = ({
  caseStudy,
  onSelectRelated,
  isBookmarked = false,
  isCompleted = false,
  onToggleBookmark,
  onToggleComplete
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'capacity' | 'api_db' | 'deep_dives'>('architecture');
  const [viewMode, setViewMode] = useState<'continuous' | 'tabbed'>('continuous');
  const [isCopied, setIsCopied] = useState(false);
  const [copiedStat, setCopiedStat] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyStat = (label: string, value: string) => {
    navigator.clipboard.writeText(`${label}: ${value}`);
    setCopiedStat(label);
    setTimeout(() => setCopiedStat(null), 1800);
  };

  const toggleReqCheck = (key: string) => {
    setCheckedRequirements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Scroll spy to track active section in continuous reading mode
  useEffect(() => {
    if (viewMode !== 'continuous') return;

    const sections = ['overview', 'requirements', 'architecture', 'capacity', 'api-db', 'deep-dives'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'Intermediate':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'Advanced':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="relative flex gap-8 items-start font-sans pb-16">
      {/* Central Reading Area */}
      <div className="flex-1 min-w-0 max-w-4xl space-y-10">
        {/* Header Breadcrumbs & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span className="font-bold text-neutral-900 dark:text-white">02 / Case Archive</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{caseStudy.category}</span>
            <span className="flex items-center gap-1.5 font-mono ml-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              {caseStudy.readTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleComplete && (
              <button
                onClick={onToggleComplete}
                className={`px-3 py-1.5 text-xs font-sans rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{isCompleted ? 'Completed' : 'Mark Done'}</span>
              </button>
            )}

            {onToggleBookmark && (
              <button
                onClick={onToggleBookmark}
                className={`px-3 py-1.5 text-xs font-sans rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
                <span className="text-xs font-semibold">{isBookmarked ? 'Saved' : 'Save Study'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="px-3 py-1.5 text-xs font-sans rounded-xl bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="text-xs font-semibold">{isCopied ? 'Link Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Title, Badges & Overview */}
        <div id="overview" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 text-xs font-mono uppercase font-bold tracking-wider rounded-md border ${getDifficultyBadge(caseStudy.difficulty)}`}>
              {caseStudy.difficulty}
            </span>
            <span className="text-xs px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-md font-mono uppercase tracking-wider">
              {caseStudy.category}
            </span>
            {isCompleted && (
              <span className="text-xs px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md font-mono uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Completed
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light text-neutral-900 dark:text-white tracking-tight leading-tight">
            {caseStudy.title}
          </h1>

          <p className="text-base sm:text-lg font-serif text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-4xl">
            {caseStudy.tagline}
          </p>

          {caseStudy.overview && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111420] border-l-4 border-indigo-600 dark:border-indigo-400 border border-neutral-200/80 dark:border-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans shadow-2xs">
              <span className="font-bold text-neutral-900 dark:text-white block mb-1 uppercase font-mono text-[11px] tracking-wider text-indigo-600 dark:text-indigo-400">
                Executive Architectural Overview
              </span>
              {caseStudy.overview}
            </div>
          )}

          {/* Scale Metric Callout Stat Cards */}
          {caseStudy.scaleSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div 
                onClick={() => handleCopyStat('Daily Scale', caseStudy.scaleSummary.dau)}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-colors cursor-pointer group"
                title="Click to copy metric"
              >
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">Daily Scale</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedStat === 'Daily Scale' ? 'Copied' : 'Copy'}
                  </span>
                </div>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 block truncate">
                  {caseStudy.scaleSummary.dau}
                </span>
              </div>

              <div 
                onClick={() => handleCopyStat('Peak QPS', caseStudy.scaleSummary.qps)}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs hover:border-sky-300 dark:hover:border-sky-700/60 transition-colors cursor-pointer group"
                title="Click to copy metric"
              >
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">Peak QPS</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedStat === 'Peak QPS' ? 'Copied' : 'Copy'}
                  </span>
                </div>
                <span className="text-sm sm:text-base font-bold font-mono text-sky-700 dark:text-sky-300 block truncate">
                  {caseStudy.scaleSummary.qps}
                </span>
              </div>

              <div 
                onClick={() => handleCopyStat('Storage Volume', caseStudy.scaleSummary.storage)}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors cursor-pointer group"
                title="Click to copy metric"
              >
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">Storage Volume</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedStat === 'Storage Volume' ? 'Copied' : 'Copy'}
                  </span>
                </div>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-700 dark:text-amber-300 block truncate">
                  {caseStudy.scaleSummary.storage}
                </span>
              </div>

              <div 
                onClick={() => handleCopyStat('Bandwidth', caseStudy.scaleSummary.bandwidth)}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-colors cursor-pointer group"
                title="Click to copy metric"
              >
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">Bandwidth</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedStat === 'Bandwidth' ? 'Copied' : 'Copy'}
                  </span>
                </div>
                <span className="text-sm sm:text-base font-bold font-mono text-indigo-700 dark:text-indigo-300 block truncate">
                  {caseStudy.scaleSummary.bandwidth}
                </span>
              </div>
            </div>
          )}

          {/* Quick Jump Navigation Bar (Continuous Mode) */}
          {viewMode === 'continuous' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-neutral-400 mr-1 flex items-center gap-1">
                Jump To:
              </span>
              {[
                { id: 'requirements', label: 'Requirements' },
                { id: 'architecture', label: 'Schematic' },
                { id: 'capacity', label: 'Capacity' },
                { id: 'api-db', label: 'API & DB' },
                { id: 'deep-dives', label: 'Deep Dives' },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer"
                >
                  #{link.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System Requirements Section */}
        <section id="requirements" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Functional Requirements */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-sans text-neutral-900 dark:text-white">
                Functional Requirements (Core Stories)
              </h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
              {caseStudy.functionalRequirements.map((req, i) => {
                const key = `func-${i}`;
                const isChecked = !!checkedRequirements[key];

                return (
                  <li 
                    key={i} 
                    onClick={() => toggleReqCheck(key)}
                    className="flex items-start gap-2.5 cursor-pointer select-none group"
                  >
                    <span className={`text-xs mt-0.5 transition-colors ${isChecked ? 'text-emerald-500 font-bold' : 'text-neutral-400 group-hover:text-emerald-400'}`}>
                      {isChecked ? '✓' : '○'}
                    </span>
                    <span className={`leading-relaxed transition-all ${isChecked ? 'line-through opacity-70 text-neutral-500' : ''}`}>
                      {req}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Non-Functional Requirements */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5">
              <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-sans text-neutral-900 dark:text-white">
                Non-Functional SLAs & Constraints
              </h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
              {caseStudy.nonFunctionalRequirements.map((req, i) => {
                const key = `nonfunc-${i}`;
                const isChecked = !!checkedRequirements[key];

                return (
                  <li 
                    key={i} 
                    onClick={() => toggleReqCheck(key)}
                    className="flex items-start gap-2.5 cursor-pointer select-none group"
                  >
                    <span className={`text-xs mt-0.5 transition-colors ${isChecked ? 'text-sky-500 font-bold' : 'text-neutral-400 group-hover:text-sky-400'}`}>
                      {isChecked ? '✓' : '⚡'}
                    </span>
                    <span className={`leading-relaxed transition-all ${isChecked ? 'line-through opacity-70 text-neutral-500' : ''}`}>
                      {req}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Reading Mode Switcher Bar */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'continuous'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Continuous Chapter Mode</span>
            </button>
            <button
              onClick={() => setViewMode('tabbed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tabbed'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Tabbed Focus Mode</span>
            </button>
          </div>

          <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
            {viewMode === 'continuous' ? 'Full chapter layout with live outline' : 'Deep focused tabbed views'}
          </span>
        </div>

        {/* Tab Header (Rendered in Tabbed Mode) */}
        {viewMode === 'tabbed' && (
          <div className="border-b border-neutral-200/80 dark:border-neutral-800 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'architecture'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architecture ({caseStudy.architecture.nodes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('capacity')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'capacity'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Capacity Math ({caseStudy.capacityEstimations.metrics.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('api_db')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'api_db'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>API & DB ({caseStudy.apiDesign.length} Endpoints)</span>
            </button>

            <button
              onClick={() => setActiveTab('deep_dives')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'deep_dives'
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Deep Dives ({caseStudy.deepDives.length})</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {viewMode === 'tabbed' ? (
          <div>
            {activeTab === 'architecture' && (
              <div className="space-y-6">
                <ArchitectureCanvas
                  nodes={caseStudy.architecture.nodes}
                  edges={caseStudy.architecture.edges}
                  flowSteps={caseStudy.architecture.flowSteps}
                  title={caseStudy.title}
                />
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans shadow-sm">
                  <span className="font-bold font-serif text-neutral-900 dark:text-white text-sm block mb-1">Architecture Synthesis: </span>
                  {caseStudy.architecture.summary}
                </div>
              </div>
            )}

            {activeTab === 'capacity' && (
              <CapacityEstimator estimation={caseStudy.capacityEstimations} />
            )}

            {activeTab === 'api_db' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
                    REST & RPC API Design
                  </h3>
                  <ApiViewer endpoints={caseStudy.apiDesign} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
                    Database Schema & Sharding Design
                  </h3>
                  <DatabaseViewer schemas={caseStudy.databaseDesign} />
                </div>
              </div>
            )}

            {activeTab === 'deep_dives' && (
              <DeepDiveViewer
                deepDives={caseStudy.deepDives}
                bottlenecks={caseStudy.bottlenecksAndMitigations}
                interviewQA={caseStudy.interviewQA}
              />
            )}
          </div>
        ) : (
          /* Continuous Reading Mode - Flowing Editorial Chapter */
          <div className="space-y-12">
            {/* Section: Architecture */}
            <section id="architecture" className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-sans flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Architectural Schematic ({caseStudy.architecture.nodes.length} Components)
                </h3>
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Section 03</span>
              </div>
              <ArchitectureCanvas
                nodes={caseStudy.architecture.nodes}
                edges={caseStudy.architecture.edges}
                flowSteps={caseStudy.architecture.flowSteps}
                title={caseStudy.title}
              />
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans shadow-sm">
                <span className="font-bold font-serif text-neutral-900 dark:text-white text-sm block mb-1">Architecture Synthesis: </span>
                {caseStudy.architecture.summary}
              </div>
            </section>

            {/* Section: Capacity Estimations */}
            <section id="capacity" className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-sans flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Back-of-the-Envelope Capacity Estimations
                </h3>
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Section 04</span>
              </div>
              <CapacityEstimator estimation={caseStudy.capacityEstimations} />
            </section>

            {/* Section: API & Database Design */}
            <section id="api-db" className="space-y-8">
              <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-sans flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  API & Database Architecture
                </h3>
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Section 05</span>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans">
                  Core REST & RPC Endpoints
                </h4>
                <ApiViewer endpoints={caseStudy.apiDesign} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-sans">
                  Data Models & Partitioning Keys
                </h4>
                <DatabaseViewer schemas={caseStudy.databaseDesign} />
              </div>
            </section>

            {/* Section: Deep Dives & Bottlenecks & Interview Q&A */}
            <section id="deep-dives" className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-sans flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                  Technical Deep Dives, Bottlenecks & Interview Drill
                </h3>
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Section 06</span>
              </div>
              <DeepDiveViewer
                deepDives={caseStudy.deepDives}
                bottlenecks={caseStudy.bottlenecksAndMitigations}
                interviewQA={caseStudy.interviewQA}
              />
            </section>
          </div>
        )}

        {/* Footer Tags & Similar Systems */}
        <div className="pt-6 border-t border-neutral-200/80 dark:border-neutral-800 space-y-4">
          {caseStudy.similarSystems && caseStudy.similarSystems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 font-mono text-xs uppercase tracking-wider">Related Real-World Systems:</span>
              {caseStudy.similarSystems.map((sys) => (
                <button
                  key={sys}
                  onClick={() => onSelectRelated && onSelectRelated(sys.toLowerCase().replace(/ /g, '-'))}
                  className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-sans transition-colors cursor-pointer"
                >
                  {sys}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Tag className="w-3.5 h-3.5 text-neutral-400" />
            {caseStudy.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Table of Contents Sidebar (Desktop View) */}
      {viewMode === 'continuous' && (
        <aside className="hidden xl:block w-64 sticky top-20 flex-shrink-0 p-4 bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-3.5 shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5">
            <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
            <span>Chapter Outline</span>
          </div>

          <nav className="space-y-1 text-xs">
            {[
              { id: 'overview', label: '01. Scale & Overview' },
              { id: 'requirements', label: '02. Requirements & SLAs' },
              { id: 'architecture', label: '03. Architecture Schematic' },
              { id: 'capacity', label: '04. Capacity Math' },
              { id: 'api-db', label: '05. API & Schema Design' },
              { id: 'deep-dives', label: '06. Deep Dives & Q&A' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full text-left px-3 py-2 text-xs transition-all rounded-lg block font-sans cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold border-l-2 border-indigo-600 dark:border-indigo-400 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Chapter Status:</span>
            <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
              {isCompleted ? '100% Completed' : 'Reading'}
            </span>
          </div>
        </aside>
      )}
    </div>
  );
};

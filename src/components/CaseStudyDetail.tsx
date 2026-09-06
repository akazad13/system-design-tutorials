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
  Columns
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
  const [activeSection, setActiveSection] = useState<string>('overview');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Scroll spy to track active section in continuous reading mode
  useEffect(() => {
    if (viewMode !== 'continuous') return;

    const sections = ['overview', 'requirements', 'architecture', 'capacity', 'api-db', 'deep-dives'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
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

    window.addEventListener('scroll', handleScroll);
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
        return 'bg-[#F4F9F4] text-[#166534] border-[#166534]/30';
      case 'Intermediate':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#92400E]/30';
      case 'Advanced':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#991B1B]/30';
      default:
        return 'bg-[#F9F7F2] text-[#1A1A1A] border-[#1A1A1A]/20';
    }
  };

  return (
    <div className="relative flex gap-8 items-start font-sans pb-16">
      {/* Central Reading Area */}
      <div className="flex-1 min-w-0 max-w-4xl space-y-10">
        {/* Header Breadcrumbs & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A1A1A]/10 pb-4">
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/50">
            <span className="font-bold text-[#1A1A1A]">02 / Case Archive</span>
            <span>•</span>
            <span>{caseStudy.category}</span>
            <span className="text-[#1A1A1A]/60 flex items-center gap-1.5 font-mono ml-2">
              <Clock className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
              {caseStudy.readTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleComplete && (
              <button
                onClick={onToggleComplete}
                className={`px-3 py-1.5 text-xs font-sans border flex items-center gap-1.5 transition-colors ${
                  isCompleted
                    ? 'bg-[#166534] text-[#FDFCFB] border-[#166534]'
                    : 'bg-[#FFFFFF] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider">{isCompleted ? 'Completed' : 'Mark Done'}</span>
              </button>
            )}

            {onToggleBookmark && (
              <button
                onClick={onToggleBookmark}
                className={`px-3 py-1.5 text-xs font-sans border flex items-center gap-1.5 transition-colors ${
                  isBookmarked
                    ? 'bg-[#1A1A1A] text-[#FDFCFB] border-[#1A1A1A]'
                    : 'bg-[#FFFFFF] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-wider">{isBookmarked ? 'Saved' : 'Save Study'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="px-3 py-1.5 text-xs font-sans bg-[#FFFFFF] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="text-[11px] uppercase tracking-wider">{isCopied ? 'Link Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Title, Badges & Overview */}
        <div id="overview" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider border ${getDifficultyBadge(caseStudy.difficulty)}`}>
              {caseStudy.difficulty}
            </span>
            <span className="text-[9px] px-2.5 py-0.5 bg-[#F9F7F2] text-[#1A1A1A]/70 border border-[#1A1A1A]/15 font-mono uppercase tracking-wider">
              {caseStudy.category}
            </span>
            {isCompleted && (
              <span className="text-[9px] px-2.5 py-0.5 bg-[#F4F9F4] text-[#166534] border border-[#166534]/30 font-mono uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#166534]" /> Completed
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light italic text-[#1A1A1A] tracking-tight leading-tight">
            {caseStudy.title}
          </h1>

          <p className="text-base sm:text-lg font-serif text-[#1A1A1A]/80 leading-relaxed max-w-4xl">
            {caseStudy.tagline}
          </p>

          {caseStudy.overview && (
            <div className="p-4 bg-[#F9F7F2] border-l-2 border-[#1A1A1A] text-xs text-[#1A1A1A]/80 leading-relaxed font-sans">
              <span className="font-bold text-[#1A1A1A] block mb-1 uppercase font-mono text-[10px] tracking-wider">Executive Overview</span>
              {caseStudy.overview}
            </div>
          )}

          {/* Scale Metric Callouts */}
          {caseStudy.scaleSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-[#FFFFFF] border border-[#1A1A1A]/10 shadow-sm">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-[0.15em] text-[#1A1A1A]/50 block">Daily Active Scale</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#166534] block truncate">
                  {caseStudy.scaleSummary.dau}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-[0.15em] text-[#1A1A1A]/50 block">Peak QPS / Throughput</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#1D3557] block truncate">
                  {caseStudy.scaleSummary.qps}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-[0.15em] text-[#1A1A1A]/50 block">Storage Volume</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#92400E] block truncate">
                  {caseStudy.scaleSummary.storage}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono tracking-[0.15em] text-[#1A1A1A]/50 block">Network Bandwidth</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#3E5C76] block truncate">
                  {caseStudy.scaleSummary.bandwidth}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* System Requirements Section */}
        <section id="requirements" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Functional Requirements */}
          <div className="p-5 bg-[#FFFFFF] border border-[#1A1A1A]/10 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
              <CheckCircle2 className="w-4 h-4 text-[#166534]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] font-sans text-[#1A1A1A]">
                Functional Requirements (Core User Stories)
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-[#1A1A1A]/75">
              {caseStudy.functionalRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#166534] font-mono font-bold">•</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Non-Functional Requirements */}
          <div className="p-5 bg-[#FFFFFF] border border-[#1A1A1A]/10 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
              <ShieldCheck className="w-4 h-4 text-[#1D3557]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] font-sans text-[#1A1A1A]">
                Non-Functional Constraints (SLAs & Availability)
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-[#1A1A1A]/75">
              {caseStudy.nonFunctionalRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#1D3557] font-mono font-bold">⚡</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Reading Mode Switcher Bar */}
        <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
          <div className="flex items-center gap-1 bg-[#F9F7F2] p-1 border border-[#1A1A1A]/10 text-xs">
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                viewMode === 'continuous'
                  ? 'bg-[#1A1A1A] text-[#FDFCFB] font-bold shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Continuous Reading Mode</span>
            </button>
            <button
              onClick={() => setViewMode('tabbed')}
              className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                viewMode === 'tabbed'
                  ? 'bg-[#1A1A1A] text-[#FDFCFB] font-bold shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Tabbed Focus Mode</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-[#1A1A1A]/50 hidden sm:inline">
            {viewMode === 'continuous' ? 'Complete chapter layout with on-page outline' : 'Domain-focused view'}
          </span>
        </div>

        {/* Tab Header (Only rendered when in Tabbed Mode) */}
        {viewMode === 'tabbed' && (
          <div className="border-b border-[#1A1A1A]/10 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architecture ({caseStudy.architecture.nodes.length} Nodes)</span>
            </button>

            <button
              onClick={() => setActiveTab('capacity')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'capacity'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Capacity Estimations</span>
            </button>

            <button
              onClick={() => setActiveTab('api_db')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'api_db'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>API & Database Design</span>
            </button>

            <button
              onClick={() => setActiveTab('deep_dives')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'deep_dives'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Deep Dives & Interview Q&A</span>
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
                <div className="p-5 bg-[#FFFFFF] border border-[#1A1A1A]/10 text-xs text-[#1A1A1A]/80 leading-relaxed font-sans shadow-sm">
                  <span className="font-bold font-serif text-[#1A1A1A] text-sm block mb-1">Architecture Synthesis: </span>
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
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-sans border-b border-[#1A1A1A]/10 pb-2">
                    REST & RPC API Design
                  </h3>
                  <ApiViewer endpoints={caseStudy.apiDesign} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-sans border-b border-[#1A1A1A]/10 pb-2">
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
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/70 font-sans flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#3E5C76]" />
                  Architectural Schematic ({caseStudy.architecture.nodes.length} Components)
                </h3>
                <span className="text-[9px] font-mono text-[#1A1A1A]/50 uppercase">Section 03</span>
              </div>
              <ArchitectureCanvas
                nodes={caseStudy.architecture.nodes}
                edges={caseStudy.architecture.edges}
                flowSteps={caseStudy.architecture.flowSteps}
                title={caseStudy.title}
              />
              <div className="p-5 bg-[#FFFFFF] border border-[#1A1A1A]/10 text-xs text-[#1A1A1A]/80 leading-relaxed font-sans shadow-sm">
                <span className="font-bold font-serif text-[#1A1A1A] text-sm block mb-1">Architecture Synthesis: </span>
                {caseStudy.architecture.summary}
              </div>
            </section>

            {/* Section: Capacity Estimations */}
            <section id="capacity" className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/70 font-sans flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#166534]" />
                  Back-of-the-Envelope Capacity Estimations
                </h3>
                <span className="text-[9px] font-mono text-[#1A1A1A]/50 uppercase">Section 04</span>
              </div>
              <CapacityEstimator estimation={caseStudy.capacityEstimations} />
            </section>

            {/* Section: API & Database Design */}
            <section id="api-db" className="space-y-8">
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/70 font-sans flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#92400E]" />
                  API & Database Architecture
                </h3>
                <span className="text-[9px] font-mono text-[#1A1A1A]/50 uppercase">Section 05</span>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/60 font-sans">
                  Core REST & RPC Endpoints
                </h4>
                <ApiViewer endpoints={caseStudy.apiDesign} />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#1A1A1A]/60 font-sans">
                  Data Models & Partitioning Keys
                </h4>
                <DatabaseViewer schemas={caseStudy.databaseDesign} />
              </div>
            </section>

            {/* Section: Deep Dives & Bottlenecks & Interview Q&A */}
            <section id="deep-dives" className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/70 font-sans flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#1D3557]" />
                  Technical Deep Dives, Bottlenecks & Interview Drill
                </h3>
                <span className="text-[9px] font-mono text-[#1A1A1A]/50 uppercase">Section 06</span>
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
        <div className="pt-6 border-t border-[#1A1A1A]/10 space-y-4">
          {caseStudy.similarSystems && caseStudy.similarSystems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#1A1A1A]/50 font-mono text-[10px] uppercase tracking-wider">Related Real-World Systems:</span>
              {caseStudy.similarSystems.map((sys) => (
                <button
                  key={sys}
                  onClick={() => onSelectRelated && onSelectRelated(sys.toLowerCase().replace(/ /g, '-'))}
                  className="px-2.5 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#1A1A1A]/15 text-[#1A1A1A] text-xs font-serif italic transition-colors"
                >
                  {sys}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Tag className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
            {caseStudy.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-[#FFFFFF] text-[#1A1A1A]/60 border border-[#1A1A1A]/10 text-[10px] font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Table of Contents Sidebar (Desktop View) */}
      {viewMode === 'continuous' && (
        <aside className="hidden xl:block w-56 sticky top-20 flex-shrink-0 p-4 bg-[#FFFFFF] border border-[#1A1A1A]/10 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/50 font-mono border-b border-[#1A1A1A]/10 pb-2">
            <ListOrdered className="w-3.5 h-3.5 text-[#1A1A1A]" />
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
                className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors rounded-none block font-sans ${
                  activeSection === item.id
                    ? 'bg-[#1A1A1A] text-[#FDFCFB] font-semibold'
                    : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F9F7F2]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#1A1A1A]/10 text-[10px] font-mono text-[#1A1A1A]/50">
            <span>Progress: {isCompleted ? '100% (Done)' : 'In Progress'}</span>
          </div>
        </aside>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { CaseStudy } from '../types/system-design';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { CapacityEstimator } from './CapacityEstimator';
import { ApiViewer, DatabaseViewer } from './ApiViewer';
import { DeepDiveViewer } from './DeepDiveViewer';
import { GlossaryText, KeyTermsPanel, ReadingList, SectionHeader, StudyGuideCard } from './ReadingKit';
import { collectGlossaryTerms } from '../data/glossary';
import {
  CASE_STUDY_SECTIONS,
  CASE_STUDY_STUDY_GUIDE,
  CASE_STUDY_SUBSECTIONS as LABELS,
  SCALE_METRIC_GUIDE,
} from '../data/reading-guide';
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
  Copy,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';

interface CaseStudyDetailProps {
  caseStudy: CaseStudy;
  onSelectRelated?: (id: string) => void;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  onToggleBookmark?: () => void;
  onToggleComplete?: () => void;
}

type TabId = 'architecture' | 'capacity' | 'api_db' | 'deep_dives';

const section = (id: string) => CASE_STUDY_SECTIONS.find((s) => s.id === id)!;

export const CaseStudyDetail: React.FC<CaseStudyDetailProps> = ({
  caseStudy,
  onSelectRelated,
  isBookmarked = false,
  isCompleted = false,
  onToggleBookmark,
  onToggleComplete,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('architecture');
  const [viewMode, setViewMode] = useState<'continuous' | 'tabbed'>('continuous');
  const [isCopied, setIsCopied] = useState(false);
  const [copiedStat, setCopiedStat] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});

  // Reset per-page reading state when the reader opens another case study
  useEffect(() => {
    setCheckedRequirements({});
    setActiveSection('overview');
  }, [caseStudy.id]);

  const keyTerms = useMemo(
    () =>
      collectGlossaryTerms(
        [
          caseStudy.tagline,
          caseStudy.overview,
          ...(caseStudy.keyChallenges ?? []),
          ...caseStudy.functionalRequirements,
          ...caseStudy.nonFunctionalRequirements,
          caseStudy.architecture.summary,
        ],
        14
      ),
    [caseStudy]
  );

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

    const ids = CASE_STUDY_SECTIONS.map((s) => s.id);
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      for (const sectionId of ids) {
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

  const scaleMetrics = [
    { key: 'dau', value: caseStudy.scaleSummary?.dau, Icon: Users, icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300', hover: 'hover:border-emerald-300 dark:hover:border-emerald-700/60' },
    { key: 'qps', value: caseStudy.scaleSummary?.qps, Icon: Zap, icon: 'text-sky-600 dark:text-sky-400', text: 'text-sky-700 dark:text-sky-300', hover: 'hover:border-sky-300 dark:hover:border-sky-700/60' },
    { key: 'storage', value: caseStudy.scaleSummary?.storage, Icon: HardDrive, icon: 'text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-300', hover: 'hover:border-amber-300 dark:hover:border-amber-700/60' },
    { key: 'bandwidth', value: caseStudy.scaleSummary?.bandwidth, Icon: Wifi, icon: 'text-indigo-600 dark:text-indigo-400', text: 'text-indigo-700 dark:text-indigo-300', hover: 'hover:border-indigo-300 dark:hover:border-indigo-700/60' },
  ] as const;

  const renderRequirementList = (items: string[], prefix: string, tone: 'emerald' | 'sky') => (
    <ul className="space-y-2.5 text-[1.0625rem] leading-7 text-neutral-700 dark:text-neutral-300">
      {items.map((req, i) => {
        const key = `${prefix}-${i}`;
        const isChecked = !!checkedRequirements[key];
        return (
          <li key={key} className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => toggleReqCheck(key)}
              aria-pressed={isChecked}
              aria-label={isChecked ? 'Mark as not reviewed' : 'Mark as reviewed'}
              title="Tick when you can explain this requirement"
              className={`mt-1.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                isChecked
                  ? tone === 'emerald'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-sky-500 border-sky-500 text-white'
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
              }`}
            >
              {isChecked && <Check className="w-3 h-3" />}
            </button>
            <span className={isChecked ? 'text-neutral-500 dark:text-neutral-500' : ''}>
              <GlossaryText text={req} />
            </span>
          </li>
        );
      })}
    </ul>
  );

  const architectureBody = (
    <div className="space-y-4">
      <ArchitectureCanvas
        nodes={caseStudy.architecture.nodes}
        edges={caseStudy.architecture.edges}
        flowSteps={caseStudy.architecture.flowSteps}
        title={caseStudy.title}
      />
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{LABELS.architectureSummary}</h3>
        <p className="text-[1.0625rem] leading-7 text-neutral-700 dark:text-neutral-300 max-w-[80ch]">
          <GlossaryText text={caseStudy.architecture.summary} />
        </p>
      </div>
    </div>
  );

  const apiDbBody = (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
          {LABELS.api} <span className="text-sm font-normal text-neutral-500">({caseStudy.apiDesign.length})</span>
        </h3>
        <ApiViewer endpoints={caseStudy.apiDesign} />
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{LABELS.dataModel}</h3>
        <DatabaseViewer schemas={caseStudy.databaseDesign} />
      </div>
    </div>
  );

  const deepDiveBody = (
    <DeepDiveViewer
      key={caseStudy.id}
      deepDives={caseStudy.deepDives}
      bottlenecks={caseStudy.bottlenecksAndMitigations}
      interviewQA={caseStudy.interviewQA}
    />
  );

  const tabs: { id: TabId; sectionId: string; Icon: typeof Layers; count: number }[] = [
    { id: 'architecture', sectionId: 'architecture', Icon: Layers, count: caseStudy.architecture.nodes.length },
    { id: 'capacity', sectionId: 'capacity', Icon: Activity, count: caseStudy.capacityEstimations.metrics.length },
    { id: 'api_db', sectionId: 'api-db', Icon: Database, count: caseStudy.apiDesign.length },
    { id: 'deep_dives', sectionId: 'deep-dives', Icon: BookOpen, count: caseStudy.deepDives.length },
  ];

  return (
    <div className="relative flex gap-8 items-start font-sans pb-16">
      {/* Central Reading Area */}
      <div className="flex-1 min-w-0 max-w-6xl space-y-12">
        {/* Header Breadcrumbs & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span className="font-bold text-neutral-900 dark:text-white whitespace-nowrap">Case study</span>
            <span aria-hidden="true">•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">{caseStudy.category}</span>
            <span className="flex items-center gap-1.5 font-mono whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              {caseStudy.readTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleComplete && (
              <button
                onClick={onToggleComplete}
                aria-pressed={isCompleted}
                className={`px-3 py-1.5 text-xs font-sans rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{isCompleted ? 'Done' : 'Mark as done'}</span>
              </button>
            )}

            {onToggleBookmark && (
              <button
                onClick={onToggleBookmark}
                aria-pressed={isBookmarked}
                className={`px-3 py-1.5 text-xs font-sans rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
                <span className="text-xs font-semibold">{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="px-3 py-1.5 text-xs font-sans rounded-xl bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="text-xs font-semibold">{isCopied ? 'Link copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Section 1: The problem */}
        <section id="overview" className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 text-xs font-mono uppercase font-bold tracking-wider rounded-md border ${getDifficultyBadge(caseStudy.difficulty)}`}>
                {caseStudy.difficulty}
              </span>
              {isCompleted && (
                <span className="text-xs px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md font-mono uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Done
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light text-neutral-900 dark:text-white tracking-tight leading-tight">
              {caseStudy.title}
            </h1>

            <p className="text-lg sm:text-xl font-serif text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-[65ch]">
              <GlossaryText text={caseStudy.tagline} />
            </p>
          </div>

          <StudyGuideCard guide={CASE_STUDY_STUDY_GUIDE} />

          {caseStudy.overview && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111420] border-l-4 border-indigo-600 dark:border-indigo-400 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-2">
              <h2 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{LABELS.overview}</h2>
              <p className="text-[1.0625rem] leading-7 text-neutral-800 dark:text-neutral-200 max-w-[72ch]">
                <GlossaryText text={caseStudy.overview} />
              </p>
            </div>
          )}

          {/* Scale numbers with plain-language labels */}
          {caseStudy.scaleSummary && (
            <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
              {scaleMetrics.map(({ key, value, Icon, icon, text, hover }) => {
                const guide = SCALE_METRIC_GUIDE[key];
                const isStatCopied = copiedStat === guide.label;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCopyStat(guide.label, value)}
                    aria-label={`${guide.label}: ${value}. Copy to clipboard`}
                    className={`relative p-4 rounded-xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-1.5 shadow-2xs ${hover} transition-colors cursor-pointer group text-left min-w-0`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0 pr-4 text-neutral-700 dark:text-neutral-300">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${icon}`} />
                      <span className="text-sm font-semibold">{guide.label}</span>
                    </span>
                    <span
                      aria-live="polite"
                      className={`absolute top-3 right-3 transition-opacity ${
                        isStatCopied ? 'opacity-100 text-emerald-600 dark:text-emerald-400' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 text-neutral-400'
                      }`}
                    >
                      {isStatCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="sr-only">{isStatCopied ? 'Copied' : ''}</span>
                    </span>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400 leading-snug">{guide.hint}</span>
                    <span className={`text-sm sm:text-base font-bold font-mono ${text} block leading-snug break-words pt-1`}>
                      {value}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* What makes it hard / what is out of scope */}
          {((caseStudy.keyChallenges?.length ?? 0) > 0 || (caseStudy.outOfScope?.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {caseStudy.keyChallenges?.length > 0 && (
                <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                    {LABELS.keyChallenges}
                  </h2>
                  <ReadingList
                    items={caseStudy.keyChallenges}
                    marker={<span className="block w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  />
                </div>
              )}
              {caseStudy.outOfScope?.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
                    <MinusCircle className="w-4 h-4 text-neutral-400" />
                    {LABELS.outOfScope}
                  </h2>
                  <ReadingList items={caseStudy.outOfScope} />
                </div>
              )}
            </div>
          )}

          <KeyTermsPanel title={LABELS.keyTerms} terms={keyTerms} />

          {/* Quick Jump Navigation Bar (Continuous Mode) */}
          {viewMode === 'continuous' && (
            <nav aria-label="Jump to section" className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-1 whitespace-nowrap">Jump to:</span>
              {CASE_STUDY_SECTIONS.slice(1).map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  {s.nav}
                </button>
              ))}
            </nav>
          )}
        </section>

        {/* Section 2: Requirements */}
        <section id="requirements" className="space-y-5">
          <SectionHeader guide={section('requirements')} index={2} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-3.5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {LABELS.functional}
              </h3>
              {renderRequirementList(caseStudy.functionalRequirements, 'func', 'emerald')}
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 space-y-3.5 shadow-sm">
              <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                {LABELS.nonFunctional}
              </h3>
              {renderRequirementList(caseStudy.nonFunctionalRequirements, 'nonfunc', 'sky')}
            </div>
          </div>
        </section>

        {/* Reading Mode Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
          <div role="group" aria-label="Reading mode" className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <button
              onClick={() => setViewMode('continuous')}
              aria-pressed={viewMode === 'continuous'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'continuous'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full page</span>
            </button>
            <button
              onClick={() => setViewMode('tabbed')}
              aria-pressed={viewMode === 'tabbed'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tabbed'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>One section at a time</span>
            </button>
          </div>

          <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
            {viewMode === 'continuous' ? 'All sections on one page, with an outline on the right.' : 'Pick one section to focus on.'}
          </span>
        </div>

        {viewMode === 'tabbed' ? (
          <div className="space-y-6">
            <div role="tablist" aria-label="Case study sections" className="border-b border-neutral-200/80 dark:border-neutral-800 flex gap-2 overflow-x-auto">
              {tabs.map(({ id, sectionId, Icon, count }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === id
                      ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    {section(sectionId).nav} <span className="font-normal text-neutral-400">({count})</span>
                  </span>
                </button>
              ))}
            </div>

            <div role="tabpanel" className="space-y-5">
              <SectionHeader guide={section(tabs.find((t) => t.id === activeTab)!.sectionId)} />
              {activeTab === 'architecture' && architectureBody}
              {activeTab === 'capacity' && <CapacityEstimator estimation={caseStudy.capacityEstimations} />}
              {activeTab === 'api_db' && apiDbBody}
              {activeTab === 'deep_dives' && deepDiveBody}
            </div>
          </div>
        ) : (
          <div className="space-y-14">
            <section id="architecture" className="space-y-5">
              <SectionHeader
                guide={section('architecture')}
                index={3}
                extra={`${caseStudy.architecture.nodes.length} components`}
              />
              {architectureBody}
            </section>

            <section id="capacity" className="space-y-5">
              <SectionHeader guide={section('capacity')} index={4} />
              <CapacityEstimator estimation={caseStudy.capacityEstimations} />
            </section>

            <section id="api-db" className="space-y-5">
              <SectionHeader guide={section('api-db')} index={5} />
              {apiDbBody}
            </section>

            <section id="deep-dives" className="space-y-5">
              <SectionHeader guide={section('deep-dives')} index={6} />
              {deepDiveBody}
            </section>
          </div>
        )}

        {/* Footer Tags & Similar Systems */}
        <div className="pt-6 border-t border-neutral-200/80 dark:border-neutral-800 space-y-4">
          {caseStudy.similarSystems && caseStudy.similarSystems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">{LABELS.relatedSystems}:</span>
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
        <aside className="hidden xl:block w-60 sticky top-20 flex-shrink-0 p-4 bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-3.5 shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5">
            <ListOrdered className="w-4 h-4 text-indigo-500" />
            <span>On this page</span>
          </div>

          <nav aria-label="Page outline" className="space-y-1 text-sm">
            {CASE_STUDY_SECTIONS.map((item, i) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                aria-current={activeSection === item.id ? 'location' : undefined}
                className={`w-full text-left px-3 py-2 text-sm transition-all rounded-lg flex gap-2 font-sans cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold border-l-2 border-indigo-600 dark:border-indigo-400 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
              >
                <span className="font-mono text-xs text-neutral-400 pt-0.5">{i + 1}</span>
                <span>{item.nav}</span>
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Status</span>
            <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
              {isCompleted ? 'Done' : 'In progress'}
            </span>
          </div>
        </aside>
      )}
    </div>
  );
};

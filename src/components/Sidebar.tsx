import React, { useState, useMemo } from 'react';
import { FUNDAMENTAL_TOPICS } from '../data/fundamentals';
import { ALL_CASE_STUDIES, CASE_STUDY_CATEGORIES } from '../data/case-studies-index';
import { 
  Layers, 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Compass, 
  CheckCircle2, 
  Bookmark, 
  Search, 
  X,
  Check,
  Award,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeType: 'fundamental' | 'case-study';
  activeId: string;
  onSelect: (type: 'fundamental' | 'case-study', id: string) => void;
  onOpenFramework: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  bookmarks?: string[];
  completed?: string[];
  isSavedOnlyActive?: boolean;
  onToggleSavedOnly?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeType,
  activeId,
  onSelect,
  onOpenFramework,
  isOpenMobile,
  onCloseMobile,
  bookmarks = [],
  completed = [],
  isSavedOnlyActive = false,
  onToggleSavedOnly
}) => {
  const [fundamentalsExpanded, setFundamentalsExpanded] = useState(true);
  const [caseStudiesExpanded, setCaseStudiesExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [filterText, setFilterText] = useState('');
  const [localBookmarksOnly, setLocalBookmarksOnly] = useState(false);

  // Sync with external or internal bookmark filter
  const showBookmarksOnly = isSavedOnlyActive || localBookmarksOnly;

  const totalCurriculum = FUNDAMENTAL_TOPICS.length + ALL_CASE_STUDIES.length;
  const completedCount = completed.length;
  const progressPercent = Math.round((completedCount / totalCurriculum) * 100);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Categories': ALL_CASE_STUDIES.length };
    for (const cs of ALL_CASE_STUDIES) {
      counts[cs.category] = (counts[cs.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredFundamentals = FUNDAMENTAL_TOPICS.filter((f) => {
    const matchesSearch = filterText === '' || 
      f.title.toLowerCase().includes(filterText.toLowerCase()) || 
      f.summary.toLowerCase().includes(filterText.toLowerCase()) ||
      f.category.toLowerCase().includes(filterText.toLowerCase());
    const matchesBookmark = !showBookmarksOnly || bookmarks.includes(f.id);
    return matchesSearch && matchesBookmark;
  });

  const filteredCaseStudies = ALL_CASE_STUDIES.filter((cs) => {
    const matchesCategory = selectedCategory === 'All Categories' || cs.category === selectedCategory;
    const matchesSearch = filterText === '' || 
      cs.title.toLowerCase().includes(filterText.toLowerCase()) || 
      cs.tags.some(t => t.toLowerCase().includes(filterText.toLowerCase())) ||
      cs.category.toLowerCase().includes(filterText.toLowerCase());
    const matchesBookmark = !showBookmarksOnly || bookmarks.includes(cs.id);
    return matchesCategory && matchesSearch && matchesBookmark;
  });

  const getDifficultyDot = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'bg-emerald-500';
      case 'Intermediate': return 'bg-amber-500';
      case 'Advanced': return 'bg-rose-500';
      default: return 'bg-neutral-400';
    }
  };

  const handleToggleBookmarkFilter = () => {
    if (onToggleSavedOnly) {
      onToggleSavedOnly();
    } else {
      setLocalBookmarksOnly(!localBookmarksOnly);
    }
  };

  const content = (
    <aside className="w-80 h-full flex flex-col bg-neutral-50/70 dark:bg-[#0D0F17] border-r border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 select-none font-sans transition-colors duration-200">
      {/* Sidebar Header: Interview Cheat Framework & Progress */}
      <div className="p-3.5 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-[#111420]/70">
        <button
          onClick={onOpenFramework}
          className="w-full p-3 bg-gradient-to-br from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 dark:from-indigo-950/80 dark:to-neutral-900 dark:hover:from-indigo-900/80 text-white rounded-xl flex items-center justify-between transition-all group shadow-sm border border-neutral-800 dark:border-indigo-900/50 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Compass className="w-4 h-4 text-indigo-300 group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold tracking-wide block font-sans">Interview Blueprint</span>
              <span className="text-[10px] text-neutral-400 block font-mono">4 Steps & Latency Numbers</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider bg-white/10 text-neutral-200">
            Guide
          </span>
        </button>

        {/* Curriculum Progress Tracker */}
        <div className="mt-3 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Curriculum Completed:
            </span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {completedCount} / {totalCurriculum} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-200/80 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sidebar Filter & Category Selection */}
      <div className="p-3 border-b border-neutral-200/80 dark:border-neutral-800 space-y-2 bg-neutral-50/50 dark:bg-[#0D0F17]/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter 10 modules & 28 studies..."
            className="w-full bg-white dark:bg-[#131722] border border-neutral-200 dark:border-neutral-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-sans transition-all"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2 top-2 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown Filter */}
        <div className="flex items-center gap-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white dark:bg-[#131722] border border-neutral-200 dark:border-neutral-800 rounded-lg py-1.5 px-2.5 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-sans"
          >
            {CASE_STUDY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat} {categoryCounts[cat] !== undefined ? `(${categoryCounts[cat]})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Bookmarks Toggle Pill */}
        {bookmarks.length > 0 && (
          <div>
            <button
              onClick={handleToggleBookmarkFilter}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-sans flex items-center justify-between border transition-all ${
                showBookmarksOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-white dark:bg-[#131722] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? 'fill-white' : 'fill-amber-500 text-amber-500'}`} />
                <span className="font-medium">Saved Bookmarks Only</span>
              </div>
              <span className="font-mono text-[11px] font-bold">({bookmarks.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Topic Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Section 1: Fundamentals */}
        <div className="space-y-1">
          <button
            onClick={() => setFundamentalsExpanded(!fundamentalsExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>01 / Fundamentals ({filteredFundamentals.length})</span>
            </div>
            {fundamentalsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {fundamentalsExpanded && (
            <div className="space-y-0.5 pt-0.5">
              {filteredFundamentals.map((topic, index) => {
                const isActive = activeType === 'fundamental' && activeId === topic.id;
                const isItemCompleted = completed.includes(topic.id);
                const isItemBookmarked = bookmarks.includes(topic.id);

                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      onSelect('fundamental', topic.id);
                      onCloseMobile();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-all group ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold shadow-2xs border-l-3 border-indigo-600 dark:border-indigo-400'
                        : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isItemCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <span className={`font-mono text-[10px] w-4 text-center ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400'}`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                      <span className="truncate font-sans">
                        {topic.title.replace('System Design: ', '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                      {isItemBookmarked && (
                        <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" />
                      )}
                      <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                        isActive ? 'bg-indigo-100/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300' : 'text-neutral-400'
                      }`}>
                        {topic.readTime.replace(' min read', 'm')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Case Studies */}
        <div className="space-y-1">
          <button
            onClick={() => setCaseStudiesExpanded(!caseStudiesExpanded)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>02 / Case Archive ({filteredCaseStudies.length})</span>
            </div>
            {caseStudiesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {caseStudiesExpanded && (
            <div className="space-y-0.5 pt-0.5">
              {filteredCaseStudies.map((cs) => {
                const isActive = activeType === 'case-study' && activeId === cs.id;
                const isItemCompleted = completed.includes(cs.id);
                const isItemBookmarked = bookmarks.includes(cs.id);

                return (
                  <button
                    key={cs.id}
                    onClick={() => {
                      onSelect('case-study', cs.id);
                      onCloseMobile();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-all group ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 font-semibold shadow-2xs border-l-3 border-sky-600 dark:border-sky-400'
                        : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isItemCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${getDifficultyDot(cs.difficulty)} flex-shrink-0`} />
                      )}
                      <span className="truncate font-sans">
                        {cs.title.replace('Design ', '').replace('a ', '').replace('an ', '').split('(')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                      {isItemBookmarked && (
                        <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" />
                      )}
                      <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                        isActive ? 'bg-sky-100/70 dark:bg-sky-900/60 text-sky-900 dark:text-sky-300' : 'text-neutral-400'
                      }`}>
                        {cs.readTime.replace(' min read', 'm')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editorial Access Footer */}
      <div className="p-3 bg-white/70 dark:bg-[#111420]/70 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" /> High-Scale Systems
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] border border-neutral-200 dark:border-neutral-700">
          ⌘K
        </kbd>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block h-[calc(100vh-64px)] sticky top-[64px] flex-shrink-0">
        {content}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity" onClick={onCloseMobile} />
          <div className="relative z-50 w-80 max-w-[85vw] h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

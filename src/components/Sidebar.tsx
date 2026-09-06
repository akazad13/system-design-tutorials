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
  Filter,
  Check,
  Award
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeType,
  activeId,
  onSelect,
  onOpenFramework,
  isOpenMobile,
  onCloseMobile,
  bookmarks = [],
  completed = []
}) => {
  const [fundamentalsExpanded, setFundamentalsExpanded] = useState(true);
  const [caseStudiesExpanded, setCaseStudiesExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [filterText, setFilterText] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

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
      default: return 'bg-zinc-400';
    }
  };

  const content = (
    <aside className="w-80 h-full flex flex-col bg-[#F9F7F2] border-r border-[#1A1A1A]/10 text-[#1A1A1A] select-none font-sans">
      {/* Sidebar Quick Action: Interview Cheat Framework */}
      <div className="p-4 border-b border-[#1A1A1A]/10 bg-[#FDFCFB]">
        <button
          onClick={onOpenFramework}
          className="w-full p-3.5 bg-[#1A1A1A] hover:bg-[#2E2E2E] text-[#FDFCFB] flex items-center justify-between transition-all group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-[#FDFCFB]/80 group-hover:rotate-45 transition-transform duration-300" />
            <div className="text-left">
              <span className="text-xs font-bold font-sans tracking-wide block uppercase text-[11px]">Interview Blueprint</span>
              <span className="text-[10px] text-[#FDFCFB]/60 block font-mono">4-Step Strategy & Math Cheats</span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 border border-[#FDFCFB]/20 text-[#FDFCFB]/90 text-[9px] font-mono tracking-wider uppercase">
            Guide
          </span>
        </button>

        {/* Curriculum Progress Tracker */}
        <div className="mt-3 pt-3 border-t border-[#1A1A1A]/10 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#1A1A1A]/60 flex items-center gap-1">
              <Award className="w-3 h-3 text-[#166534]" /> Curriculum Progress:
            </span>
            <span className="font-bold text-[#1A1A1A]">
              {completedCount} / {totalCurriculum} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E5E2D9] overflow-hidden">
            <div 
              className="h-full bg-[#166534] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sidebar Filter & Category Select */}
      <div className="p-4 border-b border-[#1A1A1A]/10 space-y-2 bg-[#F9F7F2]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#1A1A1A]/40 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search 10 modules & 28 studies..."
            className="w-full bg-[#FFFFFF] border border-[#1A1A1A]/10 rounded-none pl-8 pr-3 py-1.5 text-xs text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#1A1A1A] font-sans"
          />
        </div>

        {/* Category Dropdown Filter */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#1A1A1A]/10 rounded-none py-1.5 px-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] font-mono uppercase text-[10px] tracking-wider"
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
          <div className="pt-1">
            <button
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`w-full px-2 py-1 text-[10px] font-mono uppercase tracking-wider flex items-center justify-between border transition-colors ${
                showBookmarksOnly
                  ? 'bg-[#1A1A1A] text-[#FDFCFB] border-[#1A1A1A]'
                  : 'bg-[#FFFFFF] text-[#1A1A1A]/70 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3 h-3" />
                <span>Saved Topics Only</span>
              </div>
              <span className="font-bold">({bookmarks.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Topic Tree */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section 1: Fundamentals */}
        <div className="space-y-2">
          <button
            onClick={() => setFundamentalsExpanded(!fundamentalsExpanded)}
            className="w-full flex items-center justify-between py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/60 hover:text-[#1A1A1A] font-sans"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#3E5C76]" />
              <span>01 / Fundamentals ({filteredFundamentals.length})</span>
            </div>
            {fundamentalsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {fundamentalsExpanded && (
            <div className="space-y-1 pl-2 border-l border-[#1A1A1A]/10">
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
                    className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors group ${
                      isActive
                        ? 'bg-[#1A1A1A] text-[#FDFCFB] font-semibold'
                        : 'text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isItemCompleted ? (
                        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <span className={`font-mono text-[9px] ${isActive ? 'text-[#FDFCFB]/60' : 'text-[#1A1A1A]/40'}`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                      <span className={`truncate font-serif ${isActive ? 'italic' : ''}`}>
                        {topic.title.replace('System Design: ', '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                      {isItemBookmarked && (
                        <Bookmark className={`w-3 h-3 ${isActive ? 'text-[#FDFCFB]/80' : 'text-[#92400E]'}`} />
                      )}
                      <span className={`text-[9px] font-mono ${isActive ? 'text-[#FDFCFB]/60' : 'text-[#1A1A1A]/40'}`}>
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
        <div className="space-y-2">
          <button
            onClick={() => setCaseStudiesExpanded(!caseStudiesExpanded)}
            className="w-full flex items-center justify-between py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]/60 hover:text-[#1A1A1A] font-sans"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#3E5C76]" />
              <span>02 / Case Archive ({filteredCaseStudies.length})</span>
            </div>
            {caseStudiesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {caseStudiesExpanded && (
            <div className="space-y-1 pl-2 border-l border-[#1A1A1A]/10">
              {filteredCaseStudies.map((cs, index) => {
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
                    className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between transition-colors group ${
                      isActive
                        ? 'bg-[#1A1A1A] text-[#FDFCFB] font-semibold'
                        : 'text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isItemCompleted ? (
                        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${getDifficultyDot(cs.difficulty)} flex-shrink-0`} />
                      )}
                      <span className={`truncate font-serif ${isActive ? 'italic' : ''}`}>
                        {cs.title.replace('Design ', '').replace('a ', '').replace('an ', '').split('(')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                      {isItemBookmarked && (
                        <Bookmark className={`w-3 h-3 ${isActive ? 'text-[#FDFCFB]/80' : 'text-[#92400E]'}`} />
                      )}
                      <span className={`text-[9px] font-mono ${isActive ? 'text-[#FDFCFB]/60' : 'text-[#1A1A1A]/40'}`}>
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
      <div className="p-4 mt-auto bg-[#1A1A1A] text-[#FDFCFB] border-t border-[#1A1A1A]">
        <p className="text-[11px] leading-relaxed font-serif text-[#FDFCFB]/80 italic">
          "Mastering distributed systems by studying high-availability patterns in production."
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-[calc(100vh-64px)] sticky top-[64px] flex-shrink-0">
        {content}
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-50 w-80 max-w-[85vw] h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

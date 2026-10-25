import React, { useState, useEffect } from 'react';
import { FUNDAMENTAL_TOPICS, getFundamentalById } from './data/fundamentals';
import { ALL_CASE_STUDIES, getCaseStudyById } from './data/case-studies-index';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FundamentalDetail } from './components/FundamentalDetail';
import { CaseStudyDetail } from './components/CaseStudyDetail';
import { InterviewFrameworkModal } from './components/InterviewFrameworkModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  BookOpen,
  Layers
} from 'lucide-react';

export function App() {
  const [activeType, setActiveType] = useState<'fundamental' | 'case-study'>('case-study');
  const [activeId, setActiveId] = useState<string>('url-shortener');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isFrameworkOpen, setIsFrameworkOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [isSavedOnlyActive, setIsSavedOnlyActive] = useState<boolean>(false);

  // Dark / Light Mode state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('system_design_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme to html element and persist
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('system_design_theme', theme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User reading preferences & progress stored in localStorage
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('system_design_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('system_design_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>(() => {
    try {
      const saved = localStorage.getItem('system_design_font_size');
      return (saved as 'sm' | 'base' | 'lg') || 'base';
    } catch {
      return 'base';
    }
  });

  // Track window scroll reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        setReadingProgress(0);
        return;
      }
      const progress = (window.scrollY / scrollHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeId]);

  // Synchronize hash with current active topic
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      const matchedFundamental = getFundamentalById(hash);
      if (matchedFundamental) {
        setActiveType('fundamental');
        setActiveId(matchedFundamental.id);
        return;
      }

      const matchedCaseStudy = getCaseStudyById(hash);
      if (matchedCaseStudy) {
        setActiveType('case-study');
        setActiveId(matchedCaseStudy.id);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when topic changes
  const handleSelectTopic = (type: 'fundamental' | 'case-study', id: string) => {
    setActiveType(type);
    setActiveId(id);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcut for Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentFundamental = getFundamentalById(activeId) || FUNDAMENTAL_TOPICS[0];
  const currentCaseStudy = getCaseStudyById(activeId) || ALL_CASE_STUDIES[0];

  // Dynamic document title
  useEffect(() => {
    const activeTitle = activeType === 'fundamental' 
      ? currentFundamental?.title 
      : currentCaseStudy?.title;
    if (activeTitle) {
      document.title = `${activeTitle.replace('System Design: ', '')} | System Design Tutorials`;
    }
  }, [activeType, currentFundamental, currentCaseStudy]);

  // Toggle bookmark handler
  const handleToggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('system_design_bookmarks', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save bookmark', e);
      }
      return updated;
    });
  };

  // Toggle completion handler
  const handleToggleComplete = (id: string) => {
    setCompleted((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('system_design_completed', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save completion', e);
      }
      return updated;
    });
  };

  // Font size change handler
  const handleChangeFontSize = (size: 'sm' | 'base' | 'lg') => {
    setFontSize(size);
    try {
      localStorage.setItem('system_design_font_size', size);
    } catch (e) {
      console.error('Failed to save font size', e);
    }
  };

  // Next / Previous Navigation Helpers
  const findNextAndPrev = () => {
    if (activeType === 'fundamental') {
      const idx = FUNDAMENTAL_TOPICS.findIndex((f) => f.id === activeId);
      const prev = idx > 0 ? FUNDAMENTAL_TOPICS[idx - 1] : null;
      const next = idx < FUNDAMENTAL_TOPICS.length - 1 ? FUNDAMENTAL_TOPICS[idx + 1] : ALL_CASE_STUDIES[0];
      return { prev, next, nextType: idx < FUNDAMENTAL_TOPICS.length - 1 ? ('fundamental' as const) : ('case-study' as const) };
    } else {
      const idx = ALL_CASE_STUDIES.findIndex((c) => c.id === activeId);
      const prev = idx > 0 ? ALL_CASE_STUDIES[idx - 1] : FUNDAMENTAL_TOPICS[FUNDAMENTAL_TOPICS.length - 1];
      const next = idx < ALL_CASE_STUDIES.length - 1 ? ALL_CASE_STUDIES[idx + 1] : null;
      return { 
        prev, 
        next, 
        prevType: idx > 0 ? ('case-study' as const) : ('fundamental' as const),
        nextType: ('case-study' as const) 
      };
    }
  };

  const { prev, next, prevType = 'fundamental', nextType = 'case-study' } = findNextAndPrev();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 dark:bg-[#0B0D13] dark:text-[#E2E8F0] flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenFramework={() => setIsFrameworkOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        totalFundamentals={FUNDAMENTAL_TOPICS.length}
        totalCaseStudies={ALL_CASE_STUDIES.length}
        readingProgress={readingProgress}
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        bookmarkCount={bookmarks.length}
        completedCount={completed.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleSavedOnly={() => setIsSavedOnlyActive(!isSavedOnlyActive)}
        isSavedOnlyActive={isSavedOnlyActive}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-row">
        {/* Left Sidebar */}
        <Sidebar
          activeType={activeType}
          activeId={activeId}
          onSelect={handleSelectTopic}
          onOpenFramework={() => setIsFrameworkOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          bookmarks={bookmarks}
          completed={completed}
          isSavedOnlyActive={isSavedOnlyActive}
          onToggleSavedOnly={() => setIsSavedOnlyActive(!isSavedOnlyActive)}
        />

        {/* Central Tutorial Reader Area */}
        <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] w-full mx-auto overflow-y-auto ${
          fontSize === 'sm' ? 'font-scale-sm' : fontSize === 'lg' ? 'font-scale-lg' : 'font-scale-base'
        }`}>
          {activeType === 'fundamental' ? (
            <FundamentalDetail 
              topic={currentFundamental} 
              isBookmarked={bookmarks.includes(currentFundamental.id)}
              isCompleted={completed.includes(currentFundamental.id)}
              onToggleBookmark={() => handleToggleBookmark(currentFundamental.id)}
              onToggleComplete={() => handleToggleComplete(currentFundamental.id)}
            />
          ) : (
            <CaseStudyDetail
              caseStudy={currentCaseStudy}
              onSelectRelated={(id) => handleSelectTopic('case-study', id)}
              isBookmarked={bookmarks.includes(currentCaseStudy.id)}
              isCompleted={completed.includes(currentCaseStudy.id)}
              onToggleBookmark={() => handleToggleBookmark(currentCaseStudy.id)}
              onToggleComplete={() => handleToggleComplete(currentCaseStudy.id)}
            />
          )}

          {/* Bottom Pagination Links */}
          <div className="mt-14 pt-8 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-4">
            {prev ? (
              <button
                onClick={() => handleSelectTopic(prevType, prev.id)}
                className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-white dark:bg-[#111420] hover:bg-neutral-50 dark:hover:bg-[#151926] border border-neutral-200/80 dark:border-neutral-800 text-left transition-all group max-w-[48%] shadow-2xs hover:shadow-sm cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 block">
                    Previous Chapter
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate block mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {prev.title.replace('System Design: ', '').replace('Design ', '')}
                  </span>
                </div>
              </button>
            ) : <div />}

            {next && (
              <button
                onClick={() => handleSelectTopic(nextType, next.id)}
                className="flex items-center justify-end gap-3.5 px-5 py-4 rounded-2xl bg-white dark:bg-[#111420] hover:bg-neutral-50 dark:hover:bg-[#151926] border border-neutral-200/80 dark:border-neutral-800 text-right transition-all group max-w-[48%] ml-auto shadow-2xs hover:shadow-sm cursor-pointer"
              >
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 block">
                    Next Chapter
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate block mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {next.title.replace('System Design: ', '').replace('Design ', '')}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Global Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTopic={handleSelectTopic}
      />

      {/* System Design Interview Master Blueprint Modal */}
      <InterviewFrameworkModal
        isOpen={isFrameworkOpen}
        onClose={() => setIsFrameworkOpen(false)}
      />
    </div>
  );
}

export default App;

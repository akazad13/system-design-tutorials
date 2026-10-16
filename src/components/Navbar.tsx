import React from 'react';
import { 
  Compass, 
  Search, 
  Menu, 
  Bookmark,
  CheckCircle2,
  Sun,
  Moon,
  Sparkles,
  Layers
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenFramework: () => void;
  onToggleMobileSidebar: () => void;
  totalFundamentals: number;
  totalCaseStudies: number;
  readingProgress?: number;
  fontSize?: 'sm' | 'base' | 'lg';
  onChangeFontSize?: (size: 'sm' | 'base' | 'lg') => void;
  bookmarkCount?: number;
  completedCount?: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onToggleSavedOnly?: () => void;
  isSavedOnlyActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenFramework,
  onToggleMobileSidebar,
  totalFundamentals,
  totalCaseStudies,
  readingProgress = 0,
  fontSize = 'base',
  onChangeFontSize,
  bookmarkCount = 0,
  completedCount = 0,
  theme = 'light',
  onToggleTheme,
  onToggleSavedOnly,
  isSavedOnlyActive = false
}) => {
  const totalCurriculum = totalFundamentals + totalCaseStudies;
  const progressPercent = Math.round((completedCount / (totalCurriculum || 1)) * 100);

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 z-50 transition-all duration-150 ease-out shadow-sm"
        style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
        role="progressbar"
        aria-valuenow={readingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <header className="h-[64px] bg-white/85 dark:bg-[#0C0E14]/85 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors duration-200">
        {/* Left: Brand Logo & Mobile Drawer Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-sans">
                System<span className="text-indigo-600 dark:text-indigo-400 font-serif italic font-normal ml-0.5">Design</span>
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                v2.5
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Quick Search Trigger Button */}
        <div className="flex-1 max-w-sm lg:max-w-md mx-3 sm:mx-6">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-neutral-100/80 dark:bg-neutral-900/80 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-800 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              <span className="hidden sm:inline font-sans text-xs truncate">
                Search 10 Fundamentals & 28 Case Studies...
              </span>
              <span className="sm:hidden font-sans text-xs">Search topics...</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Controls & Interview Blueprint */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Font Size Scaling Controls */}
          {onChangeFontSize && (
            <div className="hidden md:flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono">
              <button
                onClick={() => onChangeFontSize('sm')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  fontSize === 'sm' 
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs' 
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Small text size"
              >
                A-
              </button>
              <button
                onClick={() => onChangeFontSize('base')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  fontSize === 'base' 
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs' 
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Default text size"
              >
                A
              </button>
              <button
                onClick={() => onChangeFontSize('lg')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  fontSize === 'lg' 
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs' 
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Large text size"
              >
                A+
              </button>
            </div>
          )}

          {/* Bookmarks Counter Button (Toggles filter if callback provided) */}
          {bookmarkCount > 0 && (
            <button
              onClick={onToggleSavedOnly}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                isSavedOnlyActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
              }`}
              title="Show bookmarked topics only"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSavedOnlyActive ? 'fill-white text-white' : 'fill-amber-500 text-amber-500'}`} />
              <span className="font-semibold">{bookmarkCount}</span>
            </button>
          )}

          {/* Curriculum Completion Progress Badge */}
          {completedCount > 0 && (
            <div 
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-mono text-emerald-700 dark:text-emerald-300"
              title={`${progressPercent}% curriculum completed`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{completedCount}/{totalCurriculum}</span>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">({progressPercent}%)</span>
            </div>
          )}

          {/* Dark / Light Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>
          )}

          {/* Interview Blueprint Master Modal Trigger */}
          <button
            onClick={onOpenFramework}
            className="px-3.5 py-2 bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-500 dark:hover:to-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-indigo-500/20 group cursor-pointer"
          >
            <Compass className="w-4 h-4 text-indigo-300 dark:text-white group-hover:rotate-45 transition-transform duration-300" />
            <span className="hidden sm:inline font-sans">Interview Blueprint</span>
            <span className="sm:hidden font-sans">Blueprint</span>
          </button>
        </div>
      </header>
    </>
  );
};

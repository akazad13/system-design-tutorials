import React from 'react';
import { 
  Compass, 
  Search, 
  Menu, 
  Bookmark,
  CheckCircle2,
  Type
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
  completedCount = 0
}) => {
  return (
    <>
      {/* Top Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-[#3E5C76] z-50 transition-all duration-150 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
        role="progressbar"
        aria-valuenow={readingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <header className="h-[64px] bg-[#FDFCFB] border-b border-[#1A1A1A]/10 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F9F7F2] lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="text-xl sm:text-2xl font-serif font-black tracking-tighter text-[#1A1A1A]">
              SYSTEM<span className="font-serif font-light italic text-[#1A1A1A]/70">design</span>
              <span className="text-[#3E5C76] font-mono font-bold text-lg leading-none">.</span>
            </div>

            <span className="hidden md:inline-block px-2 py-0.5 border border-[#1A1A1A]/15 bg-[#F9F7F2] text-[#1A1A1A]/70 text-[9px] font-mono uppercase tracking-widest">
              v2.4
            </span>
          </div>
        </div>

        {/* Middle: Quick Search Trigger Button */}
        <div className="flex-1 max-w-sm lg:max-w-md mx-3 sm:mx-6">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F9F7F2] border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-all group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#1A1A1A]/40 group-hover:text-[#1A1A1A] transition-colors flex-shrink-0" />
              <span className="hidden sm:inline font-sans text-xs truncate">Search 10 Fundamentals & 28 Case Studies...</span>
              <span className="sm:hidden font-sans text-xs">Search...</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#1A1A1A]/60 bg-[#F9F7F2] border border-[#1A1A1A]/15">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Readability Controls & Interview Blueprint */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Font Size Scaling Controls */}
          {onChangeFontSize && (
            <div className="hidden md:flex items-center border border-[#1A1A1A]/15 bg-[#F9F7F2] p-0.5">
              <button
                onClick={() => onChangeFontSize('sm')}
                className={`px-2 py-0.5 text-[11px] font-mono font-medium transition-colors ${
                  fontSize === 'sm' ? 'bg-[#1A1A1A] text-[#FDFCFB]' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
                title="Small Text"
              >
                A-
              </button>
              <button
                onClick={() => onChangeFontSize('base')}
                className={`px-2 py-0.5 text-[11px] font-mono font-medium transition-colors ${
                  fontSize === 'base' ? 'bg-[#1A1A1A] text-[#FDFCFB]' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
                title="Default Text"
              >
                A
              </button>
              <button
                onClick={() => onChangeFontSize('lg')}
                className={`px-2 py-0.5 text-[11px] font-mono font-medium transition-colors ${
                  fontSize === 'lg' ? 'bg-[#1A1A1A] text-[#FDFCFB]' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
                title="Large Text (High Readability)"
              >
                A+
              </button>
            </div>
          )}

          {/* Bookmarks Counter */}
          {bookmarkCount > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 border border-[#1A1A1A]/15 bg-[#F9F7F2] text-[11px] font-mono text-[#1A1A1A]">
              <Bookmark className="w-3 h-3 text-[#3E5C76] fill-[#3E5C76]" />
              <span>{bookmarkCount}</span>
            </div>
          )}

          {/* Progress Pill */}
          {completedCount > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 border border-[#166534]/30 bg-[#F4F9F4] text-[11px] font-mono text-[#166534]">
              <CheckCircle2 className="w-3 h-3 text-[#166534]" />
              <span>{completedCount}/{totalFundamentals + totalCaseStudies}</span>
            </div>
          )}

          {/* Interview Blueprint Trigger */}
          <button
            onClick={onOpenFramework}
            className="px-3 sm:px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-[#FDFCFB] text-[10px] uppercase tracking-[0.15em] font-sans font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Interview Blueprint</span>
            <span className="sm:hidden">Blueprint</span>
          </button>
        </div>
      </header>
    </>
  );
};

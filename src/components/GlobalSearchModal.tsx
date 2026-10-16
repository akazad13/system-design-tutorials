import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, BookOpen, Layers, CornerDownLeft, Sparkles } from 'lucide-react';
import { ALL_CASE_STUDIES } from '../data/case-studies-index';
import { FUNDAMENTAL_TOPICS } from '../data/fundamentals';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (type: 'fundamental' | 'case-study', id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const fundamentals = FUNDAMENTAL_TOPICS.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.keyConcepts.some((c) => c.name.toLowerCase().includes(q) || c.explanation.toLowerCase().includes(q))
    ).map((f) => ({
      type: 'fundamental' as const,
      id: f.id,
      title: f.title,
      category: f.category,
      tagline: f.summary
    }));

    const caseStudies = ALL_CASE_STUDIES.filter(
      (cs) =>
        cs.title.toLowerCase().includes(q) ||
        cs.tagline.toLowerCase().includes(q) ||
        cs.category.toLowerCase().includes(q) ||
        cs.tags.some((t) => t.toLowerCase().includes(q)) ||
        cs.similarSystems.some((s) => s.toLowerCase().includes(q))
    ).map((cs) => ({
      type: 'case-study' as const,
      id: cs.id,
      title: cs.title,
      category: cs.category,
      tagline: cs.tagline
    }));

    return [...fundamentals, ...caseStudies].slice(0, 10);
  }, [query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (searchResults.length > 0 ? (prev + 1) % searchResults.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults.length > 0 && searchResults[selectedIndex]) {
          const item = searchResults[selectedIndex];
          onSelectTopic(item.type, item.id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectTopic, searchResults, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-sm font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="w-full max-w-2xl bg-white dark:bg-[#111420] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 bg-neutral-50/80 dark:bg-[#131722]/80 border-b border-neutral-200/80 dark:border-neutral-800">
          <Search className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 10 Fundamentals, 28 Case Studies, Kafka, Redis Lua, Snowflake ID..."
            className="w-full bg-transparent text-sm sm:text-base text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none font-sans"
          />
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={resultsContainerRef} className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-3">
              <p className="font-serif italic text-sm text-neutral-800 dark:text-neutral-200">
                Explore architectural blueprints, scalability patterns, and database designs
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {[
                  'TinyURL',
                  'Uber H3 Geospatial',
                  'Kafka Event Outbox',
                  'Consistent Hashing',
                  'Snowflake Distributed ID',
                  'Payment Ledger',
                  'Raft Consensus',
                  'Token Bucket Rate Limiter'
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 text-xs transition-colors font-mono cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400 font-serif italic">
              No matching fundamentals or case studies found for "{query}".
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    onSelectTopic(item.type, item.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between gap-3 group transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : item.type === 'fundamental'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50'
                        : 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/50'
                    }`}>
                      {item.type === 'fundamental' ? <Layers className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold truncate font-sans ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex-shrink-0 uppercase ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 font-sans ${
                        isSelected ? 'text-indigo-100' : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center transition-colors ${
                    isSelected ? 'text-white' : 'text-neutral-300 dark:text-neutral-600'
                  }`}>
                    <CornerDownLeft className="w-4 h-4" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Keyboard Footer */}
        <div className="flex items-center justify-between p-3 px-4 bg-neutral-50/80 dark:bg-[#131722]/80 border-t border-neutral-200/80 dark:border-neutral-800 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-bold">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-bold">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-bold">esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};

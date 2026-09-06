import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, BookOpen, Layers, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-[#1A1A1A]/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#1A1A1A]/20 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 bg-[#F9F7F2] border-b border-[#1A1A1A]/10">
          <Search className="w-5 h-5 text-[#1A1A1A]/60" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 10 Fundamentals, 28 Case Studies, protocols, keywords (e.g. Redis Lua, H3, Kafka)..."
            className="w-full bg-transparent text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-[#1A1A1A]/60 bg-[#FFFFFF] border border-[#1A1A1A]/20">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={resultsContainerRef} className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[#1A1A1A]/10">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-[#1A1A1A]/60 space-y-3">
              <p className="font-serif italic text-sm text-[#1A1A1A]">Type keywords to explore architectures & blueprints</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['TinyURL', 'Uber H3', 'Kafka Outbox', 'Consistent Hashing', 'Snowflake ID', 'Stripe Ledger', 'Raft Consensus', 'Circuit Breaker'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-2.5 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] text-[#1A1A1A] border border-[#1A1A1A]/15 text-xs transition-colors font-mono"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#1A1A1A]/60 font-serif italic">
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
                  className={`w-full text-left p-3.5 flex items-center justify-between gap-3 group transition-colors ${
                    isSelected ? 'bg-[#1A1A1A] text-[#FDFCFB]' : 'hover:bg-[#F9F7F2] text-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 mt-0.5 flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#333333] text-[#FDFCFB] border border-[#555555]'
                        : item.type === 'fundamental'
                        ? 'bg-[#EBF3FA] text-[#1D3557] border border-[#1D3557]/20'
                        : 'bg-[#F4F9F4] text-[#166534] border border-[#166534]/20'
                    }`}>
                      {item.type === 'fundamental' ? <Layers className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate font-sans ${isSelected ? 'text-[#FDFCFB]' : 'text-[#1A1A1A]'}`}>
                          {item.title}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 border flex-shrink-0 uppercase ${
                          isSelected
                            ? 'bg-[#2E2E2E] text-[#FDFCFB]/80 border-[#444444]'
                            : 'bg-[#F9F7F2] text-[#1A1A1A]/70 border-[#1A1A1A]/10'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 font-sans ${
                        isSelected ? 'text-[#FDFCFB]/70' : 'text-[#1A1A1A]/60'
                      }`}>
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center transition-colors ${
                    isSelected ? 'text-[#FDFCFB]' : 'text-[#1A1A1A]/30'
                  }`}>
                    <CornerDownLeft className="w-4 h-4" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Keyboard Footer */}
        <div className="flex items-center justify-between p-3 px-4 bg-[#F9F7F2] border-t border-[#1A1A1A]/10 text-[10px] font-mono text-[#1A1A1A]/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#1A1A1A]/15 font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#1A1A1A]/15 font-bold">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#1A1A1A]/15 font-bold">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#1A1A1A]/15 font-bold">esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};

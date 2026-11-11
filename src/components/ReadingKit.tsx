import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { BookMarked, ChevronDown, GraduationCap } from 'lucide-react';
import { findGlossaryMatches, GlossaryEntry } from '../data/glossary';
import { SectionGuide, StudyGuide } from '../data/reading-guide';

/* ------------------------------------------------------------------ */
/* Glossary term with a definition popover (hover or keyboard focus)  */
/* ------------------------------------------------------------------ */

const TOOLTIP_WIDTH = 256;
const VIEWPORT_GAP = 8;

const GlossaryTerm: React.FC<{ text: string; entry: GlossaryEntry }> = ({ text, entry }) => {
  const id = useId();
  // Rendered only while open, with fixed position, so it never widens or gets clipped by a scroll container.
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const isOpen = position !== null;

  const place = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_GAP * 2);
    const left = Math.max(VIEWPORT_GAP, Math.min(rect.left, window.innerWidth - width - VIEWPORT_GAP));
    setPosition({ top: rect.bottom + 6, left, width });
  };
  const close = () => setPosition(null);

  // Follow the term while the page scrolls (for example when keyboard focus scrolls it into view)
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', place, { capture: true, passive: true });
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, { capture: true });
      window.removeEventListener('resize', place);
    };
  }, [isOpen]);

  return (
    <span
      ref={anchorRef}
      tabIndex={0}
      aria-describedby={position ? id : undefined}
      onMouseEnter={place}
      onMouseLeave={close}
      onFocus={place}
      onBlur={close}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      className="underline decoration-dotted decoration-indigo-400/80 dark:decoration-indigo-400/70 underline-offset-[3px] cursor-help"
    >
      {text}
      {position && (
        <span
          role="tooltip"
          id={id}
          style={{ top: position.top, left: position.left, width: position.width }}
          className="pointer-events-none fixed z-50 block rounded-lg bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-xs leading-snug p-2.5 shadow-lg whitespace-normal normal-case tracking-normal font-sans font-normal text-left not-italic"
        >
          <span className="font-semibold">{entry.term}:</span> {entry.definition}
        </span>
      )}
    </span>
  );
};

/** Renders text and underlines the first appearance of each glossary term. */
export const GlossaryText: React.FC<{ text: string }> = ({ text }) => {
  const parts = useMemo(() => {
    const matches = findGlossaryMatches(text);
    if (matches.length === 0) return [text];
    const out: React.ReactNode[] = [];
    let cursor = 0;
    matches
      .sort((a, b) => a.start - b.start)
      .forEach((m, i) => {
        if (m.start < cursor) return;
        if (m.start > cursor) out.push(text.slice(cursor, m.start));
        out.push(<GlossaryTerm key={i} text={m.text} entry={m.entry} />);
        cursor = m.end;
      });
    if (cursor < text.length) out.push(text.slice(cursor));
    return out;
  }, [text]);
  return <>{parts}</>;
};

/* ------------------------------------------------------------------ */
/* Paragraph helpers                                                  */
/* ------------------------------------------------------------------ */

const ABBREVIATIONS = /(?:e\.g|i\.e|vs|etc|approx|ca)\.$/i;

/** Splits prose into sentences without breaking on "e.g." or "api.example.com". */
export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  const re = /[.!?](?=\s+[A-Z0-9("'])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const candidate = text.slice(start, m.index + 1);
    if (ABBREVIATIONS.test(candidate)) continue;
    sentences.push(candidate.trim());
    start = m.index + 1;
  }
  const rest = text.slice(start).trim();
  if (rest) sentences.push(rest);
  return sentences;
}

/**
 * Shows the first sentence as a bold "main idea", then the rest in short paragraphs.
 * Text that already has line breaks keeps them.
 */
export const LeadAndBody: React.FC<{ text: string; sentencesPerParagraph?: number }> = ({
  text,
  sentencesPerParagraph = 2,
}) => {
  const { lead, paragraphs } = useMemo(() => {
    if (text.includes('\n')) {
      const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
      const [first = '', ...others] = blocks;
      const firstSentences = splitSentences(first);
      return {
        lead: firstSentences[0] ?? '',
        paragraphs: [firstSentences.slice(1).join(' '), ...others].filter(Boolean),
      };
    }
    const sentences = splitSentences(text);
    const grouped: string[] = [];
    for (let i = 1; i < sentences.length; i += sentencesPerParagraph) {
      grouped.push(sentences.slice(i, i + sentencesPerParagraph).join(' '));
    }
    return { lead: sentences[0] ?? text, paragraphs: grouped };
  }, [text, sentencesPerParagraph]);

  return (
    <div className="space-y-3 max-w-[72ch]">
      <p className="text-[1.0625rem] font-semibold text-neutral-900 dark:text-white leading-7">
        <GlossaryText text={lead} />
      </p>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[1.0625rem] text-neutral-700 dark:text-neutral-300 leading-7 whitespace-pre-line">
          <GlossaryText text={p} />
        </p>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Section header                                                     */
/* ------------------------------------------------------------------ */

export const SectionHeader: React.FC<{
  guide: SectionGuide;
  index?: number;
  icon?: React.ReactNode;
  extra?: string;
}> = ({ guide, index, icon, extra }) => (
  <header className="space-y-1.5 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-serif text-neutral-900 dark:text-white leading-tight">
      {index !== undefined && (
        <span className="text-sm font-mono text-neutral-400 dark:text-neutral-500 tabular-nums">
          {String(index).padStart(2, '0')}
        </span>
      )}
      {icon}
      <span>{guide.title}</span>
      {extra && <span className="text-sm font-sans text-neutral-400 dark:text-neutral-500">{extra}</span>}
    </h2>
    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-[72ch]">
      {guide.intro}
    </p>
  </header>
);

/* ------------------------------------------------------------------ */
/* Key terms panel                                                    */
/* ------------------------------------------------------------------ */

export const KeyTermsPanel: React.FC<{ title: string; terms: GlossaryEntry[] }> = ({ title, terms }) => {
  if (terms.length === 0) return null;
  return (
    <details className="group rounded-2xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-4 sm:px-5">
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <BookMarked className="w-4 h-4 text-indigo-500" />
          {title}
          <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">({terms.length})</span>
        </span>
        <ChevronDown className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" />
      </summary>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 px-4 sm:px-5 pb-5 pt-1">
        {terms.map((t) => (
          <div key={t.term} className="text-sm leading-relaxed">
            <dt className="font-semibold text-neutral-900 dark:text-white">{t.term}</dt>
            <dd className="text-neutral-600 dark:text-neutral-400">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
};

/* ------------------------------------------------------------------ */
/* Study guide card                                                   */
/* ------------------------------------------------------------------ */

export const StudyGuideCard: React.FC<{ guide: StudyGuide }> = ({ guide }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 sm:px-5 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          <GraduationCap className="w-4 h-4" />
          {guide.title}
        </span>
        <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="px-4 sm:px-5 pb-5 space-y-2 text-sm text-indigo-950 dark:text-indigo-100 leading-relaxed list-decimal list-inside">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Simple bullet list with glossary support                          */
/* ------------------------------------------------------------------ */

export const ReadingList: React.FC<{ items: string[]; marker?: React.ReactNode; className?: string }> = ({
  items,
  marker,
  className = '',
}) => (
  <ul className={`space-y-2.5 text-[1.0625rem] leading-7 text-neutral-700 dark:text-neutral-300 ${className}`}>
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5">
        <span className="mt-[0.7em] flex-shrink-0" aria-hidden="true">
          {marker ?? <span className="block w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />}
        </span>
        <span>
          <GlossaryText text={item} />
        </span>
      </li>
    ))}
  </ul>
);

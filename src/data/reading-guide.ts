// Reader-facing copy that frames each part of a page: what the section is for and how to use it.
// Kept in src/data/ so components only render it (see AGENTS.md, "Decoupled Data Schema").

export interface SectionGuide {
  id: string;
  /** Short label for the outline and the jump bar. */
  nav: string;
  /** Section heading. */
  title: string;
  /** One or two sentences that say why the section matters and how to read it. */
  intro: string;
}

export const CASE_STUDY_SECTIONS: SectionGuide[] = [
  {
    id: 'overview',
    nav: 'The problem',
    title: 'The problem',
    intro: 'What we are building, how big it is, and which parts make it hard.',
  },
  {
    id: 'requirements',
    nav: 'Requirements',
    title: 'What the system must do',
    intro:
      'Requirements set the goal before any design. Functional requirements are the features users see. Non-functional requirements are the quality targets: speed, uptime and scale.',
  },
  {
    id: 'architecture',
    nav: 'Architecture',
    title: 'How the parts fit together',
    intro:
      'The diagram shows every component and the connections between them. Use the request flow controls under the diagram to follow one request step by step. Select a component to read what it does and where it can fail.',
  },
  {
    id: 'capacity',
    nav: 'Capacity estimate',
    title: 'How big the system must be',
    intro:
      'A back-of-the-envelope estimate turns the user numbers into load, storage and bandwidth. The results show which components need caching, sharding or replication.',
  },
  {
    id: 'api-db',
    nav: 'API and data model',
    title: 'API and data model',
    intro:
      'The API shows how clients talk to the system. The data model shows what each table stores and which key splits it across servers.',
  },
  {
    id: 'deep-dives',
    nav: 'Deep dives and practice',
    title: 'Deep dives, bottlenecks and practice questions',
    intro:
      'The hardest design decisions, the parts that break first under load, and interview questions with model answers. Try to answer each question before you open the answer.',
  },
];

export const CASE_STUDY_SUBSECTIONS = {
  overview: 'In short',
  keyChallenges: 'What makes this hard',
  outOfScope: 'Not covered here',
  functional: 'Features (functional)',
  nonFunctional: 'Quality targets (non-functional)',
  architectureSummary: 'How it works, in one paragraph',
  api: 'API endpoints',
  dataModel: 'Data model and sharding keys',
  relatedSystems: 'Similar real-world systems',
  keyTerms: 'Key terms on this page',
} as const;

export const FUNDAMENTAL_SECTIONS: SectionGuide[] = [
  {
    id: 'overview',
    nav: 'Overview',
    title: 'Overview',
    intro: 'What this building block is and why almost every large system uses it.',
  },
  {
    id: 'architecture',
    nav: 'See it in action',
    title: 'See it in action',
    intro:
      'The diagram shows where this building block sits between the user and the data. Use the request flow controls to follow one request.',
  },
  {
    id: 'concepts',
    nav: 'Core concepts',
    title: 'Core concepts',
    intro:
      'Each concept starts with the main idea in one sentence, then explains how it works, what it gives you and what it costs.',
  },
  {
    id: 'cheatsheet',
    nav: 'Quick reference',
    title: 'Quick reference',
    intro: 'The numbers and rules of thumb to remember. Read this again before an interview.',
  },
  {
    id: 'pitfalls',
    nav: 'Common mistakes',
    title: 'Common mistakes',
    intro: 'Errors that engineers and interview candidates often make with this building block.',
  },
  {
    id: 'interview-tips',
    nav: 'Interview tips',
    title: 'Interview tips',
    intro: 'How to talk about this topic in a system design interview.',
  },
];

export const FUNDAMENTAL_SUBSECTIONS = {
  pros: 'What you gain',
  cons: 'What it costs you',
  example: 'Example',
  mistake: 'Mistake',
  tip: 'Tip',
  keyTerms: 'Key terms on this page',
} as const;

/** Labels for the deep dive, bottleneck and practice question blocks. */
export const DEEP_DIVE_LABELS = {
  searchPlaceholder: 'Search deep dives, bottlenecks and questions...',
  expandAll: 'Open all',
  collapseAll: 'Close all',
  deepDivesTitle: 'Deep dives',
  deepDivesIntro: 'The design decisions that matter most in this system, and why.',
  takeaways: 'Remember',
  tradeoffTitle: 'Trade-off',
  decision: 'Decision',
  bottlenecksTitle: 'Bottlenecks: what breaks first',
  bottlenecksIntro: 'Each card names a weak point, what happens when it fails, and how to fix it.',
  impact: 'What goes wrong',
  mitigation: 'How to fix it',
  questionsTitle: 'Practice questions',
  questionsIntro: 'Answers stay hidden until you try. Say your answer out loud or write it down, then compare.',
  hideAnswers: 'Hide answers until I try',
  hint: 'Show a hint',
  hintPrompt: 'Stuck?',
  tryFirst: 'Try to answer first. Then open the model answer.',
  reveal: 'Show model answer',
  modelAnswer: 'Model answer',
  pitfall: 'Common wrong answer',
  mastered: 'I know this',
  masteredDone: 'Known',
  masteredCount: 'known',
} as const;

/** Labels and plain explanations for the four scale numbers at the top of each case study. */
export const SCALE_METRIC_GUIDE = {
  dau: { label: 'Daily users', hint: 'People who use the system each day' },
  qps: { label: 'Peak load', hint: 'Requests per second at the busiest moment' },
  storage: { label: 'Data stored', hint: 'Total data the system keeps' },
  bandwidth: { label: 'Network traffic', hint: 'Data in and out each second' },
} as const;

export interface StudyGuide {
  title: string;
  steps: string[];
}

export const CASE_STUDY_STUDY_GUIDE: StudyGuide = {
  title: 'How to study this case study',
  steps: [
    'Read the problem, the scale numbers and what makes it hard.',
    'Stop before the diagram. Sketch your own design on paper in 5 minutes.',
    'Compare your sketch with the architecture. Follow one request through the flow.',
    'Check the capacity estimate. Make sure you understand where each number comes from.',
    'Answer the practice questions without looking. Then open the model answers.',
  ],
};

export const FUNDAMENTAL_STUDY_GUIDE: StudyGuide = {
  title: 'How to study this topic',
  steps: [
    'Read the overview and the key terms first.',
    'For each concept, read the first sentence and say it again in your own words.',
    'Look at what you gain and what it costs. Interviews are mostly about these trade-offs.',
    'Close the page and list the common mistakes from memory.',
  ],
};

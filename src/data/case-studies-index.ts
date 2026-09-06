import { CaseStudy } from '../types/system-design';
import { SOCIAL_CASE_STUDIES } from './case-studies-social';
import { MESSAGING_CASE_STUDIES } from './case-studies-messaging';
import { ECOMMERCE_CASE_STUDIES } from './case-studies-ecommerce';
import { INFRASTRUCTURE_CASE_STUDIES } from './case-studies-infrastructure';

export const ALL_CASE_STUDIES: CaseStudy[] = [
  ...SOCIAL_CASE_STUDIES,
  ...MESSAGING_CASE_STUDIES,
  ...ECOMMERCE_CASE_STUDIES,
  ...INFRASTRUCTURE_CASE_STUDIES
];

export const CASE_STUDY_CATEGORIES = [
  'All Categories',
  'Social & Content',
  'Messaging & Real-time',
  'E-Commerce & Marketplaces',
  'Storage & Infrastructure',
  'Search & Big Data',
  'Financial & High Throughput'
] as const;

export function getCaseStudyById(id: string): CaseStudy | undefined {
  return ALL_CASE_STUDIES.find((cs) => cs.id === id || cs.slug === id);
}

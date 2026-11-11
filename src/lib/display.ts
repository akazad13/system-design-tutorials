// Small presentation helpers shared by navigation components.

/** Removes the "Design a/an" prefix and any trailing "(...)" so titles fit in compact lists. */
export function shortTitle(title: string): string {
  return title
    .replace(/^System Design:\s*/, '')
    .replace(/^Design\s+(an?\s+)?/, '')
    .split('(')[0]
    .trim();
}

/** Returns "⌘K" on Apple platforms and "Ctrl K" everywhere else. */
export function searchShortcutLabel(): string {
  if (typeof navigator === 'undefined') return 'Ctrl K';
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform) ? '⌘K' : 'Ctrl K';
}

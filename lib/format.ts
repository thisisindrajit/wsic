/**
 * Format a count with proper singular/plural form
 */
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format a count with singular/plural text
 */
export function formatCountWithText(count: number, singular: string, plural?: string): string {
  const pluralForm = plural || `${singular}s`;
  const formattedCount = formatCount(count);
  
  if (count === 1) {
    return `${formattedCount} ${singular}`;
  }
  
  return `${formattedCount} ${pluralForm}`;
}

/**
 * Format views count
 */
export function formatViews(count: number): string {
  return formatCountWithText(count, "view");
}

/**
 * Format likes count
 */
export function formatLikes(count: number): string {
  return formatCountWithText(count, "like");
}

/**
 * Format shares count
 */
export function formatShares(count: number): string {
  return formatCountWithText(count, "share");
}
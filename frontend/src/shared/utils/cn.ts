/**
 * Utility function for conditional className merging
 * Filters out falsy values and joins remaining class names
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

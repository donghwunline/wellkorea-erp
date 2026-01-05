/**
 * Utility function for conditional className merging.
 *
 * Filters out falsy values and joins remaining class names.
 *
 * @example
 * cn('base', isActive && 'active', className)
 * // Returns: 'base active my-class' (if isActive=true, className='my-class')
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

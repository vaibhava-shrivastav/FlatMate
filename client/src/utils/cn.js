/**
 * Merges class names, filtering out falsy values.
 * Lightweight alternative to clsx for this project's needs.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

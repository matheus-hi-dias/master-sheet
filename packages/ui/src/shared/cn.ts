export type ClassValue = string | false | null | undefined;

/**
 * Join class names without a merge dependency.
 *
 * `tailwind-merge` stays app-local until it is validated against NativeWind
 * class semantics (see the package README).
 */
export function joinClasses(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

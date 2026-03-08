import { useState, useCallback } from "react";

/**
 * Tracks whether a form has been modified since it was last reset.
 *
 * Usage:
 * ```tsx
 * const { isDirty, markDirty, resetDirty } = useFormDirty();
 *
 * // Call markDirty() whenever any field changes
 * // Call resetDirty() when the form is reset (modal opens or submit succeeds)
 * // Pass isDirty to <BaseModal isDirty={isDirty} />
 * ```
 */
export function useFormDirty() {
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const resetDirty = useCallback(() => setIsDirty(false), []);

  return { isDirty, markDirty, resetDirty };
}

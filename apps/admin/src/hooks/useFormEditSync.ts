import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormWatch } from 'react-hook-form';

/**
 * Syncs react-hook-form changes to a parent callback without useEffect([watch()]).
 * watch() returns a new object reference every render, which causes infinite loops
 * when used as a useEffect dependency.
 */
export function useFormEditSync<TFieldValues extends FieldValues>(
  watch: UseFormWatch<TFieldValues>,
  onSync: (values: TFieldValues) => void,
): void {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    let isFirst = true;
    const subscription = watch((formValues) => {
      if (isFirst) {
        isFirst = false;
        return;
      }
      if (formValues) {
        onSyncRef.current(formValues as TFieldValues);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);
}

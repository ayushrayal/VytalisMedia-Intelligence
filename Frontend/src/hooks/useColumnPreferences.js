import { useState, useMemo, useCallback } from "react";

/**
 * Custom React hook for persisting table column ordering and visibility in localStorage.
 * 
 * @param {string} storageKey - localStorage key (e.g. 'vytalis_campaign_columns')
 * @param {Array} defaultColumns - Array of column definition objects
 */
export const useColumnPreferences = (storageKey, defaultColumns = []) => {
  const defaultOrderedKeys = useMemo(() => defaultColumns.map((c) => c.id), [defaultColumns]);
  const defaultVisibleKeys = useMemo(
    () => defaultColumns.filter((c) => c.defaultVisible !== false).map((c) => c.id),
    [defaultColumns]
  );

  const columnMap = useMemo(() => {
    const map = new Map();
    defaultColumns.forEach((col) => map.set(col.id, col));
    return map;
  }, [defaultColumns]);

  // Safely read saved configuration from localStorage
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.orderedKeys) && Array.isArray(parsed.visibleKeys)) {
          // Ensure all valid columns exist in orderedKeys
          const validSavedOrdered = parsed.orderedKeys.filter((id) => columnMap.has(id));
          const missingKeys = defaultOrderedKeys.filter((id) => !validSavedOrdered.includes(id));
          const finalOrdered = [...validSavedOrdered, ...missingKeys];

          // Ensure required columns are always visible
          const requiredKeys = defaultColumns.filter((c) => c.required).map((c) => c.id);
          const validSavedVisible = parsed.visibleKeys.filter((id) => columnMap.has(id));
          const finalVisible = Array.from(new Set([...requiredKeys, ...validSavedVisible]));

          return {
            orderedKeys: finalOrdered,
            visibleKeys: finalVisible,
          };
        }
      }
    } catch (err) {
      console.warn(`[useColumnPreferences] Failed to load localStorage key '${storageKey}':`, err);
    }

    return {
      orderedKeys: defaultOrderedKeys,
      visibleKeys: defaultVisibleKeys,
    };
  });

  // Save new preferences to state and localStorage
  const savePreferences = useCallback(
    (newOrderedKeys, newVisibleKeys) => {
      // Enforce required columns visibility
      const requiredKeys = defaultColumns.filter((c) => c.required).map((c) => c.id);
      const safeVisible = Array.from(new Set([...requiredKeys, ...newVisibleKeys]));
      const safeOrdered = newOrderedKeys.filter((id) => columnMap.has(id));

      const updated = {
        orderedKeys: safeOrdered,
        visibleKeys: safeVisible,
      };

      setPreferences(updated);

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn(`[useColumnPreferences] Failed to save localStorage key '${storageKey}':`, err);
      }
    },
    [storageKey, defaultColumns, columnMap]
  );

  // Reset preferences to default configuration
  const resetToDefaults = useCallback(() => {
    const defaults = {
      orderedKeys: defaultOrderedKeys,
      visibleKeys: defaultVisibleKeys,
    };
    setPreferences(defaults);

    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.warn(`[useColumnPreferences] Failed to remove localStorage key '${storageKey}':`, err);
    }
  }, [storageKey, defaultOrderedKeys, defaultVisibleKeys]);

  // Derived array of visible column descriptors in user's custom order
  const visibleColumns = useMemo(() => {
    const visibleSet = new Set(preferences.visibleKeys);
    return preferences.orderedKeys
      .filter((id) => visibleSet.has(id) && columnMap.has(id))
      .map((id) => columnMap.get(id));
  }, [preferences, columnMap]);

  return {
    allColumns: defaultColumns,
    orderedKeys: preferences.orderedKeys,
    visibleKeys: preferences.visibleKeys,
    visibleColumns,
    savePreferences,
    resetToDefaults,
  };
};

export default useColumnPreferences;

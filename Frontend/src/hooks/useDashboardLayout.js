import { useState, useEffect, useCallback } from "react";
import {
  DASHBOARD_WIDGETS,
  DEFAULT_WIDGET_IDS,
  DEFAULT_VISIBLE_IDS,
} from "../config/dashboardWidgets.js";

const STORAGE_KEY = "vytalis_meta_dashboard_layout";
const CURRENT_VERSION = 1;

/**
 * Custom React hook for managing Meta Overview dashboard customization.
 * Handles localStorage persistence, reordering, toggling visibility, auto-save state, and reset.
 */
export const useDashboardLayout = () => {
  const [orderedIds, setOrderedIds] = useState(DEFAULT_WIDGET_IDS);
  const [visibleIds, setVisibleIds] = useState(DEFAULT_VISIBLE_IDS);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  // Load layout from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.version === CURRENT_VERSION) {
          if (Array.isArray(parsed.orderedWidgetIds)) {
            // Ensure all known widgets exist in ordered list (in case new widgets were added)
            const validOrdered = parsed.orderedWidgetIds.filter((id) =>
              DASHBOARD_WIDGETS.some((w) => w.id === id)
            );
            const missing = DEFAULT_WIDGET_IDS.filter((id) => !validOrdered.includes(id));
            setOrderedIds([...validOrdered, ...missing]);
          }

          if (Array.isArray(parsed.visibleWidgetIds)) {
            setVisibleIds(
              parsed.visibleWidgetIds.filter((id) =>
                DASHBOARD_WIDGETS.some((w) => w.id === id)
              )
            );
          }
        }
      }
    } catch {
      // Fallback to defaults on parse error
      setOrderedIds(DEFAULT_WIDGET_IDS);
      setVisibleIds(DEFAULT_VISIBLE_IDS);
    }
  }, []);

  // Save layout state to localStorage
  const saveLayoutToStorage = useCallback((newOrdered, newVisible) => {
    try {
      const payload = {
        version: CURRENT_VERSION,
        orderedWidgetIds: newOrdered,
        visibleWidgetIds: newVisible,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2000);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  // Toggle visibility of a specific widget ID
  const toggleWidget = useCallback(
    (id) => {
      setVisibleIds((prevVisible) => {
        const isVisible = prevVisible.includes(id);
        const nextVisible = isVisible
          ? prevVisible.filter((vId) => vId !== id)
          : [...prevVisible, id];

        saveLayoutToStorage(orderedIds, nextVisible);
        return nextVisible;
      });
    },
    [orderedIds, saveLayoutToStorage]
  );

  // Reorder widget IDs (Array move operation)
  const moveWidget = useCallback(
    (activeId, overId) => {
      setOrderedIds((prevOrdered) => {
        const oldIndex = prevOrdered.indexOf(activeId);
        const newIndex = prevOrdered.indexOf(overId);

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return prevOrdered;
        }

        const nextOrdered = [...prevOrdered];
        const [movedItem] = nextOrdered.splice(oldIndex, 1);
        nextOrdered.splice(newIndex, 0, movedItem);

        saveLayoutToStorage(nextOrdered, visibleIds);
        return nextOrdered;
      });
    },
    [visibleIds, saveLayoutToStorage]
  );

  // Set explicit ordered list
  const setWidgetOrder = useCallback(
    (newOrder) => {
      setOrderedIds(newOrder);
      saveLayoutToStorage(newOrder, visibleIds);
    },
    [visibleIds, saveLayoutToStorage]
  );

  // Reset dashboard layout to factory defaults
  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setOrderedIds(DEFAULT_WIDGET_IDS);
    setVisibleIds(DEFAULT_VISIBLE_IDS);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  }, []);

  // Derived lists of visible & hidden widget objects
  const visibleWidgets = orderedIds
    .filter((id) => visibleIds.includes(id))
    .map((id) => DASHBOARD_WIDGETS.find((w) => w.id === id))
    .filter(Boolean);

  const availableWidgets = DASHBOARD_WIDGETS.filter(
    (w) => !visibleIds.includes(w.id)
  );

  return {
    orderedIds,
    visibleIds,
    visibleWidgets,
    availableWidgets,
    isCustomizing,
    savedBadge,
    openCustomizer: () => setIsCustomizing(true),
    closeCustomizer: () => setIsCustomizing(false),
    toggleCustomizer: () => setIsCustomizing((prev) => !prev),
    toggleWidget,
    moveWidget,
    setWidgetOrder,
    resetToDefault,
  };
};

export default useDashboardLayout;

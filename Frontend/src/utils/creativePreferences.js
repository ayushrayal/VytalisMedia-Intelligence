import { DEFAULT_CREATIVE_CARD_PREFERENCES } from "../features/meta/config/creativeKpis.config.js";

const STORAGE_KEY_PREFIX = "vytalis_creative_card_preferences";

/**
 * Constructs a scoped localStorage key if scopeId (userId or accountId) is provided.
 */
export const getStorageKey = (scopeId = null) => {
  if (scopeId && typeof scopeId === "string" && scopeId.trim() !== "") {
    return `${STORAGE_KEY_PREFIX}_${scopeId.trim()}`;
  }
  return STORAGE_KEY_PREFIX;
};

/**
 * Parses raw JSON string and fills missing fields with defaults safely for backward compatibility.
 */
const parseAndNormalizePreferences = (jsonStr) => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_CREATIVE_CARD_PREFERENCES;
    }

    const primaryMetrics = Array.isArray(parsed.primaryMetrics) && parsed.primaryMetrics.length > 0
      ? parsed.primaryMetrics.slice(0, 4)
      : (Array.isArray(parsed.primaryKpis) && parsed.primaryKpis.length > 0
          ? parsed.primaryKpis.slice(0, 4)
          : DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics);

    const videoMetrics = Array.isArray(parsed.videoMetrics) && parsed.videoMetrics.length > 0
      ? parsed.videoMetrics.slice(0, 2)
      : DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics;

    const showFacebookLink = parsed.showFacebookLink !== undefined
      ? Boolean(parsed.showFacebookLink)
      : DEFAULT_CREATIVE_CARD_PREFERENCES.showFacebookLink;

    const showInstagramLink = parsed.showInstagramLink !== undefined
      ? Boolean(parsed.showInstagramLink)
      : DEFAULT_CREATIVE_CARD_PREFERENCES.showInstagramLink;

    const showHookHoldRates = parsed.showHookHoldRates !== undefined
      ? Boolean(parsed.showHookHoldRates)
      : DEFAULT_CREATIVE_CARD_PREFERENCES.showHookHoldRates;

    const winningRoasThreshold = parsed.winningRoasThreshold !== undefined && !isNaN(Number(parsed.winningRoasThreshold))
      ? Number(parsed.winningRoasThreshold)
      : DEFAULT_CREATIVE_CARD_PREFERENCES.winningRoasThreshold;

    const poorRoasThreshold = parsed.poorRoasThreshold !== undefined && !isNaN(Number(parsed.poorRoasThreshold))
      ? Number(parsed.poorRoasThreshold)
      : DEFAULT_CREATIVE_CARD_PREFERENCES.poorRoasThreshold;

    return {
      primaryMetrics,
      videoMetrics,
      showFacebookLink,
      showInstagramLink,
      showHookHoldRates,
      winningRoasThreshold,
      poorRoasThreshold,
    };
  } catch (e) {
    return DEFAULT_CREATIVE_CARD_PREFERENCES;
  }
};

/**
 * Safely reads and validates creative card KPI preferences from localStorage.
 * Returns saved preferences on frame 1, falling back to defaults if no saved preferences exist.
 */
export const getCreativePreferences = (scopeId = null) => {
  try {
    const key = getStorageKey(scopeId);
    const raw = localStorage.getItem(key);

    if (!raw) {
      if (scopeId) {
        const unscopedRaw = localStorage.getItem(STORAGE_KEY_PREFIX);
        if (unscopedRaw) {
          return parseAndNormalizePreferences(unscopedRaw);
        }
      }
      return DEFAULT_CREATIVE_CARD_PREFERENCES;
    }

    return parseAndNormalizePreferences(raw);
  } catch (err) {
    console.warn("[creativePreferences] Failed to load preferences from localStorage:", err);
    return DEFAULT_CREATIVE_CARD_PREFERENCES;
  }
};

/**
 * Safely persists creative card KPI preferences to localStorage.
 */
export const saveCreativePreferences = (preferences, scopeId = null) => {
  try {
    if (!preferences || typeof preferences !== "object") return;

    const normalized = {
      primaryMetrics: Array.isArray(preferences.primaryMetrics) ? preferences.primaryMetrics.slice(0, 4) : DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics,
      videoMetrics: Array.isArray(preferences.videoMetrics) ? preferences.videoMetrics.slice(0, 2) : DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics,
      showFacebookLink: preferences.showFacebookLink !== undefined ? Boolean(preferences.showFacebookLink) : true,
      showInstagramLink: preferences.showInstagramLink !== undefined ? Boolean(preferences.showInstagramLink) : true,
      showHookHoldRates: preferences.showHookHoldRates !== undefined ? Boolean(preferences.showHookHoldRates) : true,
      winningRoasThreshold: preferences.winningRoasThreshold !== undefined && !isNaN(Number(preferences.winningRoasThreshold))
        ? Number(preferences.winningRoasThreshold)
        : DEFAULT_CREATIVE_CARD_PREFERENCES.winningRoasThreshold,
      poorRoasThreshold: preferences.poorRoasThreshold !== undefined && !isNaN(Number(preferences.poorRoasThreshold))
        ? Number(preferences.poorRoasThreshold)
        : DEFAULT_CREATIVE_CARD_PREFERENCES.poorRoasThreshold,
    };

    const key = getStorageKey(scopeId);
    localStorage.setItem(key, JSON.stringify(normalized));
    localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(normalized));

    return normalized;
  } catch (err) {
    console.warn("[creativePreferences] Failed to save preferences to localStorage:", err);
  }
};

/**
 * Removes creative card KPI preferences from localStorage.
 */
export const clearCreativePreferences = (scopeId = null) => {
  try {
    const key = getStorageKey(scopeId);
    localStorage.removeItem(key);
    localStorage.removeItem(STORAGE_KEY_PREFIX);
  } catch (err) {
    console.warn("[creativePreferences] Failed to clear preferences from localStorage:", err);
  }
};

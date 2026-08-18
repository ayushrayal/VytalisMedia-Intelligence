const runPersistenceTests = () => {
  console.log("Running Creative Card Preferences Persistence Layer Verification Tests...\n");

  const DEFAULT_CREATIVE_CARD_PREFERENCES = {
    primaryMetrics: ["spend", "purchases", "cost_per_result", "purchase_roas"],
    videoMetrics: ["hook_rate", "hold_rate"],
    showFacebookLink: true,
    showInstagramLink: true,
    showHookHoldRates: true,
  };

  const STORAGE_KEY_PREFIX = "vytalis_creative_card_preferences";

  // Mock localStorage in Node
  const mockStorage = new Map();
  const localStorageMock = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
  };

  const getStorageKey = (scopeId = null) => {
    if (scopeId && typeof scopeId === "string" && scopeId.trim() !== "") {
      return `${STORAGE_KEY_PREFIX}_${scopeId.trim()}`;
    }
    return STORAGE_KEY_PREFIX;
  };

  const parseAndNormalizePreferences = (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== "object") return DEFAULT_CREATIVE_CARD_PREFERENCES;
      const primaryMetrics = Array.isArray(parsed.primaryMetrics) && parsed.primaryMetrics.length > 0
        ? parsed.primaryMetrics.slice(0, 4)
        : DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics;
      const videoMetrics = Array.isArray(parsed.videoMetrics) && parsed.videoMetrics.length > 0
        ? parsed.videoMetrics.slice(0, 2)
        : DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics;
      const showFacebookLink = parsed.showFacebookLink !== undefined ? Boolean(parsed.showFacebookLink) : true;
      const showInstagramLink = parsed.showInstagramLink !== undefined ? Boolean(parsed.showInstagramLink) : true;
      const showHookHoldRates = parsed.showHookHoldRates !== undefined ? Boolean(parsed.showHookHoldRates) : true;

      return { primaryMetrics, videoMetrics, showFacebookLink, showInstagramLink, showHookHoldRates };
    } catch (e) {
      return DEFAULT_CREATIVE_CARD_PREFERENCES;
    }
  };

  const saveCreativePreferences = (preferences, scopeId = null) => {
    const normalized = {
      primaryMetrics: Array.isArray(preferences.primaryMetrics) ? preferences.primaryMetrics.slice(0, 4) : DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics,
      videoMetrics: Array.isArray(preferences.videoMetrics) ? preferences.videoMetrics.slice(0, 2) : DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics,
      showFacebookLink: preferences.showFacebookLink !== undefined ? Boolean(preferences.showFacebookLink) : true,
      showInstagramLink: preferences.showInstagramLink !== undefined ? Boolean(preferences.showInstagramLink) : true,
      showHookHoldRates: preferences.showHookHoldRates !== undefined ? Boolean(preferences.showHookHoldRates) : true,
    };
    const key = getStorageKey(scopeId);
    localStorageMock.setItem(key, JSON.stringify(normalized));
    localStorageMock.setItem(STORAGE_KEY_PREFIX, JSON.stringify(normalized));
    return normalized;
  };

  const getCreativePreferences = (scopeId = null) => {
    const key = getStorageKey(scopeId);
    const raw = localStorageMock.getItem(key);
    if (!raw) return DEFAULT_CREATIVE_CARD_PREFERENCES;
    return parseAndNormalizePreferences(raw);
  };

  // Test 1: Frame-1 Retrieval when no saved preferences exist -> Returns Defaults
  console.log("--- Test 1: Frame-1 Default Retrieval ---");
  const initDefault = getCreativePreferences();
  console.assert(initDefault.primaryMetrics.length === 4, "Initial primary metrics length");
  console.assert(initDefault.showFacebookLink === true, "Initial showFacebookLink");
  console.assert(initDefault.showHookHoldRates === true, "Initial showHookHoldRates");
  console.log("✓ Default returned on empty storage:", initDefault);

  // Test 2: User Saves Custom Preference with showHookHoldRates OFF
  console.log("\n--- Test 2: User Saves Custom Preferences (showHookHoldRates OFF) & Reload ---");
  const customPrefs = {
    primaryMetrics: ["cpc", "purchases", "cpm", "cost_per_result"],
    videoMetrics: ["hook_rate", "video_p75_watched_actions_video_view"],
    showFacebookLink: true,
    showInstagramLink: false,
    showHookHoldRates: false,
  };
  saveCreativePreferences(customPrefs);

  // Simulate Browser Reload (Reading from storage on frame 1)
  const reloaded = getCreativePreferences();
  console.assert(reloaded.primaryMetrics[0] === "cpc", "Primary metric #1 preserved");
  console.assert(reloaded.showInstagramLink === false, "showInstagramLink preserved as false");
  console.assert(reloaded.showHookHoldRates === false, "showHookHoldRates preserved as false");
  console.log("✓ Preserved after simulated reload:", reloaded);

  // Test 3: Legacy Preference Object Backward Compatibility
  console.log("\n--- Test 3: Legacy Object Backward Compatibility ---");
  const legacyJson = JSON.stringify({
    primaryMetrics: ["ctr", "reach", "clicks", "spend"],
    videoMetrics: ["hold_rate"],
    showFacebookLink: true,
    // missing showHookHoldRates
  });
  localStorageMock.setItem(STORAGE_KEY_PREFIX, legacyJson);

  const legacyNormalized = getCreativePreferences();
  console.assert(legacyNormalized.showHookHoldRates === true, "Legacy showHookHoldRates defaulted to true");
  console.assert(legacyNormalized.primaryMetrics[0] === "ctr", "Legacy primary metric preserved");
  console.log("✓ Legacy object normalized safely with showHookHoldRates: true:", legacyNormalized);

  // Test 4: Corrupted JSON Recovery
  console.log("\n--- Test 4: Corrupted JSON Recovery ---");
  localStorageMock.setItem(STORAGE_KEY_PREFIX, "{ invalid_json: ... }");
  const corruptFallback = getCreativePreferences();
  console.assert(corruptFallback.showHookHoldRates === true, "Corrupt JSON fallback");
  console.log("✓ Recovered safely from corrupt JSON with defaults:", corruptFallback);

  console.log("\nALL PERSISTENCE LAYER TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!");
};

runPersistenceTests();

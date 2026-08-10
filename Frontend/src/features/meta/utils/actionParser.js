/**
 * Helper to safely extract numeric values from Meta API action arrays.
 * 
 * Meta API often returns metrics like:
 * "video_play_actions": [{ "action_type": "video_view", "value": "1045" }]
 * or direct numbers/strings.
 */
export const getActionValue = (action) => {
  if (action === null || action === undefined) return 0;

  // Direct number
  if (typeof action === "number") return action;

  // Direct string number
  if (typeof action === "string") {
    const parsed = parseFloat(action);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Array of action objects
  if (Array.isArray(action)) {
    if (action.length === 0) return 0;
    const first = action[0];
    if (first && first.value !== undefined) {
      const parsed = parseFloat(first.value);
      return isNaN(parsed) ? 0 : parsed;
    }
  }

  // Single object with value
  if (typeof action === "object" && action.value !== undefined) {
    const parsed = parseFloat(action.value);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

/**
 * Calculates CPM (Cost Per Mille / 1000 Impressions) if not directly available.
 */
export const calculateCpm = (spend, impressions) => {
  const numSpend = Number(spend || 0);
  const numImp = Number(impressions || 0);
  if (numImp <= 0) return 0;
  return (numSpend / numImp) * 1000;
};

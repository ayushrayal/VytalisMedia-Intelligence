/**
 * Date Filter utility for Vytalis Intelligence analytics requests.
 * Normalizes date parameters according to the backend contract.
 * 
 * CRITICAL RULE:
 * Never send datePreset together with dateFrom/dateTo.
 * The output must strictly be { datePreset } OR { dateFrom, dateTo }.
 */

/**
 * Formats a Date object as YYYY-MM-DD strictly.
 */
export const formatDateISO = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Returns today's date in YYYY-MM-DD format.
 */
export const getTodayISO = () => {
  return formatDateISO(new Date());
};

/**
 * Returns yesterday's date in YYYY-MM-DD format.
 */
export const getYesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateISO(d);
};

/**
 * Builds normalized date parameter object for Meta Analytics backend API.
 * 
 * @param {Object} dateFilter - Date filter selection object
 * @param {string} [dateFilter.type] - "preset" or "custom"
 * @param {string} [dateFilter.value] - Preset identifier (e.g. "last_7d", "last_30d", "this_month", "today", "yesterday")
 * @param {string} [dateFilter.dateFrom] - Start date YYYY-MM-DD
 * @param {string} [dateFilter.dateTo] - End date YYYY-MM-DD
 * @returns {Object} { datePreset } OR { dateFrom, dateTo }
 */
export const buildDateParams = (dateFilter) => {
  if (!dateFilter) {
    return { datePreset: "last_7d" };
  }

  // Handle explicit Preset mode
  if (dateFilter.type === "preset" || (dateFilter.value && !dateFilter.dateFrom && !dateFilter.dateTo)) {
    const val = dateFilter.value || dateFilter.preset;
    
    // Convert 'today' selection to custom YYYY-MM-DD range per backend contract
    if (val === "today") {
      const today = getTodayISO();
      return { dateFrom: today, dateTo: today };
    }

    // Convert 'yesterday' selection to custom YYYY-MM-DD range per backend contract
    if (val === "yesterday") {
      const yesterday = getYesterdayISO();
      return { dateFrom: yesterday, dateTo: yesterday };
    }

    return { datePreset: val || "last_7d" };
  }

  // Handle Custom Date Range mode
  if (dateFilter.type === "custom" || (dateFilter.dateFrom && dateFilter.dateTo)) {
    const fromStr = formatDateISO(dateFilter.dateFrom) || dateFilter.dateFrom;
    const toStr = formatDateISO(dateFilter.dateTo) || dateFilter.dateTo;
    
    return {
      dateFrom: fromStr,
      dateTo: toStr,
    };
  }

  // Default fallback
  return { datePreset: "last_7d" };
};

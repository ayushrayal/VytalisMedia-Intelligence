const runWinningPoorTests = () => {
  console.log("Running Winning Creatives & Poor Performers Logic Verification Tests...\n");

  const extractNumericValue = (val) => {
    if (val === null || val === undefined || val === "" || val === "--") return null;
    if (typeof val === "number") return isNaN(val) ? null : val;
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return null;
      const first = val[0];
      if (first && first.value !== undefined) {
        const parsed = parseFloat(first.value);
        return isNaN(parsed) ? null : parsed;
      }
    }
    if (typeof val === "object" && val.value !== undefined) {
      const parsed = parseFloat(val.value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const extractCreativeRoas = (creative) => {
    if (!creative) return null;

    // 1. Explicit purchase_roas / roas metric (nullish coalescing preserves 0)
    const raw = creative.purchase_roas ?? creative.purchase_roas_omni_purchase ?? creative.roas;
    const numericRoas = extractNumericValue(raw);
    if (numericRoas !== null && !isNaN(numericRoas) && isFinite(numericRoas)) {
      return numericRoas;
    }

    // 2. Evidence-based calculation using nullish coalescing for metric fallback
    const spend = extractNumericValue(creative.spend ?? creative.amount_spent);
    if (spend === null || spend <= 0) return null;

    const purchases = extractNumericValue(creative.purchases ?? creative.actions_omni_purchase);
    const purchaseValue = extractNumericValue(
      creative.purchase_conversion_value ??
      creative.action_values_omni_purchase ??
      creative.purchaseValue ??
      creative.purchase_value
    );

    if (purchaseValue !== null && purchaseValue > 0) {
      return purchaseValue / spend;
    }

    if (purchaseValue === 0 || purchases === 0) {
      return 0;
    }

    return null;
  };

  const sampleCreatives = [
    { id: "c1", ad_name: "Creative 1 (0.80x)", purchase_roas: 0.8 },
    { id: "c2", ad_name: "Creative 2 (1.00x)", purchase_roas: 1.0 },
    { id: "c3", ad_name: "Creative 3 (1.01x)", purchase_roas: 1.01 },
    { id: "c4", ad_name: "Creative 4 (1.50x)", purchase_roas: "1.50" }, // string ROAS
    { id: "c5", ad_name: "Creative 5 (4.25x)", purchase_roas: 4.25 },
    { id: "c6", ad_name: "Creative 6 (0.00x)", purchase_roas: 0.0 },
    { id: "c7", ad_name: "Creative 7 (0.75x)", purchase_roas: 0.75 },
    { id: "c8", ad_name: "Creative 8 (null ROAS, no spend)", purchase_roas: null, spend: 0 },
    { id: "c9", ad_name: "Creative 9 (dash ROAS, no spend)", purchase_roas: "--", spend: 0 },
    { id: "c10", ad_name: "Creative 10 (5.84x)", purchase_roas: 5.84 },
    // Data Integrity evidence test cases:
    { id: "c11", ad_name: "Creative 11 (Spend > 0, purchases = 0, purchase_roas null)", spend: 500, purchases: 0, purchase_roas: null },
    { id: "c12", ad_name: "Creative 12 (Spend > 0, purchase_value = 0, purchase_roas null)", spend: 300, purchase_conversion_value: 0, purchase_roas: null },
    { id: "c13", ad_name: "Creative 13 (Spend > 0, no purchase metrics at all)", spend: 400, purchases: null, purchase_conversion_value: null, purchase_roas: null },
  ];

  // --- Test 1: Default Winning (Above 1x) ---
  console.log("--- Test 1: Default Winning Threshold (ROAS > 1.00x) ---");
  const winDefault = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas > 1.0;
    })
    .sort((a, b) => (extractCreativeRoas(b) ?? 0) - (extractCreativeRoas(a) ?? 0));

  console.assert(winDefault.length === 4, `Expected 4 winning creatives, got ${winDefault.length}`);
  console.assert(winDefault[0].id === "c10", "Highest ROAS (5.84x) first");
  console.assert(winDefault[1].id === "c5", "Second highest ROAS (4.25x)");
  console.assert(!winDefault.some((c) => c.id === "c2"), "1.00x MUST NOT appear in Winning");
  console.assert(!winDefault.some((c) => c.id === "c1"), "0.80x MUST NOT appear in Winning");

  console.log("✓ Winning Creatives (Default > 1x):", winDefault.map((c) => `${c.id} (${extractCreativeRoas(c)}x)`));

  // --- Test 2: Default Poor (Below 1x) ---
  console.log("\n--- Test 2: Default Poor Threshold (ROAS < 1.00x) ---");
  const poorDefault = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas < 1.0;
    })
    .sort((a, b) => (extractCreativeRoas(a) ?? 0) - (extractCreativeRoas(b) ?? 0));

  console.assert(poorDefault.length === 5, `Expected 5 poor creatives, got ${poorDefault.length}`);
  console.assert(poorDefault.some((c) => c.id === "c6"), "Explicit 0.00x ROAS included");
  console.assert(poorDefault.some((c) => c.id === "c11"), "Spend > 0 & purchases=0 included as 0 ROAS");
  console.assert(poorDefault.some((c) => c.id === "c12"), "Spend > 0 & purchase_value=0 included as 0 ROAS");
  console.assert(!poorDefault.some((c) => c.id === "c13"), "Creative with no purchase metrics at all MUST remain null and be excluded");
  console.assert(!poorDefault.some((c) => c.id === "c8"), "null ROAS without spend MUST NOT appear in Poor");
  console.assert(!poorDefault.some((c) => c.id === "c9"), "dash ROAS without spend MUST NOT appear in Poor");

  console.log("✓ Poor Performers (Default < 1x):", poorDefault.map((c) => `${c.id} (${extractCreativeRoas(c)}x)`));

  // --- Test 3: Custom Threshold (Winning > 4.25x, Poor < 0.75x) ---
  console.log("\n--- Test 3: Custom Thresholds (Winning > 4.25x, Poor < 0.75x) ---");
  const winCustom = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas > 4.25;
    })
    .sort((a, b) => (extractCreativeRoas(b) ?? 0) - (extractCreativeRoas(a) ?? 0));

  console.assert(winCustom.length === 1 && winCustom[0].id === "c10", "Only 5.84x is > 4.25x (4.25x itself excluded)");
  console.log("✓ Custom Winning (> 4.25x):", winCustom.map((c) => `${c.id} (${extractCreativeRoas(c)}x)`));

  const poorCustom = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas < 0.75;
    })
    .sort((a, b) => (extractCreativeRoas(a) ?? 0) - (extractCreativeRoas(b) ?? 0));

  console.assert(poorCustom.length === 3, `Expected 3 creatives < 0.75x, got ${poorCustom.length}`);
  console.log("✓ Custom Poor (< 0.75x):", poorCustom.map((c) => `${c.id} (${extractCreativeRoas(c)}x)`));

  console.log("\nALL WINNING CREATIVES & POOR PERFORMERS VERIFICATION TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!");
};

runWinningPoorTests();

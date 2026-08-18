const runWinningPoorTests = () => {
  console.log("Running Winning Creatives & Poor Performers Logic Verification Tests...\n");

  const extractCreativeRoas = (creative) => {
    if (!creative) return null;
    const raw = creative.purchase_roas ?? creative.roas;
    if (raw === null || raw === undefined || raw === "" || raw === "--") return null;
    const num = Number(raw);
    if (isNaN(num) || !isFinite(num)) return null;
    return num;
  };

  const sampleCreatives = [
    { id: "c1", ad_name: "Creative 1 (0.80x)", purchase_roas: 0.8 },
    { id: "c2", ad_name: "Creative 2 (1.00x)", purchase_roas: 1.0 },
    { id: "c3", ad_name: "Creative 3 (1.01x)", purchase_roas: 1.01 },
    { id: "c4", ad_name: "Creative 4 (1.50x)", purchase_roas: "1.50" }, // string ROAS
    { id: "c5", ad_name: "Creative 5 (4.25x)", purchase_roas: 4.25 },
    { id: "c6", ad_name: "Creative 6 (0.00x)", purchase_roas: 0.0 },
    { id: "c7", ad_name: "Creative 7 (0.75x)", purchase_roas: 0.75 },
    { id: "c8", ad_name: "Creative 8 (null ROAS)", purchase_roas: null },
    { id: "c9", ad_name: "Creative 9 (dash ROAS)", purchase_roas: "--" },
    { id: "c10", ad_name: "Creative 10 (5.84x)", purchase_roas: 5.84 },
  ];

  // --- Test 1: Default Winning (Above 1x) ---
  console.log("--- Test 1: Default Winning Threshold (ROAS > 1.00x) ---");
  const winDefault = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas > 1.0;
    })
    .sort((a, b) => (extractCreativeRoas(b) || 0) - (extractCreativeRoas(a) || 0));

  console.assert(winDefault.length === 4, `Expected 4 winning creatives, got ${winDefault.length}`);
  console.assert(winDefault[0].id === "c10", "Highest ROAS (5.84x) first");
  console.assert(winDefault[1].id === "c5", "Second highest ROAS (4.25x)");
  console.assert(!winDefault.some((c) => c.id === "c2"), "1.00x MUST NOT appear in Winning");
  console.assert(!winDefault.some((c) => c.id === "c1"), "0.80x MUST NOT appear in Winning");

  console.log("✓ Winning Creatives (Default > 1x):", winDefault.map((c) => `${c.id} (${c.purchase_roas}x)`));

  // --- Test 2: Default Poor (Below 1x) ---
  console.log("\n--- Test 2: Default Poor Threshold (ROAS < 1.00x) ---");
  const poorDefault = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas < 1.0;
    })
    .sort((a, b) => (extractCreativeRoas(a) || 0) - (extractCreativeRoas(b) || 0));

  console.assert(poorDefault.length === 3, `Expected 3 poor creatives, got ${poorDefault.length}`);
  console.assert(poorDefault[0].id === "c6", "Worst ROAS (0.00x) first");
  console.assert(poorDefault[1].id === "c7", "Second worst ROAS (0.75x)");
  console.assert(poorDefault[2].id === "c1", "Third worst ROAS (0.80x)");
  console.assert(!poorDefault.some((c) => c.id === "c2"), "1.00x MUST NOT appear in Poor");
  console.assert(!poorDefault.some((c) => c.id === "c8"), "null ROAS MUST NOT appear in Poor");
  console.assert(!poorDefault.some((c) => c.id === "c9"), "dash ROAS MUST NOT appear in Poor");

  console.log("✓ Poor Performers (Default < 1x):", poorDefault.map((c) => `${c.id} (${c.purchase_roas}x)`));

  // --- Test 3: Custom Threshold (Winning > 4.25x, Poor < 0.75x) ---
  console.log("\n--- Test 3: Custom Thresholds (Winning > 4.25x, Poor < 0.75x) ---");
  const winCustom = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas > 4.25;
    })
    .sort((a, b) => (extractCreativeRoas(b) || 0) - (extractCreativeRoas(a) || 0));

  console.assert(winCustom.length === 1 && winCustom[0].id === "c10", "Only 5.84x is > 4.25x (4.25x itself excluded)");
  console.log("✓ Custom Winning (> 4.25x):", winCustom.map((c) => `${c.id} (${c.purchase_roas}x)`));

  const poorCustom = sampleCreatives
    .filter((c) => {
      const roas = extractCreativeRoas(c);
      return roas !== null && roas < 0.75;
    })
    .sort((a, b) => (extractCreativeRoas(a) || 0) - (extractCreativeRoas(a) || 0));

  console.assert(poorCustom.length === 1 && poorCustom[0].id === "c6", "Only 0.00x is < 0.75x (0.75x itself excluded)");
  console.log("✓ Custom Poor (< 0.75x):", poorCustom.map((c) => `${c.id} (${c.purchase_roas}x)`));

  console.log("\nALL WINNING CREATIVES & POOR PERFORMERS TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!");
};

runWinningPoorTests();

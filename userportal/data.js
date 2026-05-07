// Demo data for ShippingCow

window.SC_DATA = (() => {
  const rng = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const r = rng(42);

  // 500 shipments over last 90 days, origin 30301 Atlanta, GA
  const carriers = [
    { name: "FedEx Ground", weight: 0.45, retail: 14.20, our: 9.80 },
    { name: "FedEx Home", weight: 0.15, retail: 12.50, our: 8.60 },
    { name: "UPS Ground", weight: 0.30, retail: 13.90, our: 9.60 },
    { name: "USPS Priority", weight: 0.10, retail: 11.20, our: 7.90 },
  ];
  const platforms = [
    { name: "Amazon", weight: 0.55 },
    { name: "Shopify", weight: 0.30 },
    { name: "Walmart", weight: 0.10 },
    { name: "eBay", weight: 0.05 },
  ];

  // Top destination states by share (East-skewed)
  const destStates = [
    { abbr: "GA", share: 0.10, zone: 2 },
    { abbr: "FL", share: 0.10, zone: 3 },
    { abbr: "NY", share: 0.09, zone: 5 },
    { abbr: "TX", share: 0.08, zone: 5 },
    { abbr: "PA", share: 0.07, zone: 4 },
    { abbr: "NC", share: 0.07, zone: 3 },
    { abbr: "OH", share: 0.06, zone: 4 },
    { abbr: "IL", share: 0.06, zone: 5 },
    { abbr: "VA", share: 0.05, zone: 4 },
    { abbr: "TN", share: 0.04, zone: 3 },
    { abbr: "MA", share: 0.04, zone: 5 },
    { abbr: "MI", share: 0.04, zone: 5 },
    { abbr: "NJ", share: 0.04, zone: 5 },
    { abbr: "CA", share: 0.04, zone: 7 },
    { abbr: "WA", share: 0.02, zone: 8 },
    { abbr: "AZ", share: 0.02, zone: 7 },
    { abbr: "CO", share: 0.02, zone: 6 },
    { abbr: "OR", share: 0.01, zone: 8 },
    { abbr: "MN", share: 0.01, zone: 5 },
    { abbr: "WI", share: 0.01, zone: 5 },
    { abbr: "MO", share: 0.01, zone: 4 },
    { abbr: "AL", share: 0.01, zone: 3 },
    { abbr: "SC", share: 0.005, zone: 3 },
    { abbr: "KY", share: 0.005, zone: 4 },
  ];

  // Cost stack: 7 stages
  const costStack = [
    { stage: "Inbound trucking",  you: 0.42, bench: 0.34, ourRate: 0.31 },
    { stage: "Inbound handling",  you: 0.38, bench: 0.30, ourRate: 0.26 },
    { stage: "Putaway",           you: 0.51, bench: 0.42, ourRate: 0.38 },
    { stage: "Storage",           you: 0.78, bench: 0.61, ourRate: 0.55 },
    { stage: "Fulfillment pick",  you: 1.85, bench: 1.62, ourRate: 1.40 },
    { stage: "Last mile",         you: 8.94, bench: 7.10, ourRate: 6.30 },
    { stage: "Aftersale (returns)", you: 1.12, bench: 0.84, ourRate: 0.72 },
  ];
  // values are $/shipment

  const totalShip = 500;
  const periodTotalCost = costStack.reduce((s, x) => s + x.you, 0) * totalShip;
  const benchTotalCost  = costStack.reduce((s, x) => s + x.bench, 0) * totalShip;

  // Zone distribution (1..8)
  const zones = [
    { zone: 1, count: 30 },
    { zone: 2, count: 55 },
    { zone: 3, count: 90 },
    { zone: 4, count: 120 },
    { zone: 5, count: 110 },
    { zone: 6, count: 55 },
    { zone: 7, count: 25 },
    { zone: 8, count: 15 },
  ];
  const totalShipments = zones.reduce((s, x) => s + x.count, 0);
  const weightedZone = zones.reduce((s, x) => s + x.zone * x.count, 0) / totalShipments;
  const pctZone6plus = (zones.filter(z => z.zone >= 6).reduce((s,x)=>s+x.count,0) / totalShipments) * 100;
  const pctZone4plus = (zones.filter(z => z.zone >= 4).reduce((s,x)=>s+x.count,0) / totalShipments) * 100;

  // Dim overcharge: ~35% on dim, avg $3.85 over per shipment on those, total impact
  const dimSharePct = 35;
  const dimOverchargeAvg = 3.85;
  const dimOverchargeTotal = totalShip * (dimSharePct/100) * dimOverchargeAvg;
  const dimInflate = 28; // % "you're paying X% more" — drives cow inflation

  // Health Score 10-dim
  const health = [
    { dim: "On-time rate",         weight: 18, score: 72 },
    { dim: "Carrier concentration", weight: 12, score: 48 },
    { dim: "Zone efficiency",       weight: 15, score: 54 },
    { dim: "Dim waste rate",        weight: 10, score: 41 },
    { dim: "Cost/unit trend",       weight: 8,  score: 62 },
    { dim: "Inbound freight",       weight: 10, score: 65 },
    { dim: "Storage efficiency",    weight: 10, score: 58 },
    { dim: "Aged inventory",        weight: 7,  score: 50 },
    { dim: "Return rate",           weight: 5,  score: 64 },
    { dim: "Refurb recovery",       weight: 5,  score: 55 },
  ];
  const healthComposite = Math.round(health.reduce((s,x)=>s+x.score*x.weight,0)/100);

  // Spend by carrier
  const spendByCarrier = carriers.map(c => {
    const ships = Math.round(totalShip * c.weight);
    return {
      carrier: c.name,
      shipments: ships,
      retailRate: c.retail,
      ourRate: c.our,
      yourRate: c.retail * (0.97 + r() * 0.06),
      totalSpend: ships * c.retail,
    };
  });

  // Spend by platform across 6 months
  const months = ["Nov","Dec","Jan","Feb","Mar","Apr"];
  const platformSpendSeries = months.map((m, i) => {
    const base = 22000 + i * 1800 + (r() * 4000);
    return {
      month: m,
      Amazon: Math.round(base * 0.55),
      Shopify: Math.round(base * 0.30),
      Walmart: Math.round(base * 0.10),
      eBay: Math.round(base * 0.05),
    };
  });

  // Pain points
  const painPoints = [
    { p: "Dim overcharges on bulky SKUs",          impact: 23080, action: "Switch 14 SKUs to right-sized boxes",   sev: "critical" },
    { p: "Zone 6+ over-indexing on West Coast",    impact: 18420, action: "Add second node in Reno, NV (89501)",   sev: "critical" },
    { p: "FedEx retail rates vs negotiated",       impact: 15660, action: "Move to ShippingCow's negotiated FedEx", sev: "warning" },
    { p: "Storage fees on aged inventory",         impact:  9240, action: "Liquidate 38 SKUs aged 180+ days",      sev: "warning" },
    { p: "Return-to-stock recovery rate",          impact:  4810, action: "Re-grade refurb pricing tier",          sev: "opportunity" },
    { p: "Inbound putaway fees from LCL",          impact:  3120, action: "Consolidate to 2 inbound shipments/wk", sev: "opportunity" },
  ];

  // Daily Insights (6 cards)
  const insights = [
    {
      cat: "Trade", catLabel: "Trade", color: "purple",
      sev: "critical",
      head: "Section 301 list 4A tariffs raised to 27.5% on small-appliance HTS codes",
      body: "USTR confirmed the rate hike effective May 12, 2026. Three of your top 5 SKUs (HTS 8516.71, 8509.40) are on the affected list, including your espresso machine line.",
      means: "Your landed cost on imports from China rises ~$3.40/unit on those SKUs. Pulling forward your Q3 PO before May 12 could save roughly $11,800 on the next inbound.",
      impact: "+$11.8K exposure",
      sources: "USTR (Apr 28) · Reuters (Apr 28)",
      ts: "2 hours ago",
    },
    {
      cat: "Carrier", catLabel: "Carrier", color: "red",
      sev: "warning",
      head: "FedEx announces 5.9% GRI on Ground & Home Delivery, effective June 2",
      body: "Annual general rate increase published this morning. Surcharges on residential and DAS lanes also rising. Effective for shipments tendered on or after Mon June 2.",
      means: "Based on your last 90 days, this works out to about $1,840/month in additional spend. Locking in ShippingCow's negotiated FedEx rate before June 2 holds your current pricing.",
      impact: "+$1.8K/mo exposure",
      sources: "FedEx Press Room (Apr 30) · FreightWaves (Apr 30)",
      ts: "5 hours ago",
    },
    {
      cat: "Internal", catLabel: "Your Data", color: "yellow",
      sev: "warning",
      head: "Zone 6+ share rose 7 points this month",
      body: "Your zone 6+ shipments climbed from 14.2% to 21.4% over the last 30 days. The shift is concentrated in California, Washington, and Oregon orders from your Shopify storefront.",
      means: "At your current volume, that's roughly $2,610/month in extra last-mile cost vs. last quarter. A 2-node setup with a Reno warehouse would bring it back to 13%.",
      impact: "+$2.6K/mo",
      sources: "Internal pattern detection (90d)",
      ts: "Yesterday, 5:30 AM",
    },
    {
      cat: "Platform", catLabel: "Platform", color: "amber",
      sev: "info",
      head: "Amazon raises FBA storage utilization fee threshold for Q3",
      body: "Sellers exceeding 26 weeks of stock will see a higher storage utilization surcharge starting July 1. Your current IPI score is 542 — above the floor — but seven of your SKUs are flagged at 32+ weeks of supply.",
      means: "Trim those seven SKUs to under 26 weeks before July to avoid the new surcharge. Estimated avoided cost: $1,460/quarter.",
      impact: "+$1.5K/qtr",
      sources: "Amazon Seller Central (Apr 26) · Marketplace Pulse (Apr 27)",
      ts: "Yesterday",
    },
    {
      cat: "Logistics", catLabel: "Logistics", color: "teal",
      sev: "opportunity",
      head: "Port of Savannah congestion clearing — transit times back to baseline",
      body: "GPA reports container dwell time down to 2.8 days, the lowest since November. Inbound trucking spot rates from Savannah to Atlanta dropped 6% week-over-week.",
      means: "If you have inbound bookings on hold, this is a good window. Your typical inbound trucking spend is $4,210/load — likely $250 cheaper this week.",
      impact: "−$250/load",
      sources: "Georgia Ports Authority (Apr 29) · DAT Freight (Apr 29)",
      ts: "Yesterday",
    },
    {
      cat: "Tip", catLabel: "Weekly Tip", color: "green",
      sev: "opportunity",
      head: "Your bulky SKUs are paying dim weight — try right-sized boxes",
      body: "Across 174 of your shipments last month, billable weight exceeded actual weight by an average of 2.1 lb. The pattern points to oversized boxes on 14 specific SKUs.",
      means: "Switching those 14 SKUs to dim-optimized cartons would cut about $1,920/month in dim overcharges. Start with SKU GH-4421 — biggest offender at $214/mo.",
      impact: "−$1.9K/mo",
      sources: "Internal pattern detection · ShippingCow Tip Library",
      ts: "Mon, 6:30 AM",
    },
  ];

  // Silo files
  const siloFiles = [
    { name: "shipments_apr2026.xlsx",       schema: "shipments",         rows: 187, size: "78 KB",  ai: false, when: "Today, 8:14 AM" },
    { name: "april_fedex_invoice_clean.xlsx", schema: "shipments",       rows: 342, size: "142 KB", ai: true,  when: "Yesterday, 4:22 PM", from: "april_fedex_invoice.pdf" },
    { name: "products_master.xlsx",         schema: "products",          rows:  89, size: "34 KB",  ai: false, when: "Apr 24" },
    { name: "inbound_q1.xlsx",              schema: "inbound_shipments", rows:  18, size: "12 KB",  ai: false, when: "Apr 18" },
    { name: "returns_mar2026.xlsx",         schema: "returns",           rows:  41, size: "19 KB",  ai: true,  when: "Apr 12", from: "returns_log.csv" },
    { name: "storage_q1_pulled.xlsx",       schema: "storage_records",   rows:  72, size: "31 KB",  ai: true,  when: "Apr 03", from: "amazon_inventory.pdf" },
  ];

  const shipmentsSample = [
    { id: "A1042", date: "2026-04-28", carrier: "FedEx Ground", origin: "30301", dest: "33101", actual_lb: 4.2, billable_lb: 6.8, cost: 12.40, zone: 3, plat: "Amazon" },
    { id: "A1043", date: "2026-04-28", carrier: "UPS Ground",   origin: "30301", dest: "10001", actual_lb: 3.1, billable_lb: 3.5, cost: 11.80, zone: 5, plat: "Shopify" },
    { id: "A1044", date: "2026-04-28", carrier: "FedEx Home",   origin: "30301", dest: "90210", actual_lb: 2.4, billable_lb: 5.6, cost: 18.90, zone: 7, plat: "Amazon" },
    { id: "A1045", date: "2026-04-28", carrier: "USPS Priority",origin: "30301", dest: "60601", actual_lb: 1.8, billable_lb: 2.0, cost:  9.20, zone: 5, plat: "Amazon" },
    { id: "A1046", date: "2026-04-28", carrier: "FedEx Ground", origin: "30301", dest: "30309", actual_lb: 5.2, billable_lb: 5.4, cost:  8.60, zone: 2, plat: "Shopify" },
    { id: "A1047", date: "2026-04-28", carrier: "FedEx Ground", origin: "30301", dest: "78701", actual_lb: 6.1, billable_lb: 9.4, cost: 16.20, zone: 5, plat: "Amazon" },
    { id: "A1048", date: "2026-04-28", carrier: "UPS Ground",   origin: "30301", dest: "98101", actual_lb: 2.9, billable_lb: 6.2, cost: 19.40, zone: 8, plat: "Shopify" },
    { id: "A1049", date: "2026-04-28", carrier: "FedEx Ground", origin: "30301", dest: "27601", actual_lb: 3.4, billable_lb: 3.6, cost:  9.80, zone: 3, plat: "Amazon" },
    { id: "A1050", date: "2026-04-27", carrier: "FedEx Home",   origin: "30301", dest: "02108", actual_lb: 2.2, billable_lb: 4.8, cost: 14.30, zone: 5, plat: "Shopify" },
    { id: "A1051", date: "2026-04-27", carrier: "UPS Ground",   origin: "30301", dest: "44101", actual_lb: 4.6, billable_lb: 4.8, cost: 11.20, zone: 4, plat: "Amazon" },
    { id: "A1052", date: "2026-04-27", carrier: "FedEx Ground", origin: "30301", dest: "85001", actual_lb: 3.0, billable_lb: 7.4, cost: 17.80, zone: 7, plat: "Amazon" },
    { id: "A1053", date: "2026-04-27", carrier: "USPS Priority",origin: "30301", dest: "20001", actual_lb: 1.4, billable_lb: 1.5, cost:  8.40, zone: 4, plat: "Walmart" },
  ];

  // SC optimized zone distribution (avg 3.89) — from multi-node network
  const scZones = [
    { zone: 1, count: 35 },
    { zone: 2, count: 60 },
    { zone: 3, count: 100 },
    { zone: 4, count: 135 },
    { zone: 5, count: 105 },
    { zone: 6, count: 40 },
    { zone: 7, count: 15 },
    { zone: 8, count: 10 },
  ];
  const scAvgZone = 3.89;

  // Zone scenarios by origin ZIP (user zones vary; SC stays optimized)
  const zoneScenarios = {
    "30301": { city: "Atlanta, GA",     userZones: zones, userAvg: weightedZone, scCity: "Dallas, TX (75201)",    scZones, scAvg: 3.89, savings: 9800 },
    "10001": { city: "New York, NY",    userZones: [
      {zone:1,count:60},{zone:2,count:100},{zone:3,count:120},{zone:4,count:90},{zone:5,count:65},{zone:6,count:40},{zone:7,count:15},{zone:8,count:10}
    ], userAvg: 3.41, scCity: "Philadelphia, PA (19103)", scZones: [
      {zone:1,count:80},{zone:2,count:120},{zone:3,count:130},{zone:4,count:95},{zone:5,count:45},{zone:6,count:20},{zone:7,count:6},{zone:8,count:4}
    ], scAvg: 2.88, savings: 7200 },
    "60601": { city: "Chicago, IL",     userZones: [
      {zone:1,count:40},{zone:2,count:75},{zone:3,count:100},{zone:4,count:125},{zone:5,count:100},{zone:6,count:40},{zone:7,count:15},{zone:8,count:5}
    ], userAvg: 3.87, scCity: "Indianapolis, IN (46201)", scZones: [
      {zone:1,count:50},{zone:2,count:90},{zone:3,count:115},{zone:4,count:130},{zone:5,count:80},{zone:6,count:25},{zone:7,count:8},{zone:8,count:2}
    ], scAvg: 3.31, savings: 8400 },
    "77001": { city: "Houston, TX",     userZones: [
      {zone:1,count:35},{zone:2,count:65},{zone:3,count:95},{zone:4,count:115},{zone:5,count:100},{zone:6,count:55},{zone:7,count:25},{zone:8,count:10}
    ], userAvg: 4.07, scCity: "Dallas, TX (75201)",    scZones: [
      {zone:1,count:45},{zone:2,count:80},{zone:3,count:110},{zone:4,count:130},{zone:5,count:90},{zone:6,count:30},{zone:7,count:10},{zone:8,count:5}
    ], scAvg: 3.62, savings: 8900 },
  };

  // Top SKUs by shipment volume with your cost vs SC cost
  const topSkus = [
    { sku: "ESP-4421", name: "Espresso Machine",  ships: 142, yourCost: 18.40, scCost: 12.90 },
    { sku: "BLD-2201", name: "Blender Pro",        ships: 118, yourCost: 15.20, scCost: 10.80 },
    { sku: "VAC-0881", name: "Cordless Vacuum",    ships:  96, yourCost: 22.10, scCost: 15.40 },
    { sku: "FAN-1102", name: "Tower Fan",          ships:  84, yourCost: 12.60, scCost:  9.10 },
    { sku: "COF-3310", name: "Coffee Grinder",     ships:  71, yourCost:  9.80, scCost:  7.20 },
  ];

  // Annual savings estimate (used in yellow gauge + CTAs)
  const annualSavingsEst = 9800;

  return {
    org: { name: "Demo Seller, Inc.", originZip: "30301", originCity: "Atlanta, GA" },
    period: "Last 90 days",
    totalShip,
    periodTotalCost,
    benchTotalCost,
    costStack,
    zones, totalShipments, weightedZone, pctZone6plus, pctZone4plus,
    scZones, scAvgZone,
    zoneScenarios,
    topSkus,
    annualSavingsEst,
    dimSharePct, dimOverchargeAvg, dimOverchargeTotal, dimInflate,
    health, healthComposite,
    spendByCarrier,
    platformSpendSeries,
    painPoints,
    insights,
    destStates,
    siloFiles,
    shipmentsSample,
  };
})();

// ShippingCow — Admin Portal Mock Data

window.ADMIN_DATA = (() => {

  const ORGS = [
    { id:"org-001", name:"Bright Nest Co.",       tier:"bull",  mrr:1290, members:8,  status:"active",   created:"2024-11-03", origin_zip:"30301", shipments_30d:4820 },
    { id:"org-002", name:"Gadget Barn",            tier:"cow",   mrr:399,  members:3,  status:"active",   created:"2025-01-18", origin_zip:"10001", shipments_30d:1230 },
    { id:"org-003", name:"Maple & Stone",          tier:"cow",   mrr:399,  members:2,  status:"active",   created:"2025-02-07", origin_zip:"98101", shipments_30d:980  },
    { id:"org-004", name:"Urban Paw Supply",       tier:"calf",  mrr:0,    members:1,  status:"active",   created:"2025-03-22", origin_zip:"60601", shipments_30d:210  },
    { id:"org-005", name:"Drift & Shore",          tier:"bull",  mrr:1290, members:12, status:"active",   created:"2024-09-14", origin_zip:"33101", shipments_30d:6100 },
    { id:"org-006", name:"Crestfield Labs",        tier:"cow",   mrr:399,  members:4,  status:"suspended",created:"2025-01-05", origin_zip:"02101", shipments_30d:0    },
    { id:"org-007", name:"Pico Commerce",          tier:"calf",  mrr:0,    members:1,  status:"active",   created:"2026-01-10", origin_zip:"77001", shipments_30d:88   },
    { id:"org-008", name:"Verdant Goods",          tier:"cow",   mrr:399,  members:5,  status:"active",   created:"2025-05-30", origin_zip:"85001", shipments_30d:740  },
    { id:"org-009", name:"Blue Anchor Dist.",      tier:"bull",  mrr:1290, members:9,  status:"active",   created:"2024-07-22", origin_zip:"90210", shipments_30d:5560 },
    { id:"org-010", name:"Stackhaus Direct",       tier:"cow",   mrr:399,  members:3,  status:"active",   created:"2025-08-14", origin_zip:"55401", shipments_30d:610  },
    { id:"org-011", name:"Fennec Fulfillment",     tier:"calf",  mrr:0,    members:2,  status:"active",   created:"2026-02-28", origin_zip:"37201", shipments_30d:42   },
    { id:"org-012", name:"Outpost Commerce",       tier:"cow",   mrr:399,  members:6,  status:"deactivated",created:"2024-12-01", origin_zip:"80201", shipments_30d:0  },
  ];

  const USERS = [
    // org-001 Bright Nest Co.
    { id:"usr-001", name:"Jordan Smith",      email:"jordan@brightnest.com",  role:"owner",  org_id:"org-001", tier:"bull",  status:"active",      last_login:"2026-04-29T14:22:00Z", created:"2024-11-03", sessions:3, shipments_30d:4820, mfa:true  },
    { id:"usr-002", name:"Priya Kapoor",      email:"priya@brightnest.com",   role:"member", org_id:"org-001", tier:"bull",  status:"active",      last_login:"2026-04-28T09:11:00Z", created:"2024-11-10", sessions:1, shipments_30d:0,    mfa:true  },
    { id:"usr-003", name:"Marcus Webb",       email:"marcus@brightnest.com",  role:"member", org_id:"org-001", tier:"bull",  status:"active",      last_login:"2026-04-20T16:45:00Z", created:"2024-11-10", sessions:1, shipments_30d:0,    mfa:false },
    // org-002 Gadget Barn
    { id:"usr-004", name:"Tina Orlova",       email:"tina@gadgetbarn.io",     role:"owner",  org_id:"org-002", tier:"cow",   status:"active",      last_login:"2026-04-29T10:05:00Z", created:"2025-01-18", sessions:2, shipments_30d:1230, mfa:true  },
    { id:"usr-005", name:"Derek Luo",         email:"derek@gadgetbarn.io",    role:"member", org_id:"org-002", tier:"cow",   status:"active",      last_login:"2026-04-15T12:30:00Z", created:"2025-01-25", sessions:1, shipments_30d:0,    mfa:false },
    // org-003 Maple & Stone
    { id:"usr-006", name:"Fatima Al-Hassan",  email:"fatima@mapleandstone.co",role:"owner",  org_id:"org-003", tier:"cow",   status:"active",      last_login:"2026-04-27T08:00:00Z", created:"2025-02-07", sessions:1, shipments_30d:980,  mfa:true  },
    { id:"usr-007", name:"Elliot Park",       email:"elliot@mapleandstone.co",role:"member", org_id:"org-003", tier:"cow",   status:"active",      last_login:"2026-04-10T11:20:00Z", created:"2025-02-14", sessions:1, shipments_30d:0,    mfa:false },
    // org-004 Urban Paw
    { id:"usr-008", name:"Sam Rivera",        email:"sam@urbanpaw.com",       role:"owner",  org_id:"org-004", tier:"calf",  status:"active",      last_login:"2026-04-26T17:00:00Z", created:"2025-03-22", sessions:1, shipments_30d:210,  mfa:false },
    // org-005 Drift & Shore
    { id:"usr-009", name:"Chloe Brennan",     email:"chloe@driftandshore.com",role:"owner",  org_id:"org-005", tier:"bull",  status:"active",      last_login:"2026-04-29T13:55:00Z", created:"2024-09-14", sessions:4, shipments_30d:6100, mfa:true  },
    { id:"usr-010", name:"Ravi Mehta",        email:"ravi@driftandshore.com", role:"admin",  org_id:"org-005", tier:"bull",  status:"active",      last_login:"2026-04-29T09:30:00Z", created:"2024-09-20", sessions:2, shipments_30d:0,    mfa:true  },
    { id:"usr-011", name:"Nina Torres",       email:"nina@driftandshore.com", role:"member", org_id:"org-005", tier:"bull",  status:"active",      last_login:"2026-04-22T14:10:00Z", created:"2024-10-01", sessions:1, shipments_30d:0,    mfa:true  },
    // org-006 Crestfield Labs (suspended)
    { id:"usr-012", name:"Owen Blake",        email:"owen@crestfield.io",     role:"owner",  org_id:"org-006", tier:"cow",   status:"suspended",   last_login:"2026-03-10T10:00:00Z", created:"2025-01-05", sessions:0, shipments_30d:0,    mfa:false },
    { id:"usr-013", name:"Iris Chang",        email:"iris@crestfield.io",     role:"member", org_id:"org-006", tier:"cow",   status:"suspended",   last_login:"2026-03-08T09:45:00Z", created:"2025-01-12", sessions:0, shipments_30d:0,    mfa:false },
    // org-007 Pico Commerce
    { id:"usr-014", name:"Luca Ferrari",      email:"luca@pico.commerce",     role:"owner",  org_id:"org-007", tier:"calf",  status:"active",      last_login:"2026-04-28T20:30:00Z", created:"2026-01-10", sessions:1, shipments_30d:88,   mfa:false },
    // org-008 Verdant Goods
    { id:"usr-015", name:"Amara Osei",        email:"amara@verdantgoods.com", role:"owner",  org_id:"org-008", tier:"cow",   status:"active",      last_login:"2026-04-25T15:40:00Z", created:"2025-05-30", sessions:2, shipments_30d:740,  mfa:true  },
    { id:"usr-016", name:"Ben Hartley",       email:"ben@verdantgoods.com",   role:"member", org_id:"org-008", tier:"cow",   status:"active",      last_login:"2026-04-18T10:00:00Z", created:"2025-06-05", sessions:1, shipments_30d:0,    mfa:false },
    // org-009 Blue Anchor
    { id:"usr-017", name:"Stella Moon",       email:"stella@blueanchor.co",   role:"owner",  org_id:"org-009", tier:"bull",  status:"active",      last_login:"2026-04-29T11:00:00Z", created:"2024-07-22", sessions:3, shipments_30d:5560, mfa:true  },
    { id:"usr-018", name:"Kai Nakamura",      email:"kai@blueanchor.co",      role:"admin",  org_id:"org-009", tier:"bull",  status:"active",      last_login:"2026-04-28T16:20:00Z", created:"2024-08-01", sessions:2, shipments_30d:0,    mfa:true  },
    // org-010 Stackhaus
    { id:"usr-019", name:"Diana Cross",       email:"diana@stackhaus.io",     role:"owner",  org_id:"org-010", tier:"cow",   status:"active",      last_login:"2026-04-24T09:00:00Z", created:"2025-08-14", sessions:1, shipments_30d:610,  mfa:false },
    // org-011 Fennec
    { id:"usr-020", name:"Tom Yeager",        email:"tom@fennecfulfill.com",  role:"owner",  org_id:"org-011", tier:"calf",  status:"active",      last_login:"2026-04-29T07:15:00Z", created:"2026-02-28", sessions:1, shipments_30d:42,   mfa:false },
    // org-012 Outpost (deactivated)
    { id:"usr-021", name:"Gwen Porter",       email:"gwen@outpostco.com",     role:"owner",  org_id:"org-012", tier:"cow",   status:"deactivated", last_login:"2025-11-20T14:00:00Z", created:"2024-12-01", sessions:0, shipments_30d:0,    mfa:false },
    // Extra solo users / edge cases
    { id:"usr-022", name:"Alex Kim",          email:"alex@kimecom.xyz",       role:"owner",  org_id:"org-004", tier:"calf",  status:"active",      last_login:"2026-04-01T10:00:00Z", created:"2026-01-15", sessions:1, shipments_30d:0,    mfa:false },
    { id:"usr-023", name:"Rachel Ford",       email:"rachel@brightnest.com",  role:"member", org_id:"org-001", tier:"bull",  status:"active",      last_login:"2026-04-29T12:00:00Z", created:"2025-01-20", sessions:1, shipments_30d:0,    mfa:true  },
    { id:"usr-024", name:"Noel Adeyemi",      email:"noel@driftandshore.com", role:"member", org_id:"org-005", tier:"bull",  status:"active",      last_login:"2026-04-23T10:30:00Z", created:"2024-11-01", sessions:1, shipments_30d:0,    mfa:false },
    { id:"usr-025", name:"Yuki Tanaka",       email:"yuki@blueanchor.co",     role:"member", org_id:"org-009", tier:"bull",  status:"active",      last_login:"2026-04-27T15:00:00Z", created:"2024-09-10", sessions:1, shipments_30d:0,    mfa:true  },
  ];

  // Active sessions (for session tab in drawer)
  const SESSIONS = {
    "usr-001": [
      { id:"s-001", device:"Chrome / macOS",   ip:"74.125.22.100", location:"Atlanta, GA",     started:"2026-04-29T13:00:00Z", current:true  },
      { id:"s-002", device:"Safari / iPhone",  ip:"74.125.22.101", location:"Atlanta, GA",     started:"2026-04-29T08:30:00Z", current:false },
      { id:"s-003", device:"Firefox / Windows",ip:"203.0.113.45",  location:"Chicago, IL",     started:"2026-04-28T22:00:00Z", current:false },
    ],
    "usr-004": [
      { id:"s-004", device:"Chrome / macOS",   ip:"198.51.100.12", location:"New York, NY",    started:"2026-04-29T09:00:00Z", current:true  },
      { id:"s-005", device:"Chrome / Android", ip:"198.51.100.13", location:"New York, NY",    started:"2026-04-28T19:00:00Z", current:false },
    ],
    "usr-009": [
      { id:"s-006", device:"Chrome / macOS",   ip:"192.0.2.55",    location:"Miami, FL",       started:"2026-04-29T12:00:00Z", current:true  },
      { id:"s-007", device:"Edge / Windows",   ip:"192.0.2.56",    location:"Miami, FL",       started:"2026-04-29T07:00:00Z", current:false },
      { id:"s-008", device:"Safari / iPad",    ip:"192.0.2.57",    location:"Fort Lauderdale, FL", started:"2026-04-28T20:00:00Z", current:false },
      { id:"s-009", device:"Chrome / macOS",   ip:"203.0.113.99",  location:"São Paulo, Brazil",  started:"2026-04-27T14:00:00Z", current:false },
    ],
    "usr-017": [
      { id:"s-010", device:"Chrome / macOS",   ip:"198.51.100.80", location:"Seattle, WA",     started:"2026-04-29T10:00:00Z", current:true  },
      { id:"s-011", device:"Firefox / Linux",  ip:"198.51.100.81", location:"Portland, OR",    started:"2026-04-28T16:00:00Z", current:false },
      { id:"s-012", device:"Chrome / Android", ip:"198.51.100.82", location:"Seattle, WA",     started:"2026-04-28T09:00:00Z", current:false },
    ],
  };

  // Activity log per user
  const ACTIVITY = {
    "usr-001": [
      { ts:"2026-04-29T14:22:00Z", action:"Uploaded file",      detail:"Q1_2026_shipments.xlsx · 4,820 rows" },
      { ts:"2026-04-29T13:00:00Z", action:"Logged in",          detail:"Chrome / Atlanta, GA" },
      { ts:"2026-04-28T09:11:00Z", action:"Viewed Dashboard",   detail:"Period: 30D" },
      { ts:"2026-04-27T15:30:00Z", action:"Asked Mooovy",       detail:"\"Why is my avg zone so high?\"" },
      { ts:"2026-04-25T10:00:00Z", action:"Uploaded file",      detail:"March_2026.csv · 1,240 rows" },
      { ts:"2026-04-20T16:45:00Z", action:"Downloaded report",  detail:"Pain points export" },
    ],
    "usr-004": [
      { ts:"2026-04-29T10:05:00Z", action:"Logged in",          detail:"Chrome / New York, NY" },
      { ts:"2026-04-28T14:30:00Z", action:"Uploaded file",      detail:"April_shipments.xlsx · 1,230 rows" },
      { ts:"2026-04-15T12:30:00Z", action:"Viewed Zoning Map",  detail:"Period: 90D" },
      { ts:"2026-04-10T09:00:00Z", action:"Asked Mooovy",       detail:"\"Which carrier is cheapest for Zone 6?\"" },
    ],
    "usr-009": [
      { ts:"2026-04-29T13:55:00Z", action:"Logged in",          detail:"Chrome / Miami, FL" },
      { ts:"2026-04-29T12:00:00Z", action:"Uploaded file",      detail:"Drift_April.xlsx · 6,100 rows" },
      { ts:"2026-04-22T14:10:00Z", action:"Viewed Daily Insights", detail:"6 insights reviewed" },
      { ts:"2026-04-20T09:00:00Z", action:"Asked Mooovy",       detail:"\"How much am I losing to dim weight?\"" },
      { ts:"2026-04-18T11:00:00Z", action:"Exported data",      detail:"Shipment CSV export" },
    ],
    "usr-012": [
      { ts:"2026-03-10T10:00:00Z", action:"Logged in",          detail:"Chrome / London, UK" },
      { ts:"2026-03-08T09:45:00Z", action:"Account suspended",  detail:"Admin action — payment failure" },
      { ts:"2026-03-01T08:00:00Z", action:"Uploaded file",      detail:"Feb_2026.csv · 320 rows" },
    ],
  };

  // Admin audit log
  const AUDIT_LOG = [
    { ts:"2026-04-29T14:30:00Z", admin:"admin@shippingcow.com", action:"Impersonated user",    target:"usr-001", detail:"Session: 15 min · Reason: Support ticket #4821" },
    { ts:"2026-04-28T11:00:00Z", admin:"admin@shippingcow.com", action:"Tier override",        target:"org-006", detail:"Cow → Bull · 30-day trial · Reason: Demo for enterprise deal" },
    { ts:"2026-04-27T09:15:00Z", admin:"admin@shippingcow.com", action:"Suspended user",       target:"usr-012", detail:"Reason: Payment failure after 3 retries" },
    { ts:"2026-04-25T16:00:00Z", admin:"admin@shippingcow.com", action:"Published rate table", target:"carrier_rates_v12", detail:"FedEx Ground 2026 Q2 rates" },
    { ts:"2026-04-22T10:30:00Z", admin:"admin@shippingcow.com", action:"Force logout",         target:"usr-009", detail:"Session s-009 · Suspicious login from São Paulo" },
    { ts:"2026-04-20T14:00:00Z", admin:"admin@shippingcow.com", action:"Deleted user",         target:"usr-099", detail:"CCPA erasure request #229 · Data wiped" },
  ];

  // Helper lookups
  const orgMap = {};
  ORGS.forEach(o => { orgMap[o.id] = o; });

  return { ORGS, USERS, SESSIONS, ACTIVITY, AUDIT_LOG, orgMap };
})();

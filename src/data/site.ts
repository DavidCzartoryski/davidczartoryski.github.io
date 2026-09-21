export const SITE_URL = "https://davidczartoryski.com";

export const profile = {
  name: "David Czartoryski",
  first: "David",
  last: "Czartoryski",
  role: "Software engineer & founder",
  school: "Northeastern University",
  degree: "B.S. Computer Science & Business Administration",
  degreeNote: "Petition in progress to BSBA Finance with a CS minor",
  graduation: "May 2027",
  bases: [
    { code: "BOS", city: "Boston", note: "School, EternalTap, the MBTA" },
    { code: "WAW", city: "Warsaw", note: "Heritage, Polish Club, real estate" },
    { code: "MXP", city: "Milan", note: "Friends, modeling, photography" },
  ],
  email: "czartoryski.d@northeastern.edu",
  linkedin: "https://www.linkedin.com/in/davidczartoryski",
  github: "https://github.com/DavidCzartoryski",
  instagram: "https://www.instagram.com/dczar.ski/",
  tiktok: "https://www.tiktok.com/@dczar.ski",
  handle: "@dczar.ski",
  resume: "/resume/DavidCzartoryski_Resume.pdf",
  openTo: [
    "New-grad software engineering, starting after May 2027",
    "Private equity and venture roles",
    "Front-office, people-facing finance",
  ],
};

export const passportFacts = [
  { label: "Passenger", value: "CZARTORYSKI / DAVID" },
  { label: "Issued", value: "Boston, MA" },
  { label: "Nationality", value: "American · Polish heritage" },
  { label: "Languages", value: "English · Polish" },
  { label: "Countries", value: "23 stamped" },
  { label: "Class", value: "Founder" },
];

export type Leg = {
  id: string;
  code: string;
  city: string;
  company: string;
  title: string;
  range: string;
  bullets: string[];
  tech?: string[];
  note?: string;
};

export const flightLog: Leg[] = [
  {
    id: "pawtograder",
    code: "BOS",
    city: "Boston, MA",
    company: "Pawtograder",
    title: "Software Engineer",
    range: "Sep 2026 – Present",
    bullets: [
      "Operate a production coding and grading platform serving 5,000+ weekly active users across ten Northeastern CS courses, as one of 15 engineers shipping through daily standups and peer code review on a subteam of four that owns one service end to end.",
      "Work in the autograding path (Next.js and TypeScript on Supabase Postgres): every submission runs through GitHub Actions and returns compile errors, similarity scores, and AI-usage signals before a human grader sees it.",
      "Capstone with Prof. Jon Bell. The platform covers submissions, similarity checking, grading workflows, a gradebook with its own query language, a forum, polling, and real-time office hours. Other schools have asked to adopt it.",
    ],
    tech: ["Next.js", "TypeScript", "Supabase", "Postgres", "GitHub Actions"],
  },
  {
    id: "meta",
    code: "MPK",
    city: "Menlo Park, CA",
    company: "Meta",
    title: "GPU performance tracking",
    range: "2026",
    bullets: [
      "Multi-vendor GPU performance tracking across NVIDIA and AMD hardware.",
    ],
    tech: ["NVIDIA", "AMD", "Python"],
  },
  {
    id: "mosaiq",
    code: "BOS",
    city: "Boston, MA",
    company: "Mosaiq Software",
    title: "Full-Stack Software Engineer",
    range: "Jan 2026 – May 2026",
    bullets: [
      "Cut update latency to 120 ms by replacing a 5-second polling loop with a WebSocket transport, unblocking live updates and interactive multi-user workflows the product could not support before.",
      "Moved the React frontend and Node/Express backend onto shared TypeScript API contracts in a monorepo package, so a breaking change fails the compiler instead of reaching production as a runtime data-flow bug.",
    ],
    tech: ["React", "Node", "Express", "TypeScript", "WebSockets"],
  },
  {
    id: "summit",
    code: "SFO",
    city: "Menlo Park, CA",
    company: "Summit Partners",
    title: "DevOps Engineer Co-op",
    range: "Jul 2025 – Dec 2025",
    bullets: [
      "Cut deployment time 70% at a $42B+ AUM growth equity firm by automating infrastructure provisioning in Python, Bash, and Azure CLI, reclaiming 12 engineer-hours per week from manual runbooks.",
      "Diagnosed international server connectivity failures through firewall and routing configuration alongside the firm's lead architect, inside a security-compliant private equity environment.",
      "Provisioned 50+ company-issued devices into the firm's zero-trust endpoint stack (Zscaler, Proofpoint, ThreatLocker), maintaining hybrid fleet compliance in Jamf Pro and NinjaOne.",
      "Cut 4 hours per deal review by shipping AI extraction and summarization into the deal spreadsheet workflow, owned end to end from pitch to production as the intern project.",
      "Reduced query latency 30% with a Python and SQL service that deduplicated redundant datasets and rewrote the calculation pipelines reading from them.",
    ],
    tech: ["Python", "Bash", "Azure CLI", "SQL", "Jamf Pro"],
  },
  {
    id: "whalley",
    code: "SWK",
    city: "Southwick, MA",
    company: "Whalley Computer Associates",
    title: "Network Engineer Intern",
    range: "Jun 2023 – Aug 2024",
    bullets: [
      "Configured hundreds of Cisco switches per rollout with a Python script parameterized for each site's requirements, replacing switch-by-switch CLI work across state agency and municipal deployments.",
      "Cut inter-site latency 35% by migrating government sites off 1990s Cat 3 cabling to Cat 8 and replacing the switch hardware behind it.",
      "Set up firewall policy, BGP peering, and IP addressing at each site, standardizing configuration that had drifted into a different security posture per location.",
    ],
    tech: ["Cisco", "Python", "BGP", "Firewalls"],
  },
];

export const education = {
  school: "Northeastern University",
  city: "Boston, MA",
  degree: "B.S. Computer Science & Business Administration",
  range: "Expected May 2027",
  bullets: [
    "Combined CS and business program, with an active petition to transfer into BSBA Finance with a CS minor.",
    "President of the Polish Club (previously VP of the Polish Students Association). The club attended an international youth conference in Warsaw in summer 2026 on the future of Poland.",
    "CookYourBooks: a Java OOP group project.",
  ],
};

export type Cargo = {
  id: string;
  tag: string;
  name: string;
  sector: string;
  blurb: string;
  detail: string[];
  metric?: { value: string; label: string };
  link?: { href: string; label: string };
  tone: "red" | "blue" | "green" | "violet";
};

export const studio = {
  name: "Hercules Holdings LLC",
  role: "Founder & CEO",
  kind: "Venture studio",
  range: "2024 – Present",
  blurb:
    "A studio that builds and runs its own companies: a govtech fare platform, a consumer fintech app, two direct-to-consumer brands, and the AI tooling that keeps them selling. It has had employees and interns.",
};

export const cargo: Cargo[] = [
  {
    id: "eternaltap",
    tag: "HH-001",
    name: "EternalTap",
    sector: "B2B govtech · transit fares",
    blurb: "A wallet-native fare platform for universities and transit agencies, built with a cofounder.",
    detail: [
      "Verifies rider eligibility against a university roster sync, prices MBTA fare rules, and ships a signed Apple Wallet pass. Next.js, TypeScript, Postgres.",
      "Secured a conditional contract covering 22,000+ riders and drew venture interest. Now working go-to-market: university B2B contracts and MBTA partnership sequencing.",
    ],
    metric: { value: "22,000+", label: "riders under contract" },
    tone: "blue",
  },
  {
    id: "credimax",
    tag: "HH-002",
    name: "CrediMax",
    sector: "B2C fintech · iOS",
    blurb: "Aggregates your credit cards through Plaid and tells you which one to tap at checkout.",
    detail: [
      "An AI engine over 800+ Plaid-aggregated transactions per rolling three-month window prices missed rewards and surfaces the best card at the point of purchase.",
      "Negotiated seed terms with venture firms and senior American Express leadership, then walked away from the round.",
    ],
    metric: { value: "800+", label: "transactions per window" },
    link: { href: "https://credimax.app/", label: "credimax.app" },
    tone: "red",
  },
  {
    id: "argali",
    tag: "HH-003",
    name: "Argali",
    sector: "DTC · supplements & home",
    blurb: "Shopify storefronts and full advertorial funnels for astaxanthin, aged garlic extract, and a weed puller.",
    detail: [
      "Ran the Meta campaigns end to end: Pixel and server-side Conversions API, Meta business verification, and SPF/DKIM/DMARC so the emails land.",
    ],
    link: { href: "https://tryargali.com", label: "tryargali.com" },
    tone: "green",
  },
  {
    id: "veldre",
    tag: "HH-004",
    name: "Veldre",
    sector: "DTC · home & health",
    blurb: "Launched a waterproof mattress protector with UGC and static creatives.",
    detail: [
      "Competitive research in the Meta Ads Library, funnel drop-off diagnosed with Microsoft Clarity, long-form native advertorials written in-house.",
    ],
    link: { href: "https://tryveldre.com", label: "tryveldre.com" },
    tone: "violet",
  },
  {
    id: "engine",
    tag: "HH-005",
    name: "The creative engine",
    sector: "AI tooling · ecommerce",
    blurb: "The software behind the brands: an autonomous storefront builder and an ad creative pipeline.",
    detail: [
      "The storefront builder regenerates a whole shop per product category and tunes it against live sales, feeding heatmap and Meta Conversions API data back into its redesign decisions. $180K in revenue across the brands.",
      "The creative pipeline (Higgsfield MCP plus a Python Pillow compositor) takes ad production from days to 6 minutes, about 40 variants a week, with AI UGC video prompted through Kling 3.0 and Seedance 2.0. Shopify theme work in Liquid, JSON, and JS.",
    ],
    metric: { value: "$180K", label: "revenue driven" },
    tone: "red",
  },
  {
    id: "supply",
    tag: "HH-006",
    name: "Supply operation",
    sector: "Distribution · US, EU, Asia",
    blurb: "A global supply distribution operation feeding the two brands across three continents.",
    detail: ["Sourcing and logistics spanning the United States, the European Union, and Asia."],
    tone: "blue",
  },
];

export const flightPlan = [
  {
    name: "Runtime straggler detection",
    blurb: "Catching slow workers during distributed GPU training across mixed NVIDIA and AMD clusters, based on the Meta work.",
  },
  {
    name: "AI BDC for independent dealerships",
    blurb: "Lead interception, inventory matching, and appointment booking for small car dealers that can't staff a business development center.",
  },
];

export const wrestling = {
  headline: "Before the passport, there was the mat.",
  facts: [
    { value: "1st", label: "Massachusetts state champion, multiple titles" },
    { value: "NU", label: "Wrestles at Northeastern University" },
    { value: "HS → D1", label: "From Massachusetts high school mats to college" },
  ],
  copy: [
    "Wrestling was the first thing that took me on the road: weigh-ins at dawn, gyms in towns I had never heard of, and a scoreboard that does not care how you feel. I won the Massachusetts state title more than once in high school and I still wrestle at Northeastern.",
    "It is also why the rest of this page exists. Cutting weight teaches you to ship on a deadline. Six minutes on the mat teaches you that preparation is the whole game. Everything I build, from fare platforms to ad pipelines, runs on that.",
  ],
};

export const layover = {
  intro:
    "Between flights I am usually eating something I cannot pronounce yet, trying to pronounce it anyway, and filming the attempt.",
  pillars: [
    {
      key: "fashion",
      title: "Fashion",
      body: "Editorial and luxury-lifestyle modeling, the influencer-model hybrid lane. Milan is the reason for half the photos on this page.",
    },
    {
      key: "food",
      title: "Food",
      body: "Every country gets judged by its breakfast. New dishes are the fastest way into a culture, and the fastest way to make friends at a table.",
    },
    {
      key: "languages",
      title: "Languages",
      body: "Polish at home, at heritage-speaker level. On the road I collect enough of each language to order, thank, and get lost politely.",
    },
    {
      key: "content",
      title: "Content",
      body: "The travel gets posted. TikTok and Instagram under one handle, mostly the places, sometimes the outfits.",
    },
  ],
  extras: ["Photography", "Cars", "Chess", "Fitness", "Warsaw real estate", "Shopify freelancing"],
};

export const skills = [
  { group: "Languages", items: ["Python", "Java", "TypeScript", "JavaScript", "C++", "SQL", "Bash", "Racket", "Liquid", "HTML/CSS"] },
  { group: "Frameworks & AI", items: ["React", "Next.js", "Node.js", "Express", "Django", "Angular", "React Native", "LLM APIs", "RAG"] },
  { group: "Infrastructure", items: ["Git", "Linux", "Docker", "PostgreSQL", "Supabase", "MongoDB", "Azure CLI", "GitHub Actions"] },
  { group: "Networking", items: ["TCP/IP", "BGP", "VLANs", "Routing & switching", "ACLs", "Firewall policy", "DNS"] },
];

export const navItems = [
  { id: "passport", n: "01", label: "Passport" },
  { id: "flight-log", n: "02", label: "Flight log" },
  { id: "cargo", n: "03", label: "Cargo" },
  { id: "the-mat", n: "04", label: "The mat" },
  { id: "layover", n: "05", label: "Layover" },
  { id: "arrivals", n: "06", label: "Arrivals" },
];

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
    { code: "SFO", city: "San Francisco", note: "Work, the Bay Area, where the next leg lands" },
    { code: "BOS", city: "Boston", note: "School, EternalTap, the MBTA" },
    { code: "WAW", city: "Warsaw", note: "Heritage, Polish Club, real estate" },
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
  excites:
    "The work that actually pulls me in is making things faster. Load balancing, cutting latency, runtime, and cost: profiling a system until the bottleneck shows itself, then optimizing the code around it. Most of what I have shipped is a version of that same problem — a 5-second poll down to 120 ms, 70% off deployment time, 30% off query latency, and now straggler detection across GPU clusters.",
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

export type DeepSection = { heading: string; body: string[] };

export type VentureDeep = {
  tagline: string;
  sections: DeepSection[];
  /** Key of an interactive explainer to render inside the detail view. */
  demo?: "indian-run";
  stack?: string[];
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
  name: "Hercules Holdings",
  short: "HH",
  role: "Founder & CEO",
  kind: "Venture studio & holding company",
  range: "2024 – Present",
  blurb:
    "Hercules Holdings — HH — is a venture studio and holding company that my ventures operate under. Everything below is built and run inside it: a govtech fare platform, a consumer fintech app, the AI tooling behind the commerce brands, and runtime research for GPU clusters. It has had employees and interns.",
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
    id: "engine",
    tag: "HH-003",
    name: "The creative engine",
    sector: "AI tooling · ecommerce",
    blurb: "The software behind the DTC brands: an autonomous storefront builder and an ad creative pipeline.",
    detail: [
      "The storefront builder regenerates a whole shop per product category and tunes it against live sales, feeding heatmap and Meta Conversions API data back into its redesign decisions. $180K in revenue across the brands.",
      "The creative pipeline (Higgsfield MCP plus a Python Pillow compositor) takes ad production from days to 6 minutes, about 40 variants a week, with AI UGC video prompted through Kling 3.0 and Seedance 2.0. Shopify theme work in Liquid, JSON, and JS.",
    ],
    metric: { value: "$180K", label: "revenue driven" },
    tone: "red",
  },
  {
    id: "straggler",
    tag: "HH-004",
    name: "Runtime straggler detection",
    sector: "AI infrastructure · GPU clusters",
    blurb:
      "Catching slow workers during distributed GPU training across mixed NVIDIA and AMD clusters, based on the Meta work.",
    detail: [
      "A synchronous training step only finishes when its slowest rank does, so one degraded worker sets the pace for the entire cluster. This finds it at runtime instead of in a post-mortem.",
      "Mixed fleets are the hard part: NVIDIA and AMD expose performance differently, so the signal has to be normalized across both vendors before a straggler is separable from ordinary variance.",
    ],
    tone: "violet",
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

/**
 * Long-form copy shown when a cargo card is opened. Keyed by Cargo.id so the
 * card list stays readable.
 */
export const ventureDeep: Record<string, VentureDeep> = {
  straggler: {
    tagline: "A training cluster only moves as fast as its slowest GPU.",
    demo: "indian-run",
    sections: [
      {
        heading: "The drill",
        body: [
          "There is a conditioning run wrestlers and most team-sport athletes know as the Indian run. The team jogs in a single-file line at an easy pace. The runner at the very back sprints up the outside, passes everyone, and takes over the front, setting the pace for the pack. As soon as they arrive, the new last runner starts their sprint. The drill ends once everyone has rotated to the front some fixed number of times, say three.",
          "Here is the part that matters: the drill is not over until the slowest person has done all of their sprints. Everyone else can be fast. It changes nothing. Five strong runners and one who is gassed turns a five-minute drill into fifteen, and the other five spend that time jogging, waiting for a turn that cannot start early.",
        ],
      },
      {
        heading: "The same shape, on a GPU cluster",
        body: [
          "Training a large model is data-parallel and synchronous. Every GPU holds a copy of the model, each works through its own slice of the batch, and then all of them stop and exchange gradients before any of them can start the next step. That exchange is a barrier: it does not complete until the last GPU arrives.",
          "So the line has to wait, exactly like the drill. If one GPU in a thousand is running 30% slow — a bad thermal, a throttled link, a noisy neighbor, a subtly different clock — then every step takes 30% longer and you are paying for 999 idle GPUs while one of them catches up. That machine is the straggler.",
          "The unhelpful part is that nothing crashes. The job runs, the loss goes down, the dashboards look fine. It is just quietly costing a third more than it should, for weeks.",
        ],
      },
      {
        heading: "What I'm building",
        body: [
          "Detection at runtime rather than in a post-mortem: watch per-rank step timings as the job runs and flag the machine that is consistently arriving late at the barrier, early enough to drain it and reschedule instead of eating the cost for the rest of the run.",
          "The hard part is that the clusters are mixed. NVIDIA and AMD expose performance counters differently and have different baseline timing behavior, so a raw comparison across vendors reads a hardware difference as a fault. The signal has to be normalized per-vendor before a genuine straggler is separable from ordinary variance.",
          "The approach comes out of multi-vendor GPU performance tracking work at Meta.",
        ],
      },
    ],
    stack: ["NVIDIA", "AMD", "Python", "Distributed training"],
  },

  eternaltap: {
    tagline: "A transit pass that lives in the phone you already unlock.",
    sections: [
      {
        heading: "The problem",
        body: [
          "University transit programs are an eligibility problem wearing a fare problem's clothes. A school negotiates discounted passes for enrolled students, and then somebody has to actually prove who is enrolled, apply the right agency fare rule, issue a physical card, and take it back when the student graduates or drops. Most of that is manual, and the plastic makes it worse.",
          "There is no consumer-facing site to point you at, because this is sold to universities and transit agencies rather than to riders.",
        ],
      },
      {
        heading: "How it works",
        body: [
          "The platform syncs against the university's roster as the source of truth on who is currently enrolled, prices the ride against MBTA fare rules, and issues a signed Apple Wallet pass straight to the student's phone.",
          "Because eligibility is derived from the roster rather than from a card somebody is holding, a pass can be revoked the moment enrollment lapses, instead of staying valid until a piece of plastic is physically returned.",
        ],
      },
      {
        heading: "Where it stands",
        body: [
          "Built with a cofounder. It has a conditional contract covering 22,000+ riders and has drawn venture interest.",
          "Current work is go-to-market: university B2B contracts, and sequencing the MBTA partnership.",
        ],
      },
    ],
    stack: ["Next.js", "TypeScript", "Postgres", "Apple Wallet"],
  },

  credimax: {
    tagline: "You are holding four cards. Only one of them is the right one.",
    sections: [
      {
        heading: "The problem",
        body: [
          "Rewards cards are only worth anything if you use the right one at the right merchant, and the rules are deliberately hard to hold in your head: rotating quarterly categories, capped bonus spend, different multipliers per card. Most people default to whichever card is in front and quietly leave rewards on the table at every checkout.",
        ],
      },
      {
        heading: "How it works",
        body: [
          "The app aggregates your cards through Plaid and reads roughly 800+ transactions per rolling three-month window to learn where you actually spend.",
          "An AI engine prices what you left behind — the gap between the card you tapped and the best card you were carrying — and then surfaces the right card at the point of purchase, before you pay rather than on a statement a month later.",
        ],
      },
      {
        heading: "Where it stands",
        body: [
          "Negotiated seed terms with venture firms and with senior American Express leadership, then walked away from the round.",
        ],
      },
    ],
    stack: ["iOS", "Plaid", "LLM APIs"],
  },

  engine: {
    tagline: "The storefronts and the ads that sell on them, mostly building themselves.",
    sections: [
      {
        heading: "The storefront builder",
        body: [
          "Rather than hand-designing a shop per product category, the builder regenerates the whole storefront and then tunes it against live sales, feeding heatmap data and Meta Conversions API results back into its own redesign decisions.",
        ],
      },
      {
        heading: "The creative pipeline",
        body: [
          "Higgsfield MCP plus a Python Pillow compositor takes ad production from days down to about 6 minutes, roughly 40 variants a week. AI UGC video is prompted through Kling 3.0 and Seedance 2.0.",
          "Underneath it is ordinary Shopify theme work: Liquid, JSON, and JavaScript.",
        ],
      },
      {
        heading: "Result",
        body: ["$180K in revenue across the brands it runs."],
      },
    ],
    stack: ["Python", "Pillow", "Shopify", "Liquid", "Meta CAPI"],
  },
};

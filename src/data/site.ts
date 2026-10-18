export const SITE_URL = "https://davidczartoryski.com";

export const profile = {
  name: "David Czartoryski",
  first: "David",
  last: "Czartoryski",
  role: "Software engineer, researcher & founder",
  school: "Northeastern University",
  degree: "B.S. Computer Science & Business Administration",
  concentration: "Corporate Innovation",
  graduation: "Dec 2027",
  bases: [
    { code: "SFO", city: "San Francisco" },
    { code: "BOS", city: "Boston" },
    { code: "WAW", city: "Warsaw" },
  ],
  email: "czartoryski.d@northeastern.edu",
  linkedin: "https://www.linkedin.com/in/david-czartoryski",
  github: "https://github.com/DavidCzartoryski",
  instagram: "https://www.instagram.com/dczar.ski/",
  tiktok: "https://www.tiktok.com/@dczar.ski",
  handle: "@dczar.ski",
  resume: "/resume/DavidCzartoryski_Resume.pdf",
  openTo: [
    "New-grad software engineering, starting after December 2027",
    "Private equity and venture roles",
    "Front-office, people-facing finance",
  ],
  excites:
    "The work that actually pulls me in is making things faster. Load balancing, cutting latency, runtime, and cost: profiling a system until the bottleneck shows itself, then optimizing the code around it. Most of what I have shipped is a version of that same problem — a 5-second poll down to 120 ms, 70% off deployment time, 30% off query latency, and now GPU clusters: a cross-vendor all-reduce 2.7x faster, and a detector that finds the one slow GPU holding a training job back.",
};

export const passportFacts = [
  { label: "Passenger", value: "CZARTORYSKI / DAVID" },
  { label: "Issued", value: "Boston, MA" },
  { label: "Nationality", value: "American · Polish heritage" },
  { label: "Languages", value: "English · Polish · Russian" },
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
  links?: { href: string; label: string }[];
  /** Square logo in public/logos, shown on the recruiter view's timeline. */
  logo?: string;
};

export const flightLog: Leg[] = [
  {
    id: "ai-research",
    logo: "/logos/northeastern.png",
    code: "BOS",
    city: "Boston, MA · MGHPCC",
    company: "Northeastern University HPC Research Lab",
    title: "AI Infrastructure Researcher",
    range: "Oct 2026 – Present",
    bullets: [
      "Develop gpubridge and a runtime GPU straggler detector and workload rebalancer, using Northeastern's Explorer cluster at the Massachusetts Green High Performance Computing Center (MGHPCC). The projects began independently and led to this research role.",
      "Own the work across distributed communication, GPU kernels, statistical diagnosis and native Rust execution. Evaluate changes with hardware benchmarks, reference-based differential tests and fault injection, preserving numerical behavior and asynchronous resource lifetimes.",
    ],
    tech: ["PyTorch", "Rust", "CUDA", "ROCm", "NCCL / RCCL", "Triton", "Slurm"],
    links: [
      { href: "#gpubridge", label: "Research case study & results" },
      { href: "https://github.com/DavidCzartoryski/gpubridge", label: "Public code" },
    ],
  },
  {
    id: "pawtograder",
    logo: "/logos/pawtograder.png",
    code: "BOS",
    city: "Boston, MA",
    company: "Pawtograder",
    title: "Software Engineer",
    range: "Sep 2026 – Present",
    bullets: [
      "Operate a production coding and grading platform serving 5,000+ weekly active users across ten Northeastern CS courses, as one of 15 engineers shipping through daily standups and peer code review on a subteam of four that owns one service end to end.",
      "Set up telemetry for the Next.js and Supabase platform with the OpenTelemetry library, exporting metrics to Prometheus and visualizing them in Grafana dashboards.",
      "Raised survey error-text contrast from 3.98:1 to 5.06:1 after finding 2 WCAG 1.4.3 failures the CI accessibility gate excluded, and extended the axe-core sweep to scan pages mid-interaction, now covering 40 routes.",
      "Measured the CI accessibility gate's recall across 82 axe-core scans with 8 seeded defects: it caught 1 of 8, which made the case for scanning with every rule and in interaction states.",
      "Traced 2 test suites crashing on import to a missing jsdom global, exposing 5 real failures hidden in the LLM-hint rate-limiting tests and a CI config that gated only 2 test files.",
      "Capstone with Prof. Jon Bell. The platform covers submissions, similarity checking, grading workflows, a gradebook with its own query language, a forum, polling, and real-time office hours. Other schools have asked to adopt it.",
    ],
    tech: ["Next.js", "TypeScript", "Supabase", "OpenTelemetry", "Prometheus", "Grafana", "Playwright", "axe-core"],
  },
  {
    id: "mosaiq",
    logo: "/logos/mosaiq.png",
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
    logo: "/logos/summit.png",
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
    logo: "/logos/whalley.png",
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
  logo: "/logos/northeastern.png",
  city: "Boston, MA",
  degree: "B.S. Computer Science & Business Administration",
  concentration: "Concentration in Corporate Innovation",
  range: "Expected Dec 2027",
  bullets: [
    "Won 1st place among 250+ participants at the 2026 Microsoft x Northeastern AI Hackathon (AI Builder Blitz) with HuskyClaw.",
    "Coursework includes Financial Management and CS 4535, the capstone behind the Pawtograder role.",
    "President of the Polish Club (previously VP of the Polish Students Association). The club attended an international youth conference in Warsaw in summer 2026 on the future of Poland.",
    "Wrestling at Northeastern, and a member of the NU AI Club.",
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
    "Hercules Holdings — HH — is the venture studio and holding company behind my govtech fare platform, consumer fintech app, and the AI tooling for the commerce brands. It has had employees and interns. My GPU infrastructure work is now part of my Northeastern research role.",
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
      "Wrote the eligibility engine across 9 MBTA reduced and free fare categories, auto-verifying, rejecting, or routing each application to review, plus the entire rider web app and the native SwiftUI app, which reads date of birth from an ID with Vision OCR.",
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
      "Built solo end to end, with about 280 production deploys in six weeks: a SwiftUI app whose one location-triggered pipeline feeds lock-screen widgets, Live Activities and an Apple Watch complication, a FastAPI and Postgres backend on Plaid's production environment, and a Claude advisor grounded in card and transfer-partner data.",
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
      "AdForge, the pipeline as a FastAPI and React service: Claude turns customer research into validated ad copy, the image model renders a text-free scene, and the compositor sets every word, so copy is always legible and exactly as written.",
    ],
    metric: { value: "$180K", label: "revenue driven" },
    tone: "red",
  },
  {
    id: "straggler",
    tag: "RESEARCH",
    name: "Runtime straggler detection",
    sector: "Northeastern HPC · GPU systems",
    blurb:
      "A runtime system that finds the slow GPU, slow link, or hung rank dragging down a distributed training job, across mixed NVIDIA and AMD clusters, without ever blocking training.",
    detail: [
      "A synchronous training step only finishes when its slowest rank does, so a single slow node silently sets the pace for the entire job, and it is hard to tell which one. The tool monitors collective communication through NCCL on NVIDIA and RCCL on AMD to pinpoint the straggler while the job is still running.",
      "In calibrated simulations with 100-step windows, it catches 2% slowdowns under 5% timing jitter, with no false flags across 250,560 healthy rank-windows. Detector overhead was about 0.2% of a step in a separate CPU simulation.",
      "Hang detection with a flight recorder, NVML and AMD SMI telemetry, an NCCL/RCCL profiler plugin in C, and sample-weighted batch rebalancing. The stateful Rust scorer matched the Python reference bit for bit across 3,000 seeded jobs and over 4.1 million floating-point comparisons.",
    ],
    metric: { value: "0.2%", label: "of step time, simulated" },
    tone: "violet",
  },
];

export type Project = {
  id: string;
  name: string;
  kind: string;
  range: string;
  status: string;
  blurb: string;
  bullets: string[];
  /** Headline figures, shown only on the featured project. */
  stats?: { value: string; label: string }[];
  stack: string[];
  links?: { href: string; label: string }[];
  featured?: boolean;
};

/** Built outside the studio: open source, the hackathon winner, and personal agents. */
export const projects: Project[] = [
  {
    id: "gpubridge",
    name: "gpubridge + straggler detector",
    kind: "AI infrastructure research · Mixed-vendor GPU training",
    range: "Aug 2026 – Present",
    status: "GPU-tested collectives · RDMA in progress",
    featured: true,
    blurb:
      "Two complementary systems: an open-source PyTorch backend that joins NVIDIA and AMD GPUs in one training job, and a runtime detector and workload rebalancer that identifies what slows that job down.",
    bullets: [
      "Designed hierarchical collectives that keep NCCL on NVIDIA and RCCL on AMD while bridging vendor-specific GPU groups. Implemented asynchronous collectives, GPU-stream synchronization, DDP/FSDP2 integration and Triton compression kernels across separate CUDA and ROCm software stacks. Hardware coverage spans six GPU models.",
      "Cut a 1 GB cross-vendor all-reduce 2.7x, from 1.67 s to 0.61 s, with fp8 compression on a V100 + MI50. In a separate LLaMA-style training benchmark, fp8 raised mixed data-parallel throughput from 4,549 to 9,523 tokens/s. These results used the TCP bridge.",
      "Built hardware-aware diagnosis that separates expected GPU differences from degradation, and slow computation from communication delays when they overlap. Calibrated simulations with 100-step windows detected 2% slowdowns under 5% timing jitter, with no false flags across 250,560 healthy rank-windows. Rebalancing preserves sample-weighted gradient averaging.",
      "Ported the stateful scoring engine to Rust and verified bit-exact numerical agreement across 3,000 seeded jobs and over 4.1 million floating-point comparisons. Differential tests, fault injection and hardware regressions check correctness across numerical, scheduling and failure boundaries.",
      "Current work: hardening a Rust/libibverbs RDMA prototype with NVIDIA GPUDirect and AMD GPU-memory registration, NIC-counter-based fabric diagnosis, and polling policies that trade latency against CPU use. Preparing a reproducible cluster-validation package; real GPU-direct transfers and their training benefit remain hardware-validation targets.",
    ],
    stats: [
      { value: "2.7×", label: "faster 1 GB all-reduce across NVIDIA + AMD" },
      { value: "2%", label: "slowdown detected in calibrated simulation" },
      { value: "4.1M+", label: "bit-exact float comparisons, Rust vs Python" },
      { value: "3,000", label: "seeded jobs in the scoring validation corpus" },
    ],
    stack: ["PyTorch", "NCCL", "RCCL", "Triton", "CUDA", "ROCm", "C / C++", "Rust", "libibverbs", "Slurm"],
    links: [{ href: "https://github.com/DavidCzartoryski/gpubridge", label: "github.com/DavidCzartoryski/gpubridge" }],
  },
  {
    id: "huskyclaw",
    name: "HuskyClaw",
    kind: "AI agent · cofounded",
    range: "Sep 2026 – Present",
    status: "In beta · 1st place, AI Builder Blitz",
    blurb:
      "An agentic assistant built for Northeastern students. Text it a task (find co-ops, pick classes, prep for an interview) and it plans the work across registration, coursework and recruiting, with every real-world action behind the student's approval.",
    bullets: [
      "Won 1st place among 250+ participants at Microsoft's AI Builder Blitz, the launch challenge for Northeastern's AI Makerspace; now in beta with student testers.",
      "Working with the Dean of Khoury College, Northeastern's Chief of AI and the Board of Trustees toward a university-wide launch on Northeastern's existing Anthropic partnership.",
      "Designed a staging layer that turns every agent action into a reviewable diff the student approves, modeled on Terraform's plan and apply, which caps the blast radius and blocks prompt-injected actions.",
    ],
    stack: ["Claude", "Agents", "Human-in-the-loop"],
    links: [{ href: "https://whoisaldo.github.io/huskyclaw-demo/", label: "20-second demo" }],
  },
  {
    id: "inbox-triage",
    name: "inbox-triage",
    kind: "Open source · AI agent",
    range: "Sep 2026 – Present",
    status: "Public · MIT",
    blurb:
      "A Python agent that runs a student's job hunt from the inbox: it flags assessments, interviews and offers, files bulk mail by moving it rather than deleting, puts interviews on the calendar, scouts new postings, and on a yes tailors a one-page résumé.",
    bullets: [
      "Sends just 2 of 25 messages to the model on a real mailbox sample by putting allowlists, a weighted header prefilter and a verdict cache in front of Claude, and halved idle run time from 18.7 s to 9.0 s on a 4,046-message mailbox.",
      "Scanned 1,535 job postings in 85 s: free filters first, then Claude ranks the remaining 428 against the résumé and recommends the best 20.",
      "Sandboxed a headless Claude Code session that tailors résumés from untrusted job descriptions: writes confined to one build folder, shell limited to the build script and read-only git, and the run fails if the source résumé changes. 90 offline tests.",
    ],
    stack: ["Python", "Claude", "Claude Code", "AppleScript", "IMAP", "GitHub Actions"],
    links: [{ href: "https://github.com/DavidCzartoryski/inbox-triage", label: "github.com/DavidCzartoryski/inbox-triage" }],
  },
  {
    id: "sixthdegree",
    name: "SixthDegree",
    kind: "AI agent · local-first",
    range: "Sep 2026",
    status: "Private",
    blurb:
      "A local-first Claude agent on macOS that builds a private graph of everyone you know from Contacts, iMessage, LinkedIn exports and dictated notes, finds the shortest chain of people to whoever you need to reach, and drafts the first text.",
    bullets: [
      "A hand-written tool-use loop over 5 read-only tools and a SQLite graph with FTS5 search, where every fact and edge cites its source. Claude Opus reasons; Claude Haiku mines message history in bulk through the Message Batches API.",
      'Entity resolution turns "Jordan\'s uncle" into a placeholder that merges once someone names him, and an iMessage bridge lets the agent answer texts from the owner\'s phone, with human approval before anything is sent.',
    ],
    stack: ["Python", "Claude", "SQLite", "FastAPI", "Pydantic"],
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
      body: "Polish at home, at heritage-speaker level, plus Russian. On the road I collect enough of each language to order, thank, and get lost politely.",
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
  { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "Java", "C++", "C", "Rust", "Swift", "SQL", "Bash", "Racket", "Liquid", "HTML/CSS"] },
  { group: "Frameworks & AI", items: ["React", "Next.js", "Node.js", "Express", "FastAPI", "Django", "Angular", "SwiftUI", "React Native", "LLM APIs", "Claude tool use", "RAG"] },
  { group: "GPU & distributed", items: ["PyTorch distributed", "NCCL", "RCCL", "Triton", "CUDA streams", "ROCm", "UCX", "RDMA / libibverbs (in development)", "Slurm"] },
  { group: "Infrastructure", items: ["Git", "Linux", "Docker", "PostgreSQL", "Supabase", "MongoDB", "Azure CLI", "GitHub Actions", "OpenTelemetry", "Prometheus", "Grafana"] },
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
        heading: "Why it is hard to catch",
        body: [
          "Nothing crashes. The job runs, the loss goes down, the dashboards look healthy. A straggler does not announce itself as a failure, it just shows up as a training run that is quietly costing a third more than it should, for weeks at a time.",
          "The usual way you find out is after the fact, reading timings once the run is already paid for, and even then a job spans so many nodes that working out which one was slow is its own investigation. Detecting it while the job is live is what makes it actionable: you can drain that machine and reschedule mid-run instead of eating the tax to the end.",
        ],
      },
      {
        heading: "Watching the collectives",
        body: [
          "Distributed training synchronizes at collective operations, like the all-reduce that averages gradients every step. When one rank is slow, every other rank reaches the collective early and waits for it.",
          "The tool monitors that collective communication through NCCL on NVIDIA and RCCL on AMD, so the rank everyone is waiting on stands out at runtime. For stock jobs, a profiler plugin written in C records device-side timing for every collective into a shared-memory ring, so the rank that arrives last is found even when only its forward or backward pass is slow.",
        ],
      },
      {
        heading: "The mixed-vendor problem",
        body: [
          "These clusters are not uniform, so the tool works across both vendors instead of locking into one. NVIDIA and AMD expose performance counters differently and have different baseline timing behavior, so a naive cross-vendor comparison reads an ordinary hardware difference as a fault and flags healthy machines.",
          "The signal has to be normalized per vendor before a real straggler is separable from routine variance. Each rank is scored against its peers on the same vendor and against its own baseline, so a vendor that is slower by design reads as load imbalance rather than as bad GPUs, and hardware classes keep mixed generations (V100, A100, H200, MI50) from misflagging. Getting that boundary right is most of the work.",
        ],
      },
      {
        heading: "Fast enough to run alongside training",
        body: [
          "Cross-rank summary exchange runs on a background thread over the job's own store, so training never waits for a missing rank's summary. In a CPU simulation with 10 ms steps, the direct detector cost was about 0.2% of step time; this is not a measured overhead guarantee for GPU training.",
          "The complete stateful scoring update runs in Rust, with one native boundary call per window. The validation corpus matched the Python reference bit for bit across 3,000 seeded jobs and over 4.1 million floating-point comparisons.",
        ],
      },
      {
        heading: "From finding to fix",
        body: [
          "Every finding carries its cost in milliseconds per step and, through NVML and AMD SMI telemetry, a likely cause such as thermal throttling or a clock drop. Hangs are reported with a flight recorder that names the stuck rank and every rank's collective phase.",
          "Imbalance turns into per-vendor batch sizes with exact gradient averaging: with AMD 20% slower, simulated step time falls 5.5%. One command attaches the detector to an unchanged training script, with a Prometheus exporter and a Grafana dashboard.",
        ],
      },
      {
        heading: "Where it stands",
        body: [
          "In calibrated simulations with 100-step windows, it detected 2% slowdowns under 5% timing jitter, with no false flags across 250,560 healthy rank-windows. The next validation stage exercises the integrated Rust RDMA transport and NIC diagnosis on allocated hardware; mock and CPU results are kept separate from real GPU measurements.",
        ],
      },
      {
        heading: "Where it comes from",
        body: [
          "It started with following the work Meta and AMD have been doing on distributed training reliability. Hyperscalers are tackling this problem internally, and it matters most at supercluster scale: the more GPUs a job spans, the more places a straggler can hide, and the more every slow step costs.",
        ],
      },
    ],
    stack: ["NVIDIA", "AMD", "NCCL", "RCCL", "PyTorch", "Python", "Rust", "C", "Prometheus"],
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
        heading: "What I built",
        body: [
          "The eligibility engine: 9 categories, 5 free and 4 reduced, where each application is auto-verified, auto-rejected, or sent to human review, each category has its own re-verification period, student eligibility expires with the semester, and inspector-reported mismatches revoke it at two strikes. The MBTA's reduced-fare and Semester Pass rules live in code, with fares in integer cents.",
          "Also the family accounts (guardian and dependent riders, a 30-minute claim code, an atomic account merge), magic-link login, about 70% of the database schema, the entire rider web app, and the entire iOS app: a SwiftUI mirror of the web flow with a Keychain-backed API client and Vision OCR that reads date of birth from an ID.",
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
    stack: ["Next.js", "TypeScript", "Prisma", "Postgres", "Swift", "SwiftUI", "Apple Wallet"],
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
        heading: "How it is built",
        body: [
          "Solo, end to end: 183 commits, about 12,800 lines of Swift and 6,700 of Python, and about 280 production deploys in six weeks, on Plaid's production environment.",
          "On the phone, one location-triggered pipeline feeds four Apple surfaces: the app, home and lock-screen widgets, Live Activities, and an Apple Watch complication. A geofence wakes a background task that fetches the recommendation and writes it where the widgets and the watch can read it.",
          "Behind it, a FastAPI and Postgres backend with a rewards engine across 16 cards and 12 spending categories, a Plaid sync that saves its cursor only after every page succeeds, tokens encrypted at rest, and a Claude advisor grounded in card and transfer-partner data, rate-limited behind authentication. Stripe billing, Sign in with Apple, and CCPA delete and export round it out.",
        ],
      },
      {
        heading: "Where it stands",
        body: [
          "The site and backend are live at credimax.app with the waitlist open, and the app is on its way to TestFlight.",
          "Negotiated seed terms with venture firms and with senior American Express leadership, then walked away from the round.",
        ],
      },
    ],
    stack: ["Swift", "SwiftUI", "WidgetKit", "FastAPI", "Postgres", "Plaid", "Claude", "Stripe"],
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
          "AdForge runs it as a FastAPI and React service. Claude reads the customer-avatar and ad-angle research and returns validated JSON copy and a palette, Nano Banana Pro renders a scene with no text in it, and a custom Pillow compositor sets every word: outlined headline, auto-placed subhead, benefit callouts. Because the image model never draws text, the copy is always legible and exactly as written.",
          "The agent-run version follows a per-product spec through the Higgsfield MCP server with locked settings, which is how a test run caught the provider silently swapping image models and halted before compositing.",
          "Underneath it is ordinary Shopify theme work: Liquid, JSON, and JavaScript.",
        ],
      },
      {
        heading: "Result",
        body: ["$180K in revenue across the brands it runs."],
      },
    ],
    stack: ["Python", "FastAPI", "React", "Pillow", "Claude", "Higgsfield MCP", "Shopify", "Liquid", "Meta CAPI"],
  },
};

/**
 * The recruiter view (/recruiter): the résumé on one quiet page. It reuses the
 * flight log, cargo, education and skills above; only what is unique to it
 * lives here.
 */
export const recruiter = {
  headline: "I build AI infrastructure, distributed systems, and the products around them.",
  lede: "Software engineer, AI infrastructure researcher at Northeastern University's HPC Research Lab, and founder. I build cross-vendor GPU training and runtime-diagnosis systems using Explorer at MGHPCC, alongside shipped products and AI agents. Studying Computer Science and Business Administration, graduating December 2027; looking for a new-grad software engineering role.",
  /** Headline numbers; `href` jumps to the role, venture or project they come from. */
  impact: [
    { value: "2.7×", label: "faster 1 GB all-reduce across NVIDIA and AMD GPUs", source: "gpubridge", href: "#gpubridge" },
    { value: "4.1M+", label: "bit-exact floating-point comparisons, Rust vs Python", source: "AI infrastructure research", href: "#ai-research" },
    { value: "120 ms", label: "update latency, down from a 5-second polling loop", source: "Mosaiq", href: "#mosaiq" },
    { value: "70%", label: "off deployment time at a $42B+ AUM growth equity firm", source: "Summit Partners", href: "#summit" },
    { value: "5,000+", label: "weekly active users on the platform I help run", source: "Pawtograder", href: "#pawtograder" },
    { value: "22,000+", label: "riders under a conditional fare contract", source: "EternalTap", href: "#eternaltap" },
    { value: "$180K", label: "revenue driven by an autonomous storefront builder", source: "Hercules Holdings", href: "#engine" },
    { value: "1st", label: "of 250+ at the 2026 Microsoft × Northeastern AI Hackathon", source: "HuskyClaw", href: "#huskyclaw" },
  ],
  /**
   * Phrases picked out with a highlighter wherever they appear in a bullet.
   * They have to match the copy above exactly; a phrase that stops matching
   * just stops being highlighted.
   */
  emphasis: [
    "5,000+ weekly active users",
    "one of 15 engineers",
    "from 3.98:1 to 5.06:1",
    "it caught 1 of 8",
    "5 real failures",
    "Other schools have asked to adopt it.",
    "Cut update latency to 120 ms",
    "shared TypeScript API contracts",
    "Cut deployment time 70%",
    "12 engineer-hours per week",
    "50+ company-issued devices",
    "Cut 4 hours per deal review",
    "Reduced query latency 30%",
    "hundreds of Cisco switches",
    "Cut inter-site latency 35%",
    "1st place among 250+ participants",
    "President of the Polish Club",
    "22,000+ riders",
    "9 MBTA reduced and free fare categories",
    "800+ Plaid-aggregated transactions",
    "about 280 production deploys in six weeks",
    "$180K in revenue",
    "from days to 6 minutes",
    "NCCL on NVIDIA and RCCL on AMD",
    "250,560 healthy rank-windows",
    "2% slowdowns under 5% timing jitter",
    "3,000 seeded jobs",
    "4.1 million floating-point comparisons",
    "hardware-validation targets",
    "changing one string",
    "1.05x one V100",
    "4,549 to 9,523 tokens/s",
    "Cut a 1 GB cross-vendor all-reduce 2.7x",
    "six GPU models",
    "2 of 25 messages",
    "from 18.7 s to 9.0 s",
    "1,535 job postings in 85 s",
    "Board of Trustees",
  ],
  beyond: [
    { k: "Wrestling", v: "Massachusetts state champion, multiple titles. Still wrestles at Northeastern." },
    { k: "Languages", v: "English, Polish at heritage-speaker level, and Russian." },
    { k: "Travel", v: "23 countries so far, with home bases in San Francisco, Boston, and Warsaw." },
  ],
};

/**
 * Copy for /Artemis, the venture page for the straggler detector and
 * GPUBridge. Every number here has to say how it was measured: `kind` on an
 * evidence row is shown next to it, and simulation never reads as hardware.
 * Results come from the project's own benchmark and validation docs; keep
 * them in step when those change.
 */

export const artemis = {
  name: "Artemis",
  tagline: "Runtime reliability for GPU training",
  email: "czartoryski.d@northeastern.edu",
  github: "https://github.com/DavidCzartoryski/gpubridge",

  hero: {
    eyebrow: "Runtime reliability for GPU training",
    lead: "Every training step waits for the",
    mark: "slowest GPU.",
    lede: "Artemis finds that GPU while the job is still running. It watches the collectives on NVIDIA and AMD, names the slow rank, link or hung process, and puts a cost on it in milliseconds per step. GPUBridge, the open-source half, runs NVIDIA and AMD GPUs in one PyTorch job.",
    specs: [
      { k: "Vendors", v: "NVIDIA, AMD, or both in one job" },
      { k: "Attaches to", v: "An unchanged PyTorch training script" },
      { k: "Watches", v: "NCCL and RCCL collectives, GPU telemetry" },
      { k: "Stage", v: "Pre-seed. Taking design partners" },
    ],
    caption:
      "Illustration, not measured data. Eight ranks in a synchronous loop. Seven finish early and wait at each all-reduce for rank 2.",
  },

  problem: {
    heading: "Nothing crashes.",
    body: "A straggler throws no error. The job runs, the loss goes down and the dashboards stay green. One slow GPU sets the pace for every other GPU in the job, and the bill grows with it for weeks.",
    points: [
      {
        title: "The slowest rank sets the pace",
        body: "A synchronous step finishes when its last rank arrives at the all-reduce. Every other GPU sits idle until then.",
      },
      {
        title: "You find out after you've paid",
        body: "Most teams read the timings once the run is over. On a job that spans hundreds of nodes, working out which one was slow is its own investigation.",
      },
      {
        title: "Mixed fleets hide the fault",
        body: "NVIDIA and AMD, or a V100 next to an H200, have different normal speeds. A naive comparison flags healthy hardware and misses the GPU that is actually degrading.",
      },
    ],
  },

  calculator: {
    heading: "What one slow GPU costs",
    body: "In data-parallel training the slow rank stretches every step for every GPU. Put in your own numbers.",
    note: "Back-of-envelope. Assumes the straggler sets the pace of every step for the whole period. A slowdown of s stretches each step by s, so s / (1 + s) of every GPU-hour goes to waiting.",
  },

  product: {
    eyebrow: "The detector",
    heading: "Artemis reads the collectives.",
    body: "Distributed training synchronizes at collectives such as the all-reduce that averages gradients every step. When one rank is slow, every other rank reaches the collective early and waits. That wait is the signal.",
    attach: "straggler run --every 50 --jsonl stragglers.jsonl -- torchrun ... train.py",
    steps: [
      {
        n: "01",
        title: "Watch",
        body: "On NVIDIA, a profiler plugin written in C records device-side timing for every NCCL collective into a shared-memory ring. On AMD, GPUBridge's observer times the RCCL side. The rank everyone waits on stands out, even when only its forward or backward pass is slow.",
      },
      {
        n: "02",
        title: "Score",
        body: "Each rank is scored against its peers on the same vendor and against its own baseline. Hardware classes keep mixed generations from flagging each other, so a vendor that is slower by design reads as imbalance and not as a bad GPU.",
      },
      {
        n: "03",
        title: "Explain",
        body: "Each finding carries its cost in milliseconds per step and a likely cause from GPU telemetry, such as thermal throttling or a clock drop. A hang comes with a flight recorder that names the stuck rank and every rank's collective phase.",
      },
      {
        n: "04",
        title: "Rebalance",
        body: "Measured imbalance becomes per-vendor batch sizes. Gradient averaging stays sample-weighted, so the update is the one uniform hardware would compute. In simulation this cut step time 5.5% with AMD 20% slower. A gain on real hardware isn't shown yet.",
      },
    ],
    runtime:
      "Training never waits on Artemis. Ranks exchange summaries on a background thread, and the scoring update runs in Rust with one native call per window. On a V100 node it made no measurable difference to step time, at a cost of about 0.83 of a CPU core and 94 MiB of memory per rank. A Prometheus exporter and a Grafana dashboard ship with it.",
  },

  bridge: {
    eyebrow: "Open source · MIT",
    heading: "GPUBridge puts NVIDIA and AMD in the same training job.",
    body: [
      "A cluster with both vendors usually runs them as two separate clusters. NCCL only talks to NVIDIA and RCCL only talks to AMD, so a single job can't span both.",
      "GPUBridge is a PyTorch distributed backend that keeps each vendor on its own library and bridges the two groups. It handles asynchronous collectives, stream synchronization on CUDA and ROCm, DDP and FSDP2. Switching a script over is one import and one string.",
    ],
    snippet: [
      { code: "import gpubridge", note: "registers the backend" },
      { code: "import torch.distributed as dist" },
      { code: 'dist.init_process_group(backend="gpubridge")', note: 'instead of "nccl"' },
    ],
    steps: [
      { n: "1", title: "Reduce", body: "inside each vendor group on NCCL or RCCL" },
      { n: "2", title: "Bridge", body: "between group leaders, compressed to fp8 by Triton kernels" },
      { n: "3", title: "Broadcast", body: "the result back inside each group" },
    ],
    stats: [
      { value: "2.7×", label: "faster 1 GB all-reduce across a V100 and an MI50, 1.67 s to 0.61 s with fp8" },
      { value: "6", label: "GPU models run: V100, T4, L40S, A100, H200 and MI50" },
      { value: "1.10×", label: "faster training on a V100 plus an MI50 than on the V100 alone, pipeline parallel" },
    ],
    status:
      "These numbers use a TCP link between the vendors of about 1.2 GB/s, and that link is the bottleneck today. The RDMA transport, written in Rust on libibverbs, already runs over InfiniBand on a single host. Cross-node runs and GPUDirect are next.",
  },

  evidence: {
    heading: "Every number, labeled.",
    body: "Simulation results say simulation. Real-GPU runs say real GPUs, and early ones say how small the sample is. Nothing on this page is a projection.",
    rows: [
      {
        result: "Named the slowed rank in 8 of 8 held-out runs, 150 steps after onset, with no flags in 4 healthy 6,000-step runs",
        setup: "One 4× V100 node, slowdowns of 8.8% to 19.2%, a tuned threshold policy that isn't the default yet",
        kind: "gpu",
        early: true,
      },
      {
        result: "No measurable change in step time from running the detector, +0.18% median",
        setup: "95% CI −0.17% to +0.53%, small DDP model with 11 ms steps. Costs 0.83 of a CPU core and 94 MiB per rank",
        kind: "gpu",
      },
      {
        result: "Named the frozen rank when either GPU's process hung",
        setup: "One V100 plus one MI50, one run per side",
        kind: "gpu",
        early: true,
      },
      {
        result: "Full chain over native libibverbs on InfiniBand flagged the right rank at +5%, +10% and +30%",
        setup: "Single-host loopback. 7 of 7 healthy runs raised no flag",
        kind: "gpu",
      },
      {
        result: "2.7× faster 1 GB cross-vendor all-reduce, 1.67 s to 0.61 s",
        setup: "One V100 plus one MI50, lossy fp8 compression, TCP bridge",
        kind: "gpu",
      },
      {
        result: "A V100 and an MI50 together trained faster than the V100 alone: 1.10× with a hand-tuned split, 1.07× with the automatic one",
        setup: "Pipeline parallel, 500 steps, two runs each, TCP bridge",
        kind: "gpu",
        early: true,
      },
      {
        result: "Caught 2% slowdowns in at least 90% of runs, with no false flags across 250,560 healthy rank-windows",
        setup: "100-step windows, 5% timing jitter. Real GPU noise has heavier tails",
        kind: "sim",
      },
      {
        result: "Rebalancing cut step time 5.5% with AMD 20% slower",
        setup: "Simulated per-vendor batch sizes. No gain shown yet on real hardware",
        kind: "sim",
      },
      {
        result: "Rust scorer matches the Python reference bit for bit",
        setup: "4,138,052 floating-point comparisons across 3,000 seeded jobs, zero mismatches",
        kind: "cpu",
      },
      {
        result: "Cross-node RDMA and GPUDirect for GPUBridge",
        setup: "Native libibverbs works on one host. Multi-node is next",
        kind: "wip",
      },
    ],
  },

  audience: {
    heading: "Who it's for",
    items: [
      {
        title: "Teams training across nodes",
        body: "Any job with a synchronous step, from a handful of nodes up. The more ranks a job spans, the more places a straggler can hide and the more each slow step costs.",
      },
      {
        title: "GPU clouds",
        body: "Catch the degraded node before a customer's run does, with a likely cause attached, and drain it while the job keeps going.",
      },
      {
        title: "Mixed fleets",
        body: "NVIDIA next to AMD, or three GPU generations in one cluster. Artemis tells a normal hardware difference from a fault, and GPUBridge lets one job use all of it.",
      },
    ],
    whyNow:
      "The largest training teams built straggler and hang tooling for themselves, because at their scale they had to. Clusters everywhere else are getting bigger and more mixed, and most of them still find the slow GPU after the run is paid for. Artemis is that tooling for everyone else, across both vendors.",
  },

  roadmap: {
    heading: "Where it stands",
    phases: [
      {
        label: "Built",
        items: [
          "Straggler and hang detection with a flight recorder",
          "Per-vendor scoring with hardware classes",
          "Sample-weighted batch rebalancing",
          "Rust scoring core, bit-exact against the Python reference",
          "GPUBridge with DDP, FSDP2 and fp8 compression",
        ],
      },
      {
        label: "Validating now",
        items: [
          "Detection on multi-GPU V100 nodes and mixed V100 and MI50 jobs",
          "Default thresholds tuned on real GPU noise",
          "AMD telemetry and the RCCL side of the profiler",
          "RDMA on InfiniBand, cross-node and with GPUDirect",
        ],
      },
      {
        label: "Next",
        items: [
          "Design partners running multi-node training",
          "Current-generation NVIDIA and AMD hardware",
          "A fleet view across jobs and nodes",
        ],
      },
    ],
  },

  founders: {
    heading: "Meet the founders",
    photo: {
      src: "/team/founders.webp",
      width: 1280,
      height: 719,
      alt: "Thomas, left, and David Czartoryski at a lookout above the Golden Gate Bridge at sunset.",
    },
    people: [
      {
        name: "David Czartoryski",
        role: "Co-founder",
        photo: { src: "/team/david.webp", alt: "David Czartoryski in a dark suit and tie." },
        body: [
          "AI Infrastructure Researcher at Northeastern University's HPC Research Lab, where he builds and tests the detector and GPUBridge on the Explorer cluster at MGHPCC. Both started as his own projects and led to the role.",
          "Before that he cut deployment time 70% as a DevOps engineer at Summit Partners, a $42B+ AUM growth equity firm, and took update latency at Mosaiq from a 5-second poll to 120 ms. He founded Hercules Holdings, whose fare platform EternalTap holds a conditional contract covering 22,000+ riders.",
          "Computer Science and Business Administration at Northeastern, graduating December 2027. Massachusetts state wrestling champion.",
        ],
        links: [
          { href: "/recruiter/", label: "Résumé" },
          { href: "https://www.linkedin.com/in/david-czartoryski", label: "LinkedIn" },
          { href: "https://github.com/DavidCzartoryski", label: "GitHub" },
        ],
      },
      {
        name: "Thomas Czartoryski",
        role: "Co-founder",
        photo: { src: "/team/thomas.webp", alt: "Thomas Czartoryski in a navy jacket with the San Francisco skyline behind him." },
        body: [
          "Production engineer on Meta's traffic infrastructure team, working on global load balancing, edge tooling and CDN troubleshooting, and on observability for Meta's data centers.",
          "Promoted in under a year, a pace fewer than 1% of Meta engineers reach.",
          "Load balancing and fleet observability are the problems Artemis solves inside a single training job.",
        ],
        links: [{ href: "https://www.linkedin.com/in/thomas-czartoryski/", label: "LinkedIn" }],
      },
      {
        name: "Ali Younes",
        role: "Founding engineer",
        photo: { src: "/team/ali.webp", alt: "Ali Younes in a navy suit and blue tie." },
        body: [
          "Main author of the Rust node agent and coordinator, and of GPUBridge's pipeline-parallel training across vendors with automatic stage balancing. That work is how a V100 and an MI50 together beat one V100 alone.",
          "SDE intern at AWS on the CloudFormation Registry, where he owned policy-based sharing of private resource types end to end. A dual-model code review tool he built for Kiro was presented to the whole CloudFormation org and featured on Kiro's official LinkedIn.",
          "Before that, a six-month co-op at Philips replacing about 1,000 per-machine technician touches with zero-touch imaging under FDA-regulated Secure Boot. Computer Science and Political Science at Northeastern, 2027. David's friend since elementary school.",
        ],
        links: [
          { href: "https://aliyounes.dev", label: "Website" },
          { href: "https://www.linkedin.com/in/alialdoyounes/", label: "LinkedIn" },
          { href: "https://github.com/whoisaldo", label: "GitHub" },
        ],
      },
    ],
  },

  contact: {
    heading: "Running multi-node training?",
    mark: "Let's find your slow GPU.",
    body: "Artemis is taking a small number of design partners: teams with multi-node jobs on NVIDIA, AMD or both. Investors can write to the same address.",
  },
} as const;

export type EvidenceKind = (typeof artemis.evidence.rows)[number]["kind"];

export const evidenceKinds: Record<EvidenceKind, string> = {
  gpu: "Real GPUs",
  sim: "Simulation",
  cpu: "CPU test",
  wip: "In progress",
};

export const artemisNav = [
  { id: "problem", label: "Problem" },
  { id: "product", label: "Product" },
  { id: "gpubridge", label: "GPUBridge" },
  { id: "evidence", label: "Evidence" },
  { id: "founders", label: "Founders" },
];

export function mailto(subject: string) {
  return `mailto:${artemis.email}?subject=${encodeURIComponent(subject)}`;
}

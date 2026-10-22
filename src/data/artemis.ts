import { profile } from "@/data/site";

/**
 * Copy for /Artemis: the project page for Artemis, a runtime detector for GPU
 * performance regressions in distributed training, and GPUBridge, the
 * open-source layer that lets one job span NVIDIA and AMD.
 *
 * Every number says what it was measured on. GPUBridge's come from its public
 * README, HARDWARE_VALIDATION.md and docs/BENCHMARKS.md; the detector's from
 * its own hardware results. The detector's source is private, so nothing here
 * links to it. Keep the numbers in step when those docs change.
 */

export const artemis = {
  name: "Artemis",
  founder: profile.name,
  email: profile.email,
  linkedin: profile.linkedin,
  githubProfile: profile.github,
  github: "https://github.com/DavidCzartoryski/gpubridge",
  githubIssues: "https://github.com/DavidCzartoryski/gpubridge/issues",

  hero: {
    eyebrow: "Runtime diagnostics for distributed GPU training",
    lead: "GPU performance regressions,",
    mark: "caught while the job runs.",
    lede: "A GPU that drops its clocks, a link that degrades, a host that stalls on input: none of them crash a training job. They slow every step instead, by a few percent, for days. Artemis times the collectives every rank already runs, flags the rank, link or vendor island that regressed, estimates what it costs per step and, if you opt in, rebalances work across the GPUs the job already has. It's built for NVIDIA, AMD or both in one job.",
    specs: [
      { k: "Watches", v: "Collectives on NCCL, RCCL or GPUBridge" },
      { k: "Built for", v: "NVIDIA, AMD, or both in one job" },
      { k: "Tested on", v: "NVIDIA V100s, with InfiniBand; AMD is next" },
      { k: "Built in", v: "C, Rust and Python" },
    ],
    caption:
      "Illustration. Eight ranks in synchronous data-parallel training, four NVIDIA and four AMD. Rank 2 has regressed, so the other seven reach every all-reduce early and wait for it. Press Rebalance to apply the plan.",
    captionBalanced:
      "Rebalanced. Rank 2 is still the slow GPU per sample, but it now gets 29 samples a step and the other seven get 31 to 34, so all eight reach the all-reduce together. The global batch stays 256, and gradients are weighted by samples, so the update is the same.",
  },

  problem: {
    eyebrow: "The problem",
    heading: "Nothing crashes. Every step just gets slower.",
    body: [
      "Synchronous training moves in lockstep. Each step ends in a collective, such as the all-reduce that averages gradients, and a collective finishes only when the last rank arrives. One slow rank, often called a straggler, sets the pace for every GPU in the job while the rest sit idle at the barrier.",
      "When that slowdown starts partway through a run, it's a performance regression. Throughput drops a few percent, the loss still goes down, utilization still looks busy, and nothing points at the GPU, link or host that changed.",
    ],
    causes: [
      { title: "Power, clocks, configuration", body: "A power cap, clocks that stop boosting, a driver or setting that changed." },
      { title: "Thermal", body: "A GPU that throttles as it heats up." },
      { title: "Communication", body: "A degraded port, link or switch path, or one island's collectives slowing down." },
      { title: "Host and input", body: "A data loader, CPU or storage stall that holds one rank back off the GPU." },
    ],
    cost: {
      formula: "s ÷ (1 + s)",
      examples: [
        { slow: "2%", idle: "2.0%" },
        { slow: "5%", idle: "4.8%" },
        { slow: "10%", idle: "9.1%" },
        { slow: "20%", idle: "16.7%" },
      ],
      body: "If one rank's compute runs s slower, every step stretches by up to s, and up to s ÷ (1 + s) of every GPU-hour in the job goes to waiting: the bound when compute sets the step. One rank 8% slow in a 512-GPU job can idle the equivalent of 38 GPUs.",
    },
    chart: {
      heading: "Why step time alone can't find it",
      body: "Every rank sees the same, slower step. What separates the culprit is its compute time against its peers.",
      caption:
        "Illustration with synthetic numbers. Windows are 50 steps. A rank is suspect when its compute runs about 10% over the median of its island's other ranks, and flagged after 3 suspect windows out of the last 4.",
    },
  },

  story: {
    eyebrow: "How it came together",
    heading: "One question led to three layers of infrastructure.",
    body: "Which GPU is slowing this job down? Answering that across NVIDIA and AMD meant building the layer underneath first.",
    steps: [
      {
        title: "The detector idea",
        tag: "The question",
        body: "Find the GPU that's slowing a distributed job while the job is still running, on NVIDIA and AMD alike, instead of reading timings after the run is paid for.",
      },
      {
        title: "One job, two vendors",
        tag: "The prerequisite",
        body: "Detecting across a mixed fleet needs a job that spans it, and NCCL and RCCL can't exchange data. PyTorch's \"nccl\" backend runs NCCL on CUDA builds and RCCL on ROCm builds, never both in one job.",
      },
      {
        title: "GPUBridge, in Python",
        tag: "Open source · MIT",
        body: "A PyTorch backend that keeps each vendor on its native library and joins them over a Gloo bridge. It went on to train DDP, FSDP2 and pipeline-parallel jobs across an NVIDIA V100 and an AMD MI50.",
        href: "#gpubridge",
      },
      {
        title: "From Gloo to Rust and RDMA",
        tag: "Rust · libibverbs",
        body: "Measurements put the bottleneck on the bridge: about 1.2 GB/s of TCP through host memory. Research into RDMA moved the transports to Rust. A multi-stream TCP prototype missed its own speed target and was dropped; a raw-verbs transport over libibverbs followed and has run on InfiniBand hardware, between two NVIDIA islands on one host.",
        href: "#transport",
      },
      {
        title: "Artemis",
        tag: "The detector",
        body: "With mixed-vendor jobs running, the detector followed. It flags regressions, estimates what each one costs, suggests a likely cause and, on opt-in, rebalances work at runtime. Its agent, coordinator and scoring core are Rust, with their own RDMA channel.",
        href: "#detector",
      },
      {
        title: "Learned diagnosis",
        tag: "In development",
        body: "Research into a model, trained on GPU incident and recovery data, that suggests likely causes, the checks that confirm them and the fixes.",
        href: "#research",
      },
    ],
  },

  bridge: {
    eyebrow: "GPUBridge · open source · MIT",
    heading: "NVIDIA and AMD GPUs in one PyTorch job.",
    body: [
      "A PyTorch install is a CUDA build or a ROCm build, so each process speaks NCCL or RCCL, and an NCCL communicator can't exchange data with an RCCL one. GPUBridge is a torch.distributed backend that joins them.",
      "Each vendor's GPUs form an island on their native library. For an all-reduce, each island reduces onto its leader, the leaders exchange over the bridge, and each leader broadcasts the result back. Everything inside an island stays on NCCL or RCCL; only the leaders' exchange crosses vendors.",
      "It composes collectives PyTorch already provides, so it runs on stock CUDA and ROCm builds over any network, and moving a script over is one import and one string.",
    ],
    snippet: [
      { code: "import gpubridge", note: "registers the backend" },
      { code: "import torch.distributed as dist" },
      { code: 'dist.init_process_group(backend="gpubridge")', note: 'instead of "nccl"' },
      { code: "model = DistributedDataParallel(model)" },
    ],
    collectives: {
      label: "Collectives, step by step",
      singleVendor: "With one vendor there's no bridge, and every call goes straight to NCCL or RCCL.",
      ops: [
        {
          id: "all_reduce",
          label: "all_reduce",
          call: "dist.all_reduce(grad)",
          result: "Every rank ends with the sum of all eight.",
          legend: "Each number stands for one rank's gradient tensor.",
          steps: [
            {
              title: "Reduce",
              body: "Each island sums onto its leader, on NCCL or RCCL. A reduce moves about half the bytes of an all-reduce.",
            },
            {
              title: "Bridge",
              body: "The two leaders copy their island sums to host memory and all-reduce them over the bridge.",
            },
            { title: "Broadcast", body: "Each leader copies the total back to its GPU and broadcasts it to its island." },
          ],
        },
        {
          id: "broadcast",
          label: "broadcast",
          call: "dist.broadcast(w, src=2)",
          result: "Every rank ends with rank 2's tensor.",
          legend: "w is the tensor rank 2 starts with, such as a set of weights.",
          steps: [
            { title: "Source island", body: "Rank 2 broadcasts to the rest of the NVIDIA island on NCCL, its leader included." },
            { title: "Bridge", body: "The NVIDIA leader sends it over the bridge to the AMD leader." },
            { title: "Other island", body: "The AMD leader broadcasts it to the rest of its island on RCCL." },
          ],
        },
        {
          id: "all_gather",
          label: "all_gather",
          call: "dist.all_gather_into_tensor(out, shard)",
          result: "Every rank ends with all eight shards, in rank order.",
          legend: "Each cell is one rank's shard. A filled cell is a shard this rank holds.",
          steps: [
            { title: "Gather", body: "Each island gathers its ranks' shards onto its leader." },
            {
              title: "Bridge",
              body: "Each leader in turn broadcasts its island's shards over the bridge. They're plain copies, so the result is exact.",
            },
            { title: "Broadcast", body: "Each leader broadcasts the assembled tensor to its island." },
          ],
        },
        {
          id: "reduce_scatter",
          label: "reduce_scatter",
          call: "dist.reduce_scatter_tensor(shard, grad)",
          result: "Rank r ends with slice r of the sum.",
          legend: "Each cell is one slice. Shade shows how many ranks it sums: one, an island or all eight.",
          steps: [
            { title: "Reduce", body: "Each island sums the whole input onto its leader." },
            { title: "Bridge", body: "The leaders all-reduce the whole input over the bridge." },
            { title: "Scatter", body: "Each leader hands every rank in its island that rank's slice." },
          ],
        },
        {
          id: "send_recv",
          label: "send / recv",
          call: "dist.send(act, dst) · dist.recv(act, src)",
          result: "One rank hands a tensor to another, as pipeline stages do with activations.",
          legend: "act is a batch of activations on its way to the next pipeline stage.",
          steps: [
            { title: "Same vendor", body: "Rank 2 sends to rank 3 inside the NVIDIA island, on NCCL." },
            {
              title: "Across vendors",
              body: "Rank 3 sends to rank 6 over a Gloo link, staged through host memory. The leaders and the bridge aren't involved.",
            },
          ],
        },
        {
          id: "barrier",
          label: "barrier",
          call: "dist.barrier()",
          result: "No rank leaves until all eight have arrived.",
          legend: "The dashed outline is the CPU Gloo group that spans every rank.",
          steps: [
            {
              title: "Check in",
              body: "Each rank waits for the work it has queued on its own GPU, then enters a barrier on the Gloo group.",
            },
            {
              title: "Release",
              body: "When the last rank arrives, all eight leave together. One slow rank holds up the rest, as it does at an all-reduce.",
            },
          ],
        },
      ],
    },
    features: [
      "DDP, FSDP2 and HSDP through torch.distributed",
      "Async collectives and a DDP communication hook",
      "Pipeline parallel across vendors, with automatic stage balancing",
      "Optional bf16 and fp8 compression on the bridge, in Triton kernels",
      "Swappable bridge transports: Gloo by default, Rust verbs opt-in",
      "A simulation mode that runs two vendors on one CPU",
    ],
    stats: [
      {
        value: "2.75×",
        label: "faster 1 GB all-reduce between a V100 and an MI50 with lossy fp8 on the bridge, 1.67 s to 0.61 s",
      },
      {
        value: "1.10×",
        label: "a V100's training throughput, with an MI50 added as a second pipeline stage (best hand-tuned split; automatic gave 1.07×)",
      },
      { value: "6", label: "GPU models it has run on: V100, T4, L40S, A100, H200 and MI50" },
    ],
    insight:
      "On one V100 and one MI50 over TCP, the pipeline beat the V100 alone and data parallelism didn't. Each data-parallel step all-reduces 536 MB of gradients over a link of about 1.2 GB/s; the pipeline passes 3 MB of activations per microbatch. Mixing vendors pays when the parallelism fits the link.",
  },

  transport: {
    eyebrow: "Transport",
    heading: "Two channels, kept apart.",
    body: "GPUBridge and Artemis both move data between processes, for different reasons. They run separate code over separate connections, and a result on one says nothing about the other.",
    terms: [
      {
        term: "NCCL and RCCL",
        body: "NVIDIA's and AMD's collective communication libraries. Within one vendor they choose the fastest path themselves: NVLink or xGMI inside a node, InfiniBand or RoCE between nodes.",
      },
      {
        term: "Gloo",
        body: "PyTorch's CPU collective backend, over TCP. It's GPUBridge's default bridge because it runs on any network.",
      },
      {
        term: "InfiniBand",
        body: "The fabric: host channel adapters (HCAs) and switches built for low-latency, high-bandwidth traffic between machines.",
      },
      {
        term: "RDMA and verbs",
        body: "RDMA lets a network adapter read and write registered memory directly, with no copy through the remote CPU. libibverbs, from rdma-core, is the user-space API both Rust transports call.",
      },
    ],
    channels: [
      {
        key: "data",
        owner: "GPUBridge",
        name: "Training payload",
        from: "Island leader",
        to: "Island leader",
        carries: "Collective payloads between vendor islands: gradients, parameters, activations.",
        how: [
          ["Default", "Gloo over TCP, staged through host memory"],
          ["Opt-in", "Rust over libibverbs: reliable-connected sends and RDMA writes into registered buffers"],
        ],
        status: "The verbs path has run on one host, between two NVIDIA islands, through one InfiniBand HCA, with GPU tensors staged through host memory.",
      },
      {
        key: "ctl",
        owner: "Artemis",
        name: "Telemetry and control",
        from: "Node agent",
        to: "Coordinator",
        carries: "Window summaries up to the coordinator; control messages and acknowledgements back down. Never model tensors.",
        how: [["Transport", "Rust over libibverbs, with its own versioned protocol"]],
        status: "Has run end to end during real 4-rank DDP training on one host, over InfiniBand.",
      },
    ],
    next: "Next for both channels: across machines and on AMD. For training data, GPU memory straight to the NIC with GPUDirect RDMA.",
  },

  detector: {
    eyebrow: "Artemis · the detector",
    heading: "From collective timings to a finding you can act on.",
    body: "Every rank already checks in at the same place several times a step: the collectives. Artemis times them on each rank, scores each window of steps against the rank's peers and its own history, and reports what slowed down, by how much and why. Collection never blocks a rank, and scoring happens away from the training step.",
    source: "Source private for now",
    attach: "straggler run --plugin --every 50 --jsonl findings.jsonl -- torchrun ... train.py",
    attachNote:
      "Runs the detector in-process, on the profiler plugin or GPUBridge's records. Opt-in rebalancing adds one call per step boundary to the training loop.",
    pipeline: {
      node: {
        title: "Each training node",
        items: [
          { name: "Training ranks", body: "PyTorch DDP or FSDP on NCCL or RCCL. The script is unchanged." },
          { name: "Profiler plugin · C", body: "Loaded through NCCL's profiler plugin API, which RCCL shares. Device-side timing of every collective." },
          { name: "Shared-memory rings", body: "One per rank, written seqlock-style, so the reader never holds a rank up." },
          { name: "Node agent · Rust", body: "Reads the rings and sends one summary per window." },
        ],
      },
      channel: { up: "Window summaries", down: "Control and acks", via: "Rust · libibverbs" },
      coordinator: {
        title: "Coordinator · Rust",
        items: [
          { name: "Scoring core", body: "Island peers and warmup baselines, window by window." },
          { name: "Findings", body: "Slow rank, island, bridge link or vendor collective, and hangs." },
          { name: "Rebalance policy", body: "Opt-in. Turns a finding into a bounded plan." },
        ],
      },
      outputs: {
        title: "Out",
        hint: "Open one to see a sample.",
        sample: "Real field names. The values are illustrative, from a simulated job.",
        items: [
          {
            id: "jsonl",
            name: "JSONL findings",
            lead: "Every report, one JSON object per line, appended while the job runs. New flags also go to the straggler logger at WARNING.",
            command: "straggler run ... --jsonl findings.jsonl",
            caption: "One line of findings.jsonl, wrapped for reading: rank 2 flagged at window 37.",
          },
          {
            id: "incident",
            name: "Incident reports",
            lead: "One command turns a run's reports into incidents: when each started, where, how bad it got and the likely cause.",
            command: "straggler-report findings.jsonl",
            caption: "The Markdown it writes, rendered.",
          },
          {
            id: "metrics",
            name: "Prometheus and Grafana",
            lead: "Rank 0 serves straggler_* metrics off the training thread, and a Grafana dashboard for them comes with the detector.",
            command: "Detector(exporter=straggler.PrometheusExporter(port=9464))",
            caption: "A mock of the dashboard's panels, drawn from simulated values. Not a Grafana screenshot.",
          },
        ],
      },
      alt: "No native agent? The same scoring runs in-process in Python, fed by GPUBridge's collective observer.",
    },
    stages: [
      {
        n: "01",
        title: "Observe",
        body: "Each rank times its own compute gap between collectives and its wait inside them. The late rank has the longest gap and the shortest wait. Each rank measures only its own durations, so no clocks need syncing across nodes.",
      },
      {
        n: "02",
        title: "Score",
        body: "Each window, every rank is compared with the other ranks in its island: about 10% over their median makes it suspect, and 3 suspect windows out of the last 4 flag it. Each island's warmup baseline catches a whole island slowing together. Opt-in hardware classes, tested in simulation so far, keep a slower GPU generation from reading as a fault.",
      },
      {
        n: "03",
        title: "Explain",
        body: "Each finding carries its cost in milliseconds and percent of the step, and a likely cause from GPU telemetry: thermal, power, clocks, PCIe or host, tested against simulated telemetry so far. Missing telemetry is reported as missing. A hang names the ranks behind and dumps each rank's last 256 collectives.",
      },
      {
        n: "04",
        title: "Act",
        tag: "Opt-in",
        body: "Rebalancing moves batch work between the ranks the job already has, in proportion to measured speed and within set bounds. The global batch stays the same and each gradient is weighted by its samples, so the update is the mean over every sample, as before.",
      },
    ],
    chain: [
      "Finding",
      "Policy and bounds",
      "Plan over the control channel",
      "Every rank agrees at a step boundary",
      "All commit, or none",
      "Applied acknowledgement",
      "Scored again, per sample",
    ],
    chainEnd: "Cooldown before any next plan",
    never: "It never moves the model, changes the world size or asks the scheduler for more GPUs.",
  },

  evidence: {
    eyebrow: "Evidence",
    heading: "What's been measured so far.",
    body: "The real-GPU runs are small and specific: one node of four V100s for the detector, and one V100 paired with one MI50 for mixed-vendor training. Counts are cases, not accuracy rates.",
    items: [
      {
        scope: "detector",
        value: "8 of 8",
        result: "injected slowdowns of about 10% and 20% flagged on the right rank, 150 steps after onset",
        setup: "No flags in 4 healthy 6,000-step runs. One 4×V100 node, with a tuned policy profile.",
      },
      {
        scope: "detector",
        value: "+0.01%",
        result: "median change in step time with the full detection chain on, across 9 matched pairs",
        setup: "95% interval −0.26% to +0.28%. It costs about 0.83 of a CPU core and 96 MiB of memory per rank.",
      },
      {
        scope: "detector",
        value: "+34.9%",
        result: "median samples per second after rebalancing work away from a slowed rank",
        setup: "3 matched pairs, a small MLP with one rank slowed by injected work.",
      },
      {
        scope: "detector",
        value: "End to end",
        result: "profiler plugin to Rust agent to RDMA to coordinator, then a finding, a control and an applied acknowledgement",
        setup: "During real 4-rank DDP training. One node, InfiniBand loopback.",
      },
      {
        scope: "gpubridge",
        value: "2.75×",
        result: "faster 1 GB all-reduce across NVIDIA and AMD with lossy fp8 compression on the bridge",
        setup: "One V100 and one MI50 over TCP: 1.67 s down to 0.61 s.",
      },
      {
        scope: "gpubridge",
        value: "1.10×",
        result: "training throughput of a V100 and an MI50 as a pipeline, over the V100 alone",
        setup: "Best hand-tuned split; the automatic one gave 1.07×. LLaMA-style model, 134M parameters, 500 steps, two runs each.",
      },
    ],
    next: {
      heading: "Next to prove",
      items: [
        "Detection beyond one node, and on AMD with RCCL",
        "A default policy that stays quiet on long healthy runs without tuning",
        "RDMA across machines, on AMD, and with GPUDirect",
        "Larger mixed-vendor jobs, trained to the same numbers as native NCCL",
        "Real production workloads",
      ],
    },
  },

  research: {
    eyebrow: "Next · in development",
    heading: "Teaching a model to suggest the cause.",
    body: "Flagging the slow GPU is half the job. The other half is knowing what to check and what to do about it.",
    today: {
      title: "Today: rules over evidence",
      items: [
        "Every incident becomes a versioned record: what was flagged, the GPUs and software involved, and measurements from before and after.",
        "Likely causes are ranked across power, clocks and configuration; thermal; communication; and host and input. They're ordered by the kind of evidence behind them, never by an invented probability.",
        "Missing or stale evidence is listed as missing, and competing causes stay on the record.",
        "Each record suggests the next check that would separate the leading causes, then tracks the fix and whether the job recovered.",
      ],
    },
    next: {
      title: "Next: a model trained on incidents",
      items: [
        "Train or adapt an LLM on permitted, labeled GPU incident and recovery records.",
        "Have it suggest likely causes, the checks that would confirm them and remedies, citing the evidence it used.",
        "Judge it on held-out, resolved incidents before relying on it. Its suggestions stay hypotheses until the evidence confirms them.",
      ],
    },
    flow: ["Findings and telemetry", "Incident record", "Model", "Causes, checks, remedies", "Outcome"],
    ask: "Have incident write-ups you could share under the right terms? I'd like to hear from you.",
  },

  about: {
    heading: "Built by David Czartoryski",
    role: "Founder",
    photo: { src: "/team/david.webp", alt: "David Czartoryski in a dark suit and tie." },
    body: [
      "David started Artemis to answer one question about distributed training: which GPU is slowing this job down, and why? Answering it across vendors meant building GPUBridge first.",
      "The work runs from PyTorch distributed and a C profiler plugin to Rust agents and RDMA transports, tested on real NVIDIA and AMD GPUs. He studies Computer Science and Business Administration at Northeastern University.",
    ],
    links: [
      { href: "/recruiter/", label: "Résumé" },
      { href: profile.github, label: "GitHub" },
      { href: profile.linkedin, label: "LinkedIn" },
    ],
  },

  feedback: {
    eyebrow: "Feedback",
    heading: "Tell me where this breaks.",
    body: "Artemis is early, and what helps most right now is feedback from people who run multi-node GPU training. Twenty minutes of skepticism is worth more than a compliment.",
    questions: [
      "Which regressions take your team longest to find: clocks and thermals, links, host stalls or software changes?",
      "What would you need to see before letting a tool rebalance work inside a running job?",
      "Do you run, or want to run, NVIDIA and AMD in the same job? Over what interconnect?",
      "What incident data could you share, and on what terms, to train a diagnosis model?",
    ],
    note: "GPUBridge is open source, and issues are welcome. The detector's source is private for now; I'm glad to walk through it on a call.",
  },
} as const;

export const artemisNav = [
  { id: "problem", label: "Problem" },
  { id: "story", label: "Story" },
  { id: "gpubridge", label: "GPUBridge" },
  { id: "transport", label: "RDMA" },
  { id: "detector", label: "Detector" },
  { id: "evidence", label: "Evidence" },
  { id: "research", label: "Research" },
] as const;

export function mailto(subject: string) {
  return `mailto:${artemis.email}?subject=${encodeURIComponent(subject)}`;
}

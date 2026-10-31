// The demo's scenario: one simulated fleet day as a pure function of time.
//
// build(data) reads the page's payload (demo-data.js, written by
// `python -m straggler.fleet.demo export` from the frozen snapshot) and returns a scenario
// whose stateAt(t) gives everything the views show at simulated time t (unix seconds):
// each job's health, throughput, step time and resources, every GPU's owner and state,
// fleet totals, incident stages, what Artemis did, open tickets, the activity log and the
// guide step. Every view draws from one state, so they agree at every moment.
//
// Where the numbers come from:
// - Incidents, diagnoses, actions, recovery checks, tickets, jobs, users, hosts and GPUs
//   are the snapshot's own records. Each part of an incident appears at the time the
//   snapshot records for it (its loop timeline, its facts' first sightings). Records the
//   snapshot gives the same second are spread SPREAD seconds apart, in their recorded
//   order, so a visitor can read them one at a time; times are shown to the minute.
// - Metric curves are synthesized, seeded and deterministic: each job's normal pace is the
//   median of its recorded samples, its slowed pace and the moment it slowed come from its
//   recorded samples in the incident's hour, its pace after a fix is the recovery check's
//   recorded median, and the slow GPU's numbers are the incident's facts (for example
//   util 55 and loader wait 0.42). Small noise around those levels is a hash of the job
//   and the minute, never Math.random().
// - The snapshot renders each hour window on its own (snapshot simplification "hour
//   windows are not chained"), so its later raw samples do not carry a fault forward. The
//   scenario does: a fault lasts from its incident until the snapshot records a fix.
//
// Loads in the page (window.ArtemisScenario) and in Node (module.exports) for the tests.
"use strict";

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ArtemisScenario = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const SPREAD = 8;
  const MINUTE = 60;

  // Small helpers.
  const short = (cid) => (cid && cid.indexOf(":") >= 0 ? cid.slice(cid.indexOf(":") + 1) : cid);
  const median = (xs) => {
    if (!xs.length) return null;
    const s = xs.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const lerp = (a, b, f) => a + (b - a) * clamp(f, 0, 1);
  const gpuParts = (gid) => {
    const m = /^gpu:([^/]+)\/(\d+)$/.exec(gid || "");
    return m ? { host: m[1], index: Number(m[2]) } : null;
  };

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function hash2(a, b) {
    let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be59b, 0xc2b2ae35);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  // Smooth seeded noise in [-1, 1], continuous in t (value noise over minutes).
  function noise(seed, key, t) {
    const k = hashStr(key) ^ seed;
    const m = Math.floor(t / MINUTE);
    const f = t / MINUTE - m;
    const a = hash2(k, m) * 2 - 1, b = hash2(k, m + 1) * 2 - 1;
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  }

  function hhmm(t) {
    const d = new Date(t * 1000);
    return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0");
  }

  // Plain words for the snapshot's ids. The ids stay available deeper down.
  const POLICY = {
    "gpu.inaccessible_fallen_off_bus": { short: "GPU fell off the bus", text: "a GPU fell off the bus, so the node can no longer reach it" },
    "gpu.thermal_power_throttling": { short: "GPU too hot", text: "a GPU is slowing its own clock because it runs too hot" },
    "job.dataloader_stall": { short: "Slow input loading", text: "one rank waits on its input loader, so the GPUs wait for data" },
    "fabric.switch_failure": { short: "Network switch failed", text: "a network switch failed, cutting its rack's nodes off" },
    "none": { short: "No known problem matches", text: "no known problem matches the evidence" },
  };
  const FIX = {
    cordon_node: "Drain the node",
    restart_from_checkpoint: "Restart the job from its last checkpoint",
    node_reboot: "Reboot the node",
    rebalance_work: "Move work off the slow GPU",
    power_thermal_mitigation: "Fix the GPU's cooling or power",
    tune_job_configuration: "Change the job's input loading settings",
    run_active_diagnostic: "Run a hardware diagnostic",
    reseat_or_replace_cable: "Reseat or replace the hardware",
    rma_replace_hardware: "Replace the hardware",
  };
  const policyWords = (p) => POLICY[p] || { short: p, text: p };
  const fixWords = (f) => FIX[f] || f;
  // "rebooting r1n2", "the input loading change for protein-fold": a fix on its target.
  function fixPhrase(fix, targets, jobName) {
    const names = (targets || []).map((x) => (/^job:/.test(x) ? jobName[short(x)] || short(x) : short(x))).join(", ");
    switch (fix) {
      case "cordon_node": return "draining " + names;
      case "node_reboot": return "rebooting " + names;
      case "power_thermal_mitigation": return "the cooling or power fix for " + names;
      case "tune_job_configuration": return "the input loading change for " + names;
      case "rebalance_work": return "moving work off the slow GPU of " + names;
      case "restart_from_checkpoint": return "restarting " + names + " from its last checkpoint";
      default: return fixWords(fix).toLowerCase() + " for " + names;
    }
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const and = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
  // A paused-draining ticket's why is the policy's reasons for each node it did not drain,
  // one after another. Read it into a short summary (what is blocked, why, what a person
  // decides) and the reasons per node; null when it does not read that way.
  // The draining limit's recorded text ("5 automatically cordoned node(s) would exceed 5% of
  // 24 nodes (1.2)") as a sentence that starts with `what` ("Draining them"); null when it
  // does not read that way.
  function limitWords(text, what) {
    const lim = /(\d+) automatically cordoned node\(s\) would exceed ([\d.]+)% of (\d+) nodes/.exec(text || "");
    return lim ? what + " would bring the nodes Artemis drained on its own to " + lim[1] +
      ", over its limit of " + lim[2] + "% of the fleet's " + lim[3] + " nodes, so it stopped and asked for a review." : null;
  }
  // A node repair ticket's why is "host:<node> cordoned by Artemis for <policy>: <what
  // releases it>". Read it, and the ticket's steps, into the same summary; null when it does
  // not read that way.
  function repairBrief(tk) {
    const m = /^host:(\S+) cordoned by Artemis for (\S+): (.*)$/.exec((tk && tk.why) || "");
    if (!m || !POLICY[m[2]]) return null;
    const steps = tk.steps || [];
    const asked = steps.filter((x) => x.tier === "approval").map((x) => fixWords(x.fix).toLowerCase());
    const hands = steps.some((x) => x.tier === "human_only" && /recurs/.test(x.text));
    return {
      blocked: "Artemis drained node " + m[1] + ", so no new work lands on it.",
      why: cap(POLICY[m[2]].text) + "." + (/repair/.test(m[3]) && /check/.test(m[3]) ? " The node stays drained until a person repairs it and the check after the repair passes." : ""),
      decide: (asked.length ? "A person decides whether to " + and(asked) + "." : "A person repairs the node.") +
        (hands ? " If the fault comes back, the steps for a person cover the hands-on repair." : ""),
    };
  }
  // An approval ticket's why is only "approval tier". Its summary comes from the approval it
  // stands for: the fix and its targets, the incident's policy, and who approves.
  function approvalBrief(tk, ap, jobName, jobUser) {
    if (!ap || !POLICY[tk.policy] || tk.why !== "approval tier") return null;
    const pre = (ap.preconditions || []).map((p) => /^(The [a-z ]+? owner)\b.*\bapproves\b/.exec(p.text)).find(Boolean);
    const jobs = (ap.targets || []).filter((x) => /^job:/.test(x)).map(short);
    let who = pre ? pre[1] : "A person";
    if (who === "The job owner" && jobs.length === 1 && jobUser[jobs[0]]) who += ", " + jobUser[jobs[0]] + ",";
    return {
      blocked: cap(fixPhrase(ap.fix, ap.targets, jobName)) + " waits for approval.",
      why: cap(POLICY[tk.policy].text) + ". Artemis does not make this kind of change on its own.",
      decide: who + " decides whether to approve it.",
    };
  }
  function breakerBrief(tk) {
    const why = (tk && tk.why) || "";
    const nodes = [];
    const re = /cordon of (\S+) not run: (.*?)(?=; cordon of |$)/g;
    for (let m = re.exec(why); m; m = re.exec(why)) nodes.push({ host: short(m[1]), reasons: m[2].split("; ") });
    if (!nodes.length) return null;
    const hosts = nodes.map((n) => n.host);
    const leaves = (tk.components || []).filter((c) => /^leaf:/.test(c)).map(short);
    const weak = nodes.every((n) => n.reasons.some((r) => /^no fresh definitive or strong signal/.test(r)));
    const them = nodes.length === 1 ? "it" : "them";
    const blocked = "Artemis did not drain " + and(hosts) + (leaves.length ? ", the nodes behind switch " + and(leaves) : "") + ".";
    const why1 = (limitWords(why, "Draining " + them) || "A safety limit stopped it.") +
      (weak ? " No node shows a strong sign of a fault of its own." : "");
    const step = (tk.steps || []).find((x) => x.fix === "cordon_node");
    const decide = "A person decides whether to drain " + them + " by hand" +
      (step && /until the switch is restored/.test(step.text) && leaves.length ? " until switch " + and(leaves) + " is back" : "") + ".";
    return { blocked, why: why1, decide, nodes };
  }

  function build(data) {
    const seed = hashStr("artemis-demo-" + String((data.about && data.about.seed) || 0));
    const fleet = data.fleet;
    const END = fleet.as_of;
    const jobIds = fleet.jobs.map((j) => short(j.id));
    const jobName = {};
    for (const j of fleet.jobs) jobName[short(j.id)] = j.name;
    const hostRack = {};
    for (const h of data.topology.hosts) hostRack[h.name] = h.rack;
    const rackLeaf = {};
    for (const r of data.topology.racks) rackLeaf[r.name] = r.leaf;
    const gpuLabel = (gid) => {
      const p = gpuParts(gid);
      return p ? "GPU " + p.index + " on " + p.host : gid;
    };
    const jobUser = {};
    for (const j of fleet.jobs) jobUser[short(j.id)] = j.user;
    const ticketsById = {};
    for (const tk of data.tickets.tickets) ticketsById[tk.ticket_id] = tk;

    // ---- Jobs: recorded levels.
    const jobs = {};
    for (const fj of fleet.jobs) {
      const id = short(fj.id);
      const doc = data.jobs[id];
      const samples = (doc.samples_per_s || []).map((p) => [p[0], p[1]]);
      const ranks = doc.ranks.map((r) => ({ rank: r.rank, gpu: r.gpu, host: r.host, latest: r.latest || {} }));
      jobs[id] = {
        id, name: fj.name, user: fj.user, gpus: fj.gpus, hosts: fj.hosts.slice(),
        hostsNow: fj.hosts_now ? fj.hosts_now.slice() : null, samples, ranks,
        incidents: fj.incidents.slice(), finalState: fj.state,
        base: median(samples.map((p) => p[1])) || 1,
        sigma: 0.004,
        phases: [], // [{t, health, level|null, to?, rampFrom?}]
        memFrac: 0.6 + 0.25 * hash2(hashStr("mem-" + id), seed),
        slowRank: null, // {rank, gpu, from, kind, util, clock, loaderWait, ratio, temp}
        moved: null, // {t, from: hosts, to: hosts}
      };
      const vals = samples.map((p) => p[1]);
      const devs = vals.map((v) => Math.abs(v - jobs[id].base) / jobs[id].base).filter((d) => d < 0.03);
      if (devs.length > 4) jobs[id].sigma = clamp(median(devs) * 1.4, 0.002, 0.01);
    }

    // ---- Incidents: the records, with display times.
    const incidents = [];
    const incIndex = {};
    const events = []; // activity log
    let evSeq = 0;
    function addEvent(e) { e.seq = evSeq++; events.push(e); return e; }

    for (const row of fleet.jobs) void row; // (jobs' incident lists are read per incident below)
    const incList = Object.keys(data.incidents).map((iid) => data.incidents[iid])
      .sort((a, b) => a.incident.t_decided - b.incident.t_decided);

    for (const doc of incList) {
      const head = doc.incident;
      const iid = head.incident_id;
      const acts = data.actions[iid] || { actions: [], approvals: [], verify: [], tickets: [] };
      const jobsOf = fleet.jobs.filter((j) => j.incidents.indexOf(iid) >= 0).map((j) => short(j.id));
      const facts = [];
      for (const fam of doc.facts || []) for (const f of fam.facts || []) facts.push(Object.assign({ family: fam.family }, f));
      // A GPU named by an incident with no job of its own (an alert with no policy) belongs to
      // the job on that GPU.
      if (!jobsOf.length) {
        for (const f of facts) {
          const p = gpuParts(f.subject);
          if (!p) continue;
          for (const id of jobIds) if (jobs[id].hosts.indexOf(p.host) >= 0 && jobsOf.indexOf(id) < 0) jobsOf.push(id);
        }
      }

      // Timeline rows with a stage, spread when they share a second; the stage-less rows that
      // follow a row (its preconditions) stay with it.
      const rows = [];
      for (const r of doc.timeline || []) {
        if (r.stage) rows.push({ stage: r.stage, t: r.t, text: r.text, details: [] });
        else if (rows.length) rows[rows.length - 1].details.push(r.text);
      }
      // Facts first seen at a row's second come before the rows of that second.
      const factTimes = {};
      for (const f of facts) factTimes[f.first_seen] = (factTimes[f.first_seen] || 0) + 1;
      const usedAt = {};
      const showAt = (t) => {
        const k = (usedAt[t] || 0);
        usedAt[t] = k + 1;
        return t + k * SPREAD;
      };
      // job.ended facts at the decision second go first.
      const ended = facts.filter((f) => f.name === "job.ended");
      const endedAt = {};
      for (const f of ended) {
        const jid = short(f.subject);
        if (f.first_seen >= head.t_decided - 1) endedAt[jid] = showAt(f.first_seen);
        else endedAt[jid] = f.first_seen;
      }
      let last = null;
      for (const r of rows) {
        const chained = r.stage === "shadow" || (r.stage === "act" && /^chain: /.test(r.text));
        r.tShow = chained && last ? last.tShow : showAt(r.t);
        last = r;
      }

      const rowFor = (stage, test) => rows.find((r) => r.stage === stage && test(r.text));
      const diagRow = rows.find((r) => r.stage === "diagnose");
      const tDiag = diagRow ? diagRow.tShow : head.t_decided;

      // Detection: the earliest sign Artemis records (a flagged finding or an alerting fact).
      const SKIP = /^(source\.|topology\.|job\.throughput|job\.ended|detector\.rank_cause|rank\.hang_state)/;
      let tDetect = Infinity;
      for (const f of facts) if (!SKIP.test(f.name) && f.first_seen > 0 && f.first_seen < tDetect) tDetect = f.first_seen;
      for (const r of rows) if (r.stage === "detect" && r.t < tDetect) tDetect = r.t;
      for (const jid of jobsOf) {
        for (const fd of data.jobs[jid].findings || []) {
          if (fd.state === "flagged" && fd.scope === head.scope && fd.t < tDetect) tDetect = fd.t;
        }
      }
      if (!isFinite(tDetect)) tDetect = head.t_first;

      const actions = (acts.actions || []).map((a) => {
        const r = rowFor("act", (x) => x.indexOf(a.fix + " [") === 0 && x.indexOf(" on " + a.target + ":") > 0);
        return { fix: a.fix, words: fixWords(a.fix), target: a.target, tier: a.tier, status: a.status,
          note: a.note, commands: a.commands || [], preconditions: a.preconditions || [], readback: a.readback || null,
          simulated: a.simulated, tShow: r ? r.tShow : tDiag, t: a.t, row: r || null };
      });
      const approvals = (acts.approvals || []).map((a) => {
        const r = rowFor("approval", (x) => x.indexOf(a.fix + " [") === 0);
        return { id: a.approval_id, fix: a.fix, words: fixWords(a.fix), targets: a.targets || [], tier: a.tier,
          preconditions: a.preconditions || [], why: a.why, tShow: r ? r.tShow : tDiag, t: a.t };
      });
      const verify = (acts.verify || []).map((v) => {
        const after = v.outcome && v.outcome.after_intervention && v.outcome.after_intervention.after;
        const r = rowFor("verify", (x) => x.indexOf(" after " + v.fix + ":") > 0);
        const tAt = r ? r.tShow : after ? after.span.to : tDiag;
        return { fix: v.fix, job: short(v.job), verdict: v.outcome.verdict, healthy: v.healthy,
          after: after ? after.value : null, afterFrom: after ? after.span.from : null, afterN: after ? after.n : null,
          criteria: v.outcome.criteria, tShow: tAt };
      });
      const noteRows = rows.filter((r) => r.stage === "verify" && !verify.some((v) => v.tShow === r.tShow && r.text.indexOf(" after " + v.fix + ":") > 0));
      const tickets = (acts.tickets || []).map((tid) => {
        const tk = ticketsById[tid];
        const r = rowFor("ticket", (x) => x.indexOf(tid + " ") === 0);
        return { id: tid, kind: tk ? tk.kind : null, title: tk ? tk.title : tid, tShow: r ? r.tShow : (tk ? tk.opened_t : tDiag), ticket: tk,
          brief: briefOf(tk) };
      });
      const recoverRow = rows.find((r) => r.stage === "recover");
      const breakerRow = rows.find((r) => r.stage === "breaker");
      const lc = doc.lifecycle || {};

      const inc = {
        id: iid, policy: head.policy, words: policyWords(head.policy), title: head.title, scope: head.scope,
        jobs: jobsOf, components: head.components || [], tFirst: head.t_first, tDetect, tDiag,
        tDecided: head.t_decided, rows, actions, approvals, verify, noteRows, tickets,
        recover: recoverRow ? { tShow: recoverRow.tShow, text: recoverRow.text } : null,
        breaker: breakerRow ? { tShow: breakerRow.tShow, text: breakerRow.text } : null,
        finalState: lc.state || head.status, nodeConfirmed: head.node_confirmed || null,
        causeHypothesis: lc.cause_hypothesis || null, causeNote: lc.cause_note || null,
        model: head.model, facts, endedAt, doc,
      };
      incidents.push(inc);
      incIndex[iid] = inc;
    }

    // ---- Per-incident effects on jobs and GPUs.
    const gpuMarks = []; // {gid, from, to, state, why}
    const hostMarks = []; // {host, from, to, state, why}
    const leafMarks = []; // {leaf, from, state}

    function samplesIn(job, a, b) { return job.samples.filter((p) => p[0] >= a && p[0] <= b); }

    // Throughput change inside an incident's hour: a drop (slowed) or no samples after a
    // point (stalled).
    function changeOf(job, inc) {
      const lo = inc.tFirst - 60, hi = inc.tDecided;
      const win = samplesIn(job, lo, hi);
      const before = job.samples.filter((p) => p[0] < lo).map((p) => p[1]);
      if (before.length > 5 && !job.checkedBase) job.base = median(before);
      if (!win.length) return null;
      const lastS = win[win.length - 1];
      if (hi - lastS[0] > 120) {
        return { kind: "stall", at: lastS[0] + 30, prev: lastS[0] };
      }
      for (let i = 1; i < win.length; i++) {
        if (win[i][1] < job.base * 0.95) {
          const slow = median(win.slice(i).map((p) => p[1]));
          return { kind: "slow", from: win[i - 1][0], at: win[i][0], level: slow };
        }
      }
      return null;
    }

    function factsNamed(inc, name) { return inc.facts.filter((f) => f.name === name); }

    // A job's normal pace is the figure its recovery check compares against, when it has one.
    for (const inc of incidents) for (const v of inc.verify) {
      if (jobs[v.job] && v.healthy) { jobs[v.job].base = v.healthy; jobs[v.job].checkedBase = true; }
    }
    for (const inc of incidents) {
      for (const jid of inc.jobs) {
        const job = jobs[jid];
        const ch = changeOf(job, inc);
        const restart = inc.actions.find((a) => a.fix === "restart_from_checkpoint" && short(a.target) === jid);
        const rebalance = inc.actions.find((a) => a.fix === "rebalance_work" && short(a.target) === jid);
        const v = inc.verify.find((x) => x.job === jid);
        const endedT = inc.endedAt[jid];
        if (ch && ch.kind === "stall") {
          job.phases.push({ t: ch.at, health: "stalled", level: 0, inc: inc.id });
        } else if (ch && ch.kind === "slow") {
          job.phases.push({ t: ch.from, health: "healthy", level: job.base, ramp: true, inc: inc.id });
          job.phases.push({ t: ch.at, health: "slowed", level: ch.level, inc: inc.id });
        }
        if (endedT !== undefined) job.phases.push({ t: endedT, health: "stopped", level: 0, inc: inc.id });
        if (restart) {
          job.phases.push({ t: restart.tShow, health: "restarting", level: 0, inc: inc.id });
          if (inc.recover) {
            const to = jobs[jid].hostsNow;
            if (to) job.moved = { t: inc.recover.tShow, from: job.hosts.slice(), to: to.slice(), inc: inc.id };
          }
          if (v && v.afterFrom) {
            job.phases.push({ t: v.afterFrom - 60, health: "restarting", level: 0, inc: inc.id });
            job.phases.push({ t: v.afterFrom, health: "checking", level: v.after, rampIn: true, inc: inc.id });
          }
        }
        if (rebalance) {
          const lvl = job.phases.length ? job.phases[job.phases.length - 1].level : job.base;
          job.phases.push({ t: rebalance.tShow, health: "checking", level: lvl, ramp: true, inc: inc.id });
          if (v && v.afterFrom) job.phases.push({ t: v.afterFrom, health: "checking", level: v.after, inc: inc.id });
        }
        if (v) {
          job.phases.push({ t: v.tShow, health: v.verdict === "recovered" ? "recovered" : "slowed", level: v.after != null ? v.after : job.base, inc: inc.id });
        }
        // The slow rank and its GPU, from the incident's facts.
        const slowFact = factsNamed(inc, "detector.slow_rank").find((f) => short(f.subject).split("/")[0] === jid);
        if (slowFact && ch && ch.kind === "slow") {
          const rank = Number(short(slowFact.subject).split("/")[1]);
          const r = job.ranks.find((x) => x.rank === rank);
          const gid = r ? r.gpu : null;
          const pick = (name) => factsNamed(inc, name).find((f) => f.subject === gid);
          const clock = pick("gpu.sm_clock"), util = pick("gpu.utilization"), temp = pick("gpu.temperature");
          const lw = factsNamed(inc, "rank.loader_wait_frac").find((f) => f.subject === slowFact.subject);
          const heat = temp ? Math.min(ch.from - 180, temp.first_seen) : null;
          job.slowRank = {
            rank, gpu: gid, from: ch.from, at: ch.at, until: rebalance ? (v ? v.afterFrom : rebalance.tShow) : Infinity,
            ratio: slowFact.measured.ratio || null, loss: slowFact.measured.loss_pct || null, tFlag: slowFact.first_seen,
            clock: clock ? clock.measured.value : null, peerClock: clock ? clock.measured.peer_median : null,
            util: util ? util.measured.value : null, peerUtil: util ? util.measured.peer_median : null,
            temp: temp ? temp.measured.celsius : null, tempLine: temp ? temp.measured.line_c : null, heatFrom: heat,
            loaderWait: lw ? lw.measured.loader_wait_frac : null, loaderLine: lw ? lw.measured.line : null,
            inc: inc.id,
          };
          if (gid) gpuMarks.push({ gid, from: heat !== null ? heat : ch.from, to: Infinity, state: "culprit", inc: inc.id });
        }
      }
      // GPUs and hosts the incident names.
      for (const f of factsNamed(inc, "gpu.fallen_off_bus")) gpuMarks.push({ gid: f.subject, from: f.first_seen, to: Infinity, state: "lost", inc: inc.id });
      for (const f of factsNamed(inc, "gpu.sympathetic_xid")) gpuMarks.push({ gid: f.subject, from: f.first_seen, to: inc.tDiag, state: "culprit", inc: inc.id });
      for (const a of inc.actions) {
        if (a.fix === "cordon_node" && a.status === "done") hostMarks.push({ host: short(a.target), from: a.tShow, to: Infinity, state: "drained", inc: inc.id });
      }
      const downs = factsNamed(inc, "nic.link_downed");
      const ports = factsNamed(inc, "nic.port_down");
      const hostsOf = (fs) => Array.from(new Set(fs.map((f) => short(f.subject).split("/")[0]))).sort();
      if (downs.length) {
        const t0 = Math.min.apply(null, downs.map((f) => f.first_seen));
        for (const h of hostsOf(downs)) hostMarks.push({ host: h, from: t0, to: Infinity, state: "flapping", inc: inc.id });
      }
      if (ports.length) {
        const t1 = Math.min.apply(null, ports.map((f) => f.first_seen));
        for (const h of hostsOf(ports)) hostMarks.push({ host: h, from: t1, to: Infinity, state: "network_down", inc: inc.id });
      }
      for (const c of inc.components) if (/^leaf:/.test(c)) leafMarks.push({ leaf: short(c), from: inc.tDiag, state: "failed", inc: inc.id });
    }
    for (const id of jobIds) jobs[id].phases.sort((a, b) => a.t - b.t);

    // ---- The activity log: what happened and what Artemis did, in plain words.
    const names = (ids) => ids.map((j) => jobName[j] || j);
    const listWords = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
    for (const inc of incidents) {
      const jn = listWords(names(inc.jobs));
      const base = { inc: inc.id, jobs: inc.jobs };
      const once = {};
      const grouped = (name) => { if (once[name]) return true; once[name] = true; return false; };
      for (const f of inc.facts.slice().sort((a, b) => a.first_seen - b.first_seen)) {
        const m = f.measured || {};
        const subj = short(f.subject);
        let text = null, tone = "signal";
        if (f.name === "gpu.fallen_off_bus") text = gpuLabel(f.subject) + " stopped responding. The kernel log says Xid " + m.xid + ", fallen off the bus.";
        else if (f.name === "detector.missing_rank") text = "Rank " + subj.split("/")[1] + " of " + jobName[subj.split("/")[0]] + " stopped reporting.";
        else if (f.name === "detector.hang") text = "Artemis flagged " + jobName[subj] + ". Its ranks stopped making progress.";
        else if (f.name === "gpu.count_below_inventory") text = subj + " now reports " + m.reporting + " of its " + m.inventory + " GPUs.";
        else if (f.name === "job.nccl_timeout") text = jobName[subj] + "'s NCCL watchdog timed out waiting on an all-reduce.";
        else if (f.name === "job.ended") text = jobName[subj] + " failed. The scheduler reports " + (m.state || "FAILED") + ".";
        else if (f.name === "gpu.sympathetic_xid") text = gpuLabel(f.subject) + " reported Xid " + m.xid + ". " + jn + " keeps running.";
        else if (f.name === "detector.slow_rank") text = "Artemis flagged rank " + subj.split("/")[1] + " of " + jobName[subj.split("/")[0]] + " as slow, " + m.loss_pct + "% behind the other ranks.";
        else if (f.name === "gpu.temperature") text = gpuLabel(f.subject) + " reached " + m.celsius + " °C, above the " + m.line_c + " °C line.";
        else if (f.name === "gpu.clocks_event_reason") text = gpuLabel(f.subject) + " is lowering its clock because of heat.";
        else if (f.name === "node.io_pressure") text = subj + " is waiting on disk reads " + Math.round(m.stall_share * 100) + "% of the time.";
        else if (f.name === "rank.loader_wait_frac") text = "Rank " + subj.split("/")[1] + " of " + jobName[subj.split("/")[0]] + " spends " + Math.round(m.loader_wait_frac * 100) + "% of its time waiting for input data.";
        else if (f.name === "nic.link_downed" && !grouped(f.name)) text = "Network links on " + listWords(hostOfFacts(factsNamed(inc, f.name))) + " started dropping.";
        else if (f.name === "nic.port_down" && !grouped(f.name)) text = "Every network port on " + listWords(hostOfFacts(factsNamed(inc, f.name))) + " is down.";
        if (!text) continue;
        const t = f.name === "job.ended" && inc.endedAt[subj] !== undefined ? inc.endedAt[subj] : f.first_seen;
        addEvent(Object.assign({ t, tone, kind: "fact", text, fact: f.id }, base));
      }
      for (const jid of inc.jobs) {
        const st = jobs[jid].phases.find((p) => p.inc === inc.id && p.health === "stalled");
        if (st) addEvent(Object.assign({ t: st.t, tone: "signal", kind: "health", text: jobName[jid] + " stalled. It is no longer completing training steps." }, base, { jobs: [jid] }));
        const sl = jobs[jid].phases.find((p) => p.inc === inc.id && p.health === "slowed");
        if (sl) addEvent(Object.assign({ t: sl.t, tone: "signal", kind: "health", text: jobName[jid] + " slowed to " + Math.round(sl.level) + " samples/s from a normal " + Math.round(jobs[jid].base) + "." }, base, { jobs: [jid] }));
      }
      const diag = inc.rows.find((r) => r.stage === "diagnose");
      if (diag) {
        const text = inc.policy === "none" ? "Diagnosis: " + inc.words.text + ". Artemis takes no action." :
          "Diagnosis for " + jn + ": " + inc.words.text + ".";
        addEvent(Object.assign({ t: diag.tShow, tone: inc.policy === "none" ? "muted" : "signal", kind: "diagnosis", text }, base));
      }
      for (const a of inc.actions) {
        let text, tone = "ctl";
        const tgt = /^job:/.test(a.target) ? jobName[short(a.target)] : short(a.target);
        if (a.fix === "cordon_node" && a.status === "done") text = "Artemis drained node " + tgt + " so no new work lands on it. Simulated: the command went to a fake scheduler.";
        else if (a.fix === "restart_from_checkpoint" && a.status === "done") text = "Artemis restarted " + tgt + " from its last checkpoint, away from the bad node. Simulated: the commands went to a fake scheduler.";
        else if (a.fix === "rebalance_work") text = "Artemis asked " + tgt + " to move work off its slow GPU. Simulated: no control was sent.";
        else if (a.status === "done") text = "Artemis carried out " + fixPhrase(a.fix, [a.target], jobName) + ". Simulated.";
        else if (a.status === "breaker_open") { text = ""; tone = "person"; }
        else { text = cap(fixPhrase(a.fix, [a.target], jobName)) + ": " + a.status + "."; tone = "muted"; }
        if (a.status === "breaker_open" && grouped("breaker_act")) continue;
        if (a.status === "breaker_open") text = "Artemis did not drain " + listWords(inc.actions.filter((x) => x.status === "breaker_open").map((x) => short(x.target))) + ". Draining that many nodes would pass a safety limit.";
        addEvent(Object.assign({ t: a.tShow, tone, kind: "action", text, fix: a.fix }, base));
      }
      for (const ap of inc.approvals) {
        addEvent(Object.assign({ t: ap.tShow, tone: "person", kind: "approval", text: cap(fixPhrase(ap.fix, ap.targets, jobName)) + " waits for a person to approve it." }, base));
      }
      if (inc.recover) {
        const j = inc.jobs.find((x) => jobs[x].moved);
        if (j) addEvent(Object.assign({ t: inc.recover.tShow, tone: "ctl", kind: "recover", text: jobName[j] + " is starting again on " + listWords(jobs[j].moved.to) + ", from its last checkpoint." }, base));
      }
      for (const v of inc.verify) {
        addEvent(Object.assign({ t: v.tShow, tone: "ctl", kind: "verify", text: "Recovery check passed for " + jobName[v.job] + ": " + fmt1(v.after) + " samples/s against a normal " + fmt1(v.healthy) + "." }, base));
      }
      if (inc.breaker) addEvent(Object.assign({ t: inc.breaker.tShow, tone: "person", kind: "breaker", text: "Automatic draining is paused until a person reviews it." }, base));
      for (const tk of inc.tickets) addEvent(Object.assign({ t: tk.tShow, tone: "person", kind: "ticket", text: "Ticket opened for a person: " + ticketWords(tk.ticket) + "." }, base));
    }
    // Every ticket kind leads with the same three lines: what is blocked, why, what a person
    // decides. Null for a ticket whose record does not read the expected way.
    function briefOf(tk) {
      if (!tk) return null;
      if (tk.kind === "breaker") return breakerBrief(tk);
      if (tk.kind === "node_repair") return repairBrief(tk);
      if (tk.kind === "approval") {
        const ap = data.approvals.approvals.find((a) => a.ticket === tk.ticket_id) ||
          data.approvals.approvals.find((a) => a.incident_id === tk.incident_id);
        return approvalBrief(tk, ap, jobName, jobUser);
      }
      return null;
    }
    function hostOfFacts(fs) { return Array.from(new Set(fs.map((f) => short(f.subject).split("/")[0]))).sort(); }
    function fmt1(x) { return x == null ? "?" : (Math.round(x * 10) / 10).toString(); }
    function ticketWords(tk) {
      if (!tk) return "a ticket";
      if (tk.kind === "node_repair") return "repair node " + (tk.hosts || []).map(short).join(", ");
      if (tk.kind === "breaker") return "review the paused draining";
      if (tk.kind === "approval") {
        const ap = data.approvals.approvals.find((a) => a.incident_id === tk.incident_id);
        return ap ? "approve " + fixPhrase(ap.fix, ap.targets, jobName) : tk.title;
      }
      return tk.title;
    }
    events.sort((a, b) => a.t - b.t || a.seq - b.seq);
    events.forEach((e, i) => { e.id = "ev" + i; });

    // ---- The scenario's span and guide.
    const xid = incidents.find((i) => i.policy === "gpu.inaccessible_fallen_off_bus");
    const firstSign = xid ? xid.tDetect : Math.min.apply(null, incidents.map((i) => i.tDetect));
    const START = Math.floor((firstSign - 600) / 300) * 300;

    const steps = buildSteps();

    // A story step lands when the last record it describes becomes visible, so what it says
    // is true on every screen at that moment (tests/fleet_demo_site checks each step's words
    // against stateAt(step.t)).
    function landAt(...ts) { return Math.max.apply(null, ts.filter((x) => typeof x === "number" && isFinite(x))); }

    function buildSteps() {
      const out = [];
      const fleetJobs = jobIds.length;
      const gpuCount = data.topology.gpus.length;
      const allocated = jobIds.reduce((n, id) => n + jobs[id].gpus, 0);
      // Installed is not allocated: say how many GPUs the jobs hold and how many have none.
      out.push({ id: "start", t: START, title: "A normal night",
        text: fleetJobs + " training jobs run on " + allocated + " of the fleet's " + gpuCount + " GPUs. The other " + (gpuCount - allocated) + " have no job. Every job trains at its normal pace.",
        go: "#/fleet", goLabel: "Fleet overview" });
      if (xid) {
        const jid = xid.jobs[0];
        const j = jobs[jid];
        const lost = xid.facts.find((f) => f.name === "gpu.fallen_off_bus");
        const stall = j.phases.find((p) => p.health === "stalled");
        const restart = xid.actions.find((a) => a.fix === "restart_from_checkpoint");
        const cordon = xid.actions.find((a) => a.fix === "cordon_node");
        const v = xid.verify[0];
        const tk = xid.tickets[0];
        if (stall) out.push({ id: "stall", t: stall.t, title: j.name + " stalls", job: jid, inc: xid.id,
          text: (lost ? gpuLabel(lost.subject) + " stopped responding at " + hhmm(lost.first_seen) + ". " : "") +
            "The job's other " + (j.gpus - 1) + " GPUs wait for it, so training stops making progress.",
          go: "#/job/" + jid, goLabel: "Open " + j.name });
        out.push({ id: "diagnosis", t: xid.tDiag, title: "Artemis diagnoses it", job: jid, inc: xid.id,
          text: "At " + hhmm(xid.tDiag) + " Artemis matched the evidence to a known failure: " + xid.words.text + ". The cause stays a hypothesis until someone repairs and tests the node.",
          go: "#/incident/" + xid.id, goLabel: "Read the diagnosis" });
        // The fix step lands when the job is placed on its new nodes, so its words are true
        // on every screen at that moment.
        const tFix = restart ? landAt(restart.tShow, cordon && cordon.tShow, j.moved && j.moved.t) : null;
        if (restart) out.push({ id: "fix", t: tFix, title: "A simulated fix", job: jid, inc: xid.id,
          text: "Artemis drained " + (cordon ? short(cordon.target) : "the node") + " and restarted " + j.name + " from its last checkpoint" +
            (j.moved && j.moved.t <= tFix ? " on " + listWords(j.moved.to) : "") + ". The commands went to a fake scheduler.",
          go: "#/incident/" + xid.id + "/actions", goLabel: "See the fix log" });
        if (v) out.push({ id: "check", t: v.tShow, title: "The recovery check", job: jid, inc: xid.id,
          text: "After the restart Artemis took " + v.afterN + " samples: a median of " + fmt1(v.after) + " samples/s against a normal " + fmt1(v.healthy) +
            ". The job recovered. That confirms the node was the problem. It does not confirm the cause.",
          go: "#/job/" + jid, goLabel: "See the recovery" });
        if (tk) out.push({ id: "ticket", t: tk.tShow, title: "A ticket for a person", job: jid, inc: xid.id, ticket: tk.id,
          text: "Human work remains. Rebooting and repairing " + (tk.ticket && tk.ticket.hosts ? tk.ticket.hosts.map(short).join(", ") : "the node") +
            " needs a person, so Artemis opened a repair ticket. Nobody received it: the queue is simulated.",
          go: "#/tickets/" + tk.id, goLabel: "Open the ticket" });
      }
      const thermal = incidents.find((i) => i.policy === "gpu.thermal_power_throttling");
      if (thermal) {
        const jid = thermal.jobs[0];
        const j = jobs[jid];
        const sr = j.slowRank;
        const v = thermal.verify[0];
        if (sr) out.push({ id: "slowdown", t: sr.at, title: "A slowdown develops", job: jid, inc: thermal.id,
          text: gpuLabel(sr.gpu) + " heats up to " + sr.temp + " °C and drops its clock to " + sr.clock + " MHz. Every step of " + j.name +
            " waits for that GPU, so the whole job slows by about " + Math.round(sr.loss) + "%.",
          go: "#/job/" + jid, goLabel: "Open " + j.name });
        const rb = thermal.actions.find((a) => a.fix === "rebalance_work");
        const cool = thermal.approvals[0];
        if (rb) out.push({ id: "mitigate", t: landAt(rb.tShow, cool && cool.tShow), title: "Work moves off the hot GPU", job: jid, inc: thermal.id,
          text: "Artemis asked " + j.name + " to give the hot GPU less work. This is simulated: no control was sent." + (cool ? " Fixing the cooling itself waits for a person." : ""),
          go: "#/incident/" + thermal.id + "/actions", goLabel: "See what Artemis did" });
        const tk = thermal.tickets[0];
        if (v) out.push({ id: "recheck", t: landAt(v.tShow, tk && tk.tShow), title: "Back to normal pace", job: jid, inc: thermal.id,
          text: "The recovery check reads " + fmt1(v.after) + " samples/s against a normal " + fmt1(v.healthy) + "." + (tk ? " The GPU is still hot, so a ticket asks a person to approve the cooling fix." : ""),
          go: "#/job/" + jid, goLabel: "Open " + j.name });
      }
      const loader = incidents.find((i) => i.policy === "job.dataloader_stall");
      if (loader) {
        const jid = loader.jobs[0];
        const j = jobs[jid];
        const ap = loader.approvals[0];
        out.push({ id: "loader", t: landAt(loader.tDiag, ap && ap.tShow), title: "A fix that needs approval", job: jid, inc: loader.id,
          text: j.name + " runs " + (j.slowRank ? Math.round(j.slowRank.loss) + "% " : "") + "slower because one rank waits on its input loader." +
            (ap ? " The fix changes the job's settings, so it waits for the owner, " + j.user + ", to approve." : ""),
          go: "#/job/" + jid, goLabel: "Open " + j.name });
      }
      const sw = incidents.find((i) => i.policy === "fabric.switch_failure");
      if (sw) {
        const tk = sw.tickets[0];
        out.push({ id: "switch", t: landAt(sw.tDiag, sw.breaker && sw.breaker.tShow, tk && tk.tShow), title: "A switch fails", inc: sw.id,
          text: "Switch " + sw.components.map(short).join(", ") + " failed and " + listWords(names(sw.jobs)) + " stopped." +
            (sw.breaker ? " Draining all its nodes would pass a safety limit, so Artemis paused draining" + (tk ? " and opened a ticket for a person." : ".") : ""),
          go: "#/incident/" + sw.id, goLabel: "Read what happened" });
      }
      out.push({ id: "end", t: END, title: "End of the day",
        text: "That is the simulated day. Every number on these screens came from one clock. Press Replay to watch it again, or move the time slider.",
        go: "#/tickets", goLabel: "See what waits for people" });
      out.sort((a, b) => a.t - b.t);
      return out;
    }

    // ---- Playback pace: simulated seconds per real second at time t. Slow around guide
    // steps, a little faster around other events, fast through quiet hours.
    const zones = [];
    for (const s of steps) zones.push([s.t - 45, s.t + 150, 14]);
    for (const e of events) zones.push([e.t - 120, e.t + 240, 75]);
    function rate(t) {
      let r = 720;
      for (const z of zones) if (t >= z[0] && t < z[1] && z[2] < r) r = z[2];
      return r;
    }

    // ---- State at t.
    function phaseAt(job, t) {
      let p = null, prev = null;
      for (const ph of job.phases) { if (ph.t <= t) { prev = p; p = ph; } else break; }
      return { p, prev };
    }
    function nextPhase(job, t) { return job.phases.find((ph) => ph.t > t) || null; }

    function levelAt(job, t) {
      const { p } = phaseAt(job, t);
      if (!p) return job.base;
      const nx = nextPhase(job, t);
      if (p.ramp && nx) return lerp(p.level, nx.level, (t - p.t) / (nx.t - p.t));
      if (p.rampIn) return lerp(0, p.level, (t - p.t) / 60);
      return p.level;
    }
    function healthAt(job, t) {
      const { p } = phaseAt(job, t);
      return p ? p.health : "healthy";
    }
    function sinceAt(job, t) {
      let since = null;
      let h = "healthy";
      for (const ph of job.phases) {
        if (ph.t > t) break;
        if (ph.health !== h) { since = ph.t; h = ph.health; }
      }
      return since;
    }
    function throughputAt(id, t) {
      const job = jobs[id];
      const lvl = levelAt(job, t);
      if (!lvl) return 0;
      return Math.max(0, lvl * (1 + job.sigma * noise(seed, "thr-" + id, t)));
    }
    function hostsAt(id, t) {
      const j = jobs[id];
      return j.moved && t >= j.moved.t ? j.moved.to : j.hosts;
    }
    const samplesPerStep = {};
    for (const id of jobIds) samplesPerStep[id] = Math.pow(2, Math.round(Math.log2(jobs[id].base * 1.5)));
    function stepTimeAt(id, t) {
      const thr = throughputAt(id, t);
      return thr > 1 ? samplesPerStep[id] / thr : null;
    }
    const running = (h) => h === "healthy" || h === "slowed" || h === "checking" || h === "recovered";

    // One rank's GPU readings (util %, temperature, clock, memory GB, loader wait share).
    function rankAt(id, r, t) {
      const job = jobs[id];
      const h = healthAt(job, t);
      const hosts = hostsAt(id, t);
      const hostIdx = job.hosts.indexOf(r.host);
      const host = hostIdx >= 0 ? hosts[hostIdx] : r.host;
      const gp = gpuParts(r.gpu);
      const gid = "gpu:" + host + "/" + (gp ? gp.index : 0);
      const key = id + "-" + r.rank;
      const L = r.latest || {};
      const lost = gpuMarks.some((m) => m.state === "lost" && m.gid === gid && t >= m.from && t < m.to);
      const out = { rank: r.rank, gpu: gid, host, util: null, temp: null, clock: null, mem: null, loaderWait: null, state: "ok" };
      if (lost) { out.state = "lost"; return out; }
      const n = (k, amp) => amp * noise(seed, k + key, t);
      const warm = job.phases.find((p) => p.rampIn && t >= p.t && t < p.t + 60);
      const on = running(h) || h === "stalled";
      const warmF = warm ? (t - warm.t) / 60 : 1;
      out.util = on ? clamp((L.util_pct || 97) + n("u", 1.5), 0, 100) * warmF : 0;
      out.temp = (L.temp_c || 60) + n("c", 1.2) - (on ? 0 : 22);
      out.clock = on ? (L.sm_clock_mhz || 1400) : 210;
      out.mem = on || h === "restarting" ? 80 * job.memFrac * (h === "restarting" ? 0 : 1) * warmF + n("m", 0.15) : 0;
      out.mem = Math.max(0, out.mem);
      out.loaderWait = on && h !== "stalled" ? clamp(0.035 + n("w", 0.012), 0.005, 0.1) : null;
      const sr = job.slowRank;
      if (sr && sr.rank === r.rank) {
        const heating = sr.heatFrom !== null && t >= sr.heatFrom;
        if (sr.temp !== null && heating) {
          const f = (t - sr.heatFrom) / Math.max(60, sr.at - sr.heatFrom);
          out.temp = lerp(L.temp_c || 60, sr.temp, f) + n("c", 0.5);
          if (t >= sr.from) out.clock = lerp(L.sm_clock_mhz || 1410, sr.clock, (t - sr.from) / Math.max(30, sr.at - sr.from));
          out.state = t >= sr.from ? "culprit" : "warming";
        }
        if (sr.loaderWait !== null && t >= sr.from) {
          const f = (t - sr.from) / Math.max(30, sr.at - sr.from);
          out.loaderWait = lerp(0.04, sr.loaderWait, f) + n("w", 0.006);
          out.util = lerp(L.util_pct || 97, sr.util, f) + n("u", 1);
          out.clock = lerp(L.sm_clock_mhz || 1395, sr.clock, f);
          out.state = "culprit";
        }
        if (sr.util !== null && sr.loaderWait === null && t >= sr.from) out.util = sr.util + n("u", 1);
      }
      out.util = out.util === null ? null : clamp(out.util, 0, 100);
      return out;
    }

    // Slowest rank's step time over the median rank's (1.0 is perfectly even).
    function imbalanceAt(id, t) {
      const job = jobs[id];
      const h = healthAt(job, t);
      if (!(running(h))) return null;
      const sr = job.slowRank;
      let r = 1.018 + 0.008 * noise(seed, "imb-" + id, t);
      if (sr && sr.ratio && t >= sr.from && t < sr.until) {
        r = lerp(r, sr.ratio + 0.006 * noise(seed, "imb2-" + id, t), (t - sr.from) / Math.max(30, sr.at - sr.from));
      }
      return r;
    }

    function jobAt(id, t) {
      const job = jobs[id];
      const health = healthAt(job, t);
      const thr = throughputAt(id, t);
      const ranks = job.ranks.map((r) => rankAt(id, r, t));
      const live = ranks.filter((r) => r.util !== null);
      const incs = incidents.filter((i) => i.jobs.indexOf(id) >= 0 && t >= i.tDetect).map((i) => i.id);
      return {
        id, name: job.name, user: job.user, gpus: job.gpus, hosts: hostsAt(id, t).slice(), health,
        since: sinceAt(job, t), throughput: thr, base: job.base, pct: thr / job.base,
        stepTime: stepTimeAt(id, t), samplesPerStep: samplesPerStep[id],
        util: live.length ? live.reduce((s, r) => s + r.util, 0) / live.length : null,
        mem: live.length ? live.reduce((s, r) => s + (r.mem || 0), 0) / live.length : null,
        imbalance: imbalanceAt(id, t), ranks, incidents: incs,
        slowRank: job.slowRank && t >= job.slowRank.from ? job.slowRank : null,
      };
    }

    const healthOrder = ["stalled", "stopped", "slowed", "restarting", "checking", "recovered", "healthy"];

    function incidentAt(inc, t) {
      if (t < inc.tDetect) return null;
      const seen = (x) => x.tShow <= t;
      const diagnosed = t >= inc.tDiag;
      const actions = inc.actions.filter(seen);
      const approvals = inc.approvals.filter(seen);
      const verify = inc.verify.filter(seen);
      const tickets = inc.tickets.filter(seen);
      let stage;
      if (!diagnosed) stage = "looking";
      else if (inc.policy === "none") stage = "no_action";
      else if (verify.length) stage = tickets.length || approvals.length ? "recovered_waiting" : "recovered";
      else if (actions.some((a) => a.status === "done" || a.status === "simulated")) stage = "fixing";
      else if (approvals.length || tickets.length || (inc.breaker && seen(inc.breaker))) stage = "waiting";
      else stage = "diagnosed";
      const nodeConfirmed = verify.length && inc.nodeConfirmed ? inc.nodeConfirmed.map(short) : null;
      return { id: inc.id, policy: inc.policy, words: inc.words, jobs: inc.jobs, stage, diagnosed,
        tDetect: inc.tDetect, tDiag: inc.tDiag, actions, approvals, verify, tickets,
        breaker: inc.breaker && t >= inc.breaker.tShow ? inc.breaker : null, nodeConfirmed,
        rows: inc.rows.filter((r) => r.tShow <= t) };
    }

    // Every GPU's owner and state; a GPU's job is the job whose hosts hold it at t.
    function gpusAt(t, jobStates) {
      const owner = {};
      for (const id of jobIds) for (const h of jobStates[id].hosts) owner[h] = id;
      const out = {};
      for (const g of data.topology.gpus) {
        const jid = owner[g.host] || null;
        const js = jid ? jobStates[jid] : null;
        let state = js ? "ok" : "idle";
        if (js) {
          if (js.health === "stalled" || js.health === "slowed") state = "affected";
          else if (js.health === "stopped") state = "stopped";
          else if (js.health === "restarting" || js.health === "checking") state = "fixing";
          const rk = js.ranks.find((r) => r.gpu === g.id);
          if (rk && rk.state === "culprit") state = "culprit";
        }
        for (const m of hostMarks) if (m.host === g.host && t >= m.from && t < m.to && m.state === "drained") state = "drained";
        for (const m of gpuMarks) if (m.gid === g.id && t >= m.from && t < m.to) {
          if (m.state === "lost") state = "lost";
          else if (m.state === "culprit" && state !== "lost") state = "culprit";
        }
        out[g.id] = { id: g.id, host: g.host, index: g.index, job: jid, state, rank: js ? (js.ranks.find((r) => r.gpu === g.id) || {}).rank : undefined };
      }
      return out;
    }
    function hostsStateAt(t, jobStates, gpus) {
      const out = {};
      for (const h of data.topology.hosts) {
        let state = "ok", job = null;
        for (const id of jobIds) if (jobStates[id].hosts.indexOf(h.name) >= 0) job = id;
        if (!job) state = "idle";
        for (const m of hostMarks) if (m.host === h.name && t >= m.from && t < m.to) {
          if (m.state === "drained") state = "drained";
          else if (m.state === "network_down") state = "network_down";
          else if (m.state === "flapping" && state !== "network_down") state = "flapping";
        }
        out[h.name] = { name: h.name, rack: h.rack, job, state,
          gpus: data.topology.gpus.filter((g) => g.host === h.name).sort((a, b) => a.index - b.index).map((g) => gpus[g.id]) };
      }
      return out;
    }

    function stateAt(tIn) {
      const t = clamp(tIn, START, END);
      const jobStates = {};
      for (const id of jobIds) jobStates[id] = jobAt(id, t);
      const gpus = gpusAt(t, jobStates);
      const hosts = hostsStateAt(t, jobStates, gpus);
      const leaves = {};
      for (const r of data.topology.racks) {
        const m = leafMarks.find((x) => x.leaf === r.leaf && t >= x.from);
        const flaky = r.hosts.some((h) => hosts[h].state === "network_down" || hosts[h].state === "flapping");
        leaves[r.leaf] = { name: r.leaf, rack: r.name, state: m ? "failed" : flaky ? "suspect" : "ok" };
      }
      const incs = incidents.map((i) => incidentAt(i, t)).filter(Boolean);
      const tickets = [];
      for (const i of incs) for (const tk of i.tickets) tickets.push(Object.assign({ inc: i.id, words: ticketWords(tk.ticket) }, tk));
      tickets.sort((a, b) => a.tShow - b.tShow);
      const approvals = [];
      for (const i of incs) for (const a of i.approvals) approvals.push(Object.assign({ inc: i.id }, a));
      const counts = {};
      for (const h of healthOrder) counts[h] = 0;
      let paceNum = 0, paceDen = 0;
      for (const id of jobIds) {
        const s = jobStates[id];
        counts[s.health] += 1;
        paceNum += s.gpus * Math.min(1.05, s.pct);
        paceDen += s.gpus;
      }
      // "Training normally" is a GPU whose job trains at its normal pace; a GPU of a job that
      // Artemis is restarting or checking counts as fixing, not training.
      const gpuCounts = { total: 0, training: 0, fixing: 0, problem: 0, idle: 0, out: 0 };
      for (const gid in gpus) {
        const g = gpus[gid];
        gpuCounts.total += 1;
        if (g.state === "idle") gpuCounts.idle += 1;
        else if (g.state === "lost" || g.state === "drained") gpuCounts.out += 1;
        else if (g.state === "ok") gpuCounts.training += 1;
        else if (g.state === "fixing") gpuCounts.fixing += 1;
        else gpuCounts.problem += 1;
      }
      const unhealthy = jobIds.filter((id) => ["stalled", "stopped", "slowed"].indexOf(jobStates[id].health) >= 0);
      const atWork = jobIds.filter((id) => ["restarting", "checking"].indexOf(jobStates[id].health) >= 0);
      const activity = events.filter((e) => e.t <= t);
      // What needs attention: unhealthy jobs first, then work waiting for people.
      const attention = [];
      for (const id of unhealthy.slice().sort((a, b) => jobStates[a].since - jobStates[b].since || (a < b ? -1 : 1))) {
        const s = jobStates[id];
        const inc = incs.find((i) => i.jobs.indexOf(id) >= 0 && i.stage !== "no_action");
        attention.push({ key: "job-" + id, kind: "job", tone: "signal", job: id, inc: inc ? inc.id : null, since: s.since,
          title: s.name + " " + s.health + " at " + hhmm(s.since),
          detail: inc && inc.diagnosed ? "Diagnosis: " + inc.words.text + "." : inc ? "Artemis flagged it at " + hhmm(inc.tDetect) + " and is gathering evidence." : "Artemis has not flagged it yet." });
      }
      // Jobs Artemis is restarting or checking: not a problem any more, not done either.
      for (const id of atWork) {
        const s = jobStates[id];
        const inc = incs.find((i) => i.jobs.indexOf(id) >= 0 && i.stage === "fixing");
        attention.push({ key: "fix-" + id, kind: "fixing", tone: "ctl", job: id, inc: inc ? inc.id : null, since: s.since,
          title: s.name + (s.health === "restarting" ? " restarting" : " running again") + " since " + hhmm(s.since),
          detail: s.health === "restarting" ? "Artemis restarted it from its last checkpoint. It trains again once it loads." :
            "Artemis is checking that it is back to its normal pace." });
      }
      for (const tk of tickets) {
        attention.push({ key: "tk-" + tk.id, kind: "ticket", tone: "person", ticket: tk.id, inc: tk.inc, job: incIndex[tk.inc].jobs[0] || null, since: tk.tShow,
          title: "A person needs to " + tk.words, detail: "Ticket opened at " + hhmm(tk.tShow) + "." });
      }
      // An approval whose incident has no ticket yet still waits for a person.
      for (const a of approvals) {
        if (tickets.some((tk) => tk.inc === a.inc)) continue;
        attention.push({ key: "ap-" + a.id, kind: "approval", tone: "person", inc: a.inc, job: incIndex[a.inc].jobs[0] || null, since: a.tShow,
          title: cap(fixPhrase(a.fix, a.targets, jobName)) + " waits for approval", detail: "Artemis asked for it at " + hhmm(a.tShow) + "." });
      }
      for (const i of incs) {
        if (i.stage === "looking" && !i.jobs.some((j) => unhealthy.indexOf(j) >= 0)) {
          attention.push({ key: "inc-" + i.id, kind: "incident", tone: "signal", inc: i.id, job: i.jobs[0] || null, since: i.tDetect,
            title: "Alert on " + listWords(names(i.jobs)) + ", under review", detail: "Artemis decides at " + hhmm(i.tDiag) + "." });
        }
      }
      let step = 0;
      for (let k = 0; k < steps.length; k++) if (steps[k].t <= t) step = k;
      const breaker = incs.find((i) => i.breaker) ? incs.find((i) => i.breaker).breaker : null;
      const totals = {
        jobs: jobIds.length, counts, unhealthy: unhealthy.length, atWork: atWork.length,
        running: jobIds.filter((id) => running(jobStates[id].health)).length,
        pace: paceDen ? paceNum / paceDen : 1, gpus: gpuCounts,
        waiting: tickets.length, approvals: approvals.length,
        forPeople: attention.filter((a) => a.tone === "person").length,
        // The same items by what a person does: approve a fix, repair a node, review the
        // paused draining. They add up to forPeople.
        people: peopleOf(attention, tickets),
        alerts: attention.filter((a) => a.kind === "incident").length,
      };
      // All clear only when nothing is wrong, nothing is being fixed and nothing waits.
      totals.clear = !attention.length && !gpuCounts.problem && !gpuCounts.out && !gpuCounts.fixing && !breaker;
      return {
        t, start: START, end: END, jobs: jobStates, order: jobIds.slice(), gpus, hosts, leaves, incidents: incs,
        tickets, approvals, activity, attention, step, totals, breaker,
        headline: headlineOf(totals, atWork.map((id) => jobStates[id])),
      };
    }

    function peopleOf(attention, tickets) {
      const out = { approve: 0, repair: 0, review: 0 };
      for (const a of attention) {
        if (a.tone !== "person") continue;
        const tk = a.kind === "ticket" ? tickets.find((x) => x.id === a.ticket) : null;
        const kind = tk ? tk.kind : a.kind;
        if (kind === "node_repair") out.repair += 1;
        else if (kind === "breaker") out.review += 1;
        else out.approve += 1;
      }
      return out;
    }

    // The overview's headline, from the same totals as its numbers and its attention list.
    function headlineOf(tt, fixing) {
      const n = (k, one, many) => k + " " + (k === 1 ? one : many);
      const parts = [tt.running + " of " + tt.jobs + " jobs running."];
      if (tt.unhealthy) parts.push(n(tt.unhealthy, "job has", "jobs have") + " a problem.");
      if (fixing.length) {
        const restarting = fixing.filter((j) => j.health === "restarting").length;
        parts.push("Artemis is " + (restarting === fixing.length ? "restarting " : restarting ? "fixing " : "checking ") + listWords(fixing.map((j) => j.name)) + ".");
      }
      if (tt.alerts) parts.push(n(tt.alerts, "alert is", "alerts are") + " under review.");
      if (tt.forPeople) parts.push(n(tt.forPeople, "item waits", "items wait") + " for a person.");
      if (tt.clear) parts.push("Nothing needs attention.");
      else if (parts.length === 1) parts.push(n(tt.gpus.problem + tt.gpus.out, "GPU needs", "GPUs need") + " attention.");
      return parts.join(" ");
    }

    // ---- Series for charts (pure functions of t; the grid is absolute minutes).
    function grid(t0, t1, every) {
      const out = [];
      const a = Math.ceil(t0 / every) * every;
      for (let x = a; x < t1; x += every) out.push(x);
      out.push(t1);
      return out;
    }
    function series(kind, id, t0, t1, every) {
      const ts = grid(Math.max(t0, START), t1, every || MINUTE);
      if (kind === "throughput") return ts.map((x) => [x, throughputAt(id, x)]);
      if (kind === "stepTime") return ts.map((x) => [x, stepTimeAt(id, x)]);
      if (kind === "imbalance") return ts.map((x) => [x, imbalanceAt(id, x)]);
      if (kind === "pace") return ts.map((x) => [x, paceAt(x)]);
      throw new Error("unknown series " + kind);
    }
    function rankSeries(id, t0, t1, every, field) {
      const ts = grid(Math.max(t0, START), t1, every || MINUTE);
      const job = jobs[id];
      return job.ranks.map((r) => ({ rank: r.rank, points: ts.map((x) => [x, rankAt(id, r, x)[field]]) }));
    }
    function paceAt(t) {
      let num = 0, den = 0;
      for (const id of jobIds) {
        const j = jobs[id];
        num += j.gpus * Math.min(1.05, throughputAt(id, t) / j.base);
        den += j.gpus;
      }
      return den ? num / den : 1;
    }

    // Moments worth marking on charts: when a job's health changed.
    function marks(id) {
      const out = [];
      let h = "healthy";
      for (const p of jobs[id].phases) {
        if (p.health !== h) { out.push({ t: p.t, health: p.health, inc: p.inc }); h = p.health; }
      }
      for (const inc of incidents) {
        if (inc.jobs.indexOf(id) < 0) continue;
        out.push({ t: inc.tDiag, health: "diagnosed", inc: inc.id });
      }
      return out.sort((a, b) => a.t - b.t);
    }
    function fleetMarks() {
      const out = [];
      for (const id of jobIds) for (const m of marks(id)) if (m.health !== "diagnosed" && m.health !== "restarting") out.push(Object.assign({ job: id }, m));
      return out.sort((a, b) => a.t - b.t);
    }

    return {
      start: START, end: END, seed, steps, events, rate, stateAt, series, rankSeries, marks, fleetMarks,
      jobIds, jobName, incidents, incIndex, jobs, hhmm, policyWords, fixWords, gpuLabel, short, ticketWords,
      fixPhrase: (fix, targets) => fixPhrase(fix, targets, jobName),
      rackLeaf, hostRack, samplesPerStep, SPREAD,
    };
  }

  return { build, hhmm, short, POLICY, FIX, limitWords };
});

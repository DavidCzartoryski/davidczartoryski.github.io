// Artemis clickable demo (plan step 3): step 2.6's fleet UI (ui/app.js, unchanged) over a
// frozen snapshot of its /v1 API (demo-data.js, built by `python -m straggler.fleet.demo
// build-data`), plus this thin layer.
//
// This file loads before ui/app.js and sets window.Artemis = {source, noBoot}: app.js reads
// every view through source.get(path) and writes through source.post(path, body), and this
// file routes (app.js's routes through Artemis.route, plus #/about).
//
// - get(path) answers from the snapshot. The guided demo replays the Xid 79 incident as a
//   staged reveal: the snapshot holds, per stage, the documents the fleet service computes
//   with that incident's later parts withheld (straggler/fleet/demo/snapshot.py), and the
//   source answers from the current stage.
// - post(path, body) keeps a person's ticket order and approve/deny in this page only.
//   Nothing is sent or stored; an approval-tier fix is never executed (step 2 records
//   approvals as not_executed, and so does this page).
// - Nothing is fetched: the snapshot is a script on this origin. Every text from data goes
//   through text nodes (textContent), never innerHTML.
// - Visits and clicks go to window.ArtemisEvents (demo-events.js), which sends them only in
//   the Vercel export: page_open, every route change, the guided steps, a fact expanded to
//   its raw lines, a ticket reorder and an approve/deny (by approval id, not its note).
"use strict";

(function (root) {
  const B = root.ARTEMIS_DEMO_BUNDLE;
  const doc = root.document;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const enc = encodeURIComponent;
  const NAME = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,63}$/;

  if (!B || !B.documents) {
    doc.addEventListener("DOMContentLoaded", () => {
      doc.getElementById("view").textContent = "The demo data (demo-data.js) did not load.";
    });
    return;
  }
  const G = B.about.guided;
  const STAGES = G.stages;
  const INCIDENT = "#/incident/" + enc(G.incident_id);
  const ACTIONS = "/v1/incidents/" + enc(G.incident_id) + "/actions";

  let page = fresh();
  function track(name, extra) {
    try { if (root.ArtemisEvents) root.ArtemisEvents.send(name, extra); } catch (e) { /* never breaks the page */ }
  }
  const recording = () => !!(root.ArtemisEvents && root.ArtemisEvents.on);
  function fresh() { return { stage: 0, decisions: {}, order: null, seq: 0, note: null }; }

  // Reading: the snapshot at the current stage, then the page's own writes on top.
  function frozen(path, stage) {
    const part = B.stages[STAGES[stage]];
    if (part && own(part, path)) return part[path];
    if (own(B.documents, path)) return B.documents[path];
    return null;
  }
  function copy(v) { return JSON.parse(JSON.stringify(v)); }

  function withDecisions(d) {
    const dec = page.decisions;
    if (!Object.keys(dec).length) return d;
    const mark = (a) => {
      const x = dec[a.approval_id];
      if (x) { a.state = x.decision; a.decision = x; }
    };
    if (d.schema === "fleet-api-approvals-1") {
      d.approvals.forEach(mark);
      d.approvals.sort((a, b) => (a.state !== "pending") - (b.state !== "pending") || b.t - a.t ||
        (a.approval_id < b.approval_id ? -1 : 1));
    }
    if (d.schema === "fleet-api-actions-1") d.approvals.forEach(mark);
    const pending = (iid) => {
      const acts = frozen("/v1/incidents/" + enc(iid) + "/actions", page.stage);
      return acts ? acts.approvals.filter((a) => !dec[a.approval_id]).length : 0;
    };
    if (d.schema === "fleet-api-incidents-1") for (const i of d.incidents) i.approvals_pending = pending(i.incident_id);
    if (d.schema === "fleet-api-incident-1") d.incident.approvals_pending = pending(d.incident.incident_id);
    return d;
  }

  // TicketStore.queue's rule: a person's order puts the tickets it names, in its order, into
  // the places they hold; every other ticket (one opened later, say) keeps its place.
  function withOrder(d) {
    const o = page.order;
    if (!o || d.schema !== "fleet-api-tickets-1") return d;
    const open = new Set(d.order);
    const named = o.order.filter((t) => open.has(t));
    const want = new Set(named);
    let k = 0;
    const seq = d.order.map((t) => (want.has(t) ? named[k++] : t));
    const byId = {};
    for (const t of d.tickets) byId[t.ticket_id] = t;
    d.order = seq;
    d.tickets = seq.map((tid, i) => {
      const t = byId[tid];
      t.position = i + 1;
      if (want.has(tid)) { t.placed_by = o.by; t.reason = null; t.person_why = o.why || null; }
      return t;
    });
    d.ordered_by.person = { by: o.by, t: o.t, why: o.why };
    // TicketStore.queue's in-force text says a person's reorder holds (tickets._in_force_text).
    if (d.ordered_by.in_force_text) d.ordered_by.in_force_text += "; " + o.by + "'s reorder holds for the tickets it names";
    return d;
  }

  async function get(path) {
    const d = frozen(path, page.stage);
    if (d === null) throw new Error("not in the demo snapshot: " + path);
    return withOrder(withDecisions(copy(d)));
  }

  // Writing, in this page only.
  function person(by) {
    const name = typeof by === "string" ? by.trim() : "";
    if (!NAME.test(name) || ["automatic", "model", "fallback"].includes(name.toLowerCase())) {
      throw new Error("a person's name is required (letters, digits, '.', '_', '-', space; at most 64 characters)");
    }
    return "person:" + name;
  }
  function envelope(schema, recorded) {
    const base = B.documents["/v1/fleet"];
    return { schema: schema, api: base.api, data_origin: "simulated", simulated_banner: base.simulated_banner,
      as_of: base.as_of, recorded: recorded };
  }
  function fill(v, who) {
    if (typeof v === "string") return v.split("{person}").join(who);
    if (Array.isArray(v)) return v.map((x) => fill(x, who));
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, x] of Object.entries(v)) out[k] = fill(x, who);
      return out;
    }
    return v;
  }
  const PAGE_ONLY = " (demo: kept in this page only; the decision was not sent, stored or executed)";

  function reorder(body) {
    const order = body && body.order;
    if (!Array.isArray(order) || !order.every((x) => typeof x === "string")) throw new Error("order is a list of ticket ids");
    const why = body.why === undefined ? "" : body.why;
    if (typeof why !== "string" || why.length > 500) throw new Error("why is a note of at most 500 characters");
    const by = person(body.by);
    const open = frozen("/v1/tickets", page.stage).order;
    if (order.length !== new Set(order).size || order.length !== open.length || !order.every((t) => open.includes(t))) {
      throw new Error("a reorder names every open ticket exactly once");
    }
    const t = B.documents["/v1/fleet"].as_of;
    page.order = { by: by, t: t, why: why, order: order.slice() };
    say("Ticket order saved as " + by + PAGE_ONLY + ".");
    return envelope("fleet-api-reorder-1", { decided_by: "person", order: order.slice(), why: why, by: by, t: t });
  }

  function decide(approvalId, body) {
    const decision = body && body.decision;
    if (decision !== "approve" && decision !== "deny") throw new Error("decision is 'approve' or 'deny'");
    const note = body.note === undefined ? "" : body.note;
    if (typeof note !== "string" || note.length > 500) throw new Error("note is at most 500 characters");
    const by = person(body.by);
    const all = frozen("/v1/approvals", page.stage).approvals;
    const a = all.find((x) => x.approval_id === approvalId);
    if (!a) throw new Error("no approval " + approvalId);
    if (page.decisions[approvalId] || a.decision) throw new Error(approvalId + " is already decided");
    if (a.tier_now !== "approval") throw new Error(a.fix + " is at tier '" + a.tier_now + "' in the catalogue now, not approval: nothing is approved");
    if (a.incident_id === G.incident_id && page.stage < STAGES.length - 1) {
      throw new Error("guided demo: open the engineer ticket first (the reboot's approval belongs to that ticket)");
    }
    const tmpl = B.writes.approval_execution[a.fix];
    if (!tmpl) throw new Error("the demo has no execution record for " + a.fix);
    const execution = fill(tmpl[decision], by);
    execution.why += PAGE_ONLY;
    const rec = { seq: ++page.seq, approval_id: approvalId, incident_id: a.incident_id,
      decision: decision === "approve" ? "approved" : "denied", by: by, t: B.documents["/v1/fleet"].as_of,
      note: note, execution: execution };
    page.decisions[approvalId] = rec;
    say((decision === "approve" ? "Approved " : "Denied ") + a.fix + " for " + a.targets.join(", ") + " as " + by +
      PAGE_ONLY + ". Execution: not_executed. Artemis has no command for an approval-tier fix; a person carries it out.");
    return envelope("fleet-api-decision-1", rec);
  }

  async function post(path, body) {
    if (path === "/v1/tickets/order") {
      const out = reorder(body);
      track("ticket_reorder", { detail: out.recorded.order.length + " tickets" });
      return out;
    }
    const m = path.match(/^\/v1\/approvals\/([^/]+)\/decision$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      const out = decide(id, body);
      track(body.decision === "approve" ? "approval_approve" : "approval_deny", { detail: id.slice(0, 160) });
      return out;
    }
    throw new Error("the demo accepts no write to " + path);
  }

  root.Artemis = Object.assign(root.Artemis || {}, { source: { get: get, post: post }, noBoot: true });

  // The page's own DOM (text nodes only).
  function el(tag, attrs, ...kids) {
    const e = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "on") { for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn); continue; }
      e.setAttribute(k, String(v));
    }
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      e.appendChild(typeof k === "object" ? k : doc.createTextNode(String(k)));
    }
    return e;
  }

  function say(text) { page.note = text; drawNote(); }

  // The guided demo: what each step revealed, read from the snapshot of that stage.
  function stageSummary(stage) {
    const inc = frozen("/v1/incidents/" + enc(G.incident_id), stage).incident;
    const acts = frozen(ACTIONS, stage);
    const name = STAGES[stage];
    if (name === "diagnosed") {
      const m = inc.model;
      const shadow = "the shadow model (" + (m.ai ? "AI model in shadow" : "scripted model, not AI") + ", does not act) " +
        (!m.accepted ? "was rejected by the gate" : m.agrees_with_rule && m.agrees_with_rule.policy ? "agrees" : "disagrees");
      return ["Guided demo: the " + inc.title + " alert (window " + inc.scope + "). The rule ranking diagnosed it; " +
        shadow + ". Nothing has run yet. Explore the fleet and the alert, then run the simulated fix."];
    }
    if (name === "fixed") {
      return ["Simulated fix ran through the fake Slurm. No command was sent to any node or scheduler.",
        acts.actions.map((x) => x.fix + " [" + x.tier + "] on " + x.target + ": " + x.status + " (simulated)").join("; ") + ".",
        acts.approvals.map((a) => a.fix + " [" + a.tier + "] waits for a person").join("; ") + (acts.approvals.length ? "." : "")];
    }
    if (name === "verified") {
      const v = acts.actions.filter((x) => x.verify).map((x) => x.target + ": " + x.verify.verdict +
        (x.verify.after ? " (median " + x.verify.after.value + " vs healthy " + x.verify.healthy + " samples/s, simulated)" : ""));
      // A recovery after the node was taken out confirms the node, not the cause (step 2's
      // lifecycle.node_confirmation; the cause stays lifecycle.cause_hypothesis): the note
      // repeats the loop's own cause_note.
      const lc = frozen("/v1/incidents/" + enc(G.incident_id), stage).lifecycle;
      return ["Simulated recovery check: " + (v.join("; ") || "no verify row") + ". No real job ran.",
        lc.node_confirmation ? "Node confirmed, not the cause: " + lc.cause_note + "." : lc.cause_note || ""];
    }
    const q = withOrder(copy(frozen("/v1/tickets", stage))); // the queue the ticket view shows
    const mine = q.tickets.filter((t) => t.incident_id === G.incident_id);
    return [mine.map((t) => "Engineer ticket " + t.ticket_id + " (" + t.kind + "): " + t.title + ", position " +
      t.position + " of " + q.tickets.length + " in the queue").join("; ") + ". It went to no one: the queue is simulated.",
    "Walkthrough done. Reset demo starts it again."];
  }

  const STEPS = [
    { label: "Run simulated fix", go: INCIDENT, event: "step_fix" },
    { label: "Run recovery check", go: INCIDENT, event: "step_verify" },
    { label: "Open engineer ticket", go: "#/tickets", event: "step_ticket" },
  ];

  function drawNote() {
    const box = doc.getElementById("demo-note");
    if (!box) return;
    const lines = stageSummary(page.stage).filter(Boolean);
    box.replaceChildren(el("div", { class: "card demo-card" },
      el("div", null, el("span", { class: "badge sim" }, "simulated"), el("strong", null, "Guided demo, step " + page.stage + " of " + STEPS.length)),
      lines.map((x) => el("p", null, x)),
      page.note ? el("p", { class: "demo-write" }, page.note) : null,
      page.stage === 0 ? el("p", null, el("a", { href: INCIDENT }, "Open the alert")) : null,
      page.stage === STEPS.length ? el("p", null, el("a", { href: "#/tickets" }, "See the ticket queue")) : null));
  }

  function drawBar() {
    const bar = doc.getElementById("demo-bar");
    if (!bar) return;
    const next = STEPS[page.stage];
    bar.replaceChildren(
      el("span", { class: "demo-step" }, "Guided demo · step " + page.stage + " of " + STEPS.length + " · simulated"),
      next ? el("button", { type: "button", class: "primary", id: "demo-next", on: { click: advance } }, next.label) :
        el("span", { class: "demo-done" }, "Walkthrough done"),
      el("button", { type: "button", id: "demo-reset", on: { click: reset } }, "Reset demo"),
      el("a", { class: "demo-about", href: "#/about" }, "About"));
  }

  function draw() { drawNote(); drawBar(); }

  // The render the latest hashchange started.
  let rendering = Promise.resolve();
  function navigated() { track("route"); rendering = render(); }

  // Goes to hash and resolves once its view is drawn: a new hash is rendered by the
  // hashchange handler (which also records the route event), the current one here. Returns
  // the hash it went to.
  async function show(hash) {
    const before = root.location.hash;
    if (before !== hash) {
      let arrived;
      const changed = new Promise((res) => { arrived = res; });
      root.addEventListener("hashchange", arrived, { once: true }); // after navigated()
      root.location.hash = hash;
      const went = root.location.hash;
      if (went !== before) {
        await changed;
        await rendering;
        return went;
      }
      root.removeEventListener("hashchange", arrived);
    }
    const here = root.location.hash;
    await render();
    return here;
  }

  async function advance() {
    const step = STEPS[page.stage];
    if (!step) return;
    track(step.event);
    page.stage += 1;
    page.note = null;
    draw();
    const stage = page.stage;
    const at = await show(step.go);
    if (root.location.hash !== at || page.stage !== stage) return; // the visitor moved on while it loaded
    // Bring what the step revealed into view: the fix log, then the verify line.
    let target = null, block = "start";
    if (STAGES[stage] === "fixed") target = [...doc.querySelectorAll("#view h2")].find((x) => x.textContent === "Fix log");
    if (STAGES[stage] === "verified") {
      target = [...doc.querySelectorAll("#view .card p")].find((x) => x.textContent.startsWith("Verify:"));
      block = "center";
    }
    if (target && target.scrollIntoView) target.scrollIntoView({ block: block });
    else if (!target && root.scrollTo) root.scrollTo(0, 0);
  }

  async function reset() {
    track("step_reset");
    page = fresh();
    draw();
    await show("#/fleet");
    if (root.scrollTo) root.scrollTo(0, 0);
  }

  // #/about: what the demo is and is not.
  function viewAbout() {
    const a = B.about;
    const sec = (title, items) => el("section", null, el("h2", null, title), el("ul", null, items.map((x) => el("li", null, x))));
    return el("div", null,
      el("h1", null, "About this demo"),
      el("div", { class: "card" },
        el("p", null, "This is the Artemis fleet UI (plan step 2.6) running in your browser over a frozen snapshot of its " +
          "/v1 API for one simulated fleet day. Every document was computed by the fleet service from a fleet DB that " +
          "the step-2 code filled; nothing here comes from a live cluster, and nothing you click changes anything " +
          "outside this page."),
        recording() ?
          el("p", { class: "disclosure" }, "This demo records visits and clicks (IP address, approximate location, browser, pages viewed) to learn how it is used.") :
          el("p", null, "This copy records nothing: it sends no visit or click events."),
        el("p", null, "Guided demo: the " + G.policy + " incident (" + G.incident_id + ") is replayed in stages (" +
          G.stages.join(" → ") + "). Before each step the snapshot withholds that incident's later parts; the rest of the " +
          "day is shown as it ended.")),
      sec("What it is not", a.not),
      sec("Simulated", a.simulated),
      sec("Scripted (test code, not AI)", a.scripted),
      sec("Simplifications", a.simplifications),
      el("section", null, el("h2", null, "How the snapshot was made"),
        el("ul", null,
          el("li", null, "Generator " + a.generator + ", seed " + a.seed + "."),
          el("li", null, a.built_from.command + "."),
          el("li", null, "Step 2 code: " + a.built_from.step2.branch + " at " + a.built_from.step2.head + "."),
          el("li", null, "Demo branch " + a.built_from.demo.branch + ", base " + a.built_from.demo.base + ".")),
        el("p", { class: "muted" }, Object.keys(B.documents).length + " documents, each with data_origin \"simulated\".")));
  }

  async function render() {
    const hash = root.location.hash || "#/fleet";
    if (hash === "#/about") {
      // A route() call first, so app.js drops any older navigation still loading (it
      // renders "No such view" for #/about, replaced in the same task).
      root.Artemis.route(hash);
      doc.getElementById("view").replaceChildren(viewAbout());
      return;
    }
    await root.Artemis.route(hash);
  }

  // A fact card (app.js's factCard) opened to its raw source lines: the fact id is the
  // summary's text before " = ".
  function factOpened(e) {
    const d = e.target;
    if (!d || d.tagName !== "DETAILS" || !d.open || !d.querySelector(":scope > .body > div > pre")) return;
    const s = d.querySelector(":scope > summary");
    const node = s && s.childNodes[1];
    const id = node ? String(node.textContent).split(" = ")[0] : "";
    track("fact_expand", { detail: id.replace(/[^\x20-\x7e]/g, "").slice(0, 160) });
  }

  function boot() {
    draw();
    track("page_open", { referrer: String(doc.referrer || "").slice(0, 300) });
    const view = doc.getElementById("view");
    if (view) view.addEventListener("toggle", factOpened, true);
    root.addEventListener("hashchange", navigated);
    render();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else root.setTimeout(boot, 0);
})(window);

// The Artemis fleet demo page: one simulated day of a 192-GPU fleet, driven by one clock.
//
// scenario.js turns the snapshot (demo-data.js) into stateAt(t); this file runs the clock,
// routes between screens and draws them. Every screen reads the same state object, so the
// overview, a job's charts, the topology, the diagnosis, the actions and the recovery
// check agree at every moment.
//
// Rules this file keeps:
// - Nothing is fetched and nothing leaves the page, except visit and click events through
//   window.ArtemisEvents (demo-events.js), which sends only in the Vercel export.
// - Text from data goes through text nodes (textContent), never innerHTML.
// - Values update in place. Lists never re-sort under the pointer or keyboard focus; new
//   items wait until the pointer and focus leave. Focus moves only when the visitor
//   navigates. Screen readers hear state changes, not every tick.
// - Reduced motion: the clock starts paused, the screen redraws at most once a second
//   while playing, and nothing animates.
// - Routes are hashes (#/fleet, #/job/<id>, #/incident/<id>[/evidence|/actions|/record],
//   #/node/<host>, #/tickets[/<id>], #/activity, #/about). Each screen remembers its
//   filter, range, tab, scroll position and focused item for when the visitor comes back.
"use strict";

(function (root) {
  const doc = root.document;
  const DATA = root.ARTEMIS_DEMO_DATA;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  function fail(text) {
    const go = () => { const m = doc.getElementById("main"); if (m) m.textContent = text; };
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", go); else go();
  }
  if (!DATA || !root.ArtemisScenario) { fail("The demo data (demo-data.js) or scenario.js did not load."); return; }

  const S = root.ArtemisScenario.build(DATA);
  const hhmm = S.hhmm;
  const short = S.short;
  const mq = (q) => !!(root.matchMedia && root.matchMedia(q).matches);
  const phoneQuery = root.matchMedia ? root.matchMedia("(max-width: 720px)") : null;
  const phone = () => !!(phoneQuery && phoneQuery.matches);
  const reduced = mq("(prefers-reduced-motion: reduce)");

  function track(name, extra) {
    try { if (root.ArtemisEvents) root.ArtemisEvents.send(name, extra); } catch (e) { /* never breaks the page */ }
  }
  const recording = () => !!(root.ArtemisEvents && root.ArtemisEvents.on);

  // ---- DOM helpers (text nodes only).
  function h(tag, attrs, ...kids) {
    const e = doc.createElement(tag);
    setAttrs(e, attrs);
    append(e, kids);
    return e;
  }
  const SVGNS = "http://www.w3.org/2000/svg";
  function sv(tag, attrs, ...kids) {
    const e = doc.createElementNS(SVGNS, tag);
    setAttrs(e, attrs);
    append(e, kids);
    return e;
  }
  function setAttrs(e, attrs) {
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "on") { for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn); continue; }
      e.setAttribute(k, v === true ? "" : String(v));
    }
  }
  function append(e, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      e.appendChild(typeof k === "object" ? k : doc.createTextNode(String(k)));
    }
  }
  // Redraw part of a screen without losing the visitor's place: when keyboard focus was on
  // something inside, it goes back to the redrawn item with the same data-key (a details'
  // summary goes back to the new details' summary).
  function keepFocus(box, redraw) {
    const a = doc.activeElement;
    const inside = a && a !== box && box.contains(a);
    const keyed = inside ? a.closest("[data-key]") : null;
    const key = keyed && box.contains(keyed) ? keyed.getAttribute("data-key") : null;
    const onSummary = !!(keyed && a.tagName === "SUMMARY" && keyed.tagName === "DETAILS");
    redraw();
    if (!inside || box.contains(doc.activeElement)) return;
    const back = key ? box.querySelector('[data-key="' + cssEscape(key) + '"]') : null;
    const target = back && onSummary ? back.querySelector(":scope > summary") : back;
    if (target) target.focus({ preventScroll: true });
  }
  // The clock can hide, disable or remove the control that has keyboard focus (a recovered
  // job's Inspect issue link, the last step's Next). Focus then goes to the closest thing
  // still on screen: a container that takes focus itself (tabindex), else the first control
  // in it, else the screen's heading. Never to the page body.
  function focusPath() {
    const path = [];
    for (let e = doc.activeElement; e && e !== doc.body && e !== doc.documentElement; e = e.parentElement) path.push(e);
    return path.length ? path : null;
  }
  const shown = (e) => e.isConnected && e.getClientRects().length > 0 && !e.disabled;
  const FOCUSABLE = "a[href], button, input, summary, [tabindex]";
  function rescueFocus(path) {
    if (!path) return;
    const a = doc.activeElement;
    if (a && a !== doc.body && (a !== path[0] || shown(a))) return;
    for (const e of path.slice(1)) {
      if (!shown(e)) continue;
      if (e === main()) { const h1 = e.querySelector("h1"); (h1 || e).focus({ preventScroll: true }); return; }
      const to = e.hasAttribute("tabindex") ? e : Array.from(e.querySelectorAll(FOCUSABLE)).find(shown);
      if (to) { to.focus({ preventScroll: true }); return; }
    }
  }
  function setText(e, text) { const s = String(text); if (e.textContent !== s) e.textContent = s; }
  function setClass(e, cls) { if (e.getAttribute("class") !== cls) e.setAttribute("class", cls); }
  function setAttr(e, k, v) { const s = String(v); if (e.getAttribute(k) !== s) e.setAttribute(k, s); }
  const fmt = (x, d) => (x === null || x === undefined || !isFinite(x) ? "none" : Number(x).toFixed(d === undefined ? 0 : d));
  const pct = (x) => Math.round(x * 100) + "%";
  const listWords = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);
  const jobLink = (id) => "#/job/" + encodeURIComponent(id);
  const incLink = (iid, tab) => "#/incident/" + encodeURIComponent(iid) + (tab ? "/" + tab : "");
  const nodeLink = (host, gpu) => "#/node/" + encodeURIComponent(host) + (gpu !== undefined ? "/" + gpu : "");
  const day = (() => {
    const d = new Date(S.start * 1000);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  })();

  const HEALTH = {
    healthy: { word: "Healthy", tone: "" },
    slowed: { word: "Slowed", tone: "signal" },
    stalled: { word: "Stalled", tone: "signal" },
    stopped: { word: "Stopped", tone: "signal" },
    restarting: { word: "Restarting", tone: "ctl" },
    checking: { word: "Checking recovery", tone: "ctl" },
    recovered: { word: "Recovered", tone: "ctl" },
  };
  function badge() {
    return h("span", { class: "health" });
  }
  // A health word that changes while the visitor watches is emphasized once, briefly (opacity
  // only, nothing moves). Its first drawing is not a change.
  function updateBadge(e, health) {
    const x = HEALTH[health] || { word: health, tone: "" };
    const was = e.getAttribute("data-h");
    setAttr(e, "data-h", health);
    setClass(e, "health" + (x.tone ? " " + x.tone : "") + (e.classList.contains("changed") ? " changed" : ""));
    setText(e, x.word);
    if (was && was !== health) flash(e);
  }
  // The emphasis: never with reduced motion, nor while the visitor drags the time slider.
  function flash(e) {
    if (reduced || scrubbing) return;
    e.classList.remove("changed");
    void e.offsetWidth; // restart the animation
    e.classList.add("changed");
    e.addEventListener("animationend", () => e.classList.remove("changed"), { once: true });
  }
  const STAGE = {
    looking: { word: "Gathering evidence", tone: "signal" },
    diagnosed: { word: "Diagnosed", tone: "signal" },
    fixing: { word: "Fix running", tone: "ctl" },
    waiting: { word: "Waits for a person", tone: "person" },
    recovered: { word: "Recovered", tone: "ctl" },
    recovered_waiting: { word: "Recovered, a person has work", tone: "ctl" },
    no_action: { word: "No action", tone: "" },
  };
  function stageBadge(e, stage) {
    const x = STAGE[stage] || { word: stage, tone: "" };
    const was = e.getAttribute("data-h");
    setAttr(e, "data-h", stage);
    setClass(e, "health" + (x.tone ? " " + x.tone : "") + (e.classList.contains("changed") ? " changed" : ""));
    setText(e, x.word);
    if (was && was !== stage) flash(e);
  }
  function icon(name) {
    const p = {
      play: "M5 3.5v9l8-4.5z",
      pause: "M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z",
      replay: "M3.2 8a4.8 4.8 0 1 0 1.5-3.5M3 2.5v3h3",
      back: "M10 3.5 5.5 8l4.5 4.5",
      next: "M6 3.5 10.5 8 6 12.5",
    }[name];
    const filled = name === "play" || name === "pause";
    return sv("svg", { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": "true" },
      sv("path", { d: p, fill: filled ? "currentColor" : "none", stroke: filled ? "none" : "currentColor", "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round" }));
  }

  // ---- The clock.
  // While it plays, the clock stops at each story step for HOLD_MS of real time (shorter
  // at 2x and 4x), so the step can be read and its link clicked before the story moves on.
  // The hold lasts while the pointer is over the story or keyboard focus is in it. Back,
  // Next and the step's link pause the clock: the visitor has taken over.
  const clock = { t: S.start, playing: !reduced, speed: 1 };
  let state = S.stateAt(clock.t);
  let raf = null, lastFrame = null, lastPaint = 0, scrubbing = false;
  let hold = null; // { step, until } in performance.now() milliseconds
  const PAINT_MS = reduced ? 1000 : 200;
  const HOLD_MS = { 1: 12000, 2: 7000, 4: 4000 };
  function stepCrossed(t0, t1) {
    for (let k = 1; k < S.steps.length - 1; k++) if (S.steps[k].t > t0 && S.steps[k].t <= t1) return k;
    return -1;
  }
  function frame(now) {
    raf = null;
    if (!clock.playing || doc.hidden) { lastFrame = null; return; }
    if (lastFrame !== null) {
      const dt = Math.min(0.25, (now - lastFrame) / 1000);
      if (hold) {
        if (guide.busy()) hold.until = Math.max(hold.until, now + 1500);
        if (now >= hold.until) hold = null;
      } else {
        const next = Math.min(S.end, clock.t + dt * S.rate(clock.t) * clock.speed);
        const k = stepCrossed(clock.t, next);
        if (k > 0) { clock.t = S.steps[k].t; hold = { step: k, until: now + HOLD_MS[clock.speed] }; }
        else clock.t = next;
      }
      if (clock.t >= S.end) clock.playing = false;
    }
    lastFrame = now;
    if (!clock.playing || now - lastPaint >= PAINT_MS) { lastPaint = now; paint(); }
    if (clock.playing) raf = root.requestAnimationFrame(frame);
  }
  function run() {
    if (raf === null && clock.playing && !doc.hidden) { lastFrame = null; raf = root.requestAnimationFrame(frame); }
  }
  function setPlaying(on) {
    if (on && clock.t >= S.end) clock.t = S.start;
    clock.playing = on;
    hold = null;
    paint();
    run();
  }
  function setTime(t) {
    hold = null;
    clock.t = Math.max(S.start, Math.min(S.end, t));
    paint();
  }
  function replay() {
    track("step_reset");
    clock.t = S.start;
    maxStep = 0;
    hold = null;
    clock.playing = !reduced;
    paint();
    run();
  }
  doc.addEventListener("visibilitychange", () => { if (!doc.hidden) run(); });

  // ---- Announcements: state changes only, batched.
  const announcer = () => doc.getElementById("announce");
  let said = null, queue = [], lastSaid = 0;
  function noticeChanges(prev, next) {
    if (!prev || scrubbing || !clock.playing) return;
    for (const id of next.order) {
      if (prev.jobs[id].health !== next.jobs[id].health) queue.push(next.jobs[id].name + " " + HEALTH[next.jobs[id].health].word.toLowerCase() + ".");
    }
    if (prev.step !== next.step) queue.push("Story step " + (next.step + 1) + ": " + S.steps[next.step].title + ".");
    const now = Date.now();
    if (queue.length && now - lastSaid > 2500) {
      const text = hhmm(next.t) + ". " + queue.slice(-3).join(" ");
      queue = [];
      lastSaid = now;
      if (text !== said) { said = text; const a = announcer(); if (a) a.textContent = text; }
    }
  }

  // ---- Paint: one state for every part of the screen.
  let maxStep = 0;
  const STEP_EVENTS = { fix: "step_fix", check: "step_verify", ticket: "step_ticket" };
  function paint() {
    const prev = state;
    const was = focusPath();
    state = S.stateAt(clock.t);
    paintControls();
    guide.update(state);
    paintNav();
    if (view) view.update(state);
    rescueFocus(was);
    noticeChanges(prev, state);
    if (state.step > maxStep) {
      for (let k = maxStep + 1; k <= state.step; k++) {
        const ev = STEP_EVENTS[S.steps[k].id];
        if (ev) track(ev);
      }
      maxStep = state.step;
    }
  }

  // ---- Controls in the header.
  const ctl = {};
  function buildControls() {
    ctl.play = doc.getElementById("play");
    ctl.replay = doc.getElementById("replay");
    ctl.now = doc.getElementById("clock-now");
    ctl.day = doc.getElementById("clock-day");
    ctl.scrub = doc.getElementById("scrub");
    ctl.speed = doc.getElementById("speed");
    ctl.ticks = doc.getElementById("ticks");
    ctl.play.addEventListener("click", () => setPlaying(!clock.playing));
    ctl.replay.replaceChildren(icon("replay"));
    ctl.replay.addEventListener("click", replay);
    ctl.scrub.min = String(S.start);
    ctl.scrub.max = String(S.end);
    ctl.scrub.step = "60";
    ctl.scrub.addEventListener("input", () => { scrubbing = true; setTime(Number(ctl.scrub.value)); });
    ctl.scrub.addEventListener("change", () => { scrubbing = false; setTime(Number(ctl.scrub.value)); });
    for (const sp of [1, 2, 4]) {
      ctl.speed.appendChild(h("button", { type: "button", "data-speed": sp, "aria-pressed": sp === clock.speed ? "true" : "false",
        "aria-label": "Speed " + sp + " times", on: { click: () => { clock.speed = sp; paintControls(); } } }, sp + "×"));
    }
    const span = S.end - S.start;
    const pos = (t) => ((t - S.start) / span) * 100 + "%";
    for (const e of S.events) {
      if (e.tone !== "signal" && e.tone !== "ctl") continue;
      ctl.ticks.appendChild(h("span", { class: e.tone, style: null, "data-t": e.t }));
    }
    for (const st of S.steps) ctl.ticks.appendChild(h("span", { class: "step", "data-t": st.t }));
    // Positions through CSSOM (the page's CSP allows no inline style attributes).
    for (const sp of ctl.ticks.children) sp.style.left = pos(Number(sp.getAttribute("data-t")));
  }
  function paintControls() {
    const playing = clock.playing;
    if (ctl.playing !== playing) {
      ctl.playing = playing;
      ctl.play.replaceChildren(icon(playing ? "pause" : "play"));
      ctl.play.setAttribute("aria-label", playing ? "Pause the simulation" : (clock.t >= S.end ? "Play again from the start" : "Play the simulation"));
    }
    setText(ctl.now, hhmm(clock.t) + " UTC");
    setText(ctl.day, !playing ? day + " · paused" : hold ? day + " · holding" : day + " · running");
    if (!scrubbing) ctl.scrub.value = String(Math.round(clock.t));
    setAttr(ctl.scrub, "aria-valuetext", hhmm(clock.t) + " UTC, simulated");
    for (const b of ctl.speed.children) setAttr(b, "aria-pressed", Number(b.getAttribute("data-speed")) === clock.speed ? "true" : "false");
  }
  function paintNav() {
    const n = doc.getElementById("nav-tickets");
    if (n) setText(n, state.tickets.length ? String(state.tickets.length) : "");
    const cur = currentRoute ? currentRoute.nav : null;
    for (const a of doc.querySelectorAll(".nav a")) {
      if (a.getAttribute("data-nav") === cur) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
  }

  // ---- Calm lists: values update in place; adding, removing or reordering waits while
  // the pointer or keyboard focus is inside.
  function calmList(list, opts) {
    const nodes = new Map();
    const hint = opts.hint || null;
    let drawn = false;
    function busy() {
      return list.matches(":hover") || list.contains(doc.activeElement);
    }
    function sync(items) {
      const keys = items.map(opts.key);
      const cur = Array.from(list.children).filter((c) => c.hasAttribute("data-item")).map((c) => c.getAttribute("data-item"));
      // (The first sync always draws, so an empty list shows its empty text at once.)
      const same = drawn && keys.length === cur.length && keys.every((k, i) => k === cur[i]);
      drawn = true;
      if (!same && busy() && cur.length) {
        if (hint) setText(hint, "New items wait while you point or focus here.");
        for (const it of items) { const n = nodes.get(opts.key(it)); if (n) opts.update(n, it); }
        return;
      }
      if (hint) setText(hint, "");
      if (!same) {
        const keep = new Set(keys);
        for (const [k, n] of nodes) if (!keep.has(k)) { n.remove(); nodes.delete(k); }
        const empty = list.querySelector(":scope > .empty");
        if (empty) empty.remove();
        items.forEach((it) => {
          const k = opts.key(it);
          let n = nodes.get(k);
          if (!n) { n = opts.make(it); n.setAttribute("data-item", k); nodes.set(k, n); }
          list.appendChild(n);
        });
        if (!items.length && opts.empty) list.appendChild(opts.empty());
      }
      for (const it of items) opts.update(nodes.get(opts.key(it)), it);
    }
    return { sync };
  }

  // ---- Charts: thin, labelled, measured in px like the homepage's.
  let chartSeq = 0;
  function chart(opts) {
    const box = h("div", { class: "chart" });
    const headNow = h("span", { class: "now" });
    const head = h("div", { class: "chart-head" }, h("h3", null, opts.title), headNow);
    const legend = opts.legend ? h("ul", { class: "legend" }, opts.legend.map((l) => h("li", null, h("span", { class: "sw " + l.cls, "aria-hidden": "true" }), l.text))) : null;
    const svg = sv("svg", { role: "img", "aria-label": opts.title });
    // Event markers as buttons over the plot: one tab stop, arrow keys between them. Selecting
    // one pauses the clock at that moment and offers the job or incident it belongs to.
    // Markers closer together than a target's width share one target, a pill with their count
    // that opens a short list under the chart, so no target covers another (a phone's
    // whole-day chart puts 04:28, 05:00 and 05:12 within a few pixels).
    const mkBar = h("div", { class: "mk-bar", role: "group", "aria-label": "Events on " + opts.title.split(",")[0].toLowerCase() + ". Arrow keys move between them." });
    const plot = h("div", { class: "plot" }, svg, mkBar);
    const pickId = "mk-pick-" + (++chartSeq);
    const pick = h("div", { class: "mk-pick", id: pickId, "aria-live": "polite" });
    const note = opts.note ? h("p", { class: "chart-note" }, opts.note) : null;
    append(box, [head, legend, plot, pick, note]);
    const btns = new Map();   // first event's key -> its target
    const groups = new Map(); // first event's key -> the events the target holds now
    let picked = null, pickedT = null, opened = null, pickShown = "", drawnFirst = false;
    mkBar.addEventListener("keydown", (e) => {
      const list = Array.from(mkBar.children);
      const i = list.indexOf(doc.activeElement);
      if (i < 0) return;
      const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      const to = list[Math.max(0, Math.min(list.length - 1, j))];
      for (const b of list) b.tabIndex = b === to ? 0 : -1;
      to.focus();
    });
    pick.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !opened) return;
      const b = btns.get(opened);
      opened = null;
      drawPick();
      syncPressed();
      if (b) b.focus();
    });
    function activate(key) {
      const g = groups.get(key);
      if (!g) return;
      if (g.length === 1) { choose(g[0]); return; }
      opened = opened === key ? null : key;
      drawPick();
      syncPressed();
      const first = opened ? pick.querySelector("button") : null;
      if (first) first.focus({ preventScroll: true });
    }
    function choose(m) {
      picked = m.key;
      pickedT = m.t;
      opened = null;
      if (clock.playing) setPlaying(false);
      setTime(m.t);
      drawPick();
      syncPressed();
    }
    function eventLabel(m) { return m.name + " at " + hhmm(m.t); }
    function groupLabel(g) {
      const a = hhmm(g[0].t), b = hhmm(g[g.length - 1].t);
      return g.length + " events " + (a === b ? "at " + a : "from " + a + " to " + b) + ". Choose one.";
    }
    // Under the chart: the open group's list, else the chosen event's note, else nothing.
    function drawPick() {
      const g = opened ? groups.get(opened) : null;
      const m = !g && picked ? Array.from(groups.values()).flat().find((x) => x.key === picked) : null;
      const shownKey = g ? "g:" + g.map((x) => x.key).join(",") : m ? "p:" + m.key : "";
      if (shownKey === pickShown) return;
      pickShown = shownKey;
      keepFocus(pick, () => {
        pick.replaceChildren();
        if (g) {
          append(pick, [h("p", null, groupLabel(g).replace(/\. Choose one\.$/, ". Choose one to pause the clock there.")),
            h("ul", { class: "mk-list" }, g.map((x) => h("li", null, h("button", { type: "button", class: "mk-item", "data-key": "mk-item-" + x.key,
              on: { click: () => choose(x) } }, h("span", { class: "dot " + x.tone, "aria-hidden": "true" }), h("span", { class: "num" }, hhmm(x.t)), " " + x.name))))]);
        } else if (m) {
          append(pick, [h("p", null, h("span", { class: "dot " + m.tone, "aria-hidden": "true" }), hhmm(m.t) + " UTC · " + m.name + ". The clock is paused here. ",
            m.job && opts.markJobLink ? h("a", { href: jobLink(m.job), "data-key": "mk-job-" + m.key }, "Open " + S.jobName[m.job]) : null,
            m.job && opts.markJobLink && m.inc ? " · " : null,
            m.inc ? h("a", { href: incLink(m.inc), "data-key": "mk-inc-" + m.key }, "What happened") : null)]);
        }
      });
    }
    function syncPressed() {
      for (const [k, b] of btns) {
        const g = groups.get(k);
        if (g.length === 1) setAttr(b, "aria-pressed", picked === g[0].key ? "true" : "false");
        else setAttr(b, "aria-expanded", opened === k ? "true" : "false");
        b.classList.toggle("picked", g.some((x) => x.key === picked));
      }
    }
    function groupKeyOf(eventKey) {
      for (const [k, g] of groups) if (g.some((e) => e.key === eventKey)) return k;
      return null;
    }
    function syncMarks(list, x, y0, now) {
      const was = picked || opened, focusIn = pick.contains(doc.activeElement);
      // The note under the chart holds only while the clock stays on the chosen moment.
      if (picked && now !== pickedT) picked = null;
      // Group the events by distance on this chart's width; a target keeps its first event's key.
      const GAP = 28;
      const gs = [];
      for (const m of list) {
        const mx = x(m.t), g = gs[gs.length - 1];
        if (g && mx - g.x1 < GAP) { g.ms.push(m); g.x1 = mx; } else gs.push({ ms: [m], x0: mx, x1: mx });
      }
      groups.clear();
      for (const g of gs) groups.set(g.ms[0].key, g.ms);
      if (opened) opened = groupKeyOf(opened);
      let lost = false;
      for (const [k, b] of btns) if (!groups.has(k)) { lost = lost || b === doc.activeElement; b.remove(); btns.delete(k); }
      for (const g of gs) {
        const m = g.ms[0], many = g.ms.length > 1;
        let b = btns.get(m.key);
        if (!b) {
          b = h("button", { type: "button", "data-key": "mk-" + m.key, tabindex: "-1", on: { click: () => activate(m.key) } }, h("span", { class: "n", "aria-hidden": "true" }));
          // In time order: before the first marker that comes later (a focused one never moves).
          const after = Array.from(mkBar.children).find((c) => Number(c.getAttribute("data-t")) > m.t);
          mkBar.insertBefore(b, after || null);
          btns.set(m.key, b);
          b.setAttribute("data-t", String(m.t));
          if (drawnFirst) flash(b);
        }
        const tone = g.ms.some((e) => e.tone === "signal") ? "signal" : m.tone;
        setClass(b, "mk-b " + tone + (many ? " many" : "") + (b.classList.contains("picked") ? " picked" : "") + (b.classList.contains("changed") ? " changed" : ""));
        setAttr(b, "aria-label", many ? groupLabel(g.ms) : eventLabel(m) + ". Pause the clock here.");
        if (many) { b.removeAttribute("aria-pressed"); setAttr(b, "aria-controls", pickId); }
        else { b.removeAttribute("aria-expanded"); b.removeAttribute("aria-controls"); }
        setText(b.firstChild, many ? String(g.ms.length) : "");
        b.style.left = (g.x0 - 12).toFixed(1) + "px";
        b.style.width = (g.x1 - g.x0 + 24).toFixed(1) + "px";
        b.style.top = (y0 - 14).toFixed(1) + "px";
      }
      syncPressed();
      drawPick();
      // A link or list item under the chart that had focus hands it back to its event's target.
      if (focusIn && !pick.contains(doc.activeElement) && was) {
        const to = btns.get(groupKeyOf(was));
        if (to) to.focus({ preventScroll: true });
      }
      drawnFirst = true;
      const kids = Array.from(mkBar.children);
      if (kids.length && !kids.some((c) => c.tabIndex === 0)) {
        const start = kids.find((c) => c.classList.contains("picked")) || kids[kids.length - 1];
        start.tabIndex = 0;
      }
      // The clock went back past a focused marker: focus the latest one still shown.
      if (lost && kids.length) { for (const c of kids) c.tabIndex = c === kids[kids.length - 1] ? 0 : -1; kids[kids.length - 1].focus({ preventScroll: true }); }
    }
    let width = 0;
    const height = opts.height || 170;
    function update(st) {
      const w = Math.round(box.clientWidth || 0);
      if (!w) return;
      width = w;
      const narrow = width < 420;
      // Room above the plot for up to three rows of marker labels (none when labelRows is 0).
      const rows = opts.labelRows === undefined ? 3 : opts.labelRows;
      const ml = narrow ? 36 : 44, mr = narrow ? 46 : 58, mt = 18 + rows * 11, mb = 24;
      const pw = Math.max(80, width - ml - mr), ph = height - mt - mb;
      const [t0, t1] = opts.range(st);
      const now = st.t;
      const data = opts.get(st, t0, Math.min(now, t1));
      let [lo, hi] = opts.domain(data);
      if (hi - lo < 1e-9) hi = lo + 1;
      const x = (t) => ml + ((t - t0) / (t1 - t0)) * pw;
      const y = (v) => mt + (1 - (v - lo) / (hi - lo)) * ph;
      const kids = [];
      for (const v of opts.ticks(lo, hi)) {
        kids.push(sv("line", { class: "grid", x1: ml, x2: ml + pw, y1: y(v).toFixed(1), y2: y(v).toFixed(1) }));
        kids.push(sv("text", { x: ml - 8, y: (y(v) + 3.5).toFixed(1), "text-anchor": "end" }, opts.fmtTick(v)));
      }
      for (const r of opts.refs ? opts.refs(st, data) : []) {
        if (r.y < lo || r.y > hi) continue;
        kids.push(sv("line", { class: "ref", x1: ml, x2: ml + pw, y1: y(r.y).toFixed(1), y2: y(r.y).toFixed(1) }));
        kids.push(sv("text", { x: ml + pw - 4, y: (y(r.y) - 5).toFixed(1), "text-anchor": "end" }, r.label));
      }
      // Time axis.
      kids.push(sv("line", { class: "axis", x1: ml, x2: ml + pw, y1: mt + ph, y2: mt + ph }));
      const spanS = t1 - t0;
      const every = spanS > 6 * 3600 ? (narrow ? 4 * 3600 : 2 * 3600) : spanS > 2.5 * 3600 ? 3600 : narrow ? 3600 : 1800;
      for (let tt = Math.ceil(t0 / every) * every; tt <= t1; tt += every) {
        kids.push(sv("text", { x: x(tt).toFixed(1), y: mt + ph + 16, "text-anchor": "middle" }, hhmm(tt)));
      }
      if (now < t1) kids.push(sv("line", { class: "nowline", x1: x(now).toFixed(1), x2: x(now).toFixed(1), y1: mt - 4, y2: mt + ph }));
      // Event markers. Labels go on up to three rows above the plot; a label that fits on
      // no row is left out (its line stays, and the job's incident list names it).
      const taken = Array.from({ length: rows }, () => []);
      const shown = [];
      for (const m of opts.marks ? opts.marks(st) : []) {
        if (m.t < t0 || m.t > Math.min(now, t1)) continue;
        shown.push(m);
        const mx = x(m.t);
        kids.push(sv("line", { class: "mk " + m.tone, x1: mx.toFixed(1), x2: mx.toFixed(1), y1: mt - 4, y2: mt + ph }));
        if (!m.label) continue;
        const wl = m.label.length * 6.1 + 4;
        const right = mx + 3 + wl <= ml + pw + mr - 4;
        const a = right ? mx + 3 : mx - 3 - wl, b = right ? mx + 3 + wl : mx - 3;
        const row = taken.findIndex((r) => r.every(([p, q]) => b < p || a > q));
        if (row < 0) continue;
        taken[row].push([a, b]);
        kids.push(sv("text", { class: "mk-l " + m.tone, x: (right ? mx + 3 : mx - 3).toFixed(1), y: 10 + row * 11, "text-anchor": right ? "start" : "end", "aria-hidden": "true" }, m.label));
      }
      // Lines: an underlay keeps highlighted lines readable over the others.
      for (const ln of data.lines) {
        const d = path(ln.points, x, y);
        if (!d) continue;
        if (ln.cls === "hot") kids.push(sv("path", { class: "ln under", d }));
        kids.push(sv("path", { class: "ln " + (ln.cls || ""), d }));
      }
      if (data.cur && data.cur.v !== null && isFinite(data.cur.v) && now <= t1) {
        const cy = y(Math.max(lo, Math.min(hi, data.cur.v)));
        kids.push(sv("circle", { class: "cur" + (data.cur.tone ? " " + data.cur.tone : ""), cx: x(now).toFixed(1), cy: cy.toFixed(1), r: 4 }));
        kids.push(sv("text", { class: "cur-l", x: (x(now) + 9).toFixed(1), y: (cy + 3.5).toFixed(1) }, data.cur.label));
      }
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.replaceChildren(...kids);
      syncMarks(shown, x, mt, st.t);
      setText(headNow, data.now || "");
      setAttr(svg, "aria-label", opts.title + ". " + (data.aria || data.now || "") + " Time from " + hhmm(t0) + " to " + hhmm(t1) + " UTC, simulated.");
    }
    return { el: box, update };
  }
  function path(points, x, y) {
    let d = "", pen = false;
    for (const [t, v] of points) {
      if (v === null || v === undefined || !isFinite(v)) { pen = false; continue; }
      d += (pen ? "L" : "M") + x(t).toFixed(1) + " " + y(v).toFixed(1);
      pen = true;
    }
    return d;
  }
  const niceTicks = (lo, hi, n) => {
    const step = Math.pow(10, Math.floor(Math.log10((hi - lo) / (n || 3))));
    const err = (hi - lo) / (n || 3) / step;
    const s = step * (err >= 5 ? 5 : err >= 2 ? 2 : 1);
    const out = [];
    for (let v = Math.ceil(lo / s) * s; v <= hi + 1e-9; v += s) out.push(Number(v.toFixed(6)));
    return out;
  };
  function markFor(m) {
    const label = { stalled: "stalled", stopped: "stopped", slowed: "slowed", restarting: "fix", checking: "running again",
      recovered: "check passed", diagnosed: "diagnosed" }[m.health] || m.health;
    const tone = ["stalled", "stopped", "slowed"].indexOf(m.health) >= 0 ? "signal" : m.health === "diagnosed" ? "muted" : "ctl";
    const words = { fix: "fix started", "check passed": "recovery check passed" };
    return { t: m.t, tone, label, job: m.job || null, inc: m.inc || null, word: words[label] || label };
  }
  // A marker's key and accessible name: "protein-fold slowed", or for one job's charts just
  // "slowed".
  function named(m, withJob) {
    return Object.assign(m, { key: m.t + "-" + (m.job || "") + "-" + m.label.replace(/ /g, "_"), name: (withJob && m.job ? S.jobName[m.job] + " " : "") + m.word });
  }
  function jobMarks(id) {
    const ms = S.marks(id).map(markFor);
    // A rebalance shows as "fix" (its first checking phase); a restart's "running again" stays.
    const out = [];
    for (const m of ms) {
      const prev = out[out.length - 1];
      if (m.label === "running again" && (!prev || prev.label !== "fix" && prev.label !== "running again")) m.label = "fix";
      if (prev && prev.label === m.label && m.t - prev.t < 300) continue;
      out.push(m);
    }
    return out.map((m) => named(Object.assign(m, { word: m.label === "fix" ? "fix started" : m.word }), false));
  }

  function spark(points, base, tone) {
    const w = 96, hgt = 26;
    const svg = sv("svg", { class: "spark", width: w, height: hgt, viewBox: "0 0 " + w + " " + hgt, "aria-hidden": "true" });
    updateSpark(svg, points, base, tone);
    return svg;
  }
  function updateSpark(svg, points, base, tone) {
    const w = 96, hgt = 26;
    if (!points.length) return;
    const t0 = points[0][0], t1 = points[points.length - 1][0] || t0 + 1;
    const x = (t) => ((t - t0) / Math.max(1, t1 - t0)) * (w - 2) + 1;
    const y = (v) => hgt - 2 - Math.max(0, Math.min(1.1, v / base)) / 1.1 * (hgt - 4);
    svg.replaceChildren(
      sv("line", { class: "ref", x1: 0, x2: w, y1: y(base).toFixed(1), y2: y(base).toFixed(1) }),
      sv("path", { class: "ln" + (tone ? " " + tone : ""), d: path(points, x, y) }));
  }

  // ---- Topology: racks, nodes, GPUs; every GPU names its job.
  const CELL_WORDS = {
    ok: "training normally", idle: "no job", affected: "its job has a problem", stopped: "its job stopped",
    culprit: "the GPU behind the problem", lost: "stopped responding", fixing: "Artemis is restarting or checking its job",
    drained: "drained by Artemis",
  };
  function topology(opts) {
    const el = h("div", null);
    const legend = h("ul", { class: "topo-legend", "aria-label": "Legend" },
      [["", "Training normally"], ["affected", "Job has a problem"], ["culprit", "GPU behind it"], ["lost", "Not responding"],
        ["stopped", "Job stopped"], ["fixing", "Artemis is fixing or checking"], ["drained", "Drained"], ["idle", "No job"]]
        .map(([c, t]) => h("li", null, h("span", { class: "cell sw-cell " + c, "aria-hidden": "true" }), t)));
    const racks = h("div", { class: "racks" });
    const info = h("p", { class: "topo-info", "aria-live": "off" }, "Each square is a GPU. The name above each node is the job running on it. Select a GPU to open its job.");
    el.append(legend, racks, info);
    const cells = [];
    const nodeEls = {};
    for (const r of DATA.topology.racks) {
      const leaf = h("span", { class: "leafsw" }, "switch " + r.leaf);
      const rack = h("section", { class: "rack panel", "aria-label": "Rack " + r.name + ", switch " + r.leaf },
        h("div", { class: "rack-head" }, h("span", { class: "r" }, "Rack " + r.name), leaf));
      for (const host of r.hosts) {
        const jobEl = h("span", { class: "node-job" });
        const note = h("p", { class: "node-note" });
        const grid = h("div", { class: "cells" });
        for (const g of DATA.topology.gpus.filter((x) => x.host === host).sort((a, b) => a.index - b.index)) {
          const c = h("button", { type: "button", class: "cell", "data-gid": g.id, "data-key": "gpu-" + g.id, tabindex: "-1" });
          c.addEventListener("click", () => pick(g.id));
          c.addEventListener("focus", () => { roving = g.id; show(g.id); });
          c.addEventListener("pointerenter", () => show(g.id));
          grid.appendChild(c);
          cells.push(c);
        }
        rack.appendChild(h("div", { class: "node" },
          h("div", { class: "node-head" }, h("a", { href: nodeLink(host), "data-key": "node-" + host }, host), jobEl), grid, note));
        nodeEls[host] = { jobEl, note };
      }
      racks.appendChild(rack);
      nodeEls["leaf:" + r.leaf] = leaf;
    }
    let roving = opts.focus && cells.some((c) => c.getAttribute("data-gid") === opts.focus) ? opts.focus : cells[0].getAttribute("data-gid");
    let last = null;
    racks.addEventListener("keydown", (e) => {
      const i = cells.findIndex((c) => c === doc.activeElement);
      if (i < 0) return;
      const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8, Home: -i, End: cells.length - 1 - i }[e.key];
      if (move === undefined) return;
      e.preventDefault();
      const j = Math.max(0, Math.min(cells.length - 1, i + move));
      cells[j].focus();
    });
    racks.addEventListener("pointerleave", () => show(null));
    function cellText(g, st) {
      const job = g.job ? st.jobs[g.job] : null;
      return "GPU " + g.index + " on " + g.host + ", " + (job ? "job " + job.name + (g.rank !== undefined ? ", rank " + g.rank : "") : "no job") + ", " + CELL_WORDS[g.state];
    }
    function show(gid) {
      if (!gid || !last) {
        setText(info, "Each square is a GPU. The name above each node is the job running on it. Select a GPU to open its job.");
        return;
      }
      const g = last.gpus[gid];
      const job = g.job ? last.jobs[g.job] : null;
      info.replaceChildren(h("strong", null, "GPU " + g.index + " on " + g.host), " · ",
        job ? "job " + job.name + (g.rank !== undefined ? ", rank " + g.rank : "") + " · " + CELL_WORDS[g.state] : "no job, " + CELL_WORDS[g.state]);
    }
    function pick(gid) {
      const g = last ? last.gpus[gid] : null;
      if (!g) return;
      if (opts.onPick) opts.onPick(g);
    }
    function update(st) {
      last = st;
      const hl = opts.highlight ? opts.highlight() : null;
      for (const c of cells) {
        const gid = c.getAttribute("data-gid");
        const g = st.gpus[gid];
        setClass(c, "cell" + (g.state !== "ok" ? " " + g.state : "") + (hl && g.job !== hl ? " dim" : ""));
        setAttr(c, "aria-label", cellText(g, st));
        setAttr(c, "tabindex", gid === roving ? "0" : "-1");
      }
      for (const host in st.hosts) {
        const hs = st.hosts[host];
        const n = nodeEls[host];
        const job = hs.job ? st.jobs[hs.job] : null;
        setText(n.jobEl, job ? job.name : "no job");
        setClass(n.jobEl, "node-job" + (!job ? " none" : HEALTH[job.health].tone === "signal" ? " signal" : ""));
        const note = { drained: "drained by Artemis", network_down: "network down", flapping: "network links dropping" }[hs.state] || "";
        setText(n.note, note);
        setClass(n.note, "node-note" + (hs.state === "drained" ? " ctl" : ""));
      }
      for (const name in st.leaves) {
        const lf = st.leaves[name];
        const e = nodeEls["leaf:" + name];
        setText(e, "switch " + name + (lf.state === "failed" ? " failed" : lf.state === "suspect" ? ", links down" : ""));
        setClass(e, "leafsw" + (lf.state !== "ok" ? " " + lf.state : ""));
      }
    }
    return { el, update };
  }

  // ---- The story guide: one row above the screen (the step, its link, Back and Next) that
  // opens into a panel with the step's text. It sits in the page's flow on every screen
  // size, so it never covers what it points at. On a phone the row holds only the step and
  // Open guide; the link, Back and Next move into the panel.
  const guide = (() => {
    const el = h("section", { class: "guide panel", "aria-labelledby": "guide-title" });
    const count = h("span", { class: "label" });
    const title = h("h2", { id: "guide-title" });
    const holdChip = h("span", { class: "hold-chip", "aria-hidden": "true" });
    const toggle = h("button", { type: "button", class: "btn guide-toggle", "aria-expanded": "false", "aria-controls": "guide-body" }, "Open guide");
    const when = h("p", { class: "when" });
    const text = h("p", { class: "guide-text" });
    const clockState = h("p", { class: "guide-clock" });
    const go = h("a", { class: "btn solid", href: "#/fleet" });
    const prev = h("button", { type: "button", class: "btn", id: "guide-prev" }, icon("back"), "Back");
    const next = h("button", { type: "button", class: "btn", id: "guide-next" }, "Next", icon("next"));
    const progress = h("div", { class: "progress", "aria-hidden": "true" }, S.steps.map(() => h("span")));
    const holdNote = h("p", { class: "hold-note", "aria-live": "off" });
    const how = h("p", { class: "guide-how" }, "While the clock plays it stops at each step so you can read, and waits while you point at the story. Back and Next pause the clock and move it to each step. Moving the clock moves the story too.");
    const goWrap = h("div", { class: "guide-go" }, go);
    const nav = h("div", { class: "guide-nav" }, prev, next);
    const acts = h("div", { class: "guide-act" });
    const body = h("div", { class: "guide-body", id: "guide-body", hidden: true },
      h("div", { class: "guide-words" }, when, text, clockState, holdNote), h("div", { class: "guide-side" }, how));
    el.append(h("div", { class: "guide-row" }, h("div", { class: "guide-step" }, count, title), holdChip, acts, toggle), progress, body);
    prev.addEventListener("click", () => jump(-1));
    next.addEventListener("click", () => jump(1));
    // Following the step's link pauses the clock, so the screen it opens holds still.
    go.addEventListener("click", () => { if (clock.playing) setPlaying(false); });
    const hoverable = mq("(hover: hover)");
    function busy() {
      return (hoverable && el.matches(":hover")) || !!el.querySelector(":focus-visible");
    }
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      setText(toggle, open ? "Close guide" : "Open guide");
      body.hidden = !open;
      el.classList.toggle("open", open);
    });
    // Where the link and Back/Next go: in the row on wider screens, in the panel on phones.
    function place() {
      const small = phone();
      const words = body.querySelector(".guide-words");
      if (small) { words.insertBefore(goWrap, holdNote); body.appendChild(nav); }
      else acts.append(goWrap, nav);
      el.classList.toggle("small", small);
    }
    place();
    if (phoneQuery) { if (phoneQuery.addEventListener) phoneQuery.addEventListener("change", place); else if (phoneQuery.addListener) phoneQuery.addListener(place); }
    let shown = -1;
    function jump(d) {
      const k = Math.max(0, Math.min(S.steps.length - 1, state.step + d));
      // Pause, then land on the step's moment; when two steps share a moment, the later one wins.
      if (clock.playing) { clock.playing = false; hold = null; }
      setTime(S.steps[k].t);
    }
    function update(st) {
      const k = st.step;
      const step = S.steps[k];
      if (shown !== k) {
        shown = k;
        setText(count, "Story " + (k + 1) + "/" + S.steps.length);
        setText(when, hhmm(step.t) + " UTC");
        setText(title, step.title);
        setText(text, step.text);
        setAttr(go, "href", step.go);
        setText(go, step.goLabel);
        Array.from(progress.children).forEach((s, i) => setClass(s, i <= k ? "done" : ""));
      }
      prev.disabled = k === 0;
      next.disabled = k === S.steps.length - 1;
      const left = hold && hold.step === k ? Math.max(1, Math.ceil((hold.until - root.performance.now()) / 1000)) : 0;
      setText(holdNote, left ? "The clock waits here so you can read. It goes on in " + left + " s." : "");
      setText(holdChip, left ? "Clock waits " + left + " s" : "");
      // The first step says what the clock is doing, as the clock bar does.
      setText(clockState, k !== 0 ? "" : clock.playing ? "The clock is running. Watch the overview for the first problem." : "The clock is paused. Press play to start it, or use Next.");
    }
    return { el, update, busy };
  })();

  // ---- Screens.
  const VIEWS = {};
  const memo = {};
  let view = null, currentRoute = null;
  // The job whose dashboard the visitor last opened. An incident shared by two jobs keeps
  // that job in its breadcrumb; screens outside a job (overview, tickets, activity) forget it.
  let fromJob = null;

  function crumbs(items, keyPrefix) {
    const nav = h("nav", { class: "crumbs", "aria-label": "Breadcrumb" });
    items.forEach((it, i) => {
      if (i) nav.appendChild(h("span", { class: "sep", "aria-hidden": "true" }, "/"));
      if (it.href) nav.appendChild(h("a", { href: it.href, class: i === 0 ? "back" : null, "data-key": keyPrefix ? keyPrefix + it.href : null }, i === 0 ? [icon("back"), it.text] : it.text));
      else nav.appendChild(h("span", { class: "here", "aria-current": "page" }, it.text));
    });
    return nav;
  }
  const heading = (text, cls) => h("h1", { class: "display headline " + (cls || ""), tabindex: "-1" }, text);
  // A number with a short label; help, when given, is the definition behind a "?" button.
  let helpSeq = 0;
  function kpi(label, help) {
    const v = h("p", { class: "v" });
    const s = h("p", { class: "s" });
    const top = h("div", { class: "kpi-top" }, h("p", { class: "label" }, label));
    const el = h("div", { class: "kpi" }, top, v, s);
    if (help) {
      const id = "kpi-help-" + (++helpSeq);
      const text = h("p", { class: "kpi-help", id, hidden: true }, help);
      const b = h("button", { type: "button", class: "help-b", "aria-expanded": "false", "aria-controls": id, "aria-label": "What " + label.toLowerCase() + " means",
        "data-key": "help-" + label.toLowerCase().replace(/\W+/g, "-") }, "?");
      b.addEventListener("click", () => {
        const open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", open ? "true" : "false");
        text.hidden = !open;
      });
      top.appendChild(b);
      el.appendChild(text);
    }
    return { el, v, s };
  }
  function setKpi(k, value, small, sub, tone) {
    if (k.v.firstChild && k.v.firstChild.nodeType === 3 && k.v.childNodes.length === (small ? 2 : 1) && k.v.firstChild.textContent === value &&
      (!small || k.v.lastChild.textContent === small)) {
      setClass(k.v, "v" + (tone ? " " + tone : ""));
    } else {
      k.v.replaceChildren(value, small ? h("small", null, small) : "");
      setClass(k.v, "v" + (tone ? " " + tone : ""));
    }
    if (sub !== undefined) setText(k.s, sub);
  }
  function section(title, sub, ...kids) {
    return h("section", { class: "section" },
      h("div", { class: "section-head" }, h("h2", null, title), sub ? (typeof sub === "string" ? h("p", null, sub) : sub) : null), kids);
  }

  // Overview: what is running, what is unhealthy, what needs attention.
  VIEWS.fleet = function (args, m) {
    const el = h("div");
    const eyebrow = h("p", { class: "label eyebrow" }, h("span", null, "Fleet overview"));
    const title = heading("");
    // Under the headline: the first thing that needs attention, as a link, so the next
    // useful click is right there. Redrawn only when that item changes.
    // (It takes focus when the link that had it goes away; see rescueFocus.)
    const lede = h("p", { class: "lede now-line", tabindex: "-1" });
    let ledeKey = null;
    const installed = DATA.topology.gpus.length;
    const k = {
      running: kpi("Jobs running", "Jobs training now, at their normal pace or slower. A stalled, stopped or restarting job is not running."),
      problems: kpi("Jobs with problems", "Jobs that stalled, slowed or stopped and have not been fixed yet."),
      gpus: kpi("GPUs training normally", "GPUs whose job trains at its normal pace, out of the " + installed + " installed. The rest have no job, are out of service, belong to a job with a problem, or to a job Artemis is restarting or checking."),
      pace: kpi("Fleet speed", "Each job's throughput as a share of its normal pace, weighted by its GPUs. 100% means every job runs at its normal pace."),
      people: kpi("Waiting for approval or repair", "Work only a person can do: tickets Artemis opened, and fixes that wait for approval before a ticket exists."),
    };
    const kpis = h("div", { class: "kpis fleet-kpis" }, Object.values(k).map((x) => x.el));
    // Needs attention + what Artemis is doing.
    const attnList = h("ul", { class: "card-list", "aria-label": "Needs attention" });
    const attnHint = h("p", { class: "hold", "aria-live": "off" });
    const attn = calmList(attnList, {
      key: (a) => a.key, hint: attnHint,
      make: (a) => {
        const t = h("span", { class: "t" }), d = h("span", { class: "d" }), go = h("span", { class: "go", "aria-hidden": "true" }, "Open");
        const href = attnHref(a);
        const link = h("a", { class: "attn", href, "data-key": "attn-" + a.key },
          h("span", { class: "dot " + a.tone, "aria-hidden": "true" }), t, go, d);
        link.addEventListener("click", () => { if (a.job) m.selected = a.job; });
        return h("li", null, link);
      },
      update: (n, a) => {
        const link = n.firstChild;
        setClass(link, "attn " + a.tone);
        setText(link.childNodes[1], a.title);
        setText(link.childNodes[3], a.detail);
      },
      empty: () => h("li", { class: "empty" }, "Nothing needs attention right now. Every job runs at its normal pace."),
    });
    const feedList = h("ul", { class: "feed", "aria-label": "Latest fleet activity" });
    const feedHint = h("p", { class: "hold", "aria-live": "off" });
    const feed = calmList(feedList, feedOpts(feedHint));
    const split = h("div", { class: "split section" },
      h("div", null, h("div", { class: "section-head" }, h("h2", null, "Needs attention"), h("p", null, "Problems first, then fixes under way, then work for a person.")), attnList, attnHint),
      h("div", null, h("div", { class: "section-head" }, h("h2", null, "What Artemis is doing"), h("a", { href: "#/activity", class: "muted" }, "All activity")),
        h("div", { class: "panel" }, h("div", { class: "box feed-box" }, feedList, feedHint))));
    // Jobs.
    m.filter = m.filter || "all";
    const filters = h("div", { class: "filters", role: "group", "aria-label": "Show jobs" });
    const chips = {};
    for (const [key, label] of [["all", "All jobs"], ["attention", "Need attention"], ["healthy", "Running normally"]]) {
      const n = h("span", { class: "n" });
      chips[key] = { b: h("button", { type: "button", class: "chip", "aria-pressed": "false", "data-key": "filter-" + key,
        on: { click: () => { m.filter = key; update(state); } } }, label, n), n };
      filters.appendChild(chips[key].b);
    }
    const tbody = h("tbody");
    const rows = {};
    for (const id of S.jobIds) {
      const nm = h("a", { href: jobLink(id), "data-key": "job-" + id, on: { click: () => { m.selected = id; } } }, S.jobName[id]);
      const who = h("div", { class: "who" });
      const b = badge();
      const sp = spark([], 1);
      const num = h("span", { class: "speed-num" });
      const gpus = h("td", { class: "c-gpus muted" });
      // The problem in words, and on an affected row an explicit link to its dashboard. The
      // link is always there (hidden on healthy rows), so rows never change shape under focus.
      const whyText = h("span");
      const inspect = h("a", { class: "inspect", href: jobLink(id), "data-key": "inspect-" + id, "aria-label": "Inspect issue on " + S.jobName[id], hidden: true,
        on: { click: () => { m.selected = id; } } }, "Inspect issue");
      const why = h("td", { class: "c-why why" }, whyText, inspect);
      const tr = h("tr", { class: "row", "data-job": id },
        h("td", { class: "name" }, nm, who), h("td", { class: "c-health" }, b),
        h("td", { class: "c-speed" }, h("div", { class: "speed-cell" }, sp, num)), gpus, why);
      tr.addEventListener("click", (e) => { if (e.target.closest("a")) return; m.selected = id; location.hash = jobLink(id); });
      tr.addEventListener("pointerenter", () => { hover = id; topo.update(state); });
      tr.addEventListener("pointerleave", () => { hover = null; topo.update(state); });
      nm.addEventListener("focus", () => { hover = id; topo.update(state); });
      nm.addEventListener("blur", () => { hover = null; topo.update(state); });
      rows[id] = { tr, who, b, sp, num, gpus, whyText, inspect };
      tbody.appendChild(tr);
    }
    // A row held for focus goes once focus leaves it, even while the clock is paused.
    tbody.addEventListener("focusout", () => root.setTimeout(() => { if (el.isConnected) update(state); }, 0));
    let hover = null;
    const table = h("table", { class: "jobs" },
      h("caption", { class: "sr-only" }, "Jobs on the fleet, with their health, training speed and GPUs"),
      h("thead", null, h("tr", null, ["Job", "Health", "Training speed, last hour", "GPUs", "Problem"].map((t) => h("th", { class: "label", scope: "col" }, t)))),
      tbody);
    // Fleet speed chart.
    const fleetChart = chart({
      title: "Fleet training speed today", height: 140, labelRows: 0,
      note: "Each job's throughput as a share of its normal pace, weighted by its GPUs. A dip is a job that slowed or stopped. Orange marks a problem, green a fix or recovery.",
      legend: [{ cls: "", text: "Fleet speed" }, { cls: "ref", text: "Normal pace" }, { cls: "mk-signal", text: "Problem" }, { cls: "mk-ctl", text: "Fix or recovery" }],
      range: () => [S.start, S.end],
      get: (st, t0, t1) => {
        const pts = S.series("pace", null, t0, t1, 120);
        return { lines: [{ points: pts.map(([t, v]) => [t, v * 100]) }], cur: { v: st.totals.pace * 100, label: pct(st.totals.pace) },
          now: pct(st.totals.pace) + " of normal at " + hhmm(st.t), aria: "Now " + pct(st.totals.pace) + " of normal." };
      },
      domain: () => [0, 110], ticks: () => [0, 50, 100], fmtTick: (v) => v + "%",
      refs: () => [{ y: 100, label: "normal" }],
      markJobLink: true,
      marks: () => S.fleetMarks().map(markFor).filter((x) => x.label !== "running again")
        .map((x) => named(Object.assign({}, x, { label: "" }), true)),
    });
    const topo = topology({
      focus: m.topoFocus, highlight: () => hover,
      onPick: (g) => { if (g.job) { m.selected = g.job; location.hash = jobLink(g.job); } else location.hash = nodeLink(g.host); },
    });
    // What is running and how fast first, then the jobs, then what needs attention and what
    // Artemis did, then where the jobs run. On a phone the headline already gives the totals,
    // so the chart comes before the numbers and starts on the first screen (moved in the
    // page, not only drawn there, so keyboard order follows).
    const chartPanel = h("div", { class: "panel chart-box fleet-chart" }, fleetChart.el);
    function place() {
      const small = phone();
      if ((chartPanel.nextElementSibling === kpis) !== small) el.insertBefore(chartPanel, small ? kpis : kpis.nextSibling);
    }
    el.append(eyebrow, title, lede, kpis, chartPanel,
      section("Jobs", filters, table),
      split,
      section("Where jobs run", "6 racks, each behind one network switch. 4 nodes per rack, 8 GPUs per node.", topo.el));
    function update(st) {
      place();
      const tt = st.totals;
      const bad = tt.unhealthy;
      setText(eyebrow.firstChild, "Fleet overview · " + hhmm(st.t) + " UTC");
      // The headline, the lede, the numbers and "Needs attention" all read the same state.
      setText(title, st.headline);
      const top = st.attention[0] || null;
      const more = st.attention.length - 1;
      const lk = top ? [top.key, top.title, more].join("|") : tt.clear ? "clear|" + tt.gpus.training : "gpus|" + tt.gpus.problem + "|" + tt.gpus.out;
      if (lk !== ledeKey) {
        ledeKey = lk;
        keepFocus(lede, () => {
          if (top) {
            lede.replaceChildren(h("span", { class: "dot " + top.tone, "aria-hidden": "true" }), top.title + ". ",
              h("a", { href: attnHref(top), "data-key": "now-" + top.key, on: { click: () => { if (top.job) m.selected = top.job; } } }, top.kind === "ticket" ? "Open the ticket" : "Inspect issue"),
              more > 0 ? h("span", { class: "faint" }, " · " + more + " more under Needs attention") : "");
          } else if (tt.clear) lede.replaceChildren("Every job trains at its normal pace on " + tt.gpus.training + " GPUs.");
          else lede.replaceChildren(tt.gpus.problem + " GPUs with a problem and " + tt.gpus.out + " out of service.");
        });
      }
      setKpi(k.running, String(tt.running), "of " + tt.jobs, tt.counts.healthy + " healthy, " + tt.counts.recovered + " recovered" +
        (tt.counts.restarting ? ", " + tt.counts.restarting + " restarting" : ""));
      setKpi(k.problems, String(bad), "", bad ? listWords(S.jobIds.filter((id) => ["stalled", "stopped", "slowed"].indexOf(st.jobs[id].health) >= 0).map((id) => st.jobs[id].name)) : "None", bad ? "signal" : "");
      setKpi(k.gpus, String(tt.gpus.training), "of " + tt.gpus.total, [tt.gpus.fixing ? tt.gpus.fixing + " restarting or checking" : "",
        tt.gpus.problem ? tt.gpus.problem + " with a problem" : "", tt.gpus.out ? tt.gpus.out + " out of service" : "", tt.gpus.idle + " idle"].filter(Boolean).join(", "));
      setKpi(k.pace, pct(tt.pace), "", "of normal", tt.pace < 0.97 ? "signal" : "");
      setKpi(k.people, String(tt.forPeople), "", tt.forPeople ? tt.waiting + (tt.waiting === 1 ? " ticket, " : " tickets, ") + tt.approvals + (tt.approvals === 1 ? " fix needs" : " fixes need") + " approval" : "Nothing", tt.forPeople ? "signal" : "");
      attn.sync(st.attention);
      feed.sync(st.activity.slice(-6).reverse());
      const counts = { all: S.jobIds.length, attention: 0, healthy: 0 };
      for (const id of S.jobIds) {
        const js = st.jobs[id];
        const needs = HEALTH[js.health].tone === "signal";
        if (needs) counts.attention += 1; else counts.healthy += 1;
        const r = rows[id];
        // A row the filter no longer shows stays while keyboard focus is in it.
        const hide = !(m.filter === "all" || (m.filter === "attention" ? needs : !needs));
        if (!hide || !r.tr.contains(doc.activeElement)) r.tr.hidden = hide;
        r.tr.classList.toggle("selected", m.selected === id);
        r.tr.classList.toggle("hl", hover === id);
        setText(r.who, js.user);
        updateBadge(r.b, js.health);
        const pts = S.series("throughput", id, st.t - 3600, st.t, 120);
        updateSpark(r.sp, pts, js.base, needs ? "signal" : "");
        r.num.replaceChildren(fmt(js.throughput) + " samples/s ", h("span", { class: "pct" + (js.pct < 0.95 ? " signal" : "") }, pct(js.pct)));
        setText(r.gpus, js.gpus + " on " + js.hosts.length + (js.hosts.length === 1 ? " node" : " nodes"));
        const inc = st.incidents.find((i) => i.jobs.indexOf(id) >= 0 && i.policy !== "none" && (i.stage !== "recovered" || true));
        setText(r.whyText, inc ? (inc.diagnosed ? inc.words.short : "Under review") : "None");
        const affected = !!inc && (needs || js.health === "restarting" || js.health === "checking");
        if (r.inspect.hidden === affected) r.inspect.hidden = !affected;
      }
      for (const key in chips) {
        setAttr(chips[key].b, "aria-pressed", m.filter === key ? "true" : "false");
        setText(chips[key].n, String(counts[key]));
      }
      fleetChart.update(st);
      topo.update(st);
    }
    return { el, update, save: () => ({ topoFocus: (doc.activeElement && doc.activeElement.getAttribute("data-gid")) || m.topoFocus }) };
  };

  function attnHref(a) {
    return a.kind === "ticket" ? "#/tickets/" + a.ticket : a.kind === "approval" ? incLink(a.inc, "actions") : a.job ? jobLink(a.job) : incLink(a.inc);
  }

  function feedOpts(hint) {
    return {
      key: (e) => e.id, hint,
      make: (e) => {
        const what = h("span", { class: "what" });
        return h("li", null, h("span", { class: "when" }, hhmm(e.t)), h("span", { class: "dot " + e.tone, "aria-hidden": "true" }), what);
      },
      update: (n, e) => {
        const what = n.lastChild;
        if (!what.firstChild) {
          what.append(e.text, " ");
          if (e.jobs && e.jobs.length === 1) what.append(h("a", { href: jobLink(e.jobs[0]), "data-key": "feed-" + e.id }, "Open " + S.jobName[e.jobs[0]]));
          else if (e.inc) what.append(h("a", { href: incLink(e.inc), "data-key": "feed-" + e.id }, "What happened"));
        }
      },
      empty: () => h("li", { class: "empty" }, "Nothing has happened yet today."),
    };
  }

  // A job's health dashboard.
  // Its summary: one sentence on how the job performs (lead), what happens about it now
  // (now: a fix, an approval, a ticket), and why (the signal behind it and the diagnosis).
  function jobSummary(st, id) {
    const js = st.jobs[id];
    const job = S.jobs[id];
    const inc = st.incidents.filter((i) => i.jobs.indexOf(id) >= 0 && i.policy !== "none").slice(-1)[0] || null;
    const full = inc ? S.incIndex[inc.id] : null;
    const pace = fmt(js.throughput) + " samples/s against a normal " + fmt(js.base);
    const sr = js.slowRank;
    const rk = sr ? js.ranks.find((r) => r.rank === sr.rank) : null;
    const lost = full ? full.facts.find((f) => f.name === "gpu.fallen_off_bus") : null;
    let lead = "";
    const now = [], why = [];
    const since = js.since ? hhmm(js.since) : null;
    switch (js.health) {
      case "healthy":
        lead = "Training runs at its normal pace: " + pace + ".";
        break;
      case "stalled":
        lead = "Training stalled at " + since + ".";
        why.push(lost ? S.gpuLabel(lost.subject) + " stopped responding and the other " + (js.gpus - 1) + " GPUs wait for it." : "Its ranks stopped completing steps.");
        break;
      case "stopped":
        lead = "The job failed at " + since + " after it stalled.";
        break;
      case "slowed":
        lead = "Training is " + Math.round((1 - js.pct) * 100) + "% slower than its normal pace since " + since + ": " + pace + ".";
        if (sr && rk && sr.temp !== null) why.push(S.gpuLabel(rk.gpu) + " is at " + fmt(rk.temp) + " °C and runs its clock at " + fmt(rk.clock) + " MHz. The other GPUs run near " + fmt(sr.peerClock) + " MHz and wait for it at every step.");
        if (sr && rk && sr.loaderWait !== null) why.push("Rank " + sr.rank + " on " + rk.host + " spends " + pct(rk.loaderWait) + " of its time waiting for input data, so its GPU sits at " + fmt(rk.util) + "% busy and the other GPUs wait for it.");
        break;
      case "restarting":
        lead = "Artemis restarted the job from its last checkpoint at " + since + ", away from the bad node." + (job.moved && st.t >= job.moved.t ? " It is loading on " + listWords(js.hosts) + "." : "");
        break;
      case "checking":
        lead = "The job is training again: " + pace + ".";
        now.push("Artemis is collecting samples to check that it is back to normal.");
        break;
      case "recovered":
        lead = "Recovered at " + since + ": " + pace + ".";
        break;
      default:
        lead = pace + ".";
    }
    if (inc) {
      if (!inc.diagnosed) now.push("Artemis flagged it at " + hhmm(inc.tDetect) + " and is gathering evidence. It decides at " + hhmm(inc.tDiag) + ", when the hour of signals closes.");
      else {
        why.push("Diagnosis: " + inc.words.text + ".");
        if (inc.nodeConfirmed) why.push("The recovery confirms node " + inc.nodeConfirmed.join(", ") + " was the problem. The cause stays a hypothesis until someone repairs the node and runs its check.");
        if (inc.verify.length && inc.policy === "gpu.thermal_power_throttling") why.push("Moving work is a mitigation. The GPU is still hot, so no cause is confirmed.");
        if (!inc.nodeConfirmed && !inc.verify.length) why.push("The cause stays a hypothesis.");
        if (inc.breaker) now.push("Artemis did not drain the nodes. Draining that many would pass a safety limit, so a person has to review it.");
        for (const tk of inc.tickets) now.push("A ticket asks a person to " + S.ticketWords(tk.ticket) + ".");
        if (!inc.tickets.length) for (const a of inc.approvals) now.push(S.fixPhrase(a.fix, a.targets).replace(/^./, (c) => c.toUpperCase()) + " waits for a person to approve it.");
      }
    }
    return { lead, now, why, tone: HEALTH[js.health].tone };
  }

  VIEWS.job = function (args, m) {
    const id = args[0];
    if (!own(S.jobs, id)) return notFound("There is no job " + id + " in this simulated fleet.");
    const job = S.jobs[id];
    fromJob = id;
    m.range = m.range || "2h";
    const el = h("div");
    const b = badge();
    const meta = h("div", { class: "meta" });
    const sumBox = h("div", { class: "summary-box" });
    const whyBox = h("div", { class: "why-box" });
    const k = { thr: kpi("Throughput"), step: kpi("Step time"), util: kpi("GPU utilization"), mem: kpi("Memory per GPU"), imb: kpi("Rank imbalance") };
    const seg = h("div", { class: "seg", role: "group", "aria-label": "Time range" });
    const rangeBtns = {};
    for (const [key, label] of [["2h", "Last 2 hours"], ["day", "Whole day"]]) {
      rangeBtns[key] = h("button", { type: "button", "aria-pressed": "false", "data-key": "range-" + key, on: { click: () => { m.range = key; update(state); } } }, label);
      seg.appendChild(rangeBtns[key]);
    }
    const range = (st) => (m.range === "day" ? [S.start, S.end] : [Math.max(S.start, st.t - 7200), Math.max(S.start + 7200, st.t)]);
    const marks = () => jobMarks(id);
    const charts = [];
    charts.push(chart({
      title: "Throughput, samples per second",
      legend: [{ cls: "", text: job.name }, { cls: "ref", text: "Normal pace" }],
      range, marks,
      get: (st, t0, t1) => {
        const js = st.jobs[id];
        return { lines: [{ points: S.series("throughput", id, t0, t1, 60) }], cur: { v: js.throughput, label: fmt(js.throughput), tone: js.pct < 0.95 ? "signal" : "" },
          now: fmt(js.throughput) + " samples/s · " + pct(js.pct) + " of normal" };
      },
      domain: () => [0, job.base * 1.15], ticks: () => niceTicks(0, job.base * 1.15, 3), fmtTick: (v) => String(v),
      refs: () => [{ y: job.base, label: "normal " + fmt(job.base) }],
    }));
    charts.push(chart({
      title: "Rank imbalance, slowest rank's step time over the median",
      legend: [{ cls: "", text: "Slowest rank ÷ median" }, { cls: "ref", text: "Perfectly even" }],
      range, marks,
      get: (st, t0, t1) => {
        const js = st.jobs[id];
        return { lines: [{ points: S.series("imbalance", id, t0, t1, 60) }], cur: { v: js.imbalance, label: js.imbalance ? js.imbalance.toFixed(2) + "×" : "" },
          now: js.imbalance ? js.imbalance.toFixed(2) + "×" : "no steps completing" };
      },
      domain: () => [0.95, 1.4], ticks: () => [1, 1.1, 1.2, 1.3], fmtTick: (v) => v.toFixed(1) + "×",
      refs: () => [{ y: 1, label: "even" }],
    }));
    const hotRank = job.slowRank ? job.slowRank.rank : null;
    charts.push(chart({
      title: "GPU utilization, every GPU of the job",
      legend: hotRank !== null ? [{ cls: "hot", text: "The slow GPU, rank " + hotRank }, { cls: "thin", text: "Other GPUs" }] : [{ cls: "thin", text: "Each GPU" }],
      note: "High utilization does not mean progress: in a stall the GPUs stay busy waiting on each other.",
      range, marks,
      get: (st, t0, t1) => {
        const js = st.jobs[id];
        const every = t1 - t0 > 4 * 3600 ? 300 : 60;
        const all = S.rankSeries(id, t0, t1, every, "util");
        const lines = all.filter((r) => r.rank !== hotRank).map((r) => ({ points: r.points, cls: "thin" }));
        const hot = all.find((r) => r.rank === hotRank);
        if (hot) lines.push({ points: hot.points, cls: "hot" });
        return { lines, cur: { v: js.util, label: js.util === null ? "" : fmt(js.util) + "%" }, now: js.util === null ? "no data" : "average " + fmt(js.util) + "%" };
      },
      domain: () => [0, 105], ticks: () => [0, 50, 100], fmtTick: (v) => v + "%",
    }));
    const sr0 = job.slowRank;
    if (sr0 && sr0.temp !== null) {
      charts.push(chart({
        title: "GPU temperature, the slow GPU and the others",
        note: "The hot GPU lowers its clock, so its steps take longer and every other GPU waits for it.",
        legend: [{ cls: "hot", text: "Rank " + sr0.rank + " GPU" }, { cls: "thin", text: "Other GPUs" }, { cls: "ref", text: sr0.tempLine + " °C line" }],
        range, marks,
        get: (st, t0, t1) => {
          const all = S.rankSeries(id, t0, t1, t1 - t0 > 4 * 3600 ? 300 : 60, "temp");
          const lines = all.filter((r) => r.rank !== sr0.rank).map((r) => ({ points: r.points, cls: "thin" }));
          const hot = all.find((r) => r.rank === sr0.rank);
          lines.push({ points: hot.points, cls: "hot" });
          const cur = st.jobs[id].ranks.find((r) => r.rank === sr0.rank);
          return { lines, cur: { v: cur.temp, label: fmt(cur.temp) + " °C", tone: cur.temp > sr0.tempLine ? "signal" : "" }, now: "rank " + sr0.rank + ": " + fmt(cur.temp) + " °C, clock " + fmt(cur.clock) + " MHz" };
        },
        domain: () => [30, 95], ticks: () => [40, 60, 80], fmtTick: (v) => v + "°",
        refs: () => [{ y: sr0.tempLine, label: sr0.tempLine + " °C" }],
      }));
    } else if (sr0 && sr0.loaderWait !== null) {
      charts.push(chart({
        title: "Time spent waiting for input data, per rank",
        note: "One rank waits for its input loader while the others keep their GPUs busy, so every step waits for it.",
        legend: [{ cls: "hot", text: "Rank " + sr0.rank }, { cls: "thin", text: "Other ranks" }, { cls: "ref", text: pct(sr0.loaderLine) + " line" }],
        range, marks,
        get: (st, t0, t1) => {
          const all = S.rankSeries(id, t0, t1, t1 - t0 > 4 * 3600 ? 300 : 60, "loaderWait");
          const lines = all.filter((r) => r.rank !== sr0.rank).map((r) => ({ points: r.points.map(([t, v]) => [t, v === null ? null : v * 100]), cls: "thin" }));
          const hot = all.find((r) => r.rank === sr0.rank);
          lines.push({ points: hot.points.map(([t, v]) => [t, v === null ? null : v * 100]), cls: "hot" });
          const cur = st.jobs[id].ranks.find((r) => r.rank === sr0.rank);
          return { lines, cur: { v: cur.loaderWait * 100, label: pct(cur.loaderWait), tone: cur.loaderWait > sr0.loaderLine ? "signal" : "" }, now: "rank " + sr0.rank + ": " + pct(cur.loaderWait) };
        },
        domain: () => [0, 50], ticks: () => [0, 20, 40], fmtTick: (v) => v + "%",
        refs: () => [{ y: sr0.loaderLine * 100, label: pct(sr0.loaderLine) }],
      }));
    } else {
      charts.push(chart({
        title: "Memory used, average per GPU",
        legend: [{ cls: "", text: "Memory used" }, { cls: "ref", text: "80 GB per GPU" }],
        range, marks,
        get: (st, t0, t1) => {
          const all = S.rankSeries(id, t0, t1, t1 - t0 > 4 * 3600 ? 300 : 60, "mem");
          const n = all.length;
          const pts = all[0].points.map((p, i) => [p[0], all.reduce((s, r) => s + (r.points[i][1] || 0), 0) / n]);
          const v = st.jobs[id].mem;
          return { lines: [{ points: pts }], cur: { v, label: fmt(v) + " GB" }, now: fmt(v) + " of 80 GB" };
        },
        domain: () => [0, 90], ticks: () => [0, 40, 80], fmtTick: (v) => v + "",
        refs: () => [{ y: 80, label: "80 GB" }],
      }));
    }
    // The throughput chart leads; the signal that explains a slowdown (temperature or input
    // wait) sits beside it. The other metrics follow.
    const explainer = sr0 && (sr0.temp !== null || sr0.loaderWait !== null) ? charts[3] : null;
    const lead = [charts[0]].concat(explainer ? [explainer] : []);
    const rest = charts.filter((c) => lead.indexOf(c) < 0);
    // Resources.
    const res = h("div", { class: "res" });
    const resNodes = {};
    const allHosts = Array.from(new Set(job.hosts.concat(job.moved ? job.moved.to : [])));
    for (const host of allHosts) {
      const cells = h("div", { class: "cells" });
      for (let i = 0; i < 8; i++) {
        const gid = "gpu:" + host + "/" + i;
        cells.appendChild(h("a", { class: "cell", href: nodeLink(host), "data-gid": gid, "data-key": "res-" + gid }));
      }
      const note = h("p", { class: "node-note" });
      const card = h("div", { class: "node" }, h("div", { class: "node-head" }, h("a", { href: nodeLink(host), "data-key": "res-node-" + host }, "node " + host), h("span", { class: "node-job faint" }, "rack " + S.hostRack[host] + ", switch " + S.rackLeaf[S.hostRack[host]])), cells, note);
      resNodes[host] = { card, cells, note };
      res.appendChild(card);
    }
    const resNote = h("p", { class: "muted", style: null });
    // The hardware behind the job's problem, in words, each a link to its node detail.
    const hwNow = h("p", { class: "hw-now", tabindex: "-1" });
    let hwKey = null;
    function hwParts(st) {
      const js = st.jobs[id];
      const parts = [];
      for (const host of allHosts) {
        for (const g of st.hosts[host].gpus) {
          if (g.state !== "culprit" && g.state !== "lost") continue;
          if (g.job !== id && js.hosts.indexOf(host) < 0 && !(job.moved && job.moved.from.indexOf(host) >= 0)) continue;
          const rank = js.ranks.find((r) => r.gpu === g.id);
          const slow = js.slowRank && js.slowRank.gpu === g.id;
          parts.push({ key: g.id, href: nodeLink(host, g.index), text: "GPU " + g.index + " on " + host,
            after: g.state === "lost" ? " stopped responding." : slow ? (rank ? ", rank " + rank.rank : "") + ", is the slow GPU." : " reported an error." });
        }
        const hs = st.hosts[host];
        const what = { drained: " is drained by Artemis.", network_down: " lost its network ports.", flapping: " has network links dropping." }[hs.state];
        if (what) parts.push({ key: "host:" + host, href: nodeLink(host), text: "Node " + host, after: what });
      }
      return parts;
    }
    // Incidents.
    const incList = h("ul", { class: "card-list" });
    const incs = calmList(incList, {
      key: (i) => i.id,
      make: (i) => {
        const stg = h("span", { class: "health" });
        const done = h("ul", { class: "steps-done" });
        return h("li", { class: "panel inc-card" },
          h("div", { class: "row" }, stg, h("span", { class: "label" }, "Flagged " + hhmm(i.tDetect))),
          h("h3", null, ""), h("p", { class: "muted" }), done,
          h("div", { class: "row" }, h("a", { class: "btn", href: incLink(i.id), "data-key": "inc-" + i.id }, "What happened"),
            h("a", { class: "btn", href: incLink(i.id, "evidence"), "data-key": "ev-" + i.id }, "Evidence"),
            h("a", { class: "btn", href: incLink(i.id, "actions"), "data-key": "act-" + i.id }, "Fix log")));
      },
      update: (n, i) => {
        stageBadge(n.querySelector(".health"), i.stage);
        setText(n.querySelector("h3"), i.diagnosed ? i.words.short : "Under review");
        setText(n.querySelector("p.muted"), i.diagnosed ? "Diagnosis: " + i.words.text + "." : "Artemis decides at " + hhmm(i.tDiag) + ".");
        const evs = state.activity.filter((e) => e.inc === i.id && (e.kind !== "fact" || e.jobs.indexOf(id) >= 0)).slice(-5);
        const done = n.querySelector(".steps-done");
        if (done.childElementCount !== evs.length || (evs.length && done.lastChild.getAttribute("data-ev") !== evs[evs.length - 1].id)) {
          done.replaceChildren(...evs.map((e) => h("li", { "data-ev": e.id }, h("span", { class: "when" }, hhmm(e.t)), h("span", { class: "dot " + e.tone, "aria-hidden": "true" }), h("span", null, e.text))));
        }
      },
      empty: () => h("li", { class: "empty" }, "No incidents for this job so far today."),
    });
    el.append(
      crumbs([{ href: "#/fleet", text: "Overview" }, { text: job.name }]),
      h("div", { class: "job-head" }, heading(job.name), b),
      meta, sumBox,
      section("Performance", seg, h("div", { class: "lead-charts" + (explainer ? "" : " one") }, lead.map((c) => h("div", { class: "panel chart-box" }, c.el))), whyBox),
      section("Where it runs", "The nodes and GPUs this job uses. Select a node or GPU for its readings.", hwNow, res, resNote),
      section("Other metrics", "Latest values, then their history.", h("div", { class: "kpis" }, Object.values(k).map((x) => x.el)),
        h("div", { class: "charts" }, rest.map((c) => h("div", { class: "panel chart-box" }, c.el)))),
      section("Incidents", "What Artemis found and what it did.", incList),
    );
    function update(st) {
      const js = st.jobs[id];
      updateBadge(b, js.health);
      const metaText = ["job " + id, "owner " + js.user, js.gpus + " GPUs on " + js.hosts.length + " nodes"];
      if (meta.textContent !== metaText.join("")) meta.replaceChildren(...metaText.map((x) => h("span", null, x)));
      const sm = jobSummary(st, id);
      setClass(sumBox, "summary-box" + (sm.tone ? " " + sm.tone : ""));
      const said = [sm.lead, sm.now.join(" ")].join("|");
      if (sumBox.getAttribute("data-text") !== said) {
        sumBox.setAttribute("data-text", said);
        sumBox.replaceChildren(h("p", { class: "lead" }, sm.lead), sm.now.length ? h("p", { class: "now" }, sm.now.join(" ")) : "");
      }
      const why = sm.why.join(" ");
      whyBox.hidden = !why;
      if (whyBox.getAttribute("data-text") !== why) {
        whyBox.setAttribute("data-text", why);
        whyBox.replaceChildren(h("span", { class: "label" }, "Why"), h("p", null, why));
      }
      setKpi(k.thr, fmt(js.throughput), "samples/s", pct(js.pct) + " of normal " + fmt(js.base), js.pct < 0.95 ? "signal" : "");
      setKpi(k.step, js.stepTime ? js.stepTime.toFixed(2) : "none", js.stepTime ? "s" : "", js.stepTime ? "normal " + (js.samplesPerStep / js.base).toFixed(2) + " s for " + js.samplesPerStep + " samples" : "no steps completing");
      // An average near 100% hides one waiting GPU; name it when there is one.
      const srk = js.slowRank ? js.ranks.find((r) => r.rank === js.slowRank.rank) : null;
      setKpi(k.util, js.util === null ? "none" : fmt(js.util), js.util === null ? "" : "%", srk && srk.util !== null && js.slowRank.peerUtil !== null ?
        "average; rank " + js.slowRank.rank + " at " + fmt(srk.util) + "%, the others near " + fmt(js.slowRank.peerUtil) + "%" : "average over " + js.ranks.filter((r) => r.util !== null).length + " GPUs");
      setKpi(k.mem, fmt(js.mem), "GB", "of 80 GB per GPU");
      setKpi(k.imb, js.imbalance ? js.imbalance.toFixed(2) : "none", js.imbalance ? "×" : "", js.slowRank && js.imbalance > 1.08 ? "rank " + js.slowRank.rank + " is the slowest" : "slowest rank over the median", js.imbalance > 1.08 ? "signal" : "");
      for (const key in rangeBtns) setAttr(rangeBtns[key], "aria-pressed", m.range === key ? "true" : "false");
      for (const c of charts) c.update(st);
      incs.sync(st.incidents.filter((i) => i.jobs.indexOf(id) >= 0));
      const now = new Set(js.hosts);
      for (const host of allHosts) {
        const r = resNodes[host];
        const active = now.has(host);
        setClass(r.card, "node" + (active ? "" : " gone"));
        for (const c of r.cells.children) {
          const g = st.gpus[c.getAttribute("data-gid")];
          const rank = active ? js.ranks.find((x) => x.gpu === g.id) : null;
          setClass(c, "cell" + (g.state !== "ok" ? " " + g.state : ""));
          setAttr(c, "aria-label", "GPU " + g.index + " on " + host + (rank ? ", rank " + rank.rank : "") + ", " + CELL_WORDS[g.state]);
        }
        const hs = st.hosts[host];
        setText(r.note, !active ? (hs.state === "drained" ? "no longer used · drained by Artemis" : "no longer used") : hs.state === "drained" ? "drained" : hs.state === "network_down" ? "network down" : "");
        setClass(r.note, "node-note" + (hs.state === "drained" ? " ctl" : ""));
      }
      const hp = hwParts(st);
      const hk = hp.map((x) => x.key + x.after).join("|");
      if (hk !== hwKey) {
        hwKey = hk;
        keepFocus(hwNow, () => hwNow.replaceChildren(...(hp.length ? hp.flatMap((x, i) => [i ? " " : "",
          h("a", { href: x.href, "data-key": "hw-now-" + x.key }, x.text), x.after]) : ["No GPU or node of this job has a problem now."])));
        setClass(hwNow, "hw-now" + (hp.length ? " signal" : ""));
      }
      setText(resNote, job.moved && st.t >= job.moved.t ? "Moved at " + hhmm(job.moved.t) + " from " + listWords(job.moved.from) + " to " + listWords(job.moved.to) + "." : "");
    }
    return { el, update };
  };

  // What happened in one incident, with tabs for the evidence, the fix log and the record.
  const FAMILY = { gpu: "GPU", job: "Job", detector: "Detector", rank: "Rank", topology: "Topology", source: "Data source", nic: "Network card", node: "Node", host: "Node" };
  const TABS = [["", "Summary"], ["evidence", "Evidence"], ["actions", "Fix log"], ["record", "Record"]];
  VIEWS.incident = function (args, m) {
    const iid = args[0], tab = args[1] || "";
    const inc = S.incIndex[iid];
    if (!inc || TABS.every(([k]) => k !== tab)) return notFound("There is no such incident view in this simulated fleet.");
    const el = h("div");
    const jobId = inc.jobs.indexOf(fromJob) >= 0 ? fromJob : inc.jobs[0] || null;
    const b = h("span", { class: "health" });
    const title = heading("");
    const sub = h("p", { class: "lede" });
    const tabs = h("nav", { class: "tabs", "aria-label": "Incident views" },
      TABS.map(([k, label]) => h("a", { href: incLink(iid, k), "aria-current": k === tab ? "page" : null, "data-key": "tab-" + k }, label)));
    const body = h("div", { class: "section" });
    const crumbList = [{ href: "#/fleet", text: "Overview" }];
    if (jobId) crumbList.push({ href: jobLink(jobId), text: S.jobName[jobId] });
    crumbList.push(tab ? { href: incLink(iid), text: "What happened" } : { text: "What happened" });
    if (tab) crumbList.push({ text: TABS.find(([k]) => k === tab)[1] });
    el.append(crumbs(crumbList), h("div", { class: "job-head" }, title, b), sub, tabs, body);
    let shownKey = null;
    const panes = { "": summaryPane, evidence: evidencePane, actions: actionsPane, record: recordPane };
    function update(st) {
      const is = st.incidents.find((i) => i.id === iid) || null;
      setText(title, is && is.diagnosed ? inc.words.short : is ? "Under review" : "Not started yet");
      stageBadge(b, is ? is.stage : "looking");
      if (!is) { b.hidden = true; } else b.hidden = false;
      setText(sub, (inc.jobs.length ? "Job " + listWords(inc.jobs.map((j) => S.jobName[j])) + ". " : "") +
        (is ? "Flagged at " + hhmm(inc.tDetect) + ". " + (is.diagnosed ? "Diagnosed at " + hhmm(inc.tDiag) + "." : "Artemis decides at " + hhmm(inc.tDiag) + ", when the hour of signals closes.") :
          "This starts at " + hhmm(inc.tDetect) + ". Move the clock forward to see it."));
      // Rebuild the pane only when something it shows became visible (not on every tick, and
      // not when a record for another tab appears). Open panels and keyboard focus survive.
      const key = is ? paneKey(st, is) : "none";
      if (key !== shownKey) {
        const open = Array.from(body.querySelectorAll("details[open]")).map((d) => d.getAttribute("data-key"));
        shownKey = key;
        keepFocus(body, () => {
          body.replaceChildren(panes[tab](st, is));
          for (const d of body.querySelectorAll("details")) if (open.indexOf(d.getAttribute("data-key")) >= 0 || (m.open || []).indexOf(d.getAttribute("data-key")) >= 0) d.open = true;
        });
      }
    }
    function paneKey(st, is) {
      const facts = inc.facts.filter((f) => f.first_seen <= st.t).length;
      const pend = inc.actions.filter((a) => a.tShow > st.t).length + inc.approvals.filter((a) => a.tShow > st.t).length;
      if (tab === "evidence") return [is.diagnosed, facts].join(",");
      if (tab === "actions") return [is.diagnosed, is.actions.length, is.approvals.length, pend].join(",");
      if (tab === "record") return [is.diagnosed, is.rows.length].join(",");
      return [is.stage, st.activity.filter((e) => e.inc === iid).length, is.actions.length, is.approvals.length, is.verify.length,
        is.tickets.length, !!is.breaker].join(",");
    }
    function later(text) { return h("p", { class: "later" }, text); }
    function summaryPane(st, is) {
      if (!is) return later("Nothing has happened yet at " + hhmm(st.t) + ". This incident starts at " + hhmm(inc.tDetect) + ".");
      const out = h("div");
      const evs = st.activity.filter((e) => e.inc === iid);
      out.appendChild(h("div", { class: "panel box" }, h("h3", null, "What happened, in order"),
        h("ul", { class: "steps-done" }, evs.map((e) => h("li", null, h("span", { class: "when" }, hhmm(e.t)), h("span", { class: "dot " + e.tone, "aria-hidden": "true" }), h("span", null, e.text))))));
      if (!is.diagnosed) {
        out.appendChild(h("div", { class: "panel box" }, h("h3", null, "Diagnosis"), later("Artemis gathers the hour's signals and decides at " + hhmm(inc.tDiag) + ".")));
        return out;
      }
      const rr = inc.doc.rule_ranking || {};
      out.appendChild(h("div", { class: "panel box" }, h("h3", null, "Diagnosis"),
        h("p", null, inc.policy === "none" ? "No known problem matches the evidence, so Artemis takes no action." : "Artemis's rule ranking picked: " + inc.words.text + "."),
        inc.policy !== "none" ? h("p", { class: "muted" }, "It blames " + listWords(inc.components.map((c) => S.short(c))) + ". " + (rr.note ? "Why: " + rr.note + "." : "")) : null,
        inc.causeHypothesis && is.verify.length ? h("p", { class: "muted" }, "Node confirmed, not the cause: " + inc.causeNote + ".") :
          inc.policy !== "none" ? h("p", { class: "muted" }, "The cause stays a hypothesis. A recovery after a fix can confirm a node, never the cause.") : null,
        h("p", { class: "faint" }, "A scripted test model runs beside the rule ranking. It is not AI and does not act. ",
          h("a", { href: incLink(iid, "evidence"), "data-key": "sum-evidence" }, "See the evidence and the policies"))));
      const doneActs = is.actions;
      out.appendChild(h("div", { class: "panel box" }, h("h3", null, "What Artemis did"),
        doneActs.length ? h("ul", { class: "steps-done" }, doneActs.map((a) => h("li", null, h("span", { class: "when" }, hhmm(a.tShow)),
          h("span", { class: "dot " + (a.status === "breaker_open" ? "person" : "ctl"), "aria-hidden": "true" }),
          h("span", null, S.fixWords(a.fix) + " on " + targetName(a.target) + ": " + actionWord(a) + ".")))) :
          later(inc.actions.length ? "Nothing yet." : inc.policy === "none" ? "Nothing. No policy qualifies, so nothing acts." : "Nothing automatic. The fix needs a person's approval."),
        doneActs.length ? h("p", { class: "faint" }, h("a", { href: incLink(iid, "actions"), "data-key": "sum-actions" }, "Open the fix log with every command")) : null));
      if (inc.verify.length) {
        out.appendChild(h("div", { class: "panel box" }, h("h3", null, "Recovery check"),
          is.verify.length ? is.verify.map((v) => h("p", null, S.jobName[v.job] + ": " + v.verdict + ". A median of " + fmt(v.after, 1) + " samples/s over " + v.afterN + " samples, against " + fmt(v.healthy, 1) + " before. The check needs " + v.criteria + ".")) :
            later("The check runs once the job has trained for a while. Artemis reports at " + hhmm(inc.verify[0].tShow) + ".")));
      }
      if (is.approvals.length || is.tickets.length || is.breaker) {
        out.appendChild(h("div", { class: "panel box" }, h("h3", null, "Work for people"),
          is.breaker ? h("p", null, "Automatic draining is paused: " + (DATA.fleet.breaker ? DATA.fleet.breaker.why : "") + ".") : null,
          is.approvals.map((a) => h("p", null, S.fixPhrase(a.fix, a.targets).replace(/^./, (c) => c.toUpperCase()) + " waits for approval.")),
          is.tickets.map((tk) => h("p", null, h("a", { href: "#/tickets/" + tk.id, "data-key": "tk-" + tk.id }, "Ticket: " + S.ticketWords(tk.ticket))))));
      }
      return out;
    }
    function actionWord(a) {
      return { done: "done, simulated", simulated: "recorded, simulated, nothing sent", breaker_open: "not done, safety limit" }[a.status] || a.status;
    }
    function evidencePane(st, is) {
      const out = h("div");
      const seen = inc.facts.filter((f) => f.first_seen <= st.t);
      out.appendChild(h("div", { class: "ev-intro" },
        h("p", null, "These are the readings Artemis compared to reach its diagnosis. Most set one GPU, rank or node against its peers or against a fixed line."),
        h("p", { class: "muted" }, "The diagnosis is the known problem that best matches them. It stays a hypothesis: no reading confirms a cause. Each reading keeps its raw fields and log lines one click down. " +
          seen.length + " of " + inc.facts.length + " readings are visible at " + hhmm(st.t) + ".")));
      // The hardware the facts name, each a link to its node (and GPU) detail.
      let hw = [];
      for (const f of seen) {
        const x = hardwareOf(f.subject);
        if (x && !hw.some((y) => y.key === x.key)) hw.push(x);
      }
      // Many GPUs (a switch takes out whole nodes): one link per node, with its GPU count.
      if (hw.filter((x) => x.host && x.gpu !== undefined).length > 6) {
        const byHost = [];
        for (const x of hw) {
          let n = byHost.find((y) => y.host === x.host);
          if (!n) { n = { key: "host:" + x.host, host: x.host, href: nodeLink(x.host), gpus: 0 }; byHost.push(n); }
          if (x.gpu !== undefined) n.gpus += 1;
        }
        hw = byHost.map((n) => Object.assign(n, { text: "node " + n.host, job: n.gpus ? n.gpus + (n.gpus === 1 ? " GPU named" : " GPUs named") : null }));
      }
      if (hw.length) {
        out.appendChild(h("div", { class: "panel box" }, h("h3", null, "Hardware these readings name"),
          h("ul", { class: "hw-links" }, hw.map((x) => h("li", null, h("a", { href: x.href, "data-key": "hw-" + x.key }, x.text),
            x.job ? h("span", { class: "faint" }, " · " + x.job) : null)))));
      }
      // Readings first, grouped by what they measure; the record's own families keep the
      // order GPU, rank, node, detector, job, network, topology, data source.
      const fams = {};
      for (const f of seen) (fams[f.family] = fams[f.family] || []).push(f);
      const famOrder = ["gpu", "rank", "node", "host", "detector", "job", "nic", "topology", "source"];
      const famKeys = Object.keys(fams).sort((a, b) => (famOrder.indexOf(a) + 99) % 99 - (famOrder.indexOf(b) + 99) % 99);
      for (const fam of famKeys) {
        const box = h("div", { class: "panel box" }, h("h3", null, (FAMILY[fam] || fam) + " readings"));
        for (const f of fams[fam]) {
          const raw = (f.sources || []).map((s) => (s.source ? s.source + " " : "") + (s.artifact ? s.artifact + ":" + s.line + "  " : "") + s.raw).join("\n");
          const extra = f.sources_omitted ? "\n" + f.sources_omitted + " more source lines are not shipped with the demo." : "";
          const d = h("details", { "data-key": "fact-" + f.id }, h("summary", null, "Raw fields and lines"),
            h("p", { class: "fid" }, f.name + " = " + f.value + " · first seen " + hhmm(f.first_seen) + " UTC · " + f.subject),
            h("p", { class: "fid" }, JSON.stringify(f.measured || {})),
            h("pre", null, raw + extra || "No raw line."));
          // A visitor's click (or Enter) on the summary, not a reopened panel after a redraw.
          d.firstChild.addEventListener("click", () => { if (!d.open) track("fact_expand", { detail: String(f.id).replace(/[^\x20-\x7e]/g, "").slice(0, 160) }); });
          const x = hardwareOf(f.subject);
          const rd = readFact(f);
          const subj = subjectWords(f.subject);
          box.appendChild(h("div", { class: "fact" },
            h("p", { class: "ft" }, h("span", { class: "when" }, hhmm(f.first_seen)), h("strong", null, rd.label), " on ",
              x ? h("a", { href: x.href, "data-key": "fact-hw-" + f.id, "aria-label": subj + ", open " + x.text }, subj) : subj),
            h("p", { class: "reading" + (rd.vs ? " vs" : "") }, rd.text), d));
        }
        out.appendChild(box);
      }
      if (!is || !is.diagnosed) { out.appendChild(later("The policies are scored when Artemis decides, at " + hhmm(inc.tDiag) + ".")); return out; }
      const reports = inc.doc.policy_reports || [];
      out.appendChild(h("div", { class: "panel box" }, h("h3", null, "Policies Artemis scored"),
        h("p", { class: "muted" }, (inc.doc.rule_ranking && inc.doc.rule_ranking.rule) ? "Ranking rule: " + inc.doc.rule_ranking.rule + "." : ""),
        h("div", { class: "table-wrap" }, h("table", { class: "policies" },
          h("thead", null, h("tr", null, ["Policy", "Status", "Conditions met", "Missing"].map((x) => h("th", { class: "label", scope: "col" }, x)))),
          h("tbody", null, reports.map((r) => h("tr", { class: r.policy === inc.policy ? "chosen" : null },
            h("td", { class: "mono" }, r.policy + (r.policy === inc.policy ? " (picked)" : "")), h("td", null, String(r.status).replace(/_/g, " ")),
            h("td", null, String((r.matched || []).length)), h("td", { class: "mono" }, (r.missing || []).join(", ") || "none"))))))));
      const sh = inc.doc.shadow;
      if (sh) {
        out.appendChild(h("div", { class: "panel box note-model" }, h("h3", null, "Shadow model, scripted, not AI"),
          h("p", { class: "muted" }, "It does not act. The record labels the model \"" + (sh.model_label || "") + "\" and its answer \"" + (sh.answer_source_label || "") + "\"."),
          sh.answer ? h("dl", { class: "kv" }, h("dt", null, "Its answer"), h("dd", { class: "mono" }, sh.answer.policy),
            h("dt", null, "Agrees with the rule ranking"), h("dd", null, sh.agrees_with_rule && sh.agrees_with_rule.policy ? "yes, on the policy" : "no"),
            h("dt", null, "Its reasoning, quoted"), h("dd", null, sh.answer.reasoning || "none")) : null));
      }
      return out;
    }
    // A fact's subject in words: "protein-fold rank 17", "GPU 1 on r3n1", "switch leaf5".
    function subjectWords(subject) {
      const kind = subject.split(":")[0], rest = S.short(subject);
      const gm = /^([^/]+)\/(\d+)$/.exec(rest);
      if (kind === "gpu" && gm) return "GPU " + gm[2] + " on " + gm[1];
      if (kind === "rank" && gm && S.jobName[gm[1]]) return S.jobName[gm[1]] + " rank " + gm[2];
      if (kind === "job" && S.jobName[rest]) return S.jobName[rest];
      if (kind === "host") return "node " + rest;
      if (kind === "leaf") return "switch " + rest;
      if (kind === "nic") return "network card " + rest;
      if (kind === "pcie_switch") return "PCIe switch " + rest;
      return kind + " " + rest;
    }
    // A fact in plain words: what was measured, and its value against peers or a line.
    function readFact(f) {
      const m = f.measured || {};
      const n = (x, d) => fmt(Number(x), d);
      const q = (x) => (x && typeof x === "object" && "quoted" in x ? x.quoted : x);
      const peers = m.peers ? " (" + m.peers + " peers)" : "";
      switch (f.name) {
        case "gpu.utilization": return { label: "GPU utilization", vs: true, text: n(m.value) + "% against a peer median of " + n(m.peer_median) + "%" + peers };
        case "gpu.sm_clock": return { label: "GPU clock", vs: true, text: n(m.value) + " MHz against a peer median of " + n(m.peer_median) + " MHz" + peers };
        case "gpu.temperature": return { label: "GPU temperature", vs: true, text: n(m.celsius) + " °C, above the " + n(m.line_c) + " °C line" };
        case "gpu.clocks_event_reason": return { label: "Why the GPU lowers its clock", text: f.value === "thermal" ? "Heat. The GPU reports a thermal slowdown." : String(f.value) };
        case "gpu.fallen_off_bus": return { label: "GPU stopped responding", text: "The kernel log reports Xid " + m.xid + ", fallen off the bus." };
        case "gpu.count_below_inventory": return { label: "GPUs the node reports", vs: true, text: m.reporting + " of the " + m.inventory + " installed" };
        case "gpu.sympathetic_xid": return { label: "GPU error", text: "Xid " + m.xid + ". Its job keeps running." };
        case "rank.loader_wait_frac": return { label: "Time waiting for input data", vs: true, text: pct(m.loader_wait_frac) + " of the time, above the " + pct(m.line) + " line" };
        case "rank.hang_state": return { label: "Where the rank waits", text: "Inside a collective, at step " + m.seq + " while its last finished step is " + m.done_seq };
        case "node.io_pressure": return { label: "Disk read waits", vs: true, text: pct(m.stall_share) + " of " + m.seconds + " s, above the " + pct(m.line) + " line" };
        case "detector.slow_rank": return { label: "Slow rank", vs: true, text: m.loss_pct + "% behind the other ranks; its steps take " + n(m.ratio, 2) + "× the median" };
        case "detector.rank_cause": return { label: "Where the slowness starts", text: q(m.kind) === "host" ? "On the host, not the GPU" : String(q(m.kind)) };
        case "detector.missing_rank": return { label: "Rank stopped reporting", text: "No progress reports from this rank" };
        case "detector.hang": return { label: "Job stopped making progress", text: m.behind + " ranks behind, idle for " + m.idle_s + " s" };
        case "job.throughput": return { label: "Throughput samples", vs: !!m.late_over_early, text: f.value === "stopped" ? "No sample for the last " + m.last_sample_age_s + " s" :
          m.late_over_early ? "Later samples run at " + pct(m.late_over_early) + " of the earlier ones (" + f.value + ")" : String(f.value) };
        case "job.ended": return { label: "Job ended", text: "The scheduler reports " + (m.state || f.value) };
        case "job.nccl_timeout": return { label: "NCCL watchdog", text: "Timed out after " + Math.round(Number(q((m.timeout_ms || [])[0])) / 1000) + " s waiting on " + String(q((m.ops || [])[0]) || "a collective").toLowerCase() };
        case "job.nccl_net_error": return { label: "NCCL network error", text: m.lines + " log lines" };
        case "nic.link_downed": return { label: "Network link drops", text: "The link-down counter went up by " + m.delta };
        case "nic.port_down": return { label: "Network port", text: "Down" };
        case "topology.shared_leaf": return { label: "Network switch these nodes share", text: "Only these " + m.hosts + " nodes sit under it" };
        case "topology.shared_rack": return { label: "Rack these nodes share", text: "Only these " + m.hosts + " nodes are in it" };
        case "topology.shared_cooling": return { label: "Cooling these nodes share", vs: true, text: m.hosts + " of the " + m.hosts_below + " nodes it cools" };
        case "topology.shared_power_feed": return { label: "Power feed these nodes share", vs: true, text: m.hosts + " of the " + m.hosts_below + " nodes it feeds" };
        case "topology.affected_jobs_below": return { label: "Jobs under the switch", vs: true, text: m.affected_jobs + " of " + m.jobs_below + " have a problem" };
        case "topology.dependents": return { label: "Work on this GPU", text: m.jobs + " job, " + m.ranks + " rank" };
        case "topology.shared_pcie_switch": return { label: "PCIe switch", text: "Shared by this GPU and a network card" };
        case "source.dcgm_metrics": return { label: "GPU metrics", text: "Partial: some readings are missing for " + listWords(Array.from(new Set([].concat(...Object.values(m.missing || {})))).map((g) => S.short(g))) };
        default: return { label: f.name, text: String(f.value) };
      }
    }
    // A fact's subject as hardware: GPUs and ranks lead to the GPU on its node; nodes,
    // network cards and PCIe switches lead to the node.
    function hardwareOf(subject) {
      const kind = subject.split(":")[0], rest = S.short(subject);
      const gm = /^([^/]+)\/(\d+)$/.exec(rest);
      if (kind === "gpu" && gm) return { key: subject, host: gm[1], gpu: gm[2], href: nodeLink(gm[1], gm[2]), text: "GPU " + gm[2] + " on " + gm[1] };
      if (kind === "rank" && gm && own(S.jobs, gm[1])) {
        const r = S.jobs[gm[1]].ranks.find((x) => x.rank === Number(gm[2]));
        const p = r ? /^gpu:([^/]+)\/(\d+)$/.exec(r.gpu) : null;
        if (p) return { key: r.gpu, host: p[1], gpu: p[2], href: nodeLink(p[1], p[2]), text: "GPU " + p[2] + " on " + p[1], job: S.jobName[gm[1]] + " rank " + gm[2] };
      }
      if (kind === "host" || kind === "nic" || kind === "pcie_switch") {
        const host = rest.split("/")[0];
        if (S.hostRack[host]) return { key: "host:" + host, host, href: nodeLink(host), text: "node " + host };
      }
      return null;
    }
    function actionsPane(st, is) {
      const out = h("div");
      if (!is || !is.diagnosed) return later("Artemis acts only after it decides, at " + hhmm(inc.tDiag) + ".");
      out.appendChild(h("p", { class: "muted" }, "Every command went to a fake scheduler. No real node was drained and no job restarted."));
      if (!is.actions.length && !is.approvals.length) out.appendChild(later(inc.actions.length ? "Nothing has run yet." : "No automatic action for this incident."));
      for (const a of is.actions) {
        out.appendChild(h("div", { class: "panel box" }, h("h3", null, S.fixWords(a.fix) + " on " + targetName(a.target)),
          h("dl", { class: "kv" }, h("dt", null, "When"), h("dd", null, hhmm(a.tShow) + " UTC"), h("dt", null, "Tier"), h("dd", null, a.tier),
            h("dt", null, "Result"), h("dd", null, actionWord(a)), a.note ? [h("dt", null, "Note"), h("dd", null, a.note)] : null,
            a.readback ? [h("dt", null, "Read back"), h("dd", { class: "cmd" }, JSON.stringify(a.readback))] : null),
          a.commands.length ? h("pre", null, a.commands.map((c) => "$ " + c.command + "   # " + c.actuator + " scheduler, rc " + c.rc).join("\n")) : null,
          a.preconditions.length ? h("details", { "data-key": "pre-" + a.fix + a.target }, h("summary", null, a.preconditions.length + " checks before acting"),
            h("ul", { class: "checks" }, a.preconditions.map((p) => h("li", null, h("span", { class: p.result === "pass" ? "res-pass" : p.result === "fail" ? "res-fail" : "res-other" }, String(p.result).replace(/_/g, " ")), h("span", null, p.text + " " + (p.why ? "Read: " + p.why + "." : "")))))) : null));
      }
      for (const ap of is.approvals) {
        out.appendChild(h("div", { class: "panel box" }, h("h3", null, S.fixWords(ap.fix) + ", waits for approval"),
          h("p", { class: "muted" }, "Approval tier: a person decides. Nothing in this demo can approve it, and nothing runs."),
          ap.preconditions.length ? h("ul", { class: "checks" }, ap.preconditions.map((p) => h("li", null, h("span", { class: "res-other" }, String(p.result).replace(/_/g, " ")), h("span", null, p.text)))) : null));
      }
      const pend = inc.actions.filter((a) => a.tShow > st.t).length + inc.approvals.filter((a) => a.tShow > st.t).length;
      if (pend) out.appendChild(later(pend + " more steps come later in the day."));
      return out;
    }
    function recordPane(st, is) {
      if (!is || !is.diagnosed) return later("The decision record exists from " + hhmm(inc.tDiag) + ".");
      const d = inc.doc;
      const cl = d.call_log || {};
      return h("div", null,
        h("div", { class: "panel box" }, h("h3", null, "Provenance"),
          h("dl", { class: "kv" },
            h("dt", null, "Incident"), h("dd", { class: "mono" }, iid),
            h("dt", null, "Policy"), h("dd", { class: "mono" }, inc.policy),
            h("dt", null, "Hour window"), h("dd", { class: "mono" }, inc.scope),
            h("dt", null, "Model"), h("dd", { class: "mono" }, cl.model ? cl.model.id + ", ai " + cl.model.ai : "none"),
            h("dt", null, "Policy set"), h("dd", { class: "mono" }, cl.policy_set_version || "none"),
            h("dt", null, "Evidence bundle"), h("dd", { class: "mono" }, cl.bundle_sha256 || "none"),
            h("dt", null, "Topology snapshot"), h("dd", { class: "mono" }, cl.topology_snapshot_sha256 || "none"))),
        h("div", { class: "panel box" }, h("h3", null, "Limits the record states"), h("ul", { class: "checks" }, (d.limits || []).map((x) => h("li", null, h("span", { class: "res-other" }, "limit"), h("span", null, x))))),
        h("div", { class: "panel box" }, h("h3", null, "Loop timeline"), h("pre", null, is.rows.map((r) => hhmm(r.t) + "  " + r.stage + "  " + r.text + (r.details.length ? "\n        " + r.details.join("\n        ") : "")).join("\n"))),
        h("details", { "data-key": "raw-record", class: "panel box" }, h("summary", null, "The full incident record as the fleet service returned it, at its final state"),
          h("pre", null, JSON.stringify(d, null, 1))));
    }
    return { el, update, save: () => ({ open: Array.from(body.querySelectorAll("details[open]")).map((x) => x.getAttribute("data-key")) }) };
  };

  // A node and its GPUs.
  VIEWS.node = function (args) {
    const host = args[0];
    const hs0 = state.hosts[host];
    if (!hs0) return notFound("There is no node " + host + " in this simulated fleet.");
    const pickGpu = args[1] !== undefined && /^[0-7]$/.test(args[1]) ? Number(args[1]) : null;
    const el = h("div");
    const rack = S.hostRack[host];
    const crumbHolder = h("div");
    const title = heading("Node " + host);
    const sub = h("p", { class: "lede" });
    const tbody = h("tbody");
    const rows = [];
    for (let i = 0; i < 8; i++) {
      const tds = Array.from({ length: 8 }, () => h("td"));
      tds[1].className = "txt"; tds[2].className = "txt";
      const tr = h("tr", { "data-gpu": i, "aria-current": i === pickGpu ? "true" : null }, tds);
      rows.push({ tr, tds });
      tbody.appendChild(tr);
    }
    el.append(crumbHolder, title, sub,
      section("GPUs", (pickGpu !== null ? "GPU " + pickGpu + " is marked. " : "") + "Live readings at the simulated time. Utilization, temperature, clock and memory are synthesized around the snapshot's values.",
        h("div", { class: "table-wrap" }, h("table", { class: "grid-table" },
          h("thead", null, h("tr", null, ["GPU", "Job and rank", "State", "Util", "Temp", "Clock", "Memory", "Input wait"].map((x) => h("th", { class: "label", scope: "col" }, x)))), tbody))),
      section("Model", null, h("p", { class: "muted" }, (DATA.topology.hosts.find((x) => x.name === host) || {}).model || "")));
    let crumbJob = undefined;
    function update(st) {
      const hs = st.hosts[host];
      if (crumbJob !== hs.job) {
        crumbJob = hs.job;
        const items = [{ href: "#/fleet", text: "Overview" }];
        if (hs.job) items.push({ href: jobLink(hs.job), text: S.jobName[hs.job] });
        items.push({ text: "Node " + host });
        keepFocus(crumbHolder, () => crumbHolder.replaceChildren(crumbs(items, "crumb-")));
      }
      const job = hs.job ? st.jobs[hs.job] : null;
      setText(sub, "Rack " + rack + ", behind switch " + S.rackLeaf[rack] + ". " + (job ? "Runs " + job.name + ", owned by " + job.user + ". " : "No job runs here now. ") +
        ({ drained: "Artemis drained it: no new work lands on it until a person repairs and releases it.", network_down: "Its network ports are down.", flapping: "Its network links are dropping." }[hs.state] || ""));
      hs.gpus.forEach((g, i) => {
        const r = rows[i];
        const rk = job ? job.ranks.find((x) => x.gpu === g.id) : null;
        const cells = [String(g.index), job ? job.name + (rk ? ", rank " + rk.rank : "") : "none", CELL_WORDS[g.state],
          rk && rk.util !== null ? fmt(rk.util) + "%" : "", rk && rk.temp !== null ? fmt(rk.temp) + " °C" : "", rk && rk.clock !== null ? fmt(rk.clock) + " MHz" : "",
          rk && rk.mem !== null ? fmt(rk.mem) + " GB" : "", rk && rk.loaderWait !== null ? pct(rk.loaderWait) : ""];
        cells.forEach((c, j) => setText(r.tds[j], c));
        setClass(r.tr, (g.state === "culprit" || g.state === "lost" ? "hot" : "") + (g.index === pickGpu ? " picked" : ""));
      });
    }
    return { el, update };
  };

  // Tickets: work Artemis left for people.
  VIEWS.tickets = function (args, m) {
    const sel = args[0] || null;
    const el = h("div");
    const title = heading("Tickets");
    const sub = h("p", { class: "lede" });
    const list = h("ul", { class: "card-list" });
    const cl = calmList(list, {
      key: (tk) => tk.id,
      make: (tk) => {
        const T = tk.ticket || {};
        const ri = T.ranking_inputs || {};
        const inc = S.incIndex[tk.inc];
        const card = h("li", { class: "panel box" + (sel === tk.id ? " selected" : ""), id: "ticket-" + tk.id },
          h("div", { class: "row inc-card", style: null },
            h("div", { class: "job-head" }, h("span", { class: "health person" }, kindWord(T.kind)), h("span", { class: "label" }, "opened " + hhmm(tk.tShow) + " · " + tk.id)),
            h("h3", null, "A person needs to " + tk.words),
            h("p", { class: "muted" }, T.why || ""),
            h("dl", { class: "kv" },
              h("dt", null, "Who"), h("dd", null, ri.human_role || "a person"),
              h("dt", null, "GPU-hours lost"), h("dd", { class: "num" }, ri.gpu_hours_lost === undefined ? "none" : String(ri.gpu_hours_lost)),
              h("dt", null, "Jobs"), h("dd", null, ((T.jobs || []).length ? T.jobs.map((j) => S.jobName[S.short(j)] || j) : inc ? inc.jobs.map((j) => S.jobName[j]) : []).join(", ") || "none"),
              T.post_repair_check ? [h("dt", null, "Check after the repair"), h("dd", { class: "cmd" }, T.post_repair_check.command)] : null),
            (T.steps || []).length ? h("details", { "data-key": "steps-" + tk.id, open: sel === tk.id ? true : null }, h("summary", null, "Steps for a person"),
              h("ul", { class: "checks" }, T.steps.map((s) => h("li", null, h("span", { class: "res-other" }, s.tier.replace(/_/g, " ")), h("span", null, S.fixWords(s.fix) + ". " + s.text))))) : null,
            (T.inspection || []).length ? h("details", { "data-key": "insp-" + tk.id }, h("summary", null, "What to inspect"),
              h("ul", { class: "checks" }, T.inspection.map((s) => h("li", null, h("span", { class: "res-other" }, "inspect"), h("span", null, s))))) : null,
            // A link to every job the incident touched (a failed switch stops two at once).
            h("div", { class: "row" }, (inc ? inc.jobs : []).map((j) => h("a", { class: "btn", href: jobLink(j), "data-key": "tkjob-" + tk.id + "-" + j }, "Open " + S.jobName[j])),
              h("a", { class: "btn", href: incLink(tk.inc), "data-key": "tkinc-" + tk.id }, "What happened"))));
        return card;
      },
      update: () => {},
      empty: () => h("li", { class: "empty" }, "No tickets yet. Artemis opens one when work needs a person."),
    });
    el.append(crumbs([{ href: "#/fleet", text: "Overview" }, { text: "Tickets" }]), title, sub, h("div", { class: "section" }, list),
      h("p", { class: "faint section" }, "The queue is simulated: nobody received these tickets. Artemis ranked them with code inputs (human needed, GPU-hours lost). A scripted ranker, not AI, ran beside it."));
    let scrolled = false;
    function update(st) {
      setText(sub, st.tickets.length ? st.tickets.length + (st.tickets.length === 1 ? " ticket waits" : " tickets wait") + " for a person at " + hhmm(st.t) + ". " + st.approvals.length + (st.approvals.length === 1 ? " fix waits" : " fixes wait") + " for approval." :
        "Nothing waits for a person at " + hhmm(st.t) + ".");
      cl.sync(st.tickets);
      if (sel && !scrolled && !m.scroll) {
        const e = doc.getElementById("ticket-" + sel);
        if (e) { scrolled = true; e.scrollIntoView({ block: "start" }); }
      }
    }
    return { el, update };
  };
  function kindWord(k) { return { node_repair: "Node repair", approval: "Approval", breaker: "Paused draining" }[k] || k; }

  VIEWS.activity = function () {
    const el = h("div");
    const list = h("ul", { class: "feed long panel box" });
    const hint = h("p", { class: "hold", "aria-live": "off" });
    const cl = calmList(list, feedOpts(hint));
    el.append(crumbs([{ href: "#/fleet", text: "Overview" }, { text: "Activity" }]), heading("Fleet activity"),
      h("p", { class: "lede" }, "Everything that happened today up to the simulated time, newest first. Green is what Artemis did, orange is a problem or work for a person."),
      h("div", { class: "section" }, list, hint));
    return { el, update: (st) => cl.sync(st.activity.slice().reverse()) };
  };

  VIEWS.about = function () {
    const a = DATA.about;
    const ul = (xs) => h("ul", null, xs.map((x) => h("li", null, x)));
    const el = h("div", { class: "prose" },
      crumbs([{ href: "#/fleet", text: "Overview" }, { text: "About" }]),
      heading("About this demo"),
      h("p", null, "This is a simulated Artemis fleet: " + DATA.fleet.jobs.length + " training jobs on " + DATA.topology.gpus.length + " GPUs in " + DATA.topology.racks.length +
        " racks, over one day. Nothing here touches real hardware. Nothing you click changes anything outside this page."),
      recording() ? h("p", { class: "disclosure" }, "This demo records visits and clicks (IP address, approximate location, browser, pages viewed) to learn how it is used.") :
        h("p", null, "This copy records nothing. It sends no visit or click events."),
      h("h2", null, "Where the data comes from"),
      h("p", null, "Incidents, diagnoses, actions, recovery checks, tickets, jobs, users, hosts and GPUs come from a frozen snapshot of the Artemis fleet service. Generator " + a.generator +
        ", seed " + a.seed + ". " + a.built_from.command + ". Step 2 code " + a.built_from.step2.branch + " at " + a.built_from.step2.head.slice(0, 12) + "."),
      h("p", null, "Metric curves are synthesized by this page, seeded and deterministic. Each job's normal pace, the moment it slowed and how far, and its pace after a fix come from the snapshot's recorded samples and recovery checks. The slow GPU's numbers are the incident's facts."),
      h("h2", null, "What is simulated"), ul(a.simulated),
      h("h2", null, "Scripted, not AI"), ul(a.scripted),
      h("h2", null, "What it is not"), ul(a.not),
      h("h2", null, "Simplifications"), ul(a.simplifications.concat([
        "The page plays the snapshot's day on one clock. Each part of an incident appears at the time the snapshot records for it.",
        "Records the snapshot gives the same second are shown " + S.SPREAD + " seconds apart, in their recorded order, so you can read them one at a time. Times are shown to the minute.",
        "A fault lasts from its incident until the snapshot records a fix, even where a later hour of the snapshot was rendered without it.",
        "Step time is the throughput turned into seconds per step with a fixed batch per job. Memory is a fixed share per job. Both are illustrations.",
      ])),
      h("h2", null, "How the clock works"),
      h("p", null, "The clock runs slower around each story step and faster through quiet hours. While it plays, it stops at each story step for about 12 seconds, less at 2× and 4×, and longer while you point at the story or keep keyboard focus in it. Pause, replay, the speed buttons and the time slider control it. Back and Next in the story, and the story's own link, pause the clock and move it to each step. Selecting an event on a chart pauses the clock at that moment. " +
        (reduced ? "Your system asks for reduced motion, so the clock started paused and the screen redraws at most once a second while it plays." :
          "With reduced motion turned on in your system, the clock starts paused and the screen redraws at most once a second.")),
      h("p", { class: "faint" }, "Fonts: Archivo and Martian Mono, SIL Open Font License 1.1, in fonts/OFL.txt."));
    return { el, update: () => {} };
  };

  function targetName(target) {
    const id = S.short(target);
    return /^job:/.test(target) && S.jobName[id] ? S.jobName[id] : id;
  }

  function notFound(text) {
    const el = h("div", null, crumbs([{ href: "#/fleet", text: "Overview" }, { text: "Not found" }]), heading("Not found"), h("p", { class: "lede" }, text));
    return { el, update: () => {} };
  }

  // ---- Router.
  const NAV = { fleet: "fleet", job: "fleet", incident: "fleet", node: "fleet", tickets: "tickets", activity: "activity", about: "about" };
  function parse(hash) {
    const parts = (hash || "").replace(/^#\/?/, "").split("/").filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    if (!parts.length) return null;
    const name = parts[0];
    if (!own(VIEWS, name)) return { name: "missing", args: [], key: hash, nav: null };
    return { name, args: parts.slice(1), key: "#/" + parts.map(encodeURIComponent).join("/"), nav: NAV[name] };
  }
  VIEWS.missing = () => notFound("That page is not part of this demo.");
  let first = true;
  let lastClicked = null;
  function navigate() {
    const r = parse(root.location.hash);
    if (!r) { root.location.replace("#/fleet"); return; }
    if (["job", "incident", "node"].indexOf(r.name) < 0) fromJob = null;
    if (view && currentRoute) {
      const m = memo[currentRoute.key] || (memo[currentRoute.key] = {});
      Object.assign(m, view.save ? view.save() : {});
      m.scroll = root.scrollY;
      const a = doc.activeElement;
      const keyed = a && a.closest ? a.closest("[data-key]") : null;
      // Safari does not focus a link or button on a mouse click; use the item clicked last.
      m.focus = keyed && main().contains(keyed) ? keyed.getAttribute("data-key") : (a === doc.body || a === main()) ? lastClicked : null;
    }
    const m = memo[r.key] || (memo[r.key] = {});
    currentRoute = r;
    view = VIEWS[r.name](r.args, m);
    main().replaceChildren(view.el);
    main().setAttribute("data-route", r.key);
    view.update(state);
    paintNav();
    const h1 = main().querySelector("h1");
    doc.title = (h1 && h1.textContent ? h1.textContent + " · " : "") + "Artemis fleet demo (simulated)";
    const back = m.scroll !== undefined;
    root.scrollTo(0, back ? m.scroll : 0);
    if (!first) {
      const target = m.focus ? main().querySelector('[data-key="' + cssEscape(m.focus) + '"]') : null;
      (target || h1 || main()).focus({ preventScroll: true });
      if (back) root.scrollTo(0, m.scroll);
    }
    first = false;
  }
  function cssEscape(s) { return String(s).replace(/["\\]/g, "\\$&"); }
  const main = () => doc.getElementById("main");

  // The header's measured heights, for the phone's sticky clock bar (--bar-h: the top bar
  // that scrolls away) and for scroll-padding (--sticky-h: what stays on screen).
  function measureTop() {
    const top = doc.querySelector(".top"), bar = doc.querySelector(".top .bar");
    if (!top || !bar) return;
    const barH = bar.offsetHeight;
    top.style.setProperty("--bar-h", barH + "px");
    const stuck = parseFloat(root.getComputedStyle(top).top) < 0 ? top.offsetHeight - barH : top.offsetHeight;
    doc.documentElement.style.setProperty("--sticky-h", stuck + "px");
  }

  // ---- Boot.
  function boot() {
    buildControls();
    measureTop();
    if (root.ResizeObserver) new root.ResizeObserver(measureTop).observe(doc.querySelector(".top"));
    const rail = doc.getElementById("rail");
    rail.append(guide.el);
    doc.getElementById("skip").addEventListener("click", () => { const mm = main(); mm.focus(); mm.scrollIntoView(); });
    doc.addEventListener("click", (e) => {
      const k = e.target && e.target.closest ? e.target.closest("[data-key]") : null;
      lastClicked = k && main().contains(k) ? k.getAttribute("data-key") : null;
    }, true);
    root.addEventListener("hashchange", () => { track("route"); navigate(); });
    let resizeTimer = null;
    root.addEventListener("resize", () => {
      if (resizeTimer) root.clearTimeout(resizeTimer);
      resizeTimer = root.setTimeout(() => { measureTop(); if (view) view.update(state); }, 120);
    });
    track("page_open", { referrer: String(doc.referrer || "").slice(0, 300) });
    navigate();
    paint();
    run();
    // A test hook: read-only state and the clock, for the browser tests.
    root.ArtemisDemo = Object.freeze({
      scenario: S,
      now: () => clock.t,
      playing: () => clock.playing,
      state: () => state,
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else root.setTimeout(boot, 0);
})(window);

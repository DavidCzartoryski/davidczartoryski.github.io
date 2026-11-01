/* The Artemis UI kit (straggler.uikit), version 1: window.ArtemisUI, and module.exports in Node.
   One visual system for the private live UI and the public simulated demo. Every component takes
   plain data and draws it: nothing here fetches, sets a timer, reads storage or knows a query, a
   host or a URL. Markup is never written from strings: elements and text nodes only.

   API (stable: after version 1 changes are additive only)
   - dom: h, sv, setText, setClass, setAttr, path, niceTicks, keepFocus
   - HEALTH, ALLOCATION: each token's fixed word. Fill is health, the dashed amber frame is
     allocation; color never carries a state alone.
   - grid({onPick, focus?}) -> {el, update({racks, groups, dim?}), focus(cellId)}
       A frame is drawn from allocation: "active" with a group is a dashed job frame, "unknown"
       with a group a dotted last-known one; "idle" and "unavailable" draw none. An unknown health
       token draws as "unknown". groups[id].tone "signal" inks the frame's label.
   - legend(tokens, {outline?, notes?, foot?, label?}) -> element
   - chart({title, unit, height?, readout?, group?, zero?, head?, axisUnit?, digits?, utc?})
       state "error", "unsupported" or "no_data" draws no line, whatever the points; "stale" draws
       its lines dashed, with the reason
       -> {el, overlay, x(t), y(v), pad, update({start, end, step, state, reason?, lines, gaps?,
          refs?, bands?, events?})}
       (additive: utc labels the time axis in UTC; pad is the plot's padding after an update, so
       a host can place its own markers in overlay)
   - hoverGroup(onReadout) -> a shared crosshair for the charts it is passed to
   - gpuRecord({onClose?, jobHref?, head?, utc?}) -> {el, focus(), update(doc)}: an
     artemis-live-gpu-1 doc; head: false leaves the title to the host page (additive: utc for its
     benchmark charts; location.current.label, when given, is the job link's text) */
(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ArtemisUI = api;
})(typeof window !== "undefined" ? window : null, function (root) {
  "use strict";
  const SVGNS = "http://www.w3.org/2000/svg"; // an XML namespace name, never fetched
  const D = () => (root && root.document) || globalThis.document;

  // ---- dom ----------------------------------------------------------------------------------
  function setAttrs(e, attrs) {
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "on") { for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn); continue; }
      if (k === "style") throw new Error("ArtemisUI: no inline style attributes");
      e.setAttribute(k, v === true ? "" : String(v));
    }
  }
  function append(e, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      e.appendChild(typeof k === "object" ? k : D().createTextNode(String(k)));
    }
  }
  function h(tag, attrs, ...kids) { const e = D().createElement(tag); setAttrs(e, attrs); append(e, kids); return e; }
  function sv(tag, attrs, ...kids) { const e = D().createElementNS(SVGNS, tag); setAttrs(e, attrs); append(e, kids); return e; }
  function setText(e, text) { const s = String(text); if (e.textContent !== s) e.textContent = s; }
  function setClass(e, cls) { if (e.getAttribute("class") !== cls) e.setAttribute("class", cls); }
  function setAttr(e, k, v) {
    if (v === null || v === undefined) { if (e.hasAttribute(k)) e.removeAttribute(k); return; }
    const s = String(v); if (e.getAttribute(k) !== s) e.setAttribute(k, s);
  }
  // A path through [t, v] points; a missing value lifts the pen, so a gap is never bridged.
  function path(points, x, y) {
    let d = "", pen = false;
    for (const [t, v] of points) {
      if (v === null || v === undefined || !isFinite(v)) { pen = false; continue; }
      d += (pen ? "L" : "M") + x(t).toFixed(1) + " " + y(v).toFixed(1);
      pen = true;
    }
    return d;
  }
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) return [lo];
    const step = Math.pow(10, Math.floor(Math.log10((hi - lo) / (n || 3))));
    const err = (hi - lo) / (n || 3) / step;
    const s = step * (err >= 5 ? 5 : err >= 2 ? 2 : 1);
    const out = [];
    for (let v = Math.ceil(lo / s) * s; v <= hi + 1e-9; v += s) out.push(Number(v.toFixed(6)));
    return out;
  }
  // Re-render `container` with `draw` and give focus back to the element that had it (matched
  // by data-cell, or data-focus-key), so a refresh never steals a keyboard user's place.
  function keepFocus(container, draw) {
    const doc = D(), active = doc.activeElement;
    const inside = active && container.contains && container.contains(active);
    const key = inside ? (active.getAttribute("data-cell") !== null ? ["data-cell", active.getAttribute("data-cell")]
      : active.getAttribute("data-focus-key") !== null ? ["data-focus-key", active.getAttribute("data-focus-key")] : null) : null;
    const out = draw();
    if (key) {
      const again = find(container, (e) => e.getAttribute && e.getAttribute(key[0]) === key[1]);
      if (again && again.focus) again.focus({ preventScroll: true });
    }
    return out;
  }
  function find(node, test) {
    for (const c of node.children || []) {
      if (test(c)) return c;
      const deeper = find(c, test);
      if (deeper) return deeper;
    }
    return null;
  }

  // ---- vocabulary -----------------------------------------------------------------------------
  const HEALTH = Object.freeze({
    healthy: "Healthy",
    degraded: "Job has a problem",
    cause: "GPU behind the problem",
    checking: "Artemis fixing or checking",
    drained: "Drained",
    unresponsive: "Not responding",
    stale: "Stale",
    not_collected: "Not collected",
    unknown: "Unknown",
    unavailable: "Unavailable",
  });
  const ALLOCATION = Object.freeze({ active: "Active job", idle: "Idle", unavailable: "Unavailable", unknown: "Allocation unknown" });
  const token = (t) => (Object.prototype.hasOwnProperty.call(HEALTH, t) ? t : "unknown");
  const healthWord = (t) => HEALTH[token(t)];

  // ---- grid ------------------------------------------------------------------------------------
  // racks: [{id, label?, sub?, bare?, nodes: [{id, label?, href?, note?, tone?, cells: [{id, health,
  //   allocation, group?, label?, tip: [[k, v], ...], wide?}]}]}]
  // groups: {id: {label, href?, sub?}}. One tab stop (roving tabindex); arrows move by cell and by
  // node row, Home/End to the ends; hover and focus show the tip; Enter, Space or click: onPick.
  function grid(opts) {
    const o = opts || {};
    const el = h("div", { class: "ak-grid", role: "group", "aria-label": o.label || "Devices" });
    const tip = h("div", { class: "ak-tip", role: "tooltip", hidden: true });
    let order = [], rows = [], current = null, seq = 0, pending = o.focus || null;
    const tipId = "ak-tip-" + (++grid.n);
    tip.id = tipId;
    function show(cell) {
      const lines = cell._tip || [];
      tip.replaceChildren(...lines.map(([k, v]) => h("p", { class: "ak-tip-row" }, h("span", { class: "ak-tip-k" }, k), h("span", { class: "ak-tip-v" }, v))));
      tip.hidden = false;
      const r = cell.getBoundingClientRect(), g = el.getBoundingClientRect();
      const width = tip.offsetWidth || 300;
      tip.style.left = Math.max(0, Math.min(r.left - g.left, (g.width || width) - width)) + "px";
      tip.style.top = (r.bottom - g.top + 8) + "px";
      setAttr(cell, "aria-describedby", tipId);
    }
    function hide(cell) { tip.hidden = true; if (cell) setAttr(cell, "aria-describedby", null); }
    function rove(cell) {
      for (const c of order) c.tabIndex = c === cell ? 0 : -1;
      current = cell ? cell.getAttribute("data-cell") : null;
    }
    function move(cell, key) {
      const i = order.indexOf(cell);
      if (i < 0 || !/^(Arrow(Left|Right|Up|Down)|Home|End)$/.test(key)) return null;
      if (key === "ArrowRight") return order[Math.min(order.length - 1, i + 1)];
      if (key === "ArrowLeft") return order[Math.max(0, i - 1)];
      if (key === "Home") return order[0];
      if (key === "End") return order[order.length - 1];
      const r = rows.findIndex((row) => row.includes(cell));
      const col = rows[r].indexOf(cell);
      const next = rows[key === "ArrowDown" ? r + 1 : r - 1];
      return next ? next[Math.min(col, next.length - 1)] : null;
    }
    function button(c) {
      const b = h("button", { type: "button", class: "ak-cell" + (c.wide ? " ak-wide" : ""), "data-cell": c.id, "data-health": token(c.health),
        "data-allocation": c.allocation || "unknown", "data-group": c.group || null, tabindex: "-1",
        "aria-label": [healthWord(c.health)].concat((c.tip || []).map(([k, v]) => k + " " + v)).join(", ") },
      h("span", { class: "ak-cell-t" }, c.label || ""));
      b._tip = c.tip || [];
      b.addEventListener("mouseenter", () => show(b));
      b.addEventListener("mouseleave", () => hide(b));
      b.addEventListener("focus", () => { rove(b); show(b); });
      b.addEventListener("blur", () => hide(b));
      b.addEventListener("click", () => { hide(b); if (o.onPick) o.onPick(c.id); });
      b.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hide(b); if (o.onPick) o.onPick(c.id); return; }
        if (e.key === "Escape") { hide(b); return; }
        const next = move(b, e.key);
        if (next) { e.preventDefault(); if (next !== b) next.focus(); }
      });
      return b;
    }
    function update(data) {
      data = data || {};
      const groups = data.groups || {};
      order = []; rows = []; seq++;
      const bareGrid = (data.racks || []).every((r) => r.bare);
      setAttr(el, "data-bare", bareGrid ? "" : null);
      const racks = (data.racks || []).map((rack) => {
        const seen = new Set();
        let above = [];
        const nodeEls = (rack.nodes || []).map((node) => {
          const rowCells = [];
          const parts = []; // runs of one group's consecutive cells, or ungrouped cells
          for (const c of node.cells || []) {
            // the frame is the allocation's: a job's (active) or a last-known one (unknown)
            const alloc = c.allocation || "unknown";
            const g = c.group && (alloc === "active" || alloc === "unknown") ? c.group : null;
            const last = parts[parts.length - 1];
            if (g && last && last.group === g && last.alloc === alloc) last.cells.push(c);
            else parts.push({ group: g, alloc, cells: [c] });
          }
          const groupsHere = parts.filter((p) => p.group).map((p) => p.group);
          const kids = parts.map((p) => {
            const btns = p.cells.map(button);
            rowCells.push(...btns);
            if (!p.group) return btns;
            const g = groups[p.group] || { label: p.group };
            const first = !seen.has(p.group);
            seen.add(p.group);
            const join = above.includes(p.group) ? "up" : null;
            return h("div", { class: "ak-group", "data-group": p.group, "data-join": join, "data-allocation": p.alloc, "data-tone": g.tone || null },
              first ? (g.href ? h("a", { class: "ak-group-label", href: g.href }, g.label, g.sub ? h("span", { class: "ak-group-sub" }, g.sub) : null)
                : h("span", { class: "ak-group-label" }, g.label, g.sub ? h("span", { class: "ak-group-sub" }, g.sub) : null)) : null,
              h("div", { class: "ak-cells" }, btns));
          });
          above = groupsHere;
          rows.push(rowCells);
          order.push(...rowCells);
          const label = node.label ? (node.href ? h("a", { class: "ak-node-label", href: node.href }, node.label) : h("span", { class: "ak-node-label" }, node.label)) : null;
          return h("div", { class: "ak-node", "data-node": node.id, "data-tone": node.tone || null }, label, kids,
            node.note ? h("span", { class: "ak-node-note" }, node.note) : null);
        });
        // a frame continued on the next row loses its bottom edge
        nodeEls.forEach((n, i) => {
          const next = nodeEls[i + 1];
          if (!next) return;
          for (const g of n.children) {
            if (!g.getAttribute || g.getAttribute("class") !== "ak-group") continue;
            const id = g.getAttribute("data-group");
            if (Array.from(next.children).some((x) => x.getAttribute && x.getAttribute("data-group") === id)) setAttr(g, "data-join", ((g.getAttribute("data-join") || "") + " down").trim());
          }
        });
        return h("section", { class: "ak-rack", "data-rack": rack.id, "data-bare": rack.bare ? "" : null, "aria-label": rack.label || null },
          rack.label ? h("div", { class: "ak-rack-head" }, h("span", { class: "ak-rack-label" }, rack.label), rack.sub ? h("span", { class: "ak-rack-sub" }, rack.sub) : null) : null,
          nodeEls);
      });
      tip.hidden = true;
      keepFocus(el, () => el.replaceChildren(...racks, tip));
      const keep = order.find((c) => c.getAttribute("data-cell") === current) || order[0] || null;
      rove(keep);
      setAttr(el, "data-dim", data.dim ? "" : null);
      if (pending && focus(pending)) pending = null; // grid({focus}): the first update that has it
      return seq;
    }
    function focus(cellId) {
      const c = order.find((x) => x.getAttribute("data-cell") === cellId);
      if (c) c.focus();
      return !!c;
    }
    return { el, update, focus };
  }
  grid.n = 0;

  // ---- legend ----------------------------------------------------------------------------------
  function legend(tokens, opts) {
    const o = opts || {};
    const notes = o.notes || {};
    const item = (raw) => {
      const t = token(raw);
      return h("span", { class: "ak-lg", "data-legend": t },
        h("span", { class: "ak-cell ak-mini", "data-health": t, role: "img", "aria-label": healthWord(t) }), healthWord(t),
        notes[t] ? h("span", { class: "ak-lg-note" }, notes[t]) : null);
    };
    return h("div", { class: "ak-legend" },
      o.label === false ? null : h("span", { class: "ak-legend-label" }, o.label || "Fill = health"),
      (tokens || Object.keys(HEALTH)).map(item),
      o.outline ? [h("span", { class: "ak-legend-label" }, "Outline = allocation"),
        h("span", { class: "ak-lg", "data-legend": "allocated" }, h("span", { class: "ak-outline", role: "img", "aria-label": "Active job outline" }), "Active job, not a fault")] : null,
      o.foot ? h("span", { class: "ak-lg", "data-legend-foot": "" }, o.foot) : null);
  }

  // ---- charts -------------------------------------------------------------------------------
  const hhmm = (t) => new Date(t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const mmdd = (t) => new Date(t * 1000).toLocaleDateString([], { month: "short", day: "2-digit" });
  // In UTC (chart({utc: true})): for a host whose own clock reads UTC.
  const hhmmUTC = (t) => { const d = new Date(t * 1000); return String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0"); };
  const mmddUTC = (t) => new Date(t * 1000).toLocaleDateString([], { month: "short", day: "2-digit", timeZone: "UTC" });
  function hoverGroup(onReadout) {
    const charts = new Set();
    return {
      add(c) { charts.add(c); },
      move(t) {
        const rows = [];
        for (const c of charts) {
          if (!c.svg || !c.svg.isConnected) { charts.delete(c); continue; }
          const inside = t !== null && t >= c.start && t <= c.end;
          setAttr(c.cursor, "x1", inside ? c.x(t) : -10);
          setAttr(c.cursor, "x2", inside ? c.x(t) : -10);
          if (!inside || !c.readout) continue;
          const near = Math.max(30, c.step);
          const values = c.lines.map((l) => {
            let best = null;
            for (const p of l.points) if (p[1] !== null && isFinite(p[1]) && (best === null || Math.abs(p[0] - t) < Math.abs(best[0] - t))) best = p;
            return best && Math.abs(best[0] - t) < near ? { key: l.key, label: l.label || l.key, value: best[1] } : null;
          }).filter(Boolean);
          if (values.length) rows.push({ title: c.title, readout: c.readout, unit: c.unit, digits: c.digits, values });
        }
        if (onReadout) onReadout(t, rows);
      },
    };
  }
  function chart(opts) {
    const o = Object.assign({ height: 220, zero: true, head: true, digits: 2 }, opts || {});
    const plot = h("div", { class: "ak-plot" });
    const overlay = h("div", { class: "ak-overlay" });
    const head = o.head ? h("div", { class: "ak-chart-head" }, h("h3", { class: "ak-chart-title" }, o.title || ""), h("span", { class: "ak-chart-unit" }, o.unit || "")) : null;
    const el = h("div", { class: "ak-chart" }, head, plot);
    const self = { el, overlay, x: () => 0, y: () => 0, update, svg: null, pad: null };
    const hm = o.utc ? hhmmUTC : hhmm, md = o.utc ? mmddUTC : mmdd;
    function update(spec) {
      const s = spec || {};
      const W = Math.max(300, plot.clientWidth || 900), H = o.height;
      const pad = { l: 52, r: 14, t: (s.events && s.events.length) || o.axisUnit ? 22 : 12, b: 26 };
      const start = s.start, end = s.end, step = s.step || 1;
      // no line for an answer that is not a measurement, whatever points came with it
      const noLine = s.state === "error" || s.state === "unsupported" || s.state === "no_data";
      const stale = s.state === "stale";
      const lines = (noLine ? [] : s.lines || []).map((l, i) => ({ key: l.key, label: l.label, tone: (l.tone || "s" + (i % 4)) + (stale ? " ak-stale" : ""),
        points: (l.points || []).map(([t, v]) => [t, v === null || v === undefined || !isFinite(v) ? null : Number(v)]) }));
      const all = lines.flatMap((l) => l.points).filter((p) => p[1] !== null);
      const svg = sv("svg", { class: "ak-chart-svg", viewBox: "0 0 " + W + " " + H, width: "100%", height: H, role: "img",
        "aria-label": (o.title || "chart") + ", " + String(s.state || "no_data").replace("_", " "),
        "data-state": s.state || "no_data", "data-series": lines.length, "data-points": all.length, "data-unit": o.unit || "",
        "data-start": start, "data-end": end });
      const x = (t) => pad.l + ((t - start) / Math.max(1, end - start)) * (W - pad.l - pad.r);
      self.x = x;
      Object.assign(self, { pad, W, H });
      if (!all.length) {
        const why = s.reason || (s.state === "error" ? "Metrics unreachable" : s.state === "unsupported" ? "Not measured" : "No data in this range");
        svg.appendChild(sv("rect", { class: "ak-empty-frame", x: pad.l, y: pad.t, width: W - pad.l - pad.r, height: H - pad.t - pad.b }));
        svg.appendChild(sv("text", { x: W / 2, y: H / 2, class: "ak-empty", "text-anchor": "middle" }, why));
        self.y = () => null;
        plot.replaceChildren(svg, overlay);
        self.svg = null;
        return self;
      }
      let lo = Math.min(...all.map((p) => p[1])), hi = Math.max(...all.map((p) => p[1]));
      for (const r of s.refs || []) { lo = Math.min(lo, r.y); hi = Math.max(hi, r.y); }
      if (o.zero === false && hi === lo) { const m = Math.abs(hi) * 0.1 || 1; lo -= m; hi += m; } // a flat series still spans the axis
      lo = o.zero === false ? lo - (hi - lo) * 0.1 : Math.min(0, lo);
      hi = hi + (hi - lo) * 0.12 || lo + 1;
      const y = (v) => H - pad.b - ((v - lo) / (hi - lo)) * (H - pad.t - pad.b);
      self.y = y;
      const g = sv("g", { class: "ak-axes" });
      for (const v of niceTicks(lo, hi, 4)) {
        g.appendChild(sv("line", { class: "ak-gridline", x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v) }));
        g.appendChild(sv("text", { class: "ak-tick", x: pad.l - 8, y: y(v) + 4, "text-anchor": "end" }, String(v)));
      }
      // about six time ticks whatever the span: a day's history is not drawn with hourly ticks
      const span = end - start, stepT = span <= 1200 ? (W < 500 ? 300 : 120) : span <= 4000 ? 600 : span <= 6 * 3600 ? 3600
        : span <= 2 * 86400 ? 6 * 3600 : 86400 * Math.ceil(span / 86400 / 6);
      for (let t = Math.ceil(start / stepT) * stepT; t <= end; t += stepT) {
        g.appendChild(sv("line", { class: "ak-gridline v", x1: x(t), x2: x(t), y1: pad.t, y2: H - pad.b }));
        g.appendChild(sv("text", { class: "ak-tick", x: x(t), y: H - 8, "text-anchor": "middle" }, stepT >= 86400 ? md(t) : hm(t)));
      }
      if (o.axisUnit) g.appendChild(sv("text", { class: "ak-tick ak-axis-unit", x: 4, y: pad.t - 8 }, o.unit || ""));
      svg.appendChild(g);
      for (const b of s.bands || []) {
        const bx = x(Math.max(start, b.from)), bw = Math.max(2, x(Math.min(end, b.to)) - bx);
        svg.appendChild(sv("rect", { class: "ak-band", x: bx, y: pad.t, width: bw, height: H - pad.t - pad.b }, sv("title", null, b.label || "")));
        if (b.label) svg.appendChild(sv("text", { class: "ak-band-label", x: bx + 4, y: pad.t + 12 }, b.label));
      }
      for (const r of s.refs || []) {
        svg.appendChild(sv("line", { class: "ak-ref", x1: pad.l, x2: W - pad.r, y1: y(r.y), y2: y(r.y) }));
        if (r.label) svg.appendChild(sv("text", { class: "ak-tick", x: W - pad.r, y: y(r.y) - 4, "text-anchor": "end" }, r.label));
      }
      for (const gap of s.gaps || []) {
        svg.appendChild(sv("rect", { class: "ak-gap", x: x(gap.from), y: pad.t, width: Math.max(2, x(gap.to) - x(gap.from)), height: H - pad.t - pad.b },
          sv("title", null, "no data " + hm(gap.from) + " to " + hm(gap.to))));
      }
      for (const l of lines) {
        const broken = [];
        l.points.forEach((p, j) => { if (j && p[0] - l.points[j - 1][0] > 2 * step) broken.push([p[0], null]); broken.push(p); });
        svg.appendChild(sv("path", { class: "ak-line " + l.tone, d: path(broken, x, y), "data-trace": l.key }));
      }
      // An event's label never overlaps another or leaves the plot: its extent is estimated from
      // its length (11 px mono), it sits left of its line near the right edge, and a label that
      // would collide is left to the line's title.
      let lastEnd = -1e9;
      for (const ev of s.events || []) {
        if (ev.t < start || ev.t > end) continue;
        const ex = x(ev.t), w = String(ev.text || "").length * 7 + 4;
        const left = ex + 6 + w > W - pad.r;
        const from = left ? ex - 6 - w : ex + 6, to = left ? ex - 6 : ex + 6 + w;
        svg.appendChild(sv("line", { class: "ak-event " + (ev.tone || ""), x1: ex, x2: ex, y1: pad.t - 6, y2: H - pad.b }, sv("title", null, ev.text || "")));
        if (!ev.text || from < lastEnd + 8 || from < 0) continue;
        lastEnd = to;
        svg.appendChild(sv("text", { class: "ak-event-label", x: left ? to : from, y: pad.t - 8, "text-anchor": left ? "end" : "start" }, ev.text));
      }
      if (stale) svg.appendChild(sv("text", { class: "ak-chart-note", x: W - pad.r - 4, y: pad.t + 12, "text-anchor": "end" }, s.reason || "stale"));
      const cursor = sv("line", { class: "ak-cursor", x1: -10, x2: -10, y1: pad.t, y2: H - pad.b });
      svg.appendChild(cursor);
      plot.replaceChildren(svg, overlay);
      Object.assign(self, { svg, cursor, lines, start, end, step, title: o.title, readout: o.readout, unit: o.unit, digits: o.digits });
      if (o.group) {
        o.group.add(self);
        svg.addEventListener("mousemove", (e) => {
          const r = svg.getBoundingClientRect();
          const px = ((e.clientX - r.left) / (r.width || W)) * W;
          o.group.move(start + ((px - pad.l) / (W - pad.l - pad.r)) * (end - start));
        });
        svg.addEventListener("mouseleave", () => o.group.move(null));
      }
      return self;
    }
    return self;
  }

  // ---- one GPU's record -------------------------------------------------------------------------
  const agoText = (s) => {
    if (!isFinite(s)) return "";
    s = Math.max(0, Math.round(s));
    return s < 90 ? s + " s ago" : s < 5400 ? Math.round(s / 60) + " min ago" : Math.round(s / 3600) + " h ago";
  };
  function signalText(sg, at) {
    const v = Number(sg.value);
    if (sg.unit === "unix_s") return agoText(at - v);
    if (sg.unit === "celsius") return v.toFixed(0) + " °C";
    return v.toFixed(2) + " " + sg.unit;
  }
  function gpuRecord(opts) {
    const o = opts || {};
    const jobHref = o.jobHref || ((run) => "#/run/" + encodeURIComponent(run));
    const title = h("h2", { class: "ak-record-title", tabindex: "-1" }, "Device record");
    const uuid = h("p", { class: "ak-record-uuid" });
    const close = o.onClose ? h("button", { type: "button", class: "ak-close", "aria-label": "Close the device record" }, "Close") : null;
    if (close) close.addEventListener("click", () => o.onClose());
    const sec = (part, name) => {
      const t = h("h3", { class: "ak-sec-title" }, name);
      const sim = h("span", { class: "ak-sim", hidden: true }, "SIMULATED");
      const note = h("p", { class: "ak-sec-note" });
      const body = h("div", { class: "ak-sec-body" });
      const el = h("section", { class: "ak-sec", "data-part": part }, h("div", { class: "ak-sec-head" }, t, sim, note), body);
      return { el, sim, note, body };
    };
    const parts = { identity: sec("identity", "Identity"), job: sec("job", "Current job"), latest: sec("latest", "Latest values"),
      benchmarks: sec("benchmarks", "Benchmark and performance history"), service: sec("service", "Service history") };
    const el = h("article", { class: "ak-record", "data-part": "record" },
      o.head === false ? null : h("div", { class: "ak-record-head", "data-part": "head" }, h("div", null, title, uuid), close),
      Object.values(parts).map((p) => p.el));
    el.addEventListener("keydown", (e) => { if (e.key === "Escape" && o.onClose) { e.preventDefault(); o.onClose(); } });
    const fact = (k, val, mono) => [h("dt", null, k), h("dd", { class: mono ? "ak-mono" : null, "data-state": val === null || val === undefined ? "not_recorded" : "recorded" },
      val === null || val === undefined ? "not recorded" : String(val))];
    function update(doc) {
      const d = doc || {};
      setText(title, d.title || "Device record");
      setText(uuid, d.uuid || "");
      setAttr(el, "data-uuid", d.uuid || null);
      // identity: vendor and full model first
      const idn = (d.identity && d.identity.recorded) || {};
      const idSim = !!(d.identity && d.identity.label === "SIMULATED");
      parts.identity.sim.hidden = !idSim;
      setAttr(parts.identity.el, "data-provenance", (d.identity && d.identity.provenance) || null);
      parts.identity.body.replaceChildren(h("dl", { class: "ak-facts" },
        fact("Vendor", idn.vendor), fact("Model", idn.model),
        d.health ? fact("Health", healthWord(d.health)) : null,
        fact("Memory", idn.memory_bytes ? (idn.memory_bytes / 2 ** 30).toFixed(0) + " GiB" : null, true),
        fact("PCI bus id", idn.pci_bus_id, true), fact("Driver", idn.driver, true),
        fact("Power limit", idn.power_limit_w ? Math.round(idn.power_limit_w) + " W" : null, true),
        fact("Identity source", d.identity && d.identity.recorded ? "GPU history (" + d.identity.provenance + ")" : "no recorded identity")));
      // current job
      const loc = d.location || { current: null, seen: [] };
      const cur = loc.current;
      parts.job.body.replaceChildren(cur
        ? h("p", null, h("a", { class: "ak-job-link", href: jobHref(cur.run) }, (cur.label || cur.run) + " ↗"), " rank " + cur.rank + " on ", h("span", { class: "ak-mono" }, cur.node || "?"))
        : h("p", { class: "ak-empty-line" }, "Not in a reporting run now." + (loc.seen && loc.seen.length ? " Last seen in " + loc.seen[0].run + "." : "")),
        loc.note ? h("p", { class: "ak-small" }, loc.note) : null);
      // latest values: the host's own, or the document's signals
      // a stale value reads "last ...", with its reason as the title; never like a fresh one
      const last = (st) => (st === "stale" ? "last " : "");
      const latest = d.latest ? d.latest.map((x) => {
        const none = x.value === null || x.value === undefined, st = none ? "no_data" : x.state || "fresh";
        return [x.label, none ? null : last(st) + x.value + (x.unit ? " " + x.unit : ""), st, x.value, x.reason];
      }) : (d.signals || []).map((sg) => [sg.title, sg.value === null ? (sg.reason || "not collected") : last(sg.state) + signalText(sg, d.evaluated_at), sg.state, sg.value, sg.reason]);
      parts.latest.body.replaceChildren(latest.length ? h("dl", { class: "ak-facts" }, latest.flatMap(([k, text, state, raw, why]) =>
        [h("dt", null, k), h("dd", { class: "ak-mono", "data-state": state, "data-raw": raw ?? null, title: state === "stale" && why ? why : null }, text === null ? "not collected" : text)]))
        : h("p", { class: "ak-empty-line" }, "No latest values."));
      // benchmarks
      const b = d.benchmarks || { series: [] };
      const bSim = b.label === "SIMULATED" || b.provenance === "simulated";
      parts.benchmarks.sim.hidden = !bSim;
      setAttr(parts.benchmarks.el, "data-bench-state", b.state || null);
      setText(parts.benchmarks.note, (b.note || "") + (b.what ? " Source: " + b.what + "." : ""));
      if (!b.series || !b.series.length) {
        parts.benchmarks.body.replaceChildren(h("p", { class: "ak-empty-line", "data-bench-state": b.state || "none_recorded" }, b.reason || "No benchmark history recorded for this GPU."));
      } else {
        const charts = b.series.map((s) => {
          const c = chart({ title: s.workload + " · " + s.metric, unit: s.kind + " · " + s.unit, height: 160, zero: false, head: false, utc: o.utc });
          const trend = s.state === "trend";
          const el = h("section", { class: "ak-bench-series", "data-bench-state": s.state, "data-n": s.n, "data-kind": s.kind, "data-provenance": s.provenance },
            h("div", { class: "ak-chart-head" }, h("h4", { class: "ak-chart-title" }, s.workload + " · " + s.metric),
              h("span", { class: "ak-bench-change" }, trend && s.change_vs_baseline !== null && s.change_vs_baseline !== undefined ? (s.change_vs_baseline * 100).toFixed(1) + "% vs baseline" : ""),
              h("span", { class: "ak-chart-unit" }, s.kind + " · " + s.unit)),
            h("p", { class: "ak-bench-src" }, s.provenance === "simulated" ? h("span", { class: "ak-sim" }, "SIMULATED") : null, s.provenance === "simulated" ? " " : "",
              (s.provenance === "recorded" ? "Recorded · " : "") + "class " + s.hw_class + " · " + s.n + " point" + (s.n === 1 ? "" : "s") + " from " + s.jobs.length + " job" + (s.jobs.length === 1 ? "" : "s") + (s.reason ? " · " + s.reason : "")),
            c.el);
          return { el, c, s, trend };
        });
        parts.benchmarks.body.replaceChildren(h("div", { class: "ak-bench" }, charts.map((x) => x.el)));
        for (const { c, s, trend } of charts) {
          const t0 = s.points[0].t, t1 = s.points[s.points.length - 1].t, padT = Math.max(3600, (t1 - t0) * 0.05);
          c.update({ start: t0 - padT, end: t1 + padT, step: t1 - t0 + 2 * padT, state: "fresh",
            lines: [{ key: s.workload, label: s.metric, points: s.points.map((p) => [p.t, p.value]) }],
            refs: trend && s.baseline !== undefined && s.baseline !== null ? [{ y: s.baseline, label: "baseline " + Number(s.baseline).toFixed(2) }] : [] });
        }
      }
      // service
      const sv_ = d.service || { records: [], sources_checked: [] };
      const recs = sv_.records || [];
      parts.service.sim.hidden = !recs.some((r) => r.provenance === "simulated");
      parts.service.body.replaceChildren(recs.length
        ? h("ul", { class: "ak-service" }, recs.map((r) => h("li", { "data-provenance": r.provenance || null },
          h("span", null, r.text), h("span", { class: "ak-service-meta" }, [r.date, r.outcome].filter(Boolean).join(" · ")),
          r.provenance === "simulated" ? h("span", { class: "ak-sim" }, "SIMULATED") : h("span", { class: "ak-service-meta" }, r.provenance || ""))))
        : h("div", null, h("p", { class: "ak-empty-line", "data-state": sv_.state || "none_recorded" }, sv_.text || "No recorded service history"),
          (sv_.sources_checked || []).length ? [h("p", { class: "ak-small" }, "Sources checked:"),
            h("ul", { class: "ak-checked" }, sv_.sources_checked.map((x) => h("li", null, x)))] : null));
      return api;
    }
    const api = { el, update, focus() { (o.head === false ? el : title).focus({ preventScroll: false }); } };
    return api;
  }

  return Object.freeze({ version: 1, dom: Object.freeze({ h, sv, setText, setClass, setAttr, path, niceTicks, keepFocus }),
    HEALTH, ALLOCATION, healthWord, grid, legend, chart, hoverGroup, gpuRecord });
});

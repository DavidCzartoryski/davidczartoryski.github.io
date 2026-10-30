// Artemis fleet UI (plan step 2.6). Vanilla JS, no build step, nothing from other origins.
//
// Every view reads through Artemis.source.get(path) and writes through
// Artemis.source.post(path, body). The default source is this server's /v1 API; a demo
// (step 3) sets window.Artemis = {source: {get, post}} before this file loads and the same
// views render its data. All text from data goes through text nodes (textContent): no
// innerHTML anywhere, so a planted <script> in a job name or a log line shows as text.
"use strict";

(function (root) {
  const Artemis = (root.Artemis = root.Artemis || {});
  const SVG = "http://www.w3.org/2000/svg";

  async function apiGet(path) {
    const r = await fetch(path, { credentials: "same-origin", headers: { Accept: "application/json" } });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || r.status + "");
    return body;
  }
  async function apiPost(path, data) {
    const r = await fetch(path, {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || r.status + "");
    return body;
  }
  Artemis.source = Artemis.source || { get: apiGet, post: apiPost };

  // DOM helpers: data only ever becomes text nodes or attribute values.
  function add(el, kids) {
    for (const k of kids) {
      if (k === null || k === undefined || k === false) continue;
      if (Array.isArray(k)) add(el, k);
      else if (typeof k === "object") el.appendChild(k);
      else el.appendChild(document.createTextNode(String(k)));
    }
    return el;
  }
  function attrs(el, a) {
    for (const [k, v] of Object.entries(a || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "on") { for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn); continue; }
      if (/^on/i.test(k)) throw new Error("event attributes are not allowed: " + k);
      el.setAttribute(k, String(v));
    }
    return el;
  }
  function h(tag, a, ...kids) { return add(attrs(document.createElement(tag), a), kids); }
  function s(tag, a, ...kids) { return add(attrs(document.createElementNS(SVG, tag), a), kids); }
  const enc = encodeURIComponent;

  function when(t) {
    if (t === null || t === undefined) return "-";
    return new Date(t * 1000).toISOString().replace("T", " ").replace(/:\d\d\.\d+Z$/, "Z");
  }
  function badge(text, cls) { return h("span", { class: "badge " + (cls || "r-" + text) }, text); }
  // A confirmed_cause the loop wrote before F7 came from a recovery after a node was taken
  // out (confirmed_by verified-intervention): that confirms the node, not the cause.
  const NODE_LEVEL_BEFORE_F7 = "recorded before F7: node-level, not a cause label";
  function causeIsNodeLevel(d) {
    if (!d.confirmed_cause) return false;
    if (d.confirmed_cause_reading) return d.confirmed_cause_reading.level !== "cause";
    return d.confirmed_cause.confirmed_by === "verified-intervention";
  }
  function stateDot(state) { return h("span", { class: "dot st-" + state, title: state }); }
  function json(v) { return h("pre", null, JSON.stringify(v, null, 1)); }
  function list(items, f) { return h("ul", null, items.map((x) => h("li", null, f(x)))); }
  function section(title, ...kids) { return h("section", null, h("h2", null, title), kids); }
  function link(href, text) { return h("a", { href: href }, text); }
  function short(id) { return String(id).split(":").slice(1).join(":") || String(id); }
  function details(summary, ...kids) {
    return h("details", null, h("summary", null, summary), h("div", { class: "body" }, kids));
  }

  function banner(doc) {
    const b = document.getElementById("banner");
    if (!b || !doc) return;
    if (doc.data_origin === "simulated") {
      b.textContent = doc.simulated_banner || "Simulated fleet: no real hardware, cordon, restart or recovery.";
      b.hidden = false;
    } else {
      b.textContent = "Data origin unverified: treat everything here as simulated.";
      b.hidden = false;
    }
  }
  async function get(path) { const d = await Artemis.source.get(path); banner(d); return d; }

  // Fleet overview.
  function tiles(counts, label) {
    return Object.entries(counts).filter(([, n]) => n > 0).map(([st, n]) =>
      h("div", { class: "tile" }, h("div", { class: "k" }, label), h("div", { class: "v" }, stateDot(st), n + " " + st)));
  }
  function legend(states) {
    return h("div", { class: "legend" }, states.map((st) => h("span", null, stateDot(st), st)));
  }

  function topologySvg(topo) {
    const racks = topo.racks;
    const byId = {};
    for (const n of topo.nodes) byId[n.id] = n;
    const hostsOf = {};
    const gpusOf = {};
    for (const n of topo.nodes) {
      if (n.kind === "host") (hostsOf[n.parent] = hostsOf[n.parent] || []).push(n);
      if (n.kind === "gpu") (gpusOf[n.parent] = gpusOf[n.parent] || []).push(n);
    }
    const colW = 170, hostH = 34, top = 150;
    const maxHosts = Math.max(1, ...racks.map((r) => (hostsOf[r.rack] || []).length));
    const rackH = 30 + maxHosts * hostH;
    const W = racks.length * colW + 40, H = top + rackH + 110;
    const svg = s("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
      "aria-label": "Fleet topology: spines, leaves, racks, hosts, GPUs, power feeds and cooling" });
    const spines = topo.nodes.filter((n) => n.kind === "spine");
    const spX = (i) => 20 + (W - 40) * (i + 1) / (spines.length + 1);
    const colX = (i) => 20 + i * colW + colW / 2;
    racks.forEach((r, i) => spines.forEach((sp, j) =>
      svg.appendChild(s("line", { class: "line", x1: colX(i), y1: 90, x2: spX(j), y2: 34 }))));
    spines.forEach((sp, j) => {
      svg.appendChild(s("rect", { class: "box", x: spX(j) - 40, y: 14, width: 80, height: 22, rx: 4 }));
      svg.appendChild(s("text", { x: spX(j), y: 29, "text-anchor": "middle" }, sp.name));
    });
    const feeds = topo.nodes.filter((n) => n.kind === "power_feed" || n.kind === "cooling");
    const fy = top + rackH + 60;
    const fX = (i) => 20 + (W - 40) * (i + 1) / (feeds.length + 1);
    racks.forEach((r, i) => {
      const x0 = 20 + i * colW + 8, cx = colX(i);
      for (const f of [...r.power_feeds, ...r.cooling]) {
        const k = feeds.findIndex((n) => n.id === f);
        if (k >= 0) svg.appendChild(s("line", { class: "line", x1: cx, y1: top + rackH, x2: fX(k), y2: fy - 12, "stroke-dasharray": f.startsWith("cooling") ? "4 3" : null }));
      }
      if (r.leaf) {
        svg.appendChild(s("line", { class: "line", x1: cx, y1: 112, x2: cx, y2: top }));
        svg.appendChild(s("rect", { class: "box", x: cx - 40, y: 90, width: 80, height: 22, rx: 4 }));
        svg.appendChild(s("text", { x: cx, y: 105, "text-anchor": "middle" }, short(r.leaf)));
      }
      const rackLink = s("a", { href: "#/rack/" + enc(short(r.rack)) },
        s("rect", { class: "box", x: x0, y: top, width: colW - 16, height: rackH, rx: 6 }),
        s("text", { x: x0 + 8, y: top + 18 }, "rack " + (r.name || short(r.rack))));
      svg.appendChild(rackLink);
      (hostsOf[r.rack] || []).forEach((host, k) => {
        const y = top + 28 + k * hostH;
        const g = s("a", { href: "#/host/" + enc(host.name) },
          s("rect", { class: "hostbox st-" + host.state, x: x0 + 6, y: y, width: colW - 28, height: hostH - 4, rx: 4, "fill-opacity": host.state === "healthy" ? 0.08 : 0.3 }),
          s("title", null, host.id + ": " + host.state + (host.why.length ? " (" + host.why.join("; ") + ")" : "")),
          s("text", { x: x0 + 10, y: y + 12 }, host.name + (host.state === "healthy" ? "" : " · " + host.state)));
        (gpusOf[host.id] || []).forEach((gpu, m) => {
          g.appendChild(s("rect", { class: "st-" + gpu.state, x: x0 + 10 + m * 15, y: y + 16, width: 12, height: 10, rx: 2 },
            s("title", null, gpu.id + ": " + gpu.state)));
        });
        svg.appendChild(g);
      });
    });
    feeds.forEach((f, k) => {
      svg.appendChild(s("rect", { class: "box", x: fX(k) - 44, y: fy - 12, width: 88, height: 22, rx: 4 }));
      svg.appendChild(s("text", { x: fX(k), y: fy + 3, "text-anchor": "middle" }, (f.kind === "cooling" ? "cooling " : "feed ") + f.name));
    });
    return h("div", { class: "scroll" }, svg);
  }

  async function viewFleet() {
    const [fleet, topo] = await Promise.all([get("/v1/fleet"), get("/v1/topology")]);
    const sick = [];
    for (const c of fleet.classes) for (const g of c.gpus) if (g.state !== "healthy" && g.state !== "affected") sick.push(g);
    return h("div", null,
      h("h1", null, "Fleet"),
      h("p", { class: "muted" }, "As of " + when(fleet.as_of) + " (window " + (fleet.scope || "-") + "). " + fleet.notes.join(" ")),
      h("div", { class: "tiles" },
        tiles(fleet.counts.gpus, "GPUs"), tiles(fleet.counts.hosts, "Hosts"), tiles(fleet.counts.jobs, "Jobs"),
        h("div", { class: "tile" }, h("div", { class: "k" }, "Incidents shaping state"), h("div", { class: "v" }, fleet.incidents.shaping_state + " of " + fleet.incidents.total)),
        h("div", { class: "tile" }, h("div", { class: "k" }, "Open tickets"), h("div", { class: "v" }, link("#/tickets", String(fleet.tickets_open)))),
        h("div", { class: "tile" }, h("div", { class: "k" }, "Circuit breaker"), h("div", { class: "v" }, fleet.breaker ? "open" : "closed"))),
      fleet.breaker ? h("div", { class: "card" }, badge("breaker open", "r-breaker_open"), fleet.breaker.why, h("div", { class: "muted" }, "Closed only by " + fleet.breaker.closes_by)) : null,
      section("Topology", legend(topo.states.gpu), legend(topo.states.host.filter((x) => !topo.states.gpu.includes(x))), topologySvg(topo),
        h("h3", null, "Racks"),
        h("div", { class: "chips" }, topo.racks.map((r) => h("a", { class: "chip", href: "#/rack/" + enc(short(r.rack)) },
          "rack " + (r.name || short(r.rack)) + " · " + Object.entries(r.gpu_states).filter(([k, n]) => n && k !== "healthy").map(([k, n]) => n + " " + k).join(", ")))))
      , section("GPUs needing attention", sick.length ? h("div", { class: "tablewrap" }, h("table", null,
        h("tr", null, h("th", null, "GPU"), h("th", null, "State"), h("th", null, "Why")),
        sick.map((g) => h("tr", null, h("td", null, link("#/gpu/" + enc(g.uuid), g.id)), h("td", null, stateDot(g.state), g.state), h("td", null, g.why.join("; ")))))) : h("p", { class: "muted" }, "None.")),
      section("Jobs", h("div", { class: "tablewrap" }, h("table", null,
        h("tr", null, h("th", null, "Job"), h("th", null, "Name"), h("th", null, "User"), h("th", null, "State"), h("th", null, "Hosts")),
        fleet.jobs.map((j) => h("tr", null, h("td", null, link("#/job/" + enc(short(j.id)), j.id)), h("td", null, j.name), h("td", null, j.user),
          h("td", null, stateDot(j.state), j.state), h("td", null, (j.hosts_now ? "now " + j.hosts_now.join(", ") + " (was " + j.hosts.join(", ") + ")" : j.hosts.join(", ")))))))));
  }

  async function viewRack(rack) {
    const topo = await get("/v1/topology?rack=" + enc(rack));
    const hosts = topo.nodes.filter((n) => n.kind === "host");
    const kids = (id, kind) => topo.nodes.filter((n) => n.parent === id && n.kind === kind);
    const jobs = topo.nodes.filter((n) => n.kind === "job");
    const W = Math.max(360, hosts.length * 180 + 40), H = 250;
    const svg = s("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": "Rack " + rack + ": leaf, hosts, NICs and GPUs" });
    const leaf = topo.nodes.find((n) => n.kind === "leaf");
    if (leaf) {
      svg.appendChild(s("rect", { class: "box", x: W / 2 - 50, y: 10, width: 100, height: 24, rx: 4 }));
      svg.appendChild(s("text", { x: W / 2, y: 26, "text-anchor": "middle" }, leaf.name));
    }
    hosts.forEach((host, i) => {
      const x = 20 + i * 180;
      kids(host.id, "nic").forEach((nic, k) => {
        const nx = x + 20 + k * 36;
        svg.appendChild(s("line", { class: "line", x1: nx, y1: 90, x2: W / 2, y2: 34 }));
        svg.appendChild(s("circle", { class: "node", cx: nx, cy: 94, r: 5 }, s("title", null, nic.id)));
      });
      const g = s("a", { href: "#/host/" + enc(host.name) },
        s("rect", { class: "hostbox st-" + host.state, x: x, y: 104, width: 160, height: 120, rx: 6, "fill-opacity": host.state === "healthy" ? 0.08 : 0.3 }),
        s("text", { x: x + 8, y: 122 }, host.name + " · " + host.state));
      kids(host.id, "gpu").forEach((gpu, m) => {
        g.appendChild(s("rect", { class: "st-" + gpu.state, x: x + 8 + (m % 4) * 38, y: 132 + Math.floor(m / 4) * 40, width: 32, height: 32, rx: 4 }, s("title", null, gpu.id + ": " + gpu.state)));
        g.appendChild(s("text", { x: x + 16 + (m % 4) * 38, y: 152 + Math.floor(m / 4) * 40 }, String(gpu.attrs.index)));
      });
      svg.appendChild(g);
    });
    return h("div", null, h("h1", null, "Rack " + rack), legend(topo.states.gpu), h("div", { class: "scroll" }, svg),
      section("Hosts", h("div", { class: "chips" }, hosts.map((x) => h("a", { class: "chip", href: "#/host/" + enc(x.name) }, stateDot(x.state), x.name + " · " + x.state)))),
      section("Jobs on this rack", jobs.length ? h("div", { class: "chips" }, jobs.map((j) => h("a", { class: "chip", href: "#/job/" + enc(short(j.id)) }, stateDot(j.state), j.id + " " + (j.name || "") + " · " + j.state))) : h("p", { class: "muted" }, "None.")));
  }

  async function viewHost(host) {
    const summary = await get("/v1/topology");
    const node = summary.nodes.find((n) => n.kind === "host" && n.name === host);
    if (!node) throw new Error("no host " + host);
    const [topo, fleet] = await Promise.all([get("/v1/topology?rack=" + enc(short(node.parent))), get("/v1/fleet")]);
    const gpus = [];
    for (const c of fleet.classes) for (const g of c.gpus) if (g.host === node.id) gpus.push(g);
    const nics = topo.nodes.filter((n) => n.parent === node.id && n.kind === "nic");
    const jobs = fleet.jobs.filter((j) => j.hosts.includes(host) || (j.hosts_now || []).includes(host));
    return h("div", null, h("h1", null, "Host " + host), h("p", null, stateDot(node.state), node.state, node.why.length ? " · " + node.why.join("; ") : ""),
      h("p", null, "Rack ", link("#/rack/" + enc(short(node.parent)), short(node.parent))),
      section("GPUs", h("div", { class: "tablewrap" }, h("table", null,
        h("tr", null, h("th", null, "GPU"), h("th", null, "State"), h("th", null, "Temp C"), h("th", null, "Util %"), h("th", null, "SM MHz"), h("th", null, "Job")),
        gpus.map((g) => h("tr", null, h("td", null, link("#/gpu/" + enc(g.uuid), g.id)), h("td", null, stateDot(g.state), g.state),
          h("td", null, g.latest.temp_c ?? "-"), h("td", null, g.latest.util_pct ?? "-"), h("td", null, g.latest.sm_clock_mhz ?? "-"), h("td", null, g.job || "-")))))),
      section("NICs", list(nics, (n) => n.id + " · " + (n.attrs.rate_gbps || "?") + " Gb/s")),
      section("Jobs", jobs.length ? list(jobs, (j) => [link("#/job/" + enc(short(j.id)), j.id), " ", j.name, " · ", j.state]) : h("p", { class: "muted" }, "None.")));
  }

  function sparkline(points, label) {
    if (!points.length) return h("p", { class: "muted" }, label + ": no samples");
    const W = 320, H = 64, ts = points.map((p) => p[0]), vs = points.map((p) => Number(p[1]));
    const t0 = Math.min(...ts), t1 = Math.max(...ts), v0 = Math.min(...vs), v1 = Math.max(...vs);
    const X = (t) => 4 + (W - 8) * (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0));
    const Y = (v) => H - 14 - (H - 24) * (v1 === v0 ? 0.5 : (v - v0) / (v1 - v0));
    return h("div", null, h("div", { class: "muted" }, label + " (" + v0 + " to " + v1 + ", " + when(t0) + " to " + when(t1) + ")"),
      s("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": label },
        s("polyline", { points: points.map((p) => X(p[0]).toFixed(1) + "," + Y(Number(p[1])).toFixed(1)).join(" "), fill: "none", stroke: "#2456a6", "stroke-width": 1.5 })));
  }

  async function viewGpu(uuid) {
    const d = await get("/v1/gpus/" + enc(uuid));
    const g = d.gpu;
    return h("div", null, h("h1", null, "GPU " + g.id),
      h("div", { class: "card" }, h("p", null, stateDot(g.state), g.state, g.why.length ? " · " + g.why.join("; ") : ""),
        h("p", null, "UUID ", h("code", null, g.uuid), " · ", g.model, " · bus ", g.bdf, " · host ", link("#/host/" + enc(short(g.host)), short(g.host)), g.job ? [" · job ", link("#/job/" + enc(short(g.job)), g.job)] : null),
        g.incidents.length ? h("p", null, "Incidents: ", g.incidents.map((i) => [link("#/incident/" + enc(i), i), " "])) : null),
      section("Series (every stored window)", Object.entries(d.series).map(([k, pts]) => sparkline(pts, k))),
      section("Facts about this GPU", d.facts.length ? list(d.facts, (f) => [link("#/incident/" + enc(f.incident), f.incident), " · ", f.id, " = ", String(f.value), " (", f.status, ")"]) : h("p", { class: "muted" }, "None.")),
      h("p", { class: "muted" }, d.notes.join(" ")));
  }

  async function viewJob(job) {
    const d = await get("/v1/jobs/" + enc(job));
    const j = d.job;
    return h("div", null, h("h1", null, "Job " + j.id),
      h("div", { class: "card" }, h("p", null, "Name ", h("strong", null, j.name), " · user ", j.user, " · ", j.gpus, " GPUs"),
        h("p", null, stateDot(j.state), j.state, j.why.length ? " · " + j.why.join("; ") : ""),
        h("p", null, "Hosts: ", j.hosts.join(", "), j.hosts_now ? " · now on " + j.hosts_now.join(", ") + " (simulated restart)" : "")),
      sparkline(d.samples_per_s, "samples/s (every stored window)"),
      section("Incidents", d.incidents.length ? list(d.incidents, (i) => [link("#/incident/" + enc(i.incident_id), i.title), " · ", i.status]) : h("p", { class: "muted" }, "None.")),
      section("Actions on this job", d.actions.length ? d.actions.map(actionCard) : h("p", { class: "muted" }, "None.")),
      section("Findings", d.findings.length ? list(d.findings, (f) => [when(f.t), " · ", f.kind, " ", f.state, f.rank !== null ? " rank " + f.rank : "", " (", f.scope, ")"]) : h("p", { class: "muted" }, "None.")),
      section("Ranks", h("div", { class: "tablewrap" }, h("table", null, h("tr", null, h("th", null, "Rank"), h("th", null, "GPU"), h("th", null, "State"), h("th", null, "SM MHz")),
        d.ranks.map((r) => h("tr", null, h("td", null, r.rank), h("td", null, r.gpu), h("td", null, r.gpu_state ? [stateDot(r.gpu_state), r.gpu_state] : "-"), h("td", null, r.latest.sm_clock_mhz ?? "-")))))));
  }

  // Alerts and incidents.
  function modelLine(m) {
    const who = m.ai ? "AI model (shadow)" : "scripted model, not AI";
    if (!m.accepted) return "shadow (" + who + "): rejected by the gate, fallback to the rule";
    return "shadow (" + who + "): " + (m.agrees_with_rule && m.agrees_with_rule.policy ? "agrees" : "disagrees") + " (" + m.policy + ")";
  }
  async function viewAlerts() {
    const d = await get("/v1/incidents");
    return h("div", null, h("h1", null, "Alerts"), h("p", { class: "muted" }, "Newest first. Grouping: " + (d.grouping_rule || "-")),
      d.incidents.length ? d.incidents.map((i) => h("div", { class: "card" },
        h("div", null, badge(i.status, "r-" + i.status), h("span", { class: "muted" }, when(i.t_first || i.t_decided) + " · " + i.scope)),
        h("h3", null, link("#/incident/" + enc(i.incident_id), i.title)),
        h("div", { class: "muted" }, modelLine(i.model)),
        i.tickets.length ? h("div", null, "Tickets: ", i.tickets.map((t) => t.ticket_id + " (" + t.state + ") ")) : null,
        i.approvals_pending ? h("div", null, badge(i.approvals_pending + " approval(s) pending", "r-pending")) : null)) : h("p", { class: "muted" }, "No incidents."));
  }

  function sourceLine(r) {
    return h("div", null,
      h("div", { class: "muted" }, (r.via ? "via " + r.via + " · " : "") + r.source + " · " + r.artifact + " line " + r.line + " · " + when(r.t) + (r.matches_stored === true ? " · matches the stored text" : r.matches_stored === false ? " · DIFFERS from the stored text" : " · envelope")),
      h("pre", null, r.raw === null || r.raw === undefined ? "(no line: " + JSON.stringify(r.value) + ")" : r.raw),
      r.stored_line ? h("pre", null, "stored: " + r.stored_line) : null);
  }

  function factCard(f) {
    // A derived fact (topology.*, say) has no line of its own: it expands to the raw lines
    // of the facts it rests on, each marked with the fact it belongs to.
    const derived = f.derived_sources || [], unresolved = f.unresolved_facts || [];
    return details([badge(f.status, "r-" + f.status), f.id + " = " + String(f.value), h("span", { class: "muted" }, " · first " + when(f.first_seen))],
      f.basis ? h("p", null, "Basis: " + f.basis) : null,
      f.measured ? h("div", null, h("div", { class: "muted" }, "Measured"), json(f.measured)) : null,
      f.facts.length ? h("p", null, "From facts: " + f.facts.join(", ")) : null,
      f.related.length ? h("p", null, "Related: " + f.related.join(", ")) : null,
      f.sources.length || !f.facts.length ? h("div", { class: "muted" }, f.sources.length + " raw source line(s)") : null,
      f.sources.map(sourceLine),
      f.facts.length ? h("div", { class: "muted" }, derived.length + " raw source line(s) of the facts it rests on") : null,
      derived.map(sourceLine),
      unresolved.length ? h("p", { class: "err" }, "Not in this incident's evidence: " + unresolved.join(", ")) : null);
  }

  function reportCard(r) {
    const cond = (x) => x.condition + (x.facts && x.facts.length ? ": " + x.facts.join(", ") : "");
    return details([badge(r.status, "r-" + r.status), r.policy, r.blames.length ? h("span", { class: "muted" }, " · blames " + r.blames.join(", ")) : null],
      h("h3", null, "Requires"), r.requires.length ? list(r.requires, (q) => [badge(q.state, "r-" + q.state), cond(q)]) : h("p", { class: "muted" }, "-"),
      h("h3", null, "Matched"), r.matched.length ? list(r.matched, cond) : h("p", { class: "muted" }, "-"),
      h("h3", null, "Against"), r.against.length ? list(r.against, (a) => cond(a) + " → " + a.confounder) : h("p", { class: "muted" }, "-"),
      h("h3", null, "Missing"), r.missing.length ? list(r.missing, (m) => m) : h("p", { class: "muted" }, "-"),
      h("p", { class: "muted" }, r.absent.length + " suggesting condition(s) absent"),
      h("h3", null, "Fixes in the catalogue"), list(r.fixes, (x) => x.order + ". " + x.fix + " [" + x.tier + "]"));
  }

  function subgraphSvg(sub, blamed) {
    const rows = [["power_feed", "cooling", "spine"], ["leaf", "rack"], ["host"], ["nvswitch", "pcie_switch", "nic", "gpu"], ["job"], ["rank"]];
    const focus = new Set((sub.meta && sub.meta.focus) || []);
    const hot = new Set(blamed || []);
    const placed = {};
    const lines = rows.map((kinds) => sub.nodes.filter((n) => kinds.includes(n.kind)));
    const ranksByJob = {};
    lines[5] = lines[5].filter((n) => {
      const e = sub.edges.find((x) => x.src === n.id && x.kind === "part_of");
      const j = e ? e.dst : "?";
      (ranksByJob[j] = ranksByJob[j] || []).push(n);
      return false;
    });
    const rankGroups = Object.entries(ranksByJob).map(([j, rs]) => ({ id: "ranks@" + j, kind: "rank", label: rs.length + " ranks of " + short(j), job: j, members: rs }));
    lines[5] = rankGroups;
    for (const l of lines) if (l.length > 20) l.splice(20, l.length - 20, { id: "more" + l.length, kind: "more", label: "+" + (l.length - 20) + " more" });
    const W = Math.max(400, Math.max(...lines.map((l) => l.length)) * 112 + 40), H = lines.length * 70 + 20;
    const svg = s("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": "Incident subgraph" });
    lines.forEach((l, r) => l.forEach((n, i) => { placed[n.id] = [20 + (W - 40) * (i + 0.5) / l.length, 30 + r * 70]; if (n.members) for (const m of n.members) placed[m.id] = placed[n.id]; }));
    for (const e of sub.edges) {
      const a = placed[e.src], b = placed[e.dst];
      if (a && b && (a[0] !== b[0] || a[1] !== b[1])) svg.appendChild(s("line", { class: "line", x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
    }
    lines.forEach((l) => l.forEach((n) => {
      const [x, y] = placed[n.id];
      const cls = "node" + (hot.has(n.id) ? " blamed" : focus.has(n.id) || (n.members && n.members.some((m) => focus.has(m.id))) ? " focus" : "");
      svg.appendChild(s("rect", { class: cls, x: x - 50, y: y - 12, width: 100, height: 24, rx: 5 }, s("title", null, n.id || n.label)));
      svg.appendChild(s("text", { x: x, y: y + 4, "text-anchor": "middle" }, n.label || short(n.id)));
    }));
    return h("div", null, h("div", { class: "legend" }, h("span", null, "thick red: blamed by the decision that acts"), h("span", null, "dark: in focus")), h("div", { class: "scroll" }, svg));
  }

  function actionCard(x) {
    return h("div", { class: "card" },
      h("div", null, h("strong", null, (x.order ? x.order + ". " : "") + x.fix), " [" + x.tier + "] on " + x.target + " ", badge(x.status, "r-" + x.status), h("span", { class: "muted" }, " actor " + x.actor + " · " + when(x.t))),
      x.note ? h("p", null, x.note) : null,
      x.site_deviation ? h("p", { class: "err" }, "Site deviation: " + x.site_deviation.why) : null,
      h("div", { class: "tablewrap" }, h("table", null, h("tr", null, h("th", null, "Precondition"), h("th", null, "Result"), h("th", null, "Why")),
        x.preconditions.map((c) => h("tr", null, h("td", null, c.text), h("td", null, badge(c.result, "r-" + c.result)), h("td", null, c.why))))),
      x.commands && x.commands.length ? h("div", null, h("div", { class: "muted" }, "Commands (fake Slurm, simulated: nothing real ran)"), x.commands.map((c) => h("pre", null, c.command))) : null,
      x.verify ? h("p", null, "Verify: ", badge(x.verify.verdict, "r-" + x.verify.verdict), x.verify.after ? "median " + x.verify.after.value + " vs healthy " + x.verify.healthy + " samples/s over " + x.verify.after.n + " samples (simulated)" : (x.verify.notes || "")) : null);
  }

  function approvalCard(a, after) {
    const name = h("input", { type: "text", placeholder: "Your name", "aria-label": "Your name" });
    const note = h("input", { type: "text", placeholder: "Note (what you checked)", "aria-label": "Note" });
    const msg = h("div", { class: "err" });
    async function decide(decision) {
      try {
        await Artemis.source.post("/v1/approvals/" + enc(a.approval_id) + "/decision", { decision: decision, by: name.value, note: note.value });
        if (after) after();
      } catch (e) { msg.textContent = e.message; }
    }
    return h("div", { class: "card" },
      h("div", null, h("strong", null, a.fix), " [" + a.tier + "] for " + a.targets.join(", ") + " ", badge(a.state, "r-" + a.state), h("span", { class: "muted" }, " incident "), link("#/incident/" + enc(a.incident_id), a.incident_id)),
      h("p", null, a.why),
      a.tier_now !== a.tier ? h("p", { class: "err" }, "The catalogue now has this fix at tier " + a.tier_now) : null,
      list(a.preconditions, (c) => [badge(c.result, "r-" + c.result), c.text]),
      a.model_reasoning ? h("div", { class: "quote" }, h("div", { class: "label" }, a.model_reasoning_label + (a.model_agrees === false ? " (the model disagreed)" : "")), a.model_reasoning) : null,
      a.decision ? h("p", null, a.decision.decision + " by " + a.decision.by + " at " + when(a.decision.t) + (a.decision.note ? ": " + a.decision.note : ""), h("br"), "Execution: " + a.decision.execution.status + " · " + a.decision.execution.why) :
        h("div", null, h("div", { class: "row" }, name, note), h("div", { class: "row" },
          h("button", { class: "primary", type: "button", on: { click: () => decide("approve") } }, "Approve (recorded as you)"),
          h("button", { class: "danger", type: "button", on: { click: () => decide("deny") } }, "Deny")), msg));
  }

  async function viewIncident(id) {
    const [d, acts] = await Promise.all([get("/v1/incidents/" + enc(id)), get("/v1/incidents/" + enc(id) + "/actions")]);
    const i = d.incident, sh = d.shadow, rule = d.rule_ranking, ans = sh.answer;
    const rerender = () => route();
    return h("div", null,
      h("h1", null, i.title),
      h("p", null, badge(i.status, "r-" + i.status), h("span", { class: "muted" }, when(i.t_first) + " · window " + d.window + " · " + i.incident_id)),
      details("How these alerts were grouped", h("p", null, d.grouping.rule), d.grouping.note ? h("p", null, d.grouping.note) : null,
        d.grouping.groups.map((g) => h("p", null, g.facts.length + " alerting fact(s) from " + when(g.t_first) + " to " + when(g.t_last) + "; shared points: " + (g.shared_points.join(", ") || "-")))),
      section("Diagnosis", h("div", { class: "grid2" },
        h("div", { class: "card" }, h("h3", null, "Rule ranking ", badge("acts", "acts")),
          h("p", null, h("strong", null, rule.policy), rule.components.length ? " on " + rule.components.join(", ") : ""),
          h("p", null, rule.note), rule.alternatives.length ? h("p", { class: "muted" }, "Alternatives: " + rule.alternatives.join(", ")) : null,
          h("p", { class: "muted" }, "Actions follow: " + d.effective.policy + " (" + d.effective.source + ")")),
        h("div", { class: "card" }, h("h3", null, "Model ", badge(sh.label, "shadow"), badge(sh.model_label, "shadow")),
          h("p", { class: "muted" }, sh.model.id + " · version " + sh.model.version),
          sh.answer_source ? h("p", { class: "muted" }, "Actions followed: " + (sh.actions_followed === "rule-ranking" ? "the rule ranking, not the model" : sh.actions_followed) + ". Shadow answer: " + sh.answer_source_label + ".") : null,
          h("p", null, "Gate: ", badge(sh.gate.accepted ? "accepted" : "rejected", sh.gate.accepted ? "r-accepted" : "r-rejected"), sh.gate.reasons.join("; ")),
          ans ? h("p", null, h("strong", null, ans.policy), ans.components.length ? " on " + ans.components.join(", ") : "") : h("p", null, "No answer passed the gate."),
          sh.requirements_note ? h("p", { class: "err" }, sh.requirements_note) : null,
          ans ? h("div", { class: "quote" }, h("div", { class: "label" }, sh.reasoning_label), ans.reasoning) : null,
          ans && ans.next_check ? h("p", null, "Next check (model): " + ans.next_check) : null,
          ans && ans.ruled_out.length ? list(ans.ruled_out, (r) => r.policy + ": " + r.why) : null))),
      causeIsNodeLevel(d) ? h("div", { class: "card" }, badge("node confirmed, not the cause", "r-recovered"), " " + NODE_LEVEL_BEFORE_F7 + ": " + d.confirmed_cause.text) :
      d.confirmed_cause ? h("div", { class: "card" }, badge("cause confirmed by " + d.confirmed_cause.confirmed_by, "r-recovered"), " " + d.confirmed_cause.text) :
        d.lifecycle.node_confirmation ? h("div", { class: "card" }, badge("node confirmed, not the cause", "r-recovered"), " " + d.lifecycle.node_confirmation.components.join(", ") + ": " + d.lifecycle.node_confirmation.text,
          d.lifecycle.cause_hypothesis ? h("p", null, badge("cause: hypothesis", "shadow"), " " + d.lifecycle.cause_hypothesis.kind + " until its post-repair check: " + (d.lifecycle.cause_hypothesis.confirmed_when || d.lifecycle.cause_hypothesis.post_repair_check || "not stated")) : null) :
        d.lifecycle.cause_note ? h("div", { class: "card" }, d.lifecycle.cause_note) : null,
      section("Facts", d.facts.map((g) => details(g.label + " (" + g.facts.length + ")", g.facts.map(factCard)))),
      section("Policy matches", d.policy_reports.slice().sort((a, b) => (b.status === "matched") - (a.status === "matched")).map(reportCard)),
      section("Incident subgraph", subgraphSvg(d.subgraph, d.effective.components)),
      section("Fix log",
        h("p", null, "Stopped: " + acts.stopped),
        acts.breaker ? h("div", { class: "card" }, badge("breaker open", "r-breaker_open"), acts.breaker.why) : null,
        acts.actions.length ? acts.actions.map(actionCard) : h("p", { class: "muted" }, "No action ran."),
        acts.approvals.length ? [h("h3", null, "Approvals"), acts.approvals.map((a) => approvalCard(a, rerender))] : null,
        acts.tickets.length ? h("p", null, "Tickets: ", acts.tickets.map((t) => [link("#/tickets", t), " "])) : null),
      section("Loop timeline", h("ul", { class: "timeline" }, d.timeline.map((r) => h("li", null, h("code", null, r.iso), " " + (r.stage || "") + " " + r.text)))),
      section("Call log", h("p", { class: "muted" }, "What the shadow model call logged (replayable)."), json(d.call_log)),
      section("Limits", list(d.limits, (x) => x)));
  }

  // Tickets and approvals.
  async function viewTickets() {
    const d = await get("/v1/tickets");
    let order = d.order.slice();
    const byId = {};
    for (const t of d.tickets) byId[t.ticket_id] = t;
    const holder = h("div");
    const name = h("input", { type: "text", placeholder: "Your name", "aria-label": "Your name" });
    const why = h("input", { type: "text", placeholder: "Why (optional)", "aria-label": "Why" });
    const msg = h("div", { class: "err" });
    function move(i, by) {
      const j = i + by;
      if (j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      draw();
    }
    function card(t, i) {
      const r = t.ranking_inputs;
      return h("div", { class: "card ticket" },
        h("div", { class: "pos" }, String(i + 1)),
        h("div", null,
          h("div", null, h("strong", null, t.title), " ", badge(t.kind, "r-" + t.kind), badge(t.state, "r-" + t.state)),
          h("div", { class: "muted" }, "Placed by " + (t.placed_by === "deterministic" ? "the deterministic order" : t.placed_by) + (t.reason ? ": " + t.reason : "") + (t.person_why ? " (" + t.person_why + ")" : "")),
          t.shadow ? h("div", { class: "muted" }, badge("shadow, does not order the queue", "shadow"), " model would place it #" + t.shadow.position + (t.shadow.reason ? ": " + t.shadow.reason : "")) : null,
          h("p", null, t.why),
          h("p", null, "Human needed: " + (r.human_needed ? "yes" : "no") + " · GPU-hours lost " + r.gpu_hours_lost + " · blast radius " + r.blast_radius.gpus + " GPU(s), " + r.blast_radius.hosts + " host(s), " + r.blast_radius.jobs + " job(s) · blocked jobs " + r.blocked_jobs.length),
          r.human_role ? h("p", { class: "muted" }, r.human_role) : null,
          details("Steps, checks and model notes",
            t.steps.length ? list(t.steps, (x) => x.fix + " [" + x.tier + "] " + (x.text || "")) : null,
            t.post_repair_check && t.post_repair_check.command ? h("p", null, "Post-repair check: ", h("code", null, t.post_repair_check.command)) : null,
            t.inspection.length ? list(t.inspection, (x) => x) : null,
            t.model_reasoning ? h("div", { class: "quote" }, h("div", { class: "label" }, t.model_reasoning_label), t.model_reasoning) : null,
            h("p", null, link("#/incident/" + enc(t.incident_id), "Incident " + t.incident_id)))),
        h("div", { class: "moves" },
          h("button", { type: "button", "aria-label": "Move up", on: { click: () => move(i, -1) } }, "↑"),
          h("button", { type: "button", "aria-label": "Move down", on: { click: () => move(i, 1) } }, "↓")));
    }
    function draw() { holder.replaceChildren(...order.map((id, i) => card(byId[id], i))); }
    async function save() {
      try {
        await Artemis.source.post("/v1/tickets/order", { order: order, by: name.value, why: why.value });
        route();
      } catch (e) { msg.textContent = e.message; }
    }
    draw();
    const ob = d.ordered_by;
    return h("div", null, h("h1", null, "Ticket queue"),
      ob.in_force_text ? h("p", null, h("strong", null, "Order in force: "), ob.in_force_text, ob.mode === "live" ? [" ", badge("live model order", "r-breaker_open")] : null) : null,
      h("p", null, "Latest ranking: " + (ob.mode ? ob.mode + ", " : "") + (ob.latest_ranking || "none") + (ob.ranking_model ? " by " + ob.ranking_model + (ob.ranking_model_ai ? "" : " (scripted model, not AI)") : "") +
        (ob.gate_accepted === false ? " · gate: " + ob.gate_reasons.join("; ") : "") + (ob.person ? " · reordered by " + ob.person.by : "")),
      ob.shadow_order ? h("p", { class: "muted" }, badge(ob.shadow_label, "shadow"), " the model's order: " + ob.shadow_order.join(", ") + (ob.shadow_same_as_deterministic ? " (same as the deterministic order)" : "")) : null,
      h("p", { class: "muted" }, ob.rule),
      holder,
      h("div", { class: "card" }, h("h3", null, "Save this order"), h("div", { class: "row" }, name, why),
        h("div", { class: "row" }, h("button", { class: "primary", type: "button", on: { click: save } }, "Save order (recorded as you)")), msg),
      d.closed.length ? section("Closed", list(d.closed, (t) => t.ticket_id + " " + t.title + " (" + t.state + ")")) : null);
  }

  async function viewApprovals() {
    const d = await get("/v1/approvals");
    return h("div", null, h("h1", null, "Approvals"),
      h("p", { class: "muted" }, "Approval-tier fixes wait for a person. Approving records your decision; the fake Slurm has no command for these fixes, so nothing is executed by Artemis."),
      d.approvals.length ? d.approvals.map((a) => approvalCard(a, () => route())) : h("p", { class: "muted" }, "None."));
  }

  const ROUTES = [
    [/^#\/?$/, viewFleet], [/^#\/fleet$/, viewFleet], [/^#\/rack\/([^/]+)$/, viewRack],
    [/^#\/host\/([^/]+)$/, viewHost], [/^#\/gpu\/([^/]+)$/, viewGpu], [/^#\/job\/([^/]+)$/, viewJob],
    [/^#\/alerts$/, viewAlerts], [/^#\/incident\/([^/]+)$/, viewIncident],
    [/^#\/tickets$/, viewTickets], [/^#\/approvals$/, viewApprovals],
  ];

  // Each route() call is a navigation; only the latest one may fill the view. An older one
  // still loading when a person moves on drops its result (or its error) when it arrives.
  let navigation = 0;
  async function route(hash) {
    const mine = ++navigation;
    const where = hash !== undefined ? hash : (root.location && root.location.hash) || "#/fleet";
    const view = document.getElementById("view");
    for (const [rx, fn] of ROUTES) {
      const m = where.match(rx);
      if (!m) continue;
      let node;
      try {
        node = await fn(...m.slice(1).map(decodeURIComponent));
      } catch (e) {
        node = h("div", null, h("h1", null, "Could not load this view"), h("p", { class: "err" }, String(e.message || e)));
      }
      if (mine === navigation) view.replaceChildren(node);
      return;
    }
    view.replaceChildren(h("p", null, "No such view. ", link("#/fleet", "Go to the fleet.")));
  }

  Artemis.route = route;
  Artemis.h = h;
  if (root.addEventListener && !Artemis.noBoot) {
    root.addEventListener("hashchange", () => route());
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => route());
    else route();
  }
})(typeof window !== "undefined" ? window : globalThis);

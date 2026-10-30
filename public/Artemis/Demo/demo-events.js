// Visit and click events for the hosted demo (the Vercel export only).
//
// demo-config.js (written by the export) names the collector: {events: "/api/events"} in
// the Vercel export, {events: null} in the plain static export, where nothing is sent. From
// file:// nothing is sent either. Each event is a small JSON object posted to this origin
// with navigator.sendBeacon (fallback: fetch with keepalive): its name, the route (hash),
// the share token (?ref=, letters, digits and '-', at most 32, else "invalid"), a random
// per-tab session id (sessionStorage), a per-tab sequence number and the client time.
// Sending fails silently; nothing here can break the page.
//
// window.ArtemisEvents = {on, ref, session(), send(name, extra)}. When events are on it
// also shows the disclosure line, under the banner (#disclosure-top, on the first screen
// at any size) and in the footer (#disclosure), before demo.js sends page_open.
"use strict";

(function (root) {
  const doc = root.document;
  const cfg = root.ARTEMIS_DEMO_CONFIG || {};
  const url = typeof cfg.events === "string" && /^\/[a-z/]+$/.test(cfg.events) ? cfg.events : null;
  const loc = root.location;
  const on = !!url && (loc.protocol === "https:" || loc.protocol === "http:");
  const REF = /^[A-Za-z0-9-]{1,32}$/;
  const SID = /^[A-Za-z0-9_-]{8,64}$/;
  const KEY = "artemis-demo-sid";

  function refFrom(search) {
    let v = null;
    try { v = new URLSearchParams(search).get("ref"); } catch (e) { v = null; }
    if (v === null || v === "") return null;
    return REF.test(v) ? v : "invalid";
  }
  const ref = refFrom(loc.search);

  function newId() {
    const b = new Uint8Array(16);
    root.crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  }
  let sid = null;
  function session() {
    if (sid) return sid;
    try {
      const have = root.sessionStorage.getItem(KEY);
      sid = have && SID.test(have) ? have : newId();
      root.sessionStorage.setItem(KEY, sid);
    } catch (e) {
      if (!sid) { try { sid = newId(); } catch (e2) { sid = "nosession" + Date.now(); } }
    }
    return sid;
  }

  let n = 0;
  function send(name, extra) {
    if (!on) return false;
    try {
      const body = JSON.stringify(Object.assign({ event: name, route: (loc.hash || "").slice(0, 200), ref: ref,
        sid: session(), n: n++, t_client: Date.now() }, extra || {}));
      if (body.length > 1900) return false;
      let queued = false;
      try { queued = !!(root.navigator.sendBeacon && root.navigator.sendBeacon(url, body)); } catch (e) { queued = false; }
      if (!queued && root.fetch) {
        root.fetch(url, { method: "POST", body: body, keepalive: true, credentials: "same-origin",
          headers: { "Content-Type": "text/plain;charset=UTF-8" } }).catch(() => {});
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Seconds visible: summed over the tab's visible spells, sent each time it is hidden.
  let shownAt = doc.visibilityState === "hidden" ? null : Date.now();
  let visible = 0;
  function hidden() {
    if (shownAt === null) return;
    visible += Date.now() - shownAt;
    shownAt = null;
    send("page_hidden", { seconds: Math.round(visible / 1000) });
  }
  if (on) {
    doc.addEventListener("visibilitychange", () => {
      if (doc.visibilityState === "hidden") hidden();
      else if (shownAt === null) shownAt = Date.now();
    });
    root.addEventListener("pagehide", hidden);
  }

  // Shown before anything is sent: the line under the banner (on the first screen) and
  // the footer's.
  for (const id of ["disclosure-top", "disclosure"]) {
    const line = doc.getElementById(id);
    if (line) line.hidden = !on;
  }

  root.ArtemisEvents = { on: on, ref: ref, session: session, send: send };
})(window);

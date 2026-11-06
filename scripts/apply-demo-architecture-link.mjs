// Adds the Architecture link to the exported fleet demo. public/Artemis/Demo/ is
// replaced wholesale when the demo is refreshed from its own repository, so a hand
// edit there would vanish. This runs before every build (`prebuild` in package.json).
// It changes nothing if the link is already there. It stops the build if the export
// no longer has its anchors, or if the link would not end up as a live element inside
// `.nav`, the element demo-link.css styles, or the markup hides it in a way `unusable`
// checks. It reads only index.html, so it cannot see a nav hidden by a stylesheet.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ARTEMIS = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "Artemis");
const INDEX = join(ARTEMIS, "Demo", "index.html");
const STYLESHEET = {
  anchor: '<link rel="stylesheet" href="demo.css">',
  addition: '<link rel="stylesheet" href="../Architecture/demo-link.css">',
  separator: "\n",
  within: headRange,
};
const NAV_LINK = {
  anchor: '<a href="#/about" data-nav="about">About</a>',
  // data-nav keeps the link out of the demo's current-view highlight: demo.js compares this
  // attribute with the current route's nav value, which is null on its not-found view.
  addition: '<a href="../Architecture/" data-nav="architecture">Architecture</a>',
  separator: "\n      ",
  within: navRange,
  visible: true,
};

function fail(message) {
  console.error(`apply-demo-architecture-link: ${message}`);
  console.error("The build stops here so the demo cannot ship without its Architecture link.");
  console.error("If the export changed, update the anchors in scripts/apply-demo-architecture-link.mjs.");
  process.exit(1);
}

// The file with comments, scripts, styles, templates and noscript blocks blanked to spaces.
// Offsets still match the file, and text in those places does not count as an element on the page.
const live = (html) =>
  html.replace(/<!--[\s\S]*?(?:-->|$)|<(script|style|template|noscript)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, (part) => part.replace(/[^\n]/g, " "));

const offsets = (text, part) => {
  const found = [];
  for (let at = text.indexOf(part); at !== -1; at = text.indexOf(part, at + 1)) found.push(at);
  return found;
};

function headRange(view) {
  const start = view.search(/<head\b[^>]*>/i);
  const end = view.search(/<\/head\s*>/i);
  if (start === -1 || end === -1) fail("index.html has no <head> element.");
  return { name: "<head>", start, end };
}

function navRange(view) {
  const navs = [...view.matchAll(/<([a-z][\w-]*)\b[^>]*(?<![\w-])class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi)].filter((tag) =>
    (tag[2] ?? tag[3] ?? tag[4]).split(/\s+/).includes("nav"),
  );
  if (navs.length !== 1) fail(`expected exactly one .nav element in index.html, found ${navs.length}.`);
  const [open] = navs;
  const start = open.index + open[0].length;
  const tags = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, "gi");
  tags.lastIndex = start;
  let depth = 1;
  for (let tag = tags.exec(view); tag; tag = tags.exec(view)) {
    depth += tag[1] ? -1 : 1;
    if (depth === 0) return { name: ".nav", start, end: tag.index };
  }
  return fail("the .nav element in index.html is never closed.");
}

const inside = (range, at) => at >= range.start && at < range.end;

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

// The opening tags still open at this offset, innermost last.
function ancestors(view, at) {
  const open = [];
  for (const tag of view.slice(0, at).matchAll(/<(\/?)([a-z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
    const name = tag[2].toLowerCase();
    if (tag[1]) {
      const last = open.findLastIndex((item) => item.name === name);
      if (last !== -1) open.length = last;
    } else if (!VOID.has(name) && !tag[3].endsWith("/")) {
      open.push({ name, attributes: tag[3], html: tag[0] });
    }
  }
  return open;
}

// The attributes of an opening tag by name. A repeated attribute keeps its first value, as in a browser.
const attributesOf = (text) =>
  new Map(
    [...text.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
      .map(([, name, double, single, bare]) => [name.toLowerCase(), double ?? single ?? bare ?? ""])
      .reverse(),
  );

// These leave an element in the file but take it away from the reader.
function unusable({ name, attributes }) {
  const found = attributesOf(attributes);
  if (found.has("hidden") || found.has("inert") || found.has("popover")) return true;
  if (found.get("aria-hidden")?.trim().toLowerCase() === "true") return true;
  if ((name === "details" || name === "dialog") && !found.has("open")) return true;
  return /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:!important\s*)?(?:;|$)/i.test(found.get("style") ?? "");
}

// Returns the html with the addition in place right after its anchor, inside its element.
function place(html, { anchor, addition, separator, within, visible }) {
  const view = live(html);
  const range = within(view);
  const anchors = offsets(view, anchor);
  if (anchors.length !== 1) fail(`expected ${anchor} exactly once as a live element in index.html, found ${anchors.length}.`);
  if (!inside(range, anchors[0])) fail(`${anchor} is not inside ${range.name} in index.html.`);
  if (visible) {
    const blocked = ancestors(view, anchors[0]).find(unusable);
    if (blocked) fail(`${anchor} sits inside ${blocked.html}, which hides it or makes it inert, in index.html.`);
  }
  const additions = offsets(view, addition);
  if (additions.length > 1) fail(`found ${addition} ${additions.length} times in index.html.`);
  const end = anchors[0] + anchor.length;
  if (additions.length === 1) {
    if (additions[0] !== end + separator.length || !view.startsWith(separator, end)) {
      fail(`${addition} is in index.html but not right after ${anchor}.`);
    }
    return html;
  }
  return html.slice(0, end) + separator + addition + html.slice(end);
}

if (!existsSync(INDEX)) fail(`${INDEX} does not exist.`);
// The link's stylesheet, and the fonts the Architecture page loads from the demo.
for (const file of [join("Architecture", "demo-link.css"), join("Demo", "fonts.css")]) {
  if (!existsSync(join(ARTEMIS, file))) fail(`public/Artemis/${file} is missing.`);
}

const before = readFileSync(INDEX, "utf8");
const html = place(place(before, STYLESHEET), NAV_LINK);

// A second pass over the result must find both additions live, once, in place.
if (place(place(html, STYLESHEET), NAV_LINK) !== html) fail("the link did not land where this script expects it.");

// Any other live link to the page means an older or edited copy of the link is still there.
const links = live(html).match(/<a\b[^>]*href\s*=\s*["']?\.\.\/Architecture\/["'\s>][^>]*>/gi) ?? [];
if (links.length !== 1) fail(`expected one live link to ../Architecture/ in index.html, found ${links.length}.`);

if (html === before) {
  console.log("apply-demo-architecture-link: already applied.");
} else {
  writeFileSync(INDEX, html);
  console.log("apply-demo-architecture-link: added the link to public/Artemis/Demo/index.html.");
}

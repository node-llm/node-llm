// Builds docs/llms-full.txt from the docs pages, so the file never has to be
// edited by hand.
//
//   node scripts/generate-llms-full.mjs          # write docs/llms-full.txt
//   node scripts/generate-llms-full.mjs --check  # exit 1 if it is out of date
//
// Pages come in the order of the docs navigation: top-level pages and sections
// by `nav_order` (ties broken by title, as just-the-docs does), each section's
// index page followed by its children (`parent: <section title>`) by
// `nav_order`. llms.txt comes first; pages outside the navigation come last.
// Front matter is stripped, `{{ page.title }}`-style tags are replaced with the
// page's front matter values, and other Liquid tags, kramdown attribute lists
// (`{: .no_toc }`) and the just-the-docs table of contents are removed.
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DOCS_DIR = path.join(__dirname, "../docs");
const OUTPUT_NAME = "llms-full.txt";
const OUTPUT_FILE = path.join(DOCS_DIR, OUTPUT_NAME);

const HEADER =
  "# NodeLLM Full Documentation\n\n" +
  "> Auto-generated context for LLMs containing all project documentation.\n\n";

/** Splits a page into its front matter (flat `key: value` pairs) and body. */
export function parseFrontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    data[kv[1]] = value;
  }
  return { data, body: source.slice(match[0].length) };
}

/** Renders the parts of a page body that only make sense to Jekyll. */
export function renderBody(body, data) {
  const rendered = body
    .replace(/\{\{-?\s*page\.([\w-]+)\s*-?\}\}/g, (_, key) => data[key] ?? "")
    .replace(/\{%-?[\s\S]*?-?%\}/g, "")
    // the just-the-docs table of contents, which only Jekyll can fill in
    .replace(/^#+ Table of contents\n\{:[^}\n]*\}\n\n1\. TOC\n\{:toc\}\n\n?/gim, "")
    // an attribute list after a link: [Quick Start](/x){: .btn }
    .replace(/\)\{:[^}\n]*\}/g, ")")
    .split("\n")
    // kramdown attribute lists and the just-the-docs TOC placeholder
    .filter((line) => !/^\s*\{:[^}]*\}\s*$/.test(line))
    .join("\n")
    .replace(/^1\. TOC\n(?=\n|$)/gm, "");
  return rendered.replace(/^\s*\n/, "").replace(/\s+$/, "") + "\n";
}

function listDocs(dir, root = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // _site, _includes, _layouts, .jekyll-cache, vendor/bundle ...
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    if (entry.name === "vendor" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listDocs(full, root));
    else if (entry.name.endsWith(".md") || entry.name === "llms.txt") {
      out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  return out;
}

function byNav(a, b) {
  const na = Number.parseFloat(a.data.nav_order);
  const nb = Number.parseFloat(b.data.nav_order);
  const oa = Number.isNaN(na) ? Infinity : na;
  const ob = Number.isNaN(nb) ? Infinity : nb;
  if (oa !== ob) return oa - ob;
  const ta = a.data.title ?? a.file;
  const tb = b.data.title ?? b.file;
  return ta < tb ? -1 : ta > tb ? 1 : a.file < b.file ? -1 : a.file > b.file ? 1 : 0;
}

/** Orders pages like the docs navigation. `pages` is [{ file, data }]. */
export function orderPages(pages) {
  const ordered = [];
  const seen = new Set();
  const add = (page) => {
    if (!seen.has(page.file)) {
      seen.add(page.file);
      ordered.push(page);
    }
  };
  const inNav = (p) => p.data.nav_exclude !== "true" && p.data.nav_order !== undefined;

  const summary = pages.find((p) => p.file === "llms.txt");
  if (summary) add(summary);

  const topLevel = pages.filter((p) => inNav(p) && !p.data.parent).sort(byNav);
  for (const page of topLevel) {
    add(page);
    const children = pages
      .filter((p) => p.data.parent && p.data.parent === page.data.title)
      .sort(byNav);
    for (const child of children) add(child);
  }

  const rest = pages.filter((p) => !seen.has(p.file)).sort((a, b) => (a.file < b.file ? -1 : 1));
  for (const page of rest) add(page);
  return ordered;
}

/** Returns the full text of llms-full.txt for the docs in `docsDir`. */
export function buildLlmsFull(docsDir = DOCS_DIR) {
  const pages = listDocs(docsDir)
    .filter((file) => file !== OUTPUT_NAME)
    .map((file) => {
      const source = fs.readFileSync(path.join(docsDir, file), "utf8");
      // llms.txt is served as-is, so it is included as-is.
      if (file === "llms.txt") return { file, data: {}, body: source.replace(/\s+$/, "") + "\n" };
      const { data, body } = parseFrontMatter(source);
      return { file, data, body: renderBody(body, data) };
    });

  let content = HEADER;
  for (const page of orderPages(pages)) {
    content += `\n\n<!-- FILE: ${page.file} -->\n`;
    content += `\n# 📄 ${page.file}\n\n`;
    content += page.body;
    content += `\n<!-- END FILE: ${page.file} -->\n`;
    content += "-".repeat(40);
  }
  return content + "\n";
}

function main(argv) {
  const content = buildLlmsFull();
  if (argv.includes("--check")) {
    const current = fs.existsSync(OUTPUT_FILE) ? fs.readFileSync(OUTPUT_FILE, "utf8") : "";
    if (current !== content) {
      console.error(
        "docs/llms-full.txt is out of date. Run `npm run docs:llms` and commit the result."
      );
      process.exit(1);
    }
    console.log("docs/llms-full.txt is up to date.");
    return;
  }
  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`Generated ${OUTPUT_FILE} (${(content.length / 1024).toFixed(2)} KB)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}

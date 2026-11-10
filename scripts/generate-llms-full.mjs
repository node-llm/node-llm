import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const HEADER =
  "# NodeLLM Full Documentation\n\n" +
  "> Auto-generated context for LLMs containing all project documentation.\n\n";

function markdownFiles(dir, root = dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !["_site", ".jekyll-cache"].includes(entry.name))
    .flatMap((entry) => {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) return markdownFiles(file, root);
      return entry.isFile() && entry.name.endsWith(".md") ? [relative(root, file)] : [];
    });
}

function readPage(docsDir, file) {
  const source = readFileSync(join(docsDir, file), "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const metadata = {};
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const field = line.match(/^([\w-]+):\s*(.*)$/);
      if (field) metadata[field[1]] = field[2].replace(/^["']|["']$/g, "");
    }
  }
  return { file, metadata, body: match ? source.slice(match[0].length) : source };
}

function navigationOrder(pages) {
  const byTitle = new Map(pages.map((page) => [page.metadata.title, page]));
  const byFile = new Map(pages.map((page) => [page.file, page]));
  const children = new Map();
  const roots = [];
  for (const page of pages) {
    const parent =
      (page.metadata.parent && byTitle.get(page.metadata.parent)) ??
      (page.file.endsWith("/index.md")
        ? undefined
        : byFile.get(join(dirname(page.file), "index.md")));
    if (parent && parent !== page) {
      const group = children.get(parent) ?? [];
      group.push(page);
      children.set(parent, group);
    } else {
      roots.push(page);
    }
  }
  const compare = (a, b) =>
    Number(a.metadata.nav_order ?? Infinity) - Number(b.metadata.nav_order ?? Infinity) ||
    (a.metadata.title ?? a.file).localeCompare(b.metadata.title ?? b.file, "en") ||
    a.file.localeCompare(b.file, "en");
  const ordered = [];
  function visit(page) {
    ordered.push(page);
    for (const child of (children.get(page) ?? []).sort(compare)) visit(child);
  }
  for (const page of roots.sort(compare)) visit(page);
  return ordered;
}

function readableBody(page) {
  return page.body
    .replace(/\{\{\s*page\.(title|description)\s*\}\}/g, (_, field) => page.metadata[field] ?? "")
    .replace(/\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g, "")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export function buildContent(docsDir = DOCS_DIR) {
  const pages = markdownFiles(docsDir)
    .map((file) => readPage(docsDir, file))
    .filter((page) => page.metadata.nav_exclude !== "true");
  const summary = readPage(docsDir, "llms.txt");
  const sections = [summary, ...navigationOrder(pages)].map((page) => {
    const body = readableBody(page);
    return `<!-- FILE: ${page.file} -->\n\n# 📄 ${page.file}\n\n${body}\n\n<!-- END FILE: ${page.file} -->\n${"-".repeat(40)}`;
  });
  return HEADER + "\n\n" + sections.join("\n\n") + "\n";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = join(DOCS_DIR, "llms-full.txt");
  const content = buildContent();
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== content) {
      console.error("docs/llms-full.txt is out of date. Run npm run docs:llms.");
      process.exitCode = 1;
    }
  } else {
    writeFileSync(output, content);
    console.log(`Generated ${output}`);
  }
}

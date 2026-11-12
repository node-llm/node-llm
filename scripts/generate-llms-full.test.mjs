// Run with: node --test scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import {
  DOCS_DIR,
  buildLlmsFull,
  orderPages,
  parseFrontMatter,
  renderBody
} from "./generate-llms-full.mjs";

test("parseFrontMatter splits flat front matter from the body", () => {
  const { data, body } = parseFrontMatter(
    '---\nlayout: default\ntitle: "Chat"\nnav_order: 1\nparent: Core Features\n---\n\n# Body\n'
  );
  assert.deepEqual(data, {
    layout: "default",
    title: "Chat",
    nav_order: "1",
    parent: "Core Features"
  });
  assert.equal(body, "\n# Body\n");
  assert.deepEqual(parseFrontMatter("# No front matter\n"), {
    data: {},
    body: "# No front matter\n"
  });
});

test("renderBody fills page variables and drops Jekyll-only markup", () => {
  const body = [
    "",
    "# {{ page.title }} <span>v1.0.0+</span>",
    "{: .no_toc }",
    "",
    "{{ page.description }}",
    "",
    "## Table of contents",
    "{: .no_toc .text-delta }",
    "",
    "1. TOC",
    "{:toc}",
    "",
    "---",
    "",
    "{% raw %}`{{ value }}`{% endraw %} and {{ page.missing }}.",
    "[Quick Start](/getting-started/quick-start){: .btn .btn-primary }",
    "",
    "```js",
    "const steps = ['1. TOC'];",
    "```",
    ""
  ].join("\n");
  const out = renderBody(body, { title: "Chat", description: "One API for chat." });
  assert.equal(
    out,
    [
      "# Chat <span>v1.0.0+</span>",
      "",
      "One API for chat.",
      "",
      "---",
      "",
      "`{{ value }}` and .",
      "[Quick Start](/getting-started/quick-start)",
      "",
      "```js",
      "const steps = ['1. TOC'];",
      "```",
      ""
    ].join("\n")
  );
});

test("orderPages follows the navigation", () => {
  const page = (file, data) => ({ file, data });
  const pages = [
    page("roadmap.md", { title: "Roadmap", nav_order: "99" }),
    page("index.md", { title: "Home", nav_exclude: "true" }),
    page("orm/migrations.md", {}),
    page("core/b.md", { title: "B", parent: "Core", nav_order: "2" }),
    page("core/a.md", { title: "A", parent: "Core", nav_order: "2" }),
    page("core/first.md", { title: "Z first", parent: "Core", nav_order: "1" }),
    page("core/index.md", { title: "Core", nav_order: "3", has_children: "true" }),
    page("advanced/index.md", { title: "Advanced", nav_order: "3" }),
    page("intro.md", { title: "Introduction", nav_order: "1" }),
    page("llms.txt", {})
  ];
  assert.deepEqual(
    orderPages(pages).map((p) => p.file),
    [
      "llms.txt",
      "intro.md",
      "advanced/index.md", // nav_order tie with Core, "Advanced" sorts first
      "core/index.md",
      "core/first.md",
      "core/a.md",
      "core/b.md",
      "roadmap.md",
      "index.md",
      "orm/migrations.md"
    ]
  );
});

test("buildLlmsFull skips Jekyll folders and its own output", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "llms-full-"));
  try {
    const write = (rel, text) => {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), text);
    };
    write("llms.txt", "---\npermalink: /llms.txt\n---\n# Summary\n");
    write("intro.md", "---\ntitle: Intro\nnav_order: 1\n---\n# {{ page.title }}\n");
    write("_includes/footer.md", "not a page");
    write("_site/intro.md", "built output");
    write(".jekyll-cache/x.md", "cache");
    write("llms-full.txt", "old");
    const out = buildLlmsFull(dir);
    assert.ok(out.startsWith("# NodeLLM Full Documentation\n"));
    assert.ok(
      out.includes("<!-- FILE: llms.txt -->\n\n# 📄 llms.txt\n\n---\npermalink: /llms.txt")
    );
    assert.ok(out.includes("# 📄 intro.md\n\n# Intro\n\n<!-- END FILE: intro.md -->"));
    assert.ok(out.indexOf("FILE: llms.txt") < out.indexOf("FILE: intro.md"));
    for (const skipped of ["footer", "built output", "cache", "old"]) {
      assert.ok(!out.includes(skipped), `${skipped} should not be included`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("docs/llms-full.txt is up to date (npm run docs:llms)", () => {
  const committed = fs.readFileSync(path.join(DOCS_DIR, "llms-full.txt"), "utf8");
  assert.equal(committed, buildLlmsFull(), "run `npm run docs:llms` and commit the result");
});

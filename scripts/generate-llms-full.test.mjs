import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildContent } from "./generate-llms-full.mjs";

test("builds docs in navigation order and resolves page variables", () => {
  const docs = mkdtempSync(join(tmpdir(), "node-llm-docs-"));
  try {
    mkdirSync(join(docs, "guides"));
    writeFileSync(join(docs, "llms.txt"), "---\nlayout: null\n---\n# Summary\n");
    writeFileSync(
      join(docs, "intro.md"),
      "---\ntitle: Introduction\nnav_order: 1\n---\n# {{ page.title }}\n"
    );
    writeFileSync(
      join(docs, "guides", "index.md"),
      "---\ntitle: Guides\nnav_order: 2\n---\n# {{ page.title }}\n"
    );
    writeFileSync(
      join(docs, "guides", "second.md"),
      "---\ntitle: Second\nparent: Guides\nnav_order: 2\n---\n# {{ page.title }}\n"
    );
    writeFileSync(
      join(docs, "guides", "first.md"),
      "---\ntitle: First\nparent: Guides\nnav_order: 1\ndescription: First guide\n---\n# {{ page.title }}\n{{ page.description }}\n{% include sample %}\n"
    );
    writeFileSync(join(docs, "guides", "extra.md"), "# Extra\n");
    writeFileSync(
      join(docs, "hidden.md"),
      "---\ntitle: Hidden\nnav_exclude: true\n---\n# Hidden\n"
    );

    const content = buildContent(docs);
    const files = [...content.matchAll(/<!-- FILE: ([^ ]+) -->/g)].map((match) => match[1]);
    assert.deepEqual(files, [
      "llms.txt",
      "intro.md",
      "guides/index.md",
      "guides/first.md",
      "guides/second.md",
      "guides/extra.md"
    ]);
    assert.match(content, /# First\nFirst guide/);
    assert.doesNotMatch(content, /\{\{|\{%|nav_order:/);
    assert.equal(buildContent(docs), content);
  } finally {
    rmSync(docs, { recursive: true, force: true });
  }
});

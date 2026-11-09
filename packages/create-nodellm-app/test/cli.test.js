import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, scaffold } from "../bin/create-nodellm-app.js";

const TEMPLATES = ["tool-agent", "streaming-api", "cron-summarizer"];

test("parseArgs reads the directory and template in any form", () => {
  assert.deepEqual(parseArgs(["app", "--template", "streaming-api"]), {
    dir: "app",
    template: "streaming-api",
    help: false
  });
  assert.equal(parseArgs(["--template=cron-summarizer", "app"]).template, "cron-summarizer");
  assert.equal(parseArgs(["-t", "tool-agent"]).template, "tool-agent");
  assert.equal(parseArgs(["--help"]).help, true);
});

for (const template of TEMPLATES) {
  test(`scaffold creates a runnable ${template} project`, () => {
    const target = join(mkdtempSync(join(tmpdir(), "cna-")), "My App");
    scaffold(target, template);

    const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
    assert.equal(pkg.name, "my-app");
    assert.ok(pkg.dependencies["@node-llm/core"]);
    assert.ok(pkg.scripts.start);
    assert.ok(existsSync(join(target, ".gitignore")));
    assert.ok(existsSync(join(target, ".env.example")));
    assert.ok(!existsSync(join(target, "_gitignore")));
    assert.ok(!existsSync(join(target, "_env.example")));
  });
}

test("scaffold refuses an unknown template", () => {
  const target = join(mkdtempSync(join(tmpdir(), "cna-")), "app");
  assert.throws(() => scaffold(target, "nope"), /Unknown template/);
});

test("scaffold refuses a non-empty directory", () => {
  const target = mkdtempSync(join(tmpdir(), "cna-"));
  mkdirSync(join(target, "x"));
  writeFileSync(join(target, "x", "file.txt"), "keep me");
  assert.throws(() => scaffold(join(target, "x"), "tool-agent"), /not empty/);
  assert.equal(readFileSync(join(target, "x", "file.txt"), "utf8"), "keep me");
});

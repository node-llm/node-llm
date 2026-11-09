#!/usr/bin/env node
// Scaffolds a new NodeLLM project from one of the bundled templates.
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const TEMPLATES = {
  "tool-agent": "A chat agent that calls your own tools",
  "streaming-api": "An HTTP endpoint that streams answers (Server-Sent Events)",
  "cron-summarizer": "A scheduled job that summarizes text into structured data"
};

const templatesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "templates");

function usage() {
  console.log(`Usage: npx create-nodellm-app <project-dir> [--template <name>]

Templates:
${Object.entries(TEMPLATES)
  .map(([name, text]) => `  ${name.padEnd(16)} ${text}`)
  .join("\n")}`);
}

export function parseArgs(argv) {
  const args = { dir: undefined, template: undefined, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "-t" || arg === "--template") args.template = argv[++i];
    else if (arg.startsWith("--template=")) args.template = arg.slice("--template=".length);
    else if (!args.dir) args.dir = arg;
  }
  return args;
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export function scaffold(targetDir, template) {
  if (!TEMPLATES[template]) {
    throw new Error(
      `Unknown template "${template}". Choose one of: ${Object.keys(TEMPLATES).join(", ")}`
    );
  }
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    throw new Error(`${targetDir} already exists and is not empty.`);
  }

  cpSync(join(templatesDir, template), targetDir, { recursive: true });

  // npm drops dotfiles named .gitignore from published packages, so templates ship it as _gitignore.
  for (const [from, to] of [
    ["_gitignore", ".gitignore"],
    ["_env.example", ".env.example"]
  ]) {
    if (existsSync(join(targetDir, from))) renameSync(join(targetDir, from), join(targetDir, to));
  }

  const pkgPath = join(targetDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = basename(targetDir)
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, "-");
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();

  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  let { dir, template } = args;

  if (!dir) {
    if (!interactive) return (usage(), process.exit(1));
    dir = (await ask("Project directory: (my-nodellm-app) ")) || "my-nodellm-app";
  }

  if (!template) {
    const names = Object.keys(TEMPLATES);
    if (interactive) {
      console.log("\nWhich template?");
      names.forEach((name, i) => console.log(`  ${i + 1}. ${name.padEnd(16)} ${TEMPLATES[name]}`));
      const answer = await ask(`Choose 1-${names.length}: (1) `);
      template = names[Number(answer || 1) - 1] ?? answer;
    } else {
      template = names[0];
    }
  }

  const target = resolve(dir);
  try {
    scaffold(target, template);
  } catch (error) {
    console.error(`\n${error.message}`);
    process.exit(1);
  }

  console.log(`
Created ${dir} from the "${template}" template.

Next steps:
  cd ${dir}
  npm install
  cp .env.example .env    # then add your provider and API key
  npm start

Docs: https://nodellm.dev/docs/intro`);
}

// npx runs the bin through a symlink, so compare real paths.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  await main();
}

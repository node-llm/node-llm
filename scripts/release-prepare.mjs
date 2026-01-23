import { execSync } from "child_process";

/**
 * Release Preparation Script for NodeLLM
 * Mimics release:prepare rake task.
 */

function run(command, description) {
  console.log(`\n🚀 ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch {
    console.error(`\n❌ Step failed: ${description}`);
    process.exit(1);
  }
}

console.log("🛠  Starting Release Preparation...");

// 1. Refresh stale cassettes
run("node scripts/vcr-maintenance.mjs refresh", "Refreshing stale VCR cassettes");

// 2. Format and Lint (replaces overcommit --run for now)
run("npm run format && npm run lint", "Running format and lint");

// 3. Sync Models
run("npm run sync-models", "Syncing model aliases from providers");

// 4. Final Verification of all tests
run("npm test", "Running all tests to ensure stability");

console.log("\n✅ Release preparation complete! You are ready to commit and push.");

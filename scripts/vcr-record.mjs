import "dotenv/config";
import { execSync } from "child_process";
import { rmSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * VCR Record Script for NodeLLM
 *
 * Usage:
 *   node scripts/vcr-record.mjs all              # Re-record all integration tests
 *   node scripts/vcr-record.mjs openai,anthropic # Re-record specific providers
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const corePkgDir = path.join(rootDir, "packages/core");
const cassetteDir = path.join(corePkgDir, "test/__cassettes__");
const integrationTestDir = path.join(corePkgDir, "test/integration");

function getAvailableProviders() {
  if (!existsSync(integrationTestDir)) return [];
  return readdirSync(integrationTestDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

function main() {
  const args = process.argv.slice(2);
  const providers = args.length > 0 ? args[0].split(",").map((p) => p.trim().toLowerCase()) : [];

  const allAvailable = getAvailableProviders();

  if (providers.length === 0) {
    console.log("Usage: node scripts/vcr-record.mjs [provider1,provider2|all]");
    console.log(`Available providers: ${allAvailable.join(", ")}`);
    return;
  }

  const targetProviders = providers.includes("all") ? allAvailable : providers;

  // Validate
  const invalid = targetProviders.filter((p) => !allAvailable.includes(p));
  if (invalid.length > 0) {
    console.error(`Error: Invalid providers: ${invalid.join(", ")}`);
    console.error(`Available: ${allAvailable.join(", ")}`);
    process.exit(1);
  }

  console.log(`🚀 Recording VCR cassettes for: ${targetProviders.join(", ")}`);

  // Delete matching cassettes
  for (const provider of targetProviders) {
    const pDir = path.join(cassetteDir, provider);
    if (existsSync(pDir)) {
      console.log(`  - Deleting existing cassettes for ${provider}...`);
      rmSync(pDir, { recursive: true, force: true });
    }
  }

  // Construct test command
  // We specify the paths to the tests to run only those we need to record
  const testPaths = targetProviders.map((p) => path.join("test/integration", p));
  const testCmd = `npx vitest run ${testPaths.join(" ")}`;

  console.log(`\nExecuting: ${testCmd}`);

  try {
    // Run from packages/core to use its config and environment
    execSync(testCmd, {
      stdio: "inherit",
      cwd: corePkgDir,
      env: { ...process.env, VCR_MODE: "record" }
    });
    console.log("\n✅ Recording complete. Please review the new cassettes.");
  } catch {
    console.error("\n❌ Tests failed during recording.");
    process.exit(1);
  }
}

main();

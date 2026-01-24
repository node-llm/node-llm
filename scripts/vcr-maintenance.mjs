import { execSync } from "child_process";
import { rmSync, readdirSync, statSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const corePkgDir = path.join(rootDir, "packages/core");
const cassetteDir = path.join(corePkgDir, "test/__cassettes__");

const MAX_AGE_DAYS = 10;

function getCassettes(dir, collection = []) {
  if (!existsSync(dir)) return collection;
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      getCassettes(fullPath, collection);
    } else if (file.name.endsWith(".json") || file.name.endsWith(".yml")) {
      collection.push(fullPath);
    }
  }
  return collection;
}

function verify() {
  const cassettes = getCassettes(cassetteDir);
  const now = Date.now();
  const stale = [];

  for (const file of cassettes) {
    const stats = statSync(file);
    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > MAX_AGE_DAYS) {
      stale.push({
        file: path.relative(cassetteDir, file),
        age: ageDays.toFixed(1)
      });
    }
  }

  if (stale.length > 0) {
    console.error(`\n❌ Found ${stale.length} stale cassettes (older than ${MAX_AGE_DAYS} days):`);
    stale.forEach((s) => console.log(`   - ${s.file} (${s.age} days old)`));
    console.log(`\nRun locally: npm run vcr:refresh`);
    process.exit(1);
  } else {
    console.log(`✅ All cassettes are fresh (< ${MAX_AGE_DAYS} days old)`);
  }
}

function refresh() {
  const cassettes = getCassettes(cassetteDir);
  const now = Date.now();
  let deletedCount = 0;

  for (const file of cassettes) {
    const stats = statSync(file);
    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > MAX_AGE_DAYS) {
      console.log(
        `Removing stale cassette: ${path.relative(cassetteDir, file)} (${ageDays.toFixed(1)} days old)`
      );
      rmSync(file);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`\n🗑️  Removed ${deletedCount} stale cassettes`);
    console.log("🔄 Re-recording refreshed cassettes...");
    try {
      execSync("npx vitest run test/integration", {
        stdio: "inherit",
        cwd: corePkgDir,
        env: { ...process.env, VCR_MODE: "record" }
      });
      console.log("✅ Cassettes refreshed!");
    } catch {
      console.error("\n❌ Tests failed during re-recording.");
      process.exit(1);
    }
  } else {
    console.log("✅ No stale cassettes found");
  }
}

const command = process.argv[2];
if (command === "verify") {
  verify();
} else if (command === "refresh") {
  refresh();
} else {
  console.log("Usage: node scripts/vcr-maintenance.mjs [verify|refresh]");
}

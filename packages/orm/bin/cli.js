#!/usr/bin/env node
/**
 * @node-llm/orm migration generator
 *
 * Usage:
 *   npx @node-llm/orm init          # Generate schema.prisma
 *   npx @node-llm/orm migrate       # Create and apply migration
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");

const REFERENCE_SCHEMA_PATH = join(pkgRoot, "schema.prisma");
const SCHEMA_CONTENT = readFileSync(REFERENCE_SCHEMA_PATH, "utf-8");

function init() {
  const cwd = process.cwd();
  const prismaDir = join(cwd, "prisma");
  const schemaPath = join(prismaDir, "schema.prisma");

  // Create prisma directory if it doesn't exist
  if (!existsSync(prismaDir)) {
    mkdirSync(prismaDir, { recursive: true });
    console.log("✓ Created prisma/ directory");
  }

  // Check if schema already exists
  if (existsSync(schemaPath)) {
    console.log("⚠️  schema.prisma already exists");
    console.log("   To add or update NodeLLM models, run:");
    console.log("   npx @node-llm/orm sync");
    return;
  }

  // Write schema
  writeFileSync(schemaPath, SCHEMA_CONTENT);
  console.log("✓ Generated prisma/schema.prisma");
  console.log("\nNext steps:");
  console.log("  1. Update DATABASE_URL in .env");
  console.log("  2. Run: npx prisma migrate dev --name init");
}

function sync() {
  const cwd = process.cwd();
  const schemaPath = join(cwd, "prisma", "schema.prisma");

  if (!existsSync(schemaPath)) {
    console.error("❌ prisma/schema.prisma not found. Run 'init' first.");
    return;
  }

  const userSchema = readFileSync(schemaPath, "utf-8");

  // Required fields for modern reasoning support
  const requiredFields = [
    "thinkingText",
    "thinkingSignature",
    "thinkingTokens",
    "thoughtSignature"
  ];

  // Check for AgentSession model (v0.5.0+)
  const hasAgentSession =
    userSchema.includes("LlmAgentSession") || userSchema.includes("AgentSession");

  const missingFields = requiredFields.filter((field) => !userSchema.includes(field));

  if (missingFields.length === 0 && hasAgentSession) {
    console.log("✓ Schema is already up to date with @node-llm/orm v0.5.0 features.");
    return;
  }

  if (missingFields.length > 0) {
    console.log("🛠  Syncing missing fields for Extended Thinking support...");
    console.log(`\nDetected missing fields: ${missingFields.join(", ")}`);
  }

  if (!hasAgentSession) {
    console.log("\n🤖 Missing AgentSession support (v0.5.0+)");
    console.log(
      "   AgentSession enables persistent agent conversations with the 'Code Wins' pattern."
    );
    console.log("\n   To add AgentSession, copy the migration from:");
    console.log("   node_modules/@node-llm/orm/migrations/add_agent_session.sql");
    console.log("\n   Or add this to your schema.prisma:");
    console.log(`
model LlmAgentSession {
  id         String   @id @default(uuid())
  agentClass String
  chatId     String   @unique
  metadata   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  chat       LlmChat  @relation(fields: [chatId], references: [id], onDelete: Cascade)

  @@index([agentClass])
  @@index([createdAt])
}

// Also add to LlmChat:
// agentSession LlmAgentSession?
`);
  }

  console.log("\nTo update your schema safely, follow the Reference Schema at:");
  console.log("https://github.com/node-llm/node-llm/blob/main/packages/orm/schema.prisma");

  console.log("\nOr run this to generate a versioned migration:");
  console.log("  npx prisma migrate dev --name add_agent_session");
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "init":
      init();
      break;
    case "sync":
      sync();
      break;
    case "migrate":
      console.log("🛠 Running Prisma migration...");
      console.log("\nPlease run:");
      console.log("  npx prisma migrate dev --name add_nodellm_orm");
      break;
    default:
      console.log("@node-llm/orm - Database migration tool\n");
      console.log("Usage:");
      console.log("  npx @node-llm/orm init     # Generate initial schema.prisma");
      console.log("  npx @node-llm/orm sync     # Check for missing ORM fields");
      console.log("  npx @node-llm/orm migrate  # Rails-style migration helper");
      console.log("\nFor enterprise patterns, see:");
      console.log("  https://node-llm.eshaiju.com/orm/migrations");
  }
}

main();

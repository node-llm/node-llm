# Database Migration Guide

Maintaining a production-grade database requires moving away from `npx prisma db push` (which can cause data loss) to **Prisma Migrate** (which tracks incremental changes via SQL files).

This guide explains how to manage schema updates professionally, translating Rails-style migration discipline into the Node.js / Prisma ecosystem.

**Added in v0.2.0**
{: .label .label-green }

---

## The Migration Workflow

NodeLLM's ORM schema will evolve over time (e.g., adding "Extended Thinking" support). To update your application without losing user chat history, follow this workflow.

### 1. Detect Changes (CLI)

The easiest way to check if your existing database is missing columns for new NodeLLM features is to use the **ORM CLI Sync**:

```bash
npx @node-llm/orm sync
```

**What this does:**
- Scans your `prisma/schema.prisma`.
- Identifies missing fields (like `thinkingText` or `thoughtSignature`).
- Provides guidance on the specific columns to add.

### 2. Update the Schema manually
Modify your `prisma/schema.prisma` with the new fields or models (or copy the latest version from `@node-llm/orm/schema.prisma`).

### 3. Generate a Migration
Instead of pushing directly to the DB, generate a versioned migration file:

```bash
npx prisma migrate dev --name add_thinking_support
```

**What this does:**
- Detects the difference between your `schema.prisma` and your actual database.
- Creates a new folder in `prisma/migrations/` containing a `migration.sql` file.
- Applies that SQL to your local database.

### 3. Commit the Migration
**Crucial**: Always commit the `prisma/migrations` folder to your version control. This ensures all environments (staging, production) apply the exact same SQL changes.

---

## Baseline: Moving from `db push` to `migrate`

If you have been using `db push` and now want to start using formal migrations without losing data:

1. **Clear Drift**: Ensure your database and schema are currently in sync via one last `db push`.
2. **Baseline**: Initialize the migration history by marking the current state as the "initial" version:

```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

npx prisma migrate resolve --applied 0_init
```

---

## Deployment to Production

In production, **never** use `migrate dev`. Instead, use the deployment command which applies all pending migrations in the migrations folder:

```bash
npx prisma migrate deploy
```

---

## Common Scenarios

### Renaming a Column
If you rename a column (e.g., `reasoning` to `thinkingText`), Prisma might try to drop the old column and create a new one, causing data loss.

To fix this:
1. Run `npx prisma migrate dev --name rename_reasoning --create-only`.
2. Open the generated `.sql` file.
3. Replace the `DROP` and `ADD` commands with an `ALTER TABLE ... RENAME COLUMN ...` command.
4. Run `npx prisma migrate dev` to apply your edited SQL.

### Adding Required Fields
When adding a required (`non-nullable`) field to a table with existing data:
1. Generate the migration with `--create-only`.
2. Edit the SQL to provide a default value for existing rows or make it nullable temporarily.
3. Apply the migration.

---

## Upgrading to AgentSession (v0.5.0+)

If you're upgrading from a previous version and want to use the new `AgentSession` feature for persistent agent conversations, you'll need to add the `LlmAgentSession` table.

### Option 1: Use the Provided Migration

Copy the pre-built migration file:

```bash
cp node_modules/@node-llm/orm/migrations/add_agent_session.sql \
   prisma/migrations/$(date +%Y%m%d%H%M%S)_add_agent_session/migration.sql

npx prisma migrate resolve --applied $(date +%Y%m%d%H%M%S)_add_agent_session
```

### Option 2: Generate via Prisma

1. Update your `schema.prisma` with the new model:

```prisma
model LlmAgentSession {
  id         String   @id @default(uuid())
  agentClass String   // Class name for validation
  chatId     String   @unique
  metadata   Json?    // Session context (userId, ticketId)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  chat       LlmChat  @relation(fields: [chatId], references: [id], onDelete: Cascade)

  @@index([agentClass])
  @@index([createdAt])
}

// Add to existing LlmChat model:
model LlmChat {
  // ... existing fields
  agentSession LlmAgentSession?
}
```

2. Generate and apply the migration:

```bash
npx prisma migrate dev --name add_agent_session
```

### Verify the Upgrade

Run the sync command to confirm your schema is up to date:

```bash
npx @node-llm/orm sync
# ✓ Schema is already up to date with @node-llm/orm v0.5.0 features.

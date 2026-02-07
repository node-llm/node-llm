# @node-llm/orm Migrations

Reference SQL migrations for upgrading your database schema.

## Who Needs These?

| User Type         | Action                                                             |
| ----------------- | ------------------------------------------------------------------ |
| **New user**      | ❌ Skip these. Run `npx @node-llm/orm init` → full schema included |
| **Existing user** | ✅ Use these to upgrade without losing data                        |

> **Note:** These migrations are **idempotent** — safe to run multiple times. They use `IF NOT EXISTS` and conditional checks, so running them on a fresh database won't cause errors.

## Available Migrations

| File                       | Version | Description                                         |
| -------------------------- | ------- | --------------------------------------------------- |
| `add_thinking_support.sql` | v0.2.0+ | Extended Thinking columns (Claude 3.7, DeepSeek R1) |
| `add_agent_session.sql`    | v0.5.0+ | AgentSession for persistent agent conversations     |

## How to Use

### Option 1: Copy and Apply

```bash
# Create migration folder
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_agent_session

# Copy the SQL
cp node_modules/@node-llm/orm/migrations/add_agent_session.sql \
   prisma/migrations/$(date +%Y%m%d%H%M%S)_add_agent_session/migration.sql

# Mark as applied
npx prisma migrate resolve --applied $(date +%Y%m%d%H%M%S)_add_agent_session
```

### Option 2: Let Prisma Generate

1. Update your `schema.prisma` with the new models from `@node-llm/orm/schema.prisma`
2. Run: `npx prisma migrate dev --name add_agent_session`

## Custom Table Names

If you're using custom table names (e.g., `AssistantMessage` instead of `LlmMessage`),
edit the SQL file to match your table names before applying.

## Documentation

See the full [Migration Guide](https://node-llm.eshaiju.com/orm/migrations) for:

- Baseline migrations
- Production deployment
- Renaming columns safely

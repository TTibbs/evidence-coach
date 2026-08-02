#!/usr/bin/env node
/**
 * Database migration runner for Evidence Coach.
 *
 * Tracks applied migrations in public.schema_migrations so re-runs
 * only apply pending files.
 *
 * Usage:
 *   npm run db:migrate              # apply pending (prompts y/n)
 *   npm run db:migrate -- --dry-run # preview only
 *   npm run db:migrate -- --yes     # skip confirmation
 *   npm run db:rollback             # roll back last migration (prompts y/n)
 *   npm run db:rollback -- --steps=2
 *   npm run db:status               # list applied / pending
 *
 * Requires DATABASE_URL (Postgres connection string) in env or .env.local.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const ROLLBACKS_DIR = path.join(ROOT, "supabase", "rollbacks");

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(ROOT, name);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function parseArgs(argv) {
  const args = {
    command: "up",
    dryRun: false,
    yes: false,
    steps: 1,
  };

  const positional = [];
  for (const arg of argv) {
    if (arg === "--dry-run" || arg === "-n") {
      args.dryRun = true;
    } else if (arg === "--yes" || arg === "-y") {
      args.yes = true;
    } else if (arg.startsWith("--steps=")) {
      args.steps = Math.max(1, Number.parseInt(arg.slice("--steps=".length), 10) || 1);
    } else if (arg === "--help" || arg === "-h") {
      args.command = "help";
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  if (positional[0]) {
    const cmd = positional[0].toLowerCase();
    if (["up", "migrate", "down", "rollback", "status", "help"].includes(cmd)) {
      args.command = cmd === "migrate" ? "up" : cmd === "rollback" ? "down" : cmd;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Evidence Coach DB migrations

Commands:
  up | migrate     Apply pending migrations (default)
  down | rollback  Roll back the most recent migration(s)
  status           Show applied and pending migrations
  help             Show this help

Flags:
  --dry-run, -n    Print SQL that would run; make no changes
  --yes, -y        Skip interactive y/n confirmation
  --steps=N        Number of migrations to roll back (default 1)

Environment:
  DATABASE_URL     Postgres connection string (required for up/down/status)

Migration files live in supabase/migrations/:
  <timestamp>_<name>.sql       forward migration
  <timestamp>_<name>.down.sql  rollback companion (required for down)

Legacy rollback companions in supabase/rollbacks/ are also supported.
`);
}

function listMigrationPairs() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort();

  return files.map((file) => {
    const id = file.replace(/\.sql$/, "");
    const upPath = path.join(MIGRATIONS_DIR, file);
    const migrationDownPath = path.join(MIGRATIONS_DIR, `${id}.down.sql`);
    const legacyDownPath = path.join(ROLLBACKS_DIR, `${id}.down.sql`);
    const downPath = fs.existsSync(migrationDownPath)
      ? migrationDownPath
      : legacyDownPath;
    return {
      id,
      file,
      upPath,
      downPath,
      hasDown: fs.existsSync(downPath),
    };
  });
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getAppliedIds(client) {
  const { rows } = await client.query(
    "select id from public.schema_migrations order by id asc",
  );
  return new Set(rows.map((r) => r.id));
}

function askYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

async function confirmOrAbort(message, { yes, dryRun }) {
  if (dryRun) {
    console.log("Dry run — no changes will be made.\n");
    return true;
  }
  if (yes) return true;
  if (!process.stdin.isTTY) {
    console.error(
      "Non-interactive terminal: pass --yes to confirm, or --dry-run to preview.",
    );
    process.exit(1);
  }
  const ok = await askYesNo(message);
  if (!ok) {
    console.log("Aborted.");
    process.exit(0);
  }
  return true;
}

async function withClient(fn) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local (Supabase → Project Settings → Database → URI).",
    );
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl:
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function status() {
  const migrations = listMigrationPairs();
  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await getAppliedIds(client);

    console.log("Migration status\n");
    for (const m of migrations) {
      const mark = applied.has(m.id) ? "applied" : "pending";
      const down = m.hasDown ? "" : " (missing .down.sql)";
      console.log(`  [${mark}] ${m.id}${down}`);
    }

    const pending = migrations.filter((m) => !applied.has(m.id));
    console.log(
      `\n${applied.size} applied, ${pending.length} pending, ${migrations.length} total`,
    );
  });
}

async function migrateUp({ dryRun, yes }) {
  const migrations = listMigrationPairs();
  if (migrations.length === 0) {
    console.log("No migration files found.");
    return;
  }

  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await getAppliedIds(client);
    const pending = migrations.filter((m) => !applied.has(m.id));

    if (pending.length === 0) {
      console.log("Database is up to date — no pending migrations.");
      return;
    }

    console.log("Pending migrations:");
    for (const m of pending) {
      console.log(`  - ${m.id}`);
    }
    console.log("");

    await confirmOrAbort(
      `Apply ${pending.length} migration(s)?`,
      { yes, dryRun },
    );

    for (const m of pending) {
      const sql = fs.readFileSync(m.upPath, "utf8");
      console.log(`\n→ ${m.id}`);
      if (dryRun) {
        console.log(sql.trim().slice(0, 500) + (sql.length > 500 ? "\n…" : ""));
        continue;
      }

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into public.schema_migrations (id) values ($1)",
          [m.id],
        );
        await client.query("commit");
        console.log(`  applied ${m.id}`);
      } catch (err) {
        await client.query("rollback");
        console.error(`  failed ${m.id}:`, err.message);
        process.exit(1);
      }
    }

    if (dryRun) {
      console.log(`\nDry run complete — would apply ${pending.length} migration(s).`);
    } else {
      console.log(`\nDone — applied ${pending.length} migration(s).`);
    }
  });
}

async function migrateDown({ dryRun, yes, steps }) {
  const migrations = listMigrationPairs();

  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    const applied = await getAppliedIds(client);
    const appliedOrdered = migrations
      .filter((m) => applied.has(m.id))
      .map((m) => m.id);

    if (appliedOrdered.length === 0) {
      console.log("No applied migrations to roll back.");
      return;
    }

    const toRollBack = appliedOrdered.slice(-steps).reverse();
    console.log("Migrations to roll back:");
    for (const id of toRollBack) {
      const pair = migrations.find((m) => m.id === id);
      console.log(
        `  - ${id}${pair?.hasDown ? "" : " ⚠ missing .down.sql"}`,
      );
    }
    console.log("");

    for (const id of toRollBack) {
      const pair = migrations.find((m) => m.id === id);
      if (!pair?.hasDown) {
        console.error(
          `Cannot roll back ${id}: missing ${id}.down.sql`,
        );
        process.exit(1);
      }
    }

    await confirmOrAbort(
      `Roll back ${toRollBack.length} migration(s)? This may delete data.`,
      { yes, dryRun },
    );

    for (const id of toRollBack) {
      const pair = migrations.find((m) => m.id === id);
      const sql = fs.readFileSync(pair.downPath, "utf8");
      console.log(`\n← ${id}`);
      if (dryRun) {
        console.log(sql.trim().slice(0, 500) + (sql.length > 500 ? "\n…" : ""));
        continue;
      }

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "delete from public.schema_migrations where id = $1",
          [id],
        );
        await client.query("commit");
        console.log(`  rolled back ${id}`);
      } catch (err) {
        await client.query("rollback");
        console.error(`  failed ${id}:`, err.message);
        process.exit(1);
      }
    }

    if (dryRun) {
      console.log(
        `\nDry run complete — would roll back ${toRollBack.length} migration(s).`,
      );
    } else {
      console.log(`\nDone — rolled back ${toRollBack.length} migration(s).`);
    }
  });
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case "help":
      printHelp();
      break;
    case "status":
      await status();
      break;
    case "up":
      await migrateUp(args);
      break;
    case "down":
      await migrateDown(args);
      break;
    default:
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

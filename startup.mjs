import pg from "pg";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[startup] ERROR: DATABASE_URL is not set. Please add a PostgreSQL database in Railway.");
  process.exit(1);
}

const MIGRATE_SQL = `
CREATE TABLE IF NOT EXISTS user_balances (
  telegram_user_id TEXT PRIMARY KEY,
  username TEXT DEFAULT '',
  balance INTEGER NOT NULL DEFAULT 0,
  subscribers INTEGER NOT NULL DEFAULT 0,
  rating INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  max_multiplier_x100 INTEGER NOT NULL DEFAULT 100,
  total_earnings INTEGER NOT NULL DEFAULT 0,
  total_wagered INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  game_stars INTEGER NOT NULL,
  tg_stars INTEGER NOT NULL,
  telegram_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  claimed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_id TEXT NOT NULL,
  total_bonus_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT DEFAULT '',
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  bet INTEGER NOT NULL,
  result TEXT NOT NULL,
  multiplier_x100 INTEGER NOT NULL DEFAULT 100,
  payout INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_ref_links (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_ref_attribution (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  stars_purchased INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_ref_attr_user_idx ON admin_ref_attribution(user_id);

CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  photo_url TEXT,
  photo_data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

async function migrate() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log("[startup] Connected to database. Running migrations...");
    await client.query(MIGRATE_SQL);
    console.log("[startup] Migrations complete.");
  } catch (err) {
    console.error("[startup] Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function main() {
  await migrate();

  console.log("[startup] Starting server...");
  const server = spawn("node", [path.join(__dirname, "server.js")], {
    stdio: "inherit",
    env: process.env,
  });

  server.on("exit", (code) => {
    console.log(`[startup] Server exited with code ${code}`);
    process.exit(code ?? 1);
  });

  process.on("SIGTERM", () => server.kill("SIGTERM"));
  process.on("SIGINT", () => server.kill("SIGINT"));
}

main();

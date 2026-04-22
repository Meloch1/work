import express from "express";
import cors from "cors";
import { Pool } from "pg";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// ===== ENV =====
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

// ===== DB =====
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ===== INIT DB =====
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
  )
`);

console.log("✅ Database ready");

// ===== TELEGRAM REQUEST =====
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.description);
  }

  return data.result;
}

// ===== BALANCE =====
async function getUser(id) {
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

  if (res.rows.length === 0) {
    const created = await pool.query(
      "INSERT INTO users (id, balance) VALUES ($1, 0) RETURNING *",
      [id]
    );
    return created.rows[0];
  }

  return res.rows[0];
}

// получить баланс
app.get("/api/balance/:id", async (req, res) => {
  const user = await getUser(req.params.id);
  res.json({ balance: user.balance });
});

// добавить баланс
app.post("/api/balance/add", async (req, res) => {
  const { id, amount } = req.body;

  const result = await pool.query(
    "UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING *",
    [amount, id]
  );

  res.json({ balance: result.rows[0].balance });
});

// ===== STARS =====
app.post("/api/stars/create", async (req, res) => {
  try {
    if (!TOKEN) {
      return res.status(500).json({ error: "no token" });
    }

    const { userId, amount } = req.body;

    const invoice = await tg("createInvoiceLink", {
      title: "Покупка Stars",
      description: "Пополнение баланса",
      payload: "stars_payment",
      currency: "XTR",
      prices: [{ label: "Stars", amount }],
    });

    res.json({ url: invoice });
  } catch (e) {
    console.error("❌ Stars error:", e.message);
    res.status(500).json({ error: "network error", message: e.message });
  }
});

// ===== HEALTH =====
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ===== ROOT =====
app.get("/", (_req, res) => {
  res.send("OK 🚀");
});

// ===== START =====
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on", PORT);
});

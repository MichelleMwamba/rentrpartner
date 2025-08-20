const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// --- middlewares ---
app.use(express.json());
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"], // Live Server
    methods: ["POST", "OPTIONS", "GET"],
    allowedHeaders: ["Content-Type"],
  })
);

// --- DB connection ---
const db = mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "rentr",
  password: "SætEtStærktPasswordHer!",
  database: "rentrpartner",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Fejl ved forbindelse til MySQL:", err);
    process.exit(1);
  }
  console.log("✅ Forbundet til MySQL database.");
});

// --- Healthcheck ---
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// --- Create lead ---
app.post("/leads", (req, res) => {
  // Acceptér både camelCase og snake_case
  const b = req.body || {};
  const data = {
    full_name: (b.full_name ?? b.fullName ?? "").trim(),
    email: (b.email ?? "").trim(),
    phone: (b.phone ?? "").trim(),
    address: (b.address ?? "").trim(),
    home_type: (b.home_type ?? b.homeType ?? "").trim(),
    rooms: b.rooms == null || b.rooms === "" ? null : Number(b.rooms),
    sqm: b.sqm == null || b.sqm === "" ? null : Number(b.sqm),
    notes: (b.notes ?? "").trim(),
  };

  // Basal validering (matcher NOT NULL + ENUM)
  if (!data.full_name || !data.email || !data.phone || !data.home_type) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const allowed = new Set(["lejlighed", "hus", "sommerhus"]);
  if (!allowed.has(data.home_type)) {
    return res.status(400).json({ error: "Invalid home_type" });
  }

  const sql = `INSERT INTO leads
    (full_name, email, phone, address, home_type, rooms, sqm, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [
      data.full_name,
      data.email,
      data.phone,
      data.address,
      data.home_type,
      data.rooms,
      data.sqm,
      data.notes,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ DB error:", err.sqlMessage || err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ id: result.insertId, status: "ok" });
    }
  );
});

// --- Start ---
app.listen(3000, () => {
  console.log("🚀 Server kører på http://localhost:3000");
});

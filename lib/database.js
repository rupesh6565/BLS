import pg from "pg";

const { Pool } = pg;

const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
];

const schemaSql = `
CREATE TABLE IF NOT EXISTS enquiries (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  matter VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'new',
  ip_address VARCHAR(80),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);
`;

let pool;
let initialization;

export function getDatabaseUrl() {
  for (const key of DATABASE_ENV_KEYS) {
    if (process.env[key]) {
      return process.env[key];
    }
  }

  return "";
}

export function hasDatabaseConfig() {
  return Boolean(getDatabaseUrl());
}

function databaseConfigError() {
  const error = new Error(
    `Database is not configured. Set one of: ${DATABASE_ENV_KEYS.join(", ")}.`
  );
  error.code = "DB_NOT_CONFIGURED";
  return error;
}

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw databaseConfigError();
  }

  pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  });

  return pool;
}

export async function ensureDatabase() {
  if (!initialization) {
    initialization = getPool().query(schemaSql);
  }

  await initialization;
}

export async function saveEnquiry(data, meta = {}) {
  await ensureDatabase();

  const result = await getPool().query(
    `INSERT INTO enquiries (name, phone, matter, message, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at`,
    [
      data.name,
      data.phone,
      data.matter,
      data.message,
      meta.ipAddress || null,
      meta.userAgent || null,
    ]
  );

  return result.rows[0];
}

export async function listEnquiries(limit = 50) {
  await ensureDatabase();

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const result = await getPool().query(
    `SELECT id, name, phone, matter, message, status, created_at
     FROM enquiries
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows;
}

export async function checkDatabase() {
  await ensureDatabase();
  await getPool().query("SELECT 1");
}
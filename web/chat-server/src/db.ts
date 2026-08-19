import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.RT_DB_HOST ?? "localhost",
  port: Number(process.env.RT_DB_PORT ?? 5432),
  user: process.env.RT_DB_USER ?? "remtech",
  password: process.env.RT_DB_PASSWORD ?? "remtech",
  database: process.env.RT_DB_NAME ?? "remtech",
});
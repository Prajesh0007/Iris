import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

const dbPool = createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "iris_user",
  password: process.env.DB_PASSWORD || "Iris@2026_SecureKey",
  database: process.env.DB_NAME || "Iris",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function run() {
  try {
    const connection = await dbPool.getConnection();
    console.log("Connected to DB...");

    // Tasks table
    try {
      await connection.query("ALTER TABLE tasks ADD COLUMN target_classes JSON;");
    } catch (e: any) {
      if (e.code !== "ER_DUP_FIELDNAME") console.error(e);
    }
    try {
      await connection.query("ALTER TABLE tasks ADD COLUMN target_years JSON;");
    } catch (e: any) {
      if (e.code !== "ER_DUP_FIELDNAME") console.error(e);
    }
    try {
      await connection.query("ALTER TABLE tasks ADD COLUMN target_departments JSON;");
    } catch (e: any) {
      if (e.code !== "ER_DUP_FIELDNAME") console.error(e);
    }
    try {
      await connection.query("ALTER TABLE tasks ADD COLUMN filename VARCHAR(255);");
    } catch (e: any) {
      if (e.code !== "ER_DUP_FIELDNAME") console.error(e);
    }
    try {
      await connection.query("ALTER TABLE tasks ADD COLUMN file_url LONGTEXT;");
    } catch (e: any) {
      if (e.code !== "ER_DUP_FIELDNAME") console.error(e);
    }

    console.log("Migration complete!");
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();

// Rebuild book.db from schema.sql: npm run db:reset
const fs = require("fs");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = process.env.DB_FILE || path.join(__dirname, "..", "book.db");
const schemaPath = path.join(__dirname, "..", "schema.sql");

const reset = async () => {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log(`Removed old database: ${dbPath}`);
  }

  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    await db.exec(fs.readFileSync(schemaPath, "utf8"));
    const { count } = await db.get(`SELECT COUNT(*) AS count FROM book;`);
    console.log(`Created ${dbPath} with ${count} seed rows.`);
  } finally {
    await db.close();
  }
};

reset().catch((error) => {
  console.error(`Could not reset the database: ${error.message}`);
  process.exit(1);
});

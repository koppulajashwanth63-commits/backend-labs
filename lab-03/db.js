// Opens the SQLite database that holds the book table.
// Kept in its own module so index.js and the scripts can share it.
const fs = require("fs");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const DEFAULT_DB_PATH = path.join(__dirname, "book.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

const openDb = async (filename = process.env.DB_FILE || DEFAULT_DB_PATH) => {
  const db = await open({
    filename,
    driver: sqlite3.Database,
  });

  // A fresh clone has no book.db yet, so build it from schema.sql on first run.
  // This also covers DB_FILE pointing at a new, empty file.
  const table = await db.get(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'book';`
  );
  if (!table) {
    await db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  }

  return db;
};

module.exports = { openDb, DEFAULT_DB_PATH };

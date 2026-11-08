// Opens the SQLite database that holds the book table.
// Kept in its own module so index.js and the scripts can share it.
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const DEFAULT_DB_PATH = path.join(__dirname, "book.db");

const openDb = async (filename = process.env.DB_FILE || DEFAULT_DB_PATH) =>
  open({
    filename,
    driver: sqlite3.Database,
  });

module.exports = { openDb, DEFAULT_DB_PATH };

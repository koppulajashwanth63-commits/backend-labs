// Entry point used by Vercel: one Express app per serverless container.
// The platform filesystem is read-only except /tmp, and db.js builds the
// schema there on the first request of a cold start.
const path = require("path");
const { openDb } = require("../db");
const { createApp } = require("../app");

let appPromise = null;

const getApp = () => {
  if (!appPromise) {
    const filename = process.env.VERCEL
      ? path.join("/tmp", "book.db")
      : process.env.DB_FILE;
    appPromise = openDb(filename).then((db) => createApp(db));
  }
  return appPromise;
};

module.exports = async (request, response) => {
  const app = await getApp();
  app(request, response);
};

// Entry point: open the database, then start the HTTP server.
const { openDb } = require("./db");
const { createApp } = require("./app");

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

const main = async () => {
  let db;
  try {
    db = await openDb();
  } catch (error) {
    // A missing schema or a locked file shows up here.
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }

  const app = createApp(db);
  const server = app.listen(PORT, () => {
    console.log(`Lab 3 API running at http://localhost:${PORT}/books/`);
  });

  server.on("error", (error) => {
    // Debugging note: EADDRINUSE means another process (often an old run) owns this port.
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other process or start with PORT=3001.`);
      process.exit(1);
    }
    throw error;
  });

  const shutdown = async () => {
    server.close();
    await db.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

main();

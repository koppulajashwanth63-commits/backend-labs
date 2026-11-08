// Runs the Postman collection from the CLI against a throwaway database.
// Usage: npm run test:postman
// The script starts index.js on its own port with DB_FILE pointing at a temp
// file, waits until the API answers, runs newman, then stops the server and
// deletes the temp database. Your normal book.db and port 3000 are untouched.
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const newman = require("newman");

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const DB_FILE = path.join(os.tmpdir(), `lab3-test-${Date.now()}.db`);
const ROOT = path.join(__dirname, "..");
const COLLECTION = path.join(ROOT, "postman_collection.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (server) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`server exited with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(`${BASE_URL}/books/?limit=1`);
      if (response.ok) return;
    } catch (_) {
      // not listening yet
    }
    await sleep(200);
  }
  throw new Error("server did not start within 10 seconds");
};

const removeDb = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      fs.rmSync(DB_FILE, { force: true });
      return;
    } catch (_) {
      await sleep(200);
    }
  }
};

const run = async () => {
  const server = spawn(process.execPath, ["index.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), DB_FILE },
    stdio: ["ignore", "ignore", "inherit"],
  });

  let failures = 1;
  try {
    await waitForServer(server);
    failures = await new Promise((resolve) => {
      newman.run(
        {
          collection: COLLECTION,
          envVar: [{ key: "baseUrl", value: BASE_URL }],
          reporters: ["cli"],
        },
        (error, summary) => {
          if (error) {
            console.error(error);
            resolve(1);
            return;
          }
          resolve(summary.run.failures.length);
        }
      );
    });
  } finally {
    server.kill();
    await removeDb();
  }

  process.exitCode = failures > 0 ? 1 : 0;
};

run().catch(async (error) => {
  console.error(`Test run failed: ${error.message}`);
  await removeDb();
  process.exitCode = 1;
});

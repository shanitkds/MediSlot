const http = require("http");
const env = require("./config/env");
const logger = require("./config/logger");
const { connectDb } = require("./config/db");
const { createApp } = require("./app");
const { initSocket } = require("./socket");

async function start() {
  await connectDb(env.MONGO_URI);
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});

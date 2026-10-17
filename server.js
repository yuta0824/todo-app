import { createApp } from "./server/app.js";

const app = createApp();

Bun.serve({
  port: 3000,
  fetch: app,
});

import { serverStatic } from "./server/static.js";

Bun.serve({
  port: 3000,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    return await serverStatic("public", pathname);
  },
});

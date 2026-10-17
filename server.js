Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/hello") {
      return new Response("Hello");
    } else if (url.pathname === "/time") {
      return Response.json({ now: new Date().toISOString() });
    } else {
      return new Response("Not found", { status: 404 });
    }
  },
});

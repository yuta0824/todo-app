import { HttpError, errorResponse, methodNotAllowed } from "./http.js";
import { serveStatic } from "./static.js";

const TODO_PATH = /^\/api\/todos\/(\d+)$/;

export function createApp({ publicDir = "public" } = {}) {
  async function handleHealth(request) {
    if (request.method !== "GET") {
      throw methodNotAllowed(["GET"]);
    }
    return Response.json({ status: "ok" });
  }

  async function handleTodos(request) {
    switch (request.method) {
      case "GET":
        return Response.json([]); // TODO
      default:
        throw methodNotAllowed(["GET"]);
    }
  }

  async function handleTodo(request, id) {
    switch (request.method) {
      case "GET":
        return Response.json({ id }); // TODO
      default:
        throw methodNotAllowed(["GET"]);
    }
  }

  return async function handleRequest(request) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === "/api/health") {
        return await handleHealth(request);
      }
      if (pathname === "/api/todos") {
        return await handleTodos(request);
      }
      const match = pathname.match(TODO_PATH);
      if (match) {
        return await handleTodo(request, Number(match[1]));
      }
      if (pathname.startsWith("/api")) {
        throw new HttpError(404, "API が見つかりません");
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        throw methodNotAllowed(["GET", "HEAD"]);
      }
      return await serveStatic(publicDir, pathname);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

function toErrorResponse(error) {
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.message, error.headers);
  }
  console.error(error);
  return errorResponse(500, "サーバーでエラーが発生しました");
}

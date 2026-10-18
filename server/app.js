import {
  HttpError,
  errorResponse,
  methodNotAllowed,
  readJsonBody,
} from "./http.js";
import { serveStatic } from "./static.js";
import { parseNewTodo, parseTodoChange } from "./todoValidation.js";

const TODO_PATH = /^\/api\/todos\/(\d+)$/;

export function createApp({ todoRepository, publicDir = "public" } = {}) {
  async function handleHealth(request) {
    if (request.method !== "GET") {
      throw methodNotAllowed(["GET"]);
    }
    return Response.json({ status: "ok" });
  }

  async function handleTodos(request) {
    switch (request.method) {
      case "GET":
        return Response.json(todoRepository.findAll());
      case "POST": {
        const body = await readJsonBody(request);
        const todo = todoRepository.create(parseNewTodo(body));
        return Response.json(todo, {
          status: 201,
          headers: { Location: `/api/todos/${todo.id}` },
        });
      }
      default:
        throw methodNotAllowed(["GET", "POST"]);
    }
  }

  async function handleTodo(request, id) {
    switch (request.method) {
      case "GET": {
        const todo = todoRepository.findById(id);
        if (!todo) throw notFoundTodo(id);
        return Response.json(todo);
      }
      case "PATCH": {
        const body = await readJsonBody(request);
        const updatedTodo = todoRepository.update(id, parseTodoChange(body));
        if (!updatedTodo) throw notFoundTodo(id);
        return Response.json(updatedTodo);
      }
      case "DELETE": {
        const removedTodo = todoRepository.remove(id);
        if (!removedTodo) throw notFoundTodo(id);
        return new Response(null, { status: 204 });
      }
      default:
        throw methodNotAllowed(["GET", "PATCH", "DELETE"]);
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

function notFoundTodo(id) {
  return new HttpError(404, `id: ${id} の Todo は見つかりません`);
}

function toErrorResponse(error) {
  if (error instanceof HttpError) {
    return errorResponse(error.status, error.message, error.headers);
  }
  console.error(error);
  return errorResponse(500, "サーバーでエラーが発生しました");
}

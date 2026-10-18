import { HttpError } from "./http.js";

const TITLE_MAX_LENGTH = 100;

function parseTitle(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "title は文字列で指定してください");
  }
  const title = value.trim();
  if (title === "") {
    throw new HttpError(400, "title を入力してください");
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new HttpError(
      400,
      `title は ${TITLE_MAX_LENGTH} 文字以内で指定してください`,
    );
  }
  return title;
}

function parseCompleted(value) {
  if (typeof value !== "boolean") {
    throw new HttpError(
      400,
      "completed は true または false で指定してください",
    );
  }
  return value;
}

export function parseNewTodo(body) {
  if (typeof body !== "object") {
    throw new HttpError(400, "リクエストボディが正しい JSON ではありません");
  }
  return { title: parseTitle(body.title) };
}

export function parseTodoChange(body) {
  if (typeof body !== "object") {
    throw new HttpError(400, "リクエストボディが正しい JSON ではありません");
  }
  return { completed: parseCompleted(body.completed) };
}

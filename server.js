import { createApp } from "./server/app.js";
import { openDatabase } from "./server/db.js";
import { createTodoRepository } from "./server/todoRepository.js";

const db = openDatabase("todo.sqlite");
const app = createApp({ todoRepository: createTodoRepository(db) });

Bun.serve({
  port: 3000,
  fetch: app,
});

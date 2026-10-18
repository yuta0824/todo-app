import { createApp } from "./server/app.js";
import { createInMemoryTodoRepository } from "./server/inMemoryTodoRepository.js";

const app = createApp({ todoRepository: createInMemoryTodoRepository() });

Bun.serve({
  port: 3000,
  fetch: app,
});

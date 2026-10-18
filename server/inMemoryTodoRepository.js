export function createInMemoryTodoRepository() {
  let todos = [];
  let nextId = 1;

  function findAll({ completed } = {}) {
    return todos
      .filter((todo) => completed === undefined || todo.completed === completed)
      .map((todo) => ({ ...todo }));
  }

  function findById(id) {
    const todo = todos.find((todo) => todo.id === id);
    return todo ? { ...todo } : null;
  }

  function create({ title }) {
    const todo = {
      id: nextId++,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    return { ...todo };
  }

  function update(id, changes) {
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) return null;
    Object.assign(todo, changes);
    return { ...todo };
  }

  function remove(id) {
    const before = todos.length;
    todos = todos.filter((todo) => todo.id !== id);
    return todos.length < before;
  }

  return { findAll, findById, create, update, remove };
}

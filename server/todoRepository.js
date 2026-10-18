function toTodo(row) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export function createTodoRepository(db) {
  function findAll({ completed } = {}) {
    if (completed === undefined) {
      const rows = db
        .query("SELECT id, title, completed, created_at FROM todos ORDER BY id")
        .all();
      return rows.map(toTodo);
    }
    const rows = db
      .query(
        "SELECT id, title, completed, created_at FROM todos WHERE completed = ? ORDER BY id",
      )
      .all(completed ? 1 : 0);
    return rows.map(toTodo);
  }

  function findById(id) {
    const row = db
      .query("SELECT id, title, completed, created_at FROM todos WHERE id = ?")
      .get(id);
    return row ? toTodo(row) : null;
  }

  function create({ title }) {
    const row = db
      .query(
        "INSERT INTO todos (title) VALUES (?) RETURNING id, title, completed, created_at",
      )
      .get(title);
    return toTodo(row);
  }

  function update(id, changes) {
    const current = findById(id);
    if (!current) return null;
    const next = { ...current, ...changes };
    const row = db
      .query(
        "UPDATE todos SET title = ?, completed = ? WHERE id = ? RETURNING id, title, completed, created_at",
      )
      .get(next.title, next.completed ? 1 : 0, id);
    return toTodo(row);
  }

  function remove(id) {
    const result = db.query("DELETE FROM todos WHERE id = ?").run(id);
    return result.changes > 0;
  }

  return { findAll, findById, create, update, remove };
}

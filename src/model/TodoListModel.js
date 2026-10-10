import { EventEmitter } from "../EventEmitter.js";

export class TodoListModel extends EventEmitter {
  #items;

  constructor(items = []) {
    super();
    this.#items = items;
  }

  getTotalCount() {
    return this.#items.length;
  }

  getTodoItems() {
    return this.#items;
  }

  onChange(listener) {
    this.addEventListener("change", listener);
  }

  offChange(listener) {
    this.removeEventListener("change", listener);
  }

  emitChange() {
    this.emit("change");
  }

  addTodo(todoItem) {
    this.#items.push(todoItem);
    this.emitChange();
  }

  updateTodo({ id, completed }) {
    const todoItem = this.#items.find((item) => item.id === id);
    if (!todoItem) return;

    todoItem.completed = completed;
    this.emitChange();
  }

  deleteTodo({ id }) {
    this.#items = this.#items.filter((item) => item.id !== id);
    this.emitChange();
  }
}

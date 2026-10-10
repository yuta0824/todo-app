import { TodoItemModel } from "./model/TodoItemModel.js";
import { TodoListModel } from "./model/TodoListModel.js";
import { TodoListView } from "./view/TodoListView.js";
import { render } from "./view/html-util.js";

export class App {
  #todoListView = new TodoListView();
  #todoListModel = new TodoListModel();
  #formElement = document.querySelector("#js-form");
  #inputElement = document.querySelector("#js-form-input");
  #containerElement = document.querySelector("#js-todo-list");
  #todoItemCountElement = document.querySelector("#js-todo-count");
  #submitEventListener = (event) => {
    event.preventDefault();
    if (this.#inputElement.value.trim() === "") return;
    this.handleAdd(this.#inputElement.value);
    this.#inputElement.value = "";
  };
  #todoListModelChangeListener = () => {
    const todoItems = this.#todoListModel.getTodoItems();
    const todoListElement = this.#todoListView.createElement(todoItems, {
      onUpdateTodo: ({ id, completed }) => {
        this.handleUpdateTodo({ id, completed });
      },
      onDeleteTodo: ({ id }) => {
        this.handleDeleteTodo({ id });
      },
    });
    render(todoListElement, this.#containerElement);
    this.#todoItemCountElement.innerText = `Todoアイテム数: ${this.#todoListModel.getTotalCount()}`;
  };

  handleAdd(title) {
    const todoItem = new TodoItemModel({
      title: title,
      completed: false,
    });
    this.#todoListModel.addTodo(todoItem);
  }

  handleUpdateTodo({ id, completed }) {
    this.#todoListModel.updateTodo({ id, completed });
  }

  handleDeleteTodo({ id }) {
    this.#todoListModel.deleteTodo({ id });
  }

  mount() {
    this.#todoListModel.onChange(this.#todoListModelChangeListener);
    this.#formElement.addEventListener("submit", this.#submitEventListener);
  }

  unmount() {
    this.#formElement.removeEventListener("submit", this.#submitEventListener);
    this.#todoListModel.offChange(this.#todoListModelChangeListener);
  }
}

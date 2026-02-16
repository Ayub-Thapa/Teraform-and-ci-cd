const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch (_e) {
      // no-op
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item";
  li.dataset.id = String(todo.id);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(todo.completed);

  const title = document.createElement("span");
  title.className = `todo-title${todo.completed ? " completed" : ""}`;
  title.textContent = todo.title;

  const actions = document.createElement("div");
  actions.className = "todo-actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";

  checkbox.addEventListener("change", async () => {
    try {
      const updated = await api(`/api/todos/${todo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: checkbox.checked })
      });
      title.className = `todo-title${updated.completed ? " completed" : ""}`;
    } catch (error) {
      checkbox.checked = !checkbox.checked;
      alert(error.message);
    }
  });

  deleteBtn.addEventListener("click", async () => {
    try {
      await api(`/api/todos/${todo.id}`, { method: "DELETE" });
      li.remove();
    } catch (error) {
      alert(error.message);
    }
  });

  actions.appendChild(deleteBtn);
  li.appendChild(checkbox);
  li.appendChild(title);
  li.appendChild(actions);
  return li;
}

async function loadTodos() {
  todoList.innerHTML = "";
  const todos = await api("/api/todos");
  todos.forEach((todo) => todoList.appendChild(createTodoItem(todo)));
}

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;

  try {
    const todo = await api("/api/todos", {
      method: "POST",
      body: JSON.stringify({ title })
    });
    todoList.appendChild(createTodoItem(todo));
    todoInput.value = "";
    todoInput.focus();
  } catch (error) {
    alert(error.message);
  }
});

loadTodos().catch((error) => alert(error.message));

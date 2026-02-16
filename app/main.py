from pathlib import Path
from threading import Lock

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(title="Todo App API")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

_todos_lock = Lock()
_todos: list[dict] = []
_next_id = 1


class TodoCreate(BaseModel):
    title: str = Field(min_length=1)


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    completed: bool | None = None


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/todos")
def list_todos() -> list[dict]:
    with _todos_lock:
        return list(_todos)


@app.post("/api/todos", status_code=201)
def create_todo(payload: TodoCreate) -> dict:
    global _next_id

    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="title is required")

    with _todos_lock:
        todo = {"id": _next_id, "title": title, "completed": False}
        _next_id += 1
        _todos.append(todo)
        return todo


@app.patch("/api/todos/{todo_id}")
def update_todo(todo_id: int, payload: TodoUpdate) -> dict:
    with _todos_lock:
        todo = next((item for item in _todos if item["id"] == todo_id), None)
        if not todo:
            raise HTTPException(status_code=404, detail="todo not found")

        if payload.title is not None:
            title = payload.title.strip()
            if not title:
                raise HTTPException(status_code=400, detail="title cannot be empty")
            todo["title"] = title

        if payload.completed is not None:
            todo["completed"] = payload.completed

        return todo


@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int) -> None:
    with _todos_lock:
        index = next((i for i, item in enumerate(_todos) if item["id"] == todo_id), -1)
        if index == -1:
            raise HTTPException(status_code=404, detail="todo not found")
        _todos.pop(index)
    return None


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")

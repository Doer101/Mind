import React, { useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTodos } from "@/lib/useTodos";

const COLORS = [
  "#f87171", // red
  "#fbbf24", // yellow
  "#34d399", // green
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
  "#38bdf8", // sky
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function TodoList({ date }: { date: string }) {
  const { todosByDate, addTodo, updateTodo, deleteTodo, loading, error } = useTodos();
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  console.log("TodoList: Rendering for date:", date);
  console.log("TodoList: All todosByDate:", todosByDate);
  const todosForDate = todosByDate[date] || [];
  console.log("TodoList: Todos for this date:", todosForDate);

  const isPastDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  function handleAdd() {
    if (!input.trim()) return;
    addTodo(date, input, getRandomColor());
    setInput("");
  }

  function handleEdit(id: string, text?: string) {
    setEditId(id);
    setEditText(
      typeof text === "string"
        ? text
        : (todosForDate.find((t) => t.id === id)?.text || "")
    );
  }

  function handleEditSave(id: string) {
    updateTodo(date, id, { text: editText });
    setEditId(null);
    setEditText("");
  }

  const isReadOnly = isPastDate(date);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Add Todo Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a to-do..."
          disabled={isReadOnly}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isReadOnly && input.trim() !== "") {
              handleAdd();
            }
          }}
          className="flex-1"
        />
        <Button
          disabled={isReadOnly || !input.trim()}
          onClick={handleAdd}
        >
          Add
        </Button>
      </div>

      {/* Todo List */}
      <ul className="space-y-2">
        {todosForDate.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-2 rounded px-3 py-2 transition-colors"
            style={{ backgroundColor: todo.color + "22" }}
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => updateTodo(date, todo.id, { completed: !todo.completed })}
              disabled={isReadOnly}
            />
            
            {editId === todo.id ? (
              <>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave(todo.id);
                    if (e.key === "Escape") setEditId(null);
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleEditSave(todo.id)}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <span
                  className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: todo.color }}
                />
                <span
                  className={`flex-1 truncate ${
                    todo.completed ? "line-through text-muted-foreground" : ""
                  }`}
                  onDoubleClick={() => !isReadOnly && handleEdit(todo.id)}
                >
                  {todo.text}
                </span>
                {!isReadOnly && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(todo.id)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTodo(date, todo.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {todosForDate.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No todos for this date. Add one above!
        </p>
      )}
      
      {isReadOnly && (
        <p className="text-center text-sm text-muted-foreground">
          Past dates are read-only
        </p>
      )}
    </div>
  );
}

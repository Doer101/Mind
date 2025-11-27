import React, { useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTodos } from "@/lib/useTodos";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const todosForDate = todosByDate[date] || [];

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
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500 rounded-2xl">
        <p className="text-red-400 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Todo Input */}
      {!isReadOnly && (
        <div className="flex gap-3 p-1 bg-black border border-white rounded-2xl hover:bg-white/5 transition-colors">
          <Input
            placeholder="What needs to be done?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim() !== "") {
                handleAdd();
              }
            }}
            className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
          />
          <Button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="bg-white text-black hover:bg-black hover:text-white border border-white h-12 px-6 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            Add Task
          </Button>
        </div>
      )}

      {/* Todo List */}
      {todosForDate.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black border border-white mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white font-medium">
            {isReadOnly ? "No tasks for this date" : "No tasks yet. Add one above!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {todosForDate.map((todo, index) => (
            <div
              key={todo.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                "bg-black/70 hover:bg-black",
                "border-white",
                todo.completed && "opacity-60"
              )}
            >
              {/* Color accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{
                  background: todo.color,
                }}
              />

              <div className="flex items-center gap-4 p-4 pl-6">
                {/* Checkbox */}
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => updateTodo(date, todo.id, { completed: !todo.completed })}
                  disabled={isReadOnly}
                  className={cn(
                    "h-5 w-5 rounded-lg border-2 transition-all",
                    todo.completed 
                      ? "bg-green-500 border-green-500" 
                      : "border-white hover:border-white/70"
                  )}
                />

                {/* Todo Text */}
                {editId === todo.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave(todo.id);
                        if (e.key === "Escape") {
                          setEditId(null);
                          setEditText("");
                        }
                      }}
                      className="flex-1 bg-black border-white text-white h-9 rounded-lg"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(todo.id)}
                      className="h-9 w-9 p-0 bg-green-600 hover:bg-green-500 rounded-lg border-none"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditId(null);
                        setEditText("");
                      }}
                      className="h-9 w-9 p-0 hover:bg-white/10 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span
                      className={cn(
                        "flex-1 text-base transition-all",
                        todo.completed
                          ? "line-through text-gray-500"
                          : "text-white font-medium"
                      )}
                    >
                      {todo.text}
                    </span>

                    {/* Action Buttons */}
                    {!isReadOnly && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(todo.id, todo.text)}
                          className="h-9 w-9 p-0 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTodo(date, todo.id)}
                          className="h-9 w-9 p-0 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read-only indicator */}
      {isReadOnly && todosForDate.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-white pt-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Past dates are read-only</span>
        </div>
      )}
    </div>
  );
}

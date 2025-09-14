import React, { useState } from "react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useTodos } from "../lib/useTodos";

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
  const { todosByDate, addTodo, updateTodo, deleteTodo } = useTodos();
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
    // Add to calendar (for demonstration, this is a placeholder)
    // If you have a separate calendar add function, call it here:
    // calendarAddTodo(new Date(date), input);
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

  return null;
}

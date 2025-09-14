import { useEffect, useState } from "react";

export type TodoItem = {
  id: string;
  text: string;
  color: string;
  completed: boolean;
};

export type TodosByDate = {
  [date: string]: TodoItem[];
};

const STORAGE_KEY = "calendar_todos";

function loadTodos(): TodosByDate {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveTodos(todos: TodosByDate) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function useTodos() {
  const [todosByDate, setTodosByDate] = useState<TodosByDate>({});

  useEffect(() => {
    setTodosByDate(loadTodos());
  }, []);

  useEffect(() => {
    saveTodos(todosByDate);
  }, [todosByDate]);

  function addTodo(date: string, text: string, color: string) {
    setTodosByDate((prev) => {
      const newTodo: TodoItem = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        color,
        completed: false,
      };
      return {
        ...prev,
        [date]: prev[date] ? [...prev[date], newTodo] : [newTodo],
      };
    });
  }

  function updateTodo(date: string, id: string, updates: Partial<TodoItem>) {
    setTodosByDate((prev) => {
      const items = prev[date]?.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ) || [];
      return { ...prev, [date]: items };
    });
  }

  function deleteTodo(date: string, id: string) {
    setTodosByDate((prev) => {
      const items = prev[date]?.filter((item) => item.id !== id) || [];
      return { ...prev, [date]: items };
    });
  }

  return { todosByDate, addTodo, updateTodo, deleteTodo };
}

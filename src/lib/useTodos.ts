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

type DbTodo = {
  id: string;
  user_id: string;
  date: string;
  text: string;
  color: string;
  completed: boolean;
  created_at: string;
};

export function useTodos() {
  const [todosByDate, setTodosByDate] = useState<TodosByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch todos from database on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/todos");
      
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const { todos } = await response.json();
      
      // Convert array of todos to todosByDate object
      const grouped: TodosByDate = {};
      todos.forEach((todo: DbTodo) => {
        if (!grouped[todo.date]) {
          grouped[todo.date] = [];
        }
        grouped[todo.date].push({
          id: todo.id,
          text: todo.text,
          color: todo.color,
          completed: todo.completed,
        });
      });

      setTodosByDate(grouped);
    } catch (err) {
      console.error("Error fetching todos:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch todos");
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(date: string, text: string, color: string) {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTodo: TodoItem = {
      id: tempId,
      text,
      color,
      completed: false,
    };

    setTodosByDate((prev) => ({
      ...prev,
      [date]: prev[date] ? [...prev[date], newTodo] : [newTodo],
    }));

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, text, color }),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      const { todo } = await response.json();

      // Replace temp todo with real one from server
      setTodosByDate((prev) => ({
        ...prev,
        [date]: prev[date].map((t) => (t.id === tempId ? {
          id: todo.id,
          text: todo.text,
          color: todo.color,
          completed: todo.completed,
        } : t)),
      }));
    } catch (err) {
      console.error("Error adding todo:", err);
      // Rollback optimistic update
      setTodosByDate((prev) => ({
        ...prev,
        [date]: prev[date].filter((t) => t.id !== tempId),
      }));
      setError(err instanceof Error ? err.message : "Failed to add todo");
    }
  }

  async function updateTodo(date: string, id: string, updates: Partial<TodoItem>) {
    // Optimistic update
    const previousState = { ...todosByDate };
    
    setTodosByDate((prev) => ({
      ...prev,
      [date]: prev[date]?.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ) || [],
    }));

    try {
      const response = await fetch("/api/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      const { todo } = await response.json();

      // Update with server response
      setTodosByDate((prev) => ({
        ...prev,
        [date]: prev[date]?.map((item) =>
          item.id === id ? {
            id: todo.id,
            text: todo.text,
            color: todo.color,
            completed: todo.completed,
          } : item
        ) || [],
      }));
    } catch (err) {
      console.error("Error updating todo:", err);
      // Rollback optimistic update
      setTodosByDate(previousState);
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  }

  async function deleteTodo(date: string, id: string) {
    // Optimistic update
    const previousState = { ...todosByDate };
    
    setTodosByDate((prev) => ({
      ...prev,
      [date]: prev[date]?.filter((item) => item.id !== id) || [],
    }));

    try {
      const response = await fetch(`/api/todos?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }
    } catch (err) {
      console.error("Error deleting todo:", err);
      // Rollback optimistic update
      setTodosByDate(previousState);
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  }

  return { todosByDate, addTodo, updateTodo, deleteTodo, loading, error, refetch: fetchTodos };
}

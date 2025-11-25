import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  format,
  isBefore,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

type TodosByDate = {
  [date: string]: Todo[];
};

type CalendarProps = {
  onDayClick?: (date: Date) => void;
  [key: string]: any;
};

export default function CalendarWithTodos({ onDayClick, ...props }: CalendarProps) {
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [todos, setTodos] = useState<TodosByDate>({});
  const [inputVal, setInputVal] = useState("");
  const today = new Date();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDayClick) {
      onDayClick(date);
    }
  };

  const addTodo = (date: Date, title: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setTodos((prev) => ({
      ...prev,
      [dateStr]: [
        ...(prev[dateStr] || []),
        { id: Date.now().toString(), title, completed: false },
      ],
    }));
  };

  const toggleTodo = (date: Date, id: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setTodos((prev) => ({
      ...prev,
      [dateStr]: prev[dateStr].map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const deleteTodo = (date: Date, id: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setTodos((prev) => ({
      ...prev,
      [dateStr]: prev[dateStr].filter((t) => t.id !== id),
    }));
  };

  const getMarkerColor = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayTodos = todos[dateStr] || [];
    if (dayTodos.length === 0) return "";
    const completed = dayTodos.filter((t) => t.completed).length;
    if (completed === 0) return "bg-red-500";
    if (completed === dayTodos.length) return "bg-green-500";
    return "bg-yellow-400";
  };

  const renderHeader = () => (
    <div className="flex justify-center items-center gap-4 mb-2">
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-2 py-1 rounded-full hover:bg-white/10 text-white">
        ◀
      </button>
      <div className="flex items-center gap-2">
  <span className="text-lg font-semibold text-white px-2 py-1">{format(currentMonth, "MMMM")}</span>
        {yearDropdownOpen ? (
          <div className="relative z-50" style={{ minWidth: 0, width: '100%' }}>
            <select
              autoFocus
              className="bg-black/80 border border-white/20 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 max-h-40 overflow-y-auto w-full"
              value={currentMonth.getFullYear()}
              onChange={e => {
                const newYear = parseInt(e.target.value, 10);
                setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
                setYearDropdownOpen(false);
              }}
              onBlur={() => setYearDropdownOpen(false)}
              size={6}
              style={{ minWidth: 0, width: '100%' }}
            >
              {Array.from({ length: 21 }, (_, i) => {
                const year = new Date().getFullYear() - 10 + i;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
          </div>
        ) : (
          <span
            className="text-lg font-semibold text-white cursor-pointer hover:underline px-2 py-1"
            onClick={() => setYearDropdownOpen(true)}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setYearDropdownOpen(true); }}
          >
            {currentMonth.getFullYear()}
          </span>
        )}
      </div>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-2 py-1 rounded-full hover:bg-white/10 text-white">
        ▶
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return (
      <div className="grid grid-cols-7 mb-1">
        {days.map((day) => (
          <div
            key={day}
            className="w-10 h-10 flex items-center justify-center text-xs font-medium text-gray-300"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows: JSX.Element[] = [];
    let days: JSX.Element[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        // Calendar Day Button with Circles
        days.push(
          <button
            type="button"
            key={day.toString()}
            onClick={() => handleDateClick(cloneDay)}
            className={cn(
              "relative w-10 h-10 flex items-center justify-center text-base font-medium rounded-full",
              selectedDate?.toDateString() === day.toDateString()
                ? "bg-white/20 text-white" // Selected date highlight
                : "hover:bg-white/10 hover:text-white",
              !isSameMonth(day, monthStart) ? "text-gray-600" : "text-white"
            )}
          >
            {day.getDate()}

            {/* Status Circle (positioned at bottom-right of each date) */}
            {(() => {
              const dateStr = format(day, "yyyy-MM-dd");
              const todosForDay: Todo[] = todos[dateStr] || [];
              if (todosForDay.length === 0) return null;

              const completed = todosForDay.filter((t: Todo) => t.completed).length;
              let color = "";

              if (completed === 0) color = "bg-red-500"; // none completed
              else if (completed < todosForDay.length) color = "bg-yellow-500"; // partial
              else color = "bg-green-500"; // all completed

              return (
                <span
                  className={cn(
                    "absolute bottom-1 right-1 w-2 h-2 rounded-full",
                    color
                  )}
                />
              );
            })()}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  const renderTodoPanel = () => {
    if (!selectedDate) return null;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayTodos = todos[dateStr] || [];
    const isReadOnly = isBefore(selectedDate, today) && !isToday(selectedDate);


    // Assign a color to each todo if not present
    function getColor(todo: { id: string; color?: string }) {
      if (todo.color) return todo.color;
      // fallback color palette
      const COLORS = [
        "#f87171", // red
        "#fbbf24", // yellow
        "#34d399", // green
        "#60a5fa", // blue
        "#a78bfa", // purple
        "#f472b6", // pink
        "#38bdf8", // sky
      ];
      return COLORS[Math.abs(todo.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)) % COLORS.length];
    }

    return (
  <>
        <div className="flex gap-2 mb-2">
            <input
              className="flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1 text-white placeholder:text-gray-400 bg-transparent border-white"
              placeholder="Add a to-do..."
              disabled={isReadOnly}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !isReadOnly && inputVal.trim() !== "") {
                  addTodo(selectedDate, inputVal);
                  setInputVal("");
                }
              }}
            />
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow h-9 px-4 py-2 bg-white/10 text-white hover:bg-white/20"
              disabled={isReadOnly || !inputVal.trim()}
              onClick={() => {
                if (inputVal.trim() !== "") {
                  addTodo(selectedDate, inputVal);
                  setInputVal("");
                }
              }}
            >
              Add
            </button>
          </div>
          <ul className="space-y-1 mt-2">
            {dayTodos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-2 rounded px-2 py-1"
                style={{ background: getColor(todo) + '22' }}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ background: getColor(todo) }}
                />
                <span className={"flex-1 truncate text-white" + (todo.completed ? " line-through text-muted-foreground" : "")}>{todo.title}</span>
                {!isReadOnly && (
                  <button
                    className="text-xs text-red-400"
                    onClick={() => deleteTodo(selectedDate, todo.id)}
                  >
                    ❌
                  </button>
                )}
                <span className="relative inline-block w-5 h-5">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(selectedDate, todo.id)}
                    disabled={isReadOnly}
                    className="w-5 h-5 accent-green-600 rounded border-none bg-black/80 text-lg cursor-pointer appearance-none outline-none ring-0 focus:ring-0 focus:outline-none"
                    style={{ position: 'absolute', left: 0, top: 0, margin: 0, padding: 0 }}
                  />
                  {todo.completed && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '1.25rem',
                        height: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        fontSize: '1.1rem',
                        color: '#22c55e',
                      }}
                    >
                      ✅
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
  </>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </>
  );
}

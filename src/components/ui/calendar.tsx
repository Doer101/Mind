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
  todosByDate?: TodosByDate;
  [key: string]: any;
};

export default function CalendarWithTodos({ onDayClick, todosByDate = {}, ...props }: CalendarProps) {
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [inputVal, setInputVal] = useState("");
  const today = new Date();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDayClick) {
      onDayClick(date);
    }
  };

  // Todo management is now handled by the parent component via props

  const getMarkerColor = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayTodos = todosByDate[dateStr] || [];
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
              const todosForDay: Todo[] = todosByDate[dateStr] || [];
              if (todosForDay.length === 0) return null;

              const completed = todosForDay.filter((t: Todo) => t.completed).length;
              let color = "";

              if (completed === 0) color = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"; // none completed
              else if (completed < todosForDay.length) color = "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"; // partial
              else color = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"; // all completed

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


  return (
    <>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </>
  );
}


import React from "react";
import Calendar from "@/components/ui/calendar";
import { useTodos, TodoItem } from "@/lib/useTodos";
import { DayPickerProps, DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

function getStatus(todos: TodoItem[]): "all" | "some" | "none" | null {
  if (!todos || todos.length === 0) return null;
  const completed = todos.filter((t) => t.completed).length;
  if (completed === todos.length) return "all";
  if (completed > 0) return "some";
  return "none";
}

function StatusCircle({ status }: { status: "all" | "some" | "none" | null }) {
  if (!status) return null;
  let color = "bg-gray-300";
  if (status === "all") color = "bg-green-500";
  else if (status === "some") color = "bg-yellow-400";
  else if (status === "none") color = "bg-red-500";
  return (
    <span
      className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white shadow ${color}`}
    />
  );
}

export function CalendarWithTodos({
  onDateSelect,
  className,
  calendarProps = {},
  showYearNavigation = false,
}: {
  onDateSelect?: (date: Date) => void;
  className?: string;
  calendarProps?: Partial<import("react-day-picker").DayPickerProps> & { classNames?: any };
  showYearNavigation?: boolean;
}) {
  const { todosByDate } = useTodos();

  // Custom day button rendering
  const renderDayButton = (day: Date, selectedDate: Date | undefined) => {
    // Convert date to YYYY-MM-DD format to match database format
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayNum}`;
    
    const todos = todosByDate[dateKey] || [];
    const completed = todos.filter((t) => t.completed).length;
    const isSelected = selectedDate?.toDateString() === day.toDateString();
    
    // Determine status color
    let statusColor = "bg-gray-500/20"; // Empty
    let glowColor = "";
    
    if (todos.length > 0) {
      if (completed === 0) {
        statusColor = "bg-red-500";
        glowColor = "shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      } else if (completed < todos.length) {
        statusColor = "bg-yellow-400";
        glowColor = "shadow-[0_0_8px_rgba(250,204,21,0.6)]";
      } else {
        statusColor = "bg-green-500";
        glowColor = "shadow-[0_0_8px_rgba(34,197,94,0.6)]";
      }
    }

    return (
      <button
        type="button"
        onClick={() => onDateSelect && onDateSelect(day)}
        className={cn(
          "relative w-10 h-10 flex items-center justify-center text-sm font-medium rounded-full transition-all duration-300 group",
          isSelected
            ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-110 z-10"
            : "text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105"
        )}
      >
        {day.getDate()}
        
        {/* Status Indicator */}
        {todos.length > 0 && (
          <span
            className={cn(
              "absolute bottom-1 w-1.5 h-1.5 rounded-full transition-all duration-300",
              statusColor,
              isSelected ? "bg-white shadow-none bottom-1.5" : glowColor
            )}
          />
        )}
      </button>
    );
  };

  // Use the custom day button in the calendar
  return (
    <Calendar
      mode="single"
      todosByDate={todosByDate}
      className={cn("border rounded-lg w-full max-w-[300px] mx-auto", className)}
      onDayClick={onDateSelect}
      showOutsideDays={true}
      {...(calendarProps as any)}
      showYearNavigation={showYearNavigation}
    />
  );
}


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
    const todos = todosByDate[day.toDateString()] || [];
    const completed = todos.filter((t) => t.completed).length;
    return (
      <button
        type="button"
        onClick={() => onDateSelect && onDateSelect(day)}
        className={cn(
          "relative w-10 h-10 flex items-center justify-center text-base font-medium rounded-full transition-colors",
          selectedDate?.toDateString() === day.toDateString()
            ? "bg-white text-black"
            : todos.length === 0
            ? "bg-transparent text-white hover:bg-white/10"
            : completed === 0
            ? "bg-red-500 text-white"
            : completed < todos.length
            ? "bg-yellow-500 text-black"
            : "bg-green-500 text-white"
        )}
      >
        {day.getDate()}
      </button>
    );
  };

  // Use the custom day button in the calendar
  return (
    <Calendar
      mode="single"
      className={cn("border rounded-lg w-full max-w-[300px] mx-auto", className)}
      components={{
        // @ts-ignore
        DayContent: ({ date, selected }) => renderDayButton(date, selected),
      }}
      onDayClick={onDateSelect}
      showOutsideDays={true}
      {...(calendarProps as any)}
      showYearNavigation={showYearNavigation}
    />
  );
}

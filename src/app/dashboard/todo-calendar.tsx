"use client";
import React, { useState } from "react";
import { CalendarWithTodos } from "@/components/calendar-with-todos";
import { TodoList } from "@/components/todo-list";

export default function TodoCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  function handleDateSelect(date: Date) {
    setSelectedDate(date.toISOString().slice(0, 10));
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h2 className="text-2xl font-bold mb-4">To-Do Calendar</h2>
      <div className="rounded-xl bg-black/80 shadow-lg p-6">
        <CalendarWithTodos
          onDateSelect={handleDateSelect}
          calendarProps={{
            showOutsideDays: false,
            mode: "single",
            classNames: {
              months: "flex flex-col space-y-2",
              month: "space-y-2",
              caption: "flex justify-between items-center mb-2",
              caption_label: "text-lg font-semibold text-white",
              nav: "flex gap-2",
              nav_button: "rounded-full bg-white/10 text-white hover:bg-white/20 p-2",
              table: "w-full border-separate border-spacing-1",
              head_row: "flex",
              head_cell: "w-12 h-10 text-center text-xs font-bold text-gray-300 uppercase",
              row: "flex w-full",
              cell: "w-12 h-12 flex flex-col items-center justify-center relative rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/10",
              day: "w-10 h-10 flex items-center justify-center text-base font-medium",
              day_selected: "bg-blue-600 text-white",
              day_today: "border-2 border-blue-400",
              day_outside: "hidden",
              day_disabled: "text-gray-500 opacity-50",
              day_range_middle: "bg-blue-100 text-blue-800",
              day_hidden: "invisible",
            },
          }}
        />
      </div>
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">
          To-Do List for {selectedDate}
        </h3>
        <TodoList date={selectedDate} />
      </div>
    </div>
  );
}

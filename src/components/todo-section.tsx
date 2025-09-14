"use client";
import React, { useState } from "react";
import { CalendarWithTodos } from "@/components/calendar-with-todos";
import { TodoList } from "@/components/todo-list";

export default function TodoSection() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  function handleDateSelect(date: Date) {
    setSelectedDate(date.toISOString().slice(0, 10));
  }

  return (
    <section className="bg-white dark:bg-black/70 rounded-lg shadow p-6 my-8">
  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white px-2 py-2 mt-2">To-Do Calendar</h2>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <CalendarWithTodos onDateSelect={handleDateSelect} />
        </div>
        <div className="md:w-1/2">
          <TodoList date={selectedDate} />
        </div>
      </div>
    </section>
  );
}

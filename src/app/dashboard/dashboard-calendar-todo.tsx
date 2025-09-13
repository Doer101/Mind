"use client";
import React, { useState, useEffect } from "react";
import { CalendarWithTodos } from "@/components/calendar-with-todos";
import { TodoList } from "@/components/todo-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";


export default function DashboardCalendarTodo() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setSelectedDate(now.toISOString().slice(0, 10));
  }, []);

  function handleDateSelect(date: Date) {
    if (!today) return;
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    if (date >= todayMidnight) {
      setSelectedDate(date.toISOString().slice(0, 10));
    } else {
      console.log("Cannot select past dates");
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <Card className="bg-white border shadow-xl rounded-xl overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-white tracking-wide w-full text-center">Calendar</span>
        </div>
        <CardContent className="max-w-sm mx-auto pt-6">
          <div className="w-full max-w-full md:max-w-[350px] mx-auto bg-transparent p-3 border rounded-lg real-calendar-ui">
            {today && (
              <CalendarWithTodos
                onDateSelect={handleDateSelect}
                calendarProps={{
                  disabled: { before: today },
                  showOutsideDays: false,
                  fixedWeeks: true,
                  classNames: {
                    months: "flex flex-col space-y-2",
                    month: "space-y-2",
                    caption: "flex justify-between items-center mb-2 py-2 bg-blue-700 rounded-t-lg",
                    caption_label: "text-xl font-bold text-white tracking-wide",
                    nav: "flex gap-2",
                    nav_button: "rounded-full bg-white/20 text-white hover:bg-white/40 p-2",
                    table: "w-full border-separate border-spacing-1",
                    head_row: "flex",
                    head_cell: "w-12 h-10 text-center text-base font-bold text-blue-700 bg-blue-100 uppercase border-b border-blue-200",
                    row: "flex w-full",
                    cell: "w-12 h-12 flex flex-col items-center justify-center relative rounded-lg transition-all duration-200 cursor-pointer hover:bg-blue-50",
                    day: "w-10 h-10 flex items-center justify-center text-lg font-semibold",
                    day_selected: "bg-blue-600 text-white border-2 border-blue-800",
                    day_today: "border-2 border-blue-400 bg-blue-100",
                    day_outside: "hidden",
                    day_disabled: "text-gray-400 opacity-50 bg-gray-100 cursor-not-allowed",
                    day_range_middle: "bg-blue-100 text-blue-800",
                    day_hidden: "invisible",
                  },
                }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-gray-700">All done</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
              <span className="text-xs text-gray-700">Some done</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="text-xs text-gray-700">None done</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-400 inline-block opacity-50" />
              <span className="text-xs text-gray-700">Past dates (disabled)</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border shadow-xl rounded-xl overflow-hidden">
        <div className="bg-blue-700 px-6 py-4">
          <span className="text-2xl font-bold text-white tracking-wide w-full text-center block">
            To-Do List for {selectedDate}
          </span>
        </div>
        <CardContent>
          {selectedDate && <TodoList date={selectedDate} />}
        </CardContent>
      </Card>
    </div>
  );
}
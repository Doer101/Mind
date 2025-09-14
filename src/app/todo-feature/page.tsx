"use client";
import React, { useState } from "react";
import { CalendarWithTodos } from "@/components/calendar-with-todos";
import { TodoList } from "@/components/todo-list";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TodoFeaturePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  React.useEffect(() => {
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
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8 md:mb-12 space-y-3 md:space-y-4 px-2 md:px-0">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white break-words">
            To-Do List & Calendar
          </h2>
          <p className="text-white max-w-full md:max-w-2xl mx-auto text-base md:text-lg px-1 md:px-0">
            Organize your day with color-coded tasks and a real calendar view.
            Track your progress visually and stay productive!
          </p>
        </div>
        <div className="flex justify-center items-start w-full">
          <Card className="bg-black/80 border-white/10 w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-white">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="w-full p-6 space-y-6">
              {today && (
                <CalendarWithTodos
                  onDateSelect={handleDateSelect}
                  className="real-calendar-ui w-full"
                  showYearNavigation={true}
                  calendarProps={{
                    disabled: { before: today },
                    showOutsideDays: false,
                    fixedWeeks: true,
                    classNames: {
                      months: "flex flex-col space-y-2 w-full",
                      month: "space-y-2 w-full",
                      caption: "flex justify-center items-center mb-2 py-2",
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
                      day_outside: "text-gray-500 opacity-50",
                      day_disabled: "text-gray-500 opacity-50",
                      day_range_middle: "bg-blue-100 text-blue-800",
                      day_hidden: "invisible",
                    },
                  }}
                />
              )}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs text-white">All done</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                  <span className="text-xs text-white">Some done</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="text-xs text-white">None done</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-500 inline-block opacity-50" />
                  <span className="text-xs text-white">Past dates (disabled)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

"use client";
import React, { useState } from "react";
import { CalendarWithTodos } from "@/components/calendar-with-todos";
import { TodoList } from "@/components/todo-list";
import { Calendar as CalendarIcon, CheckCircle2, ListTodo } from "lucide-react";

export default function TodoFeaturePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  React.useEffect(() => {
    const now = new Date();
    setToday(now);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }, []);

  function handleDateSelect(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  }

  return (
    <div className="min-h-screen w-full bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-black/70 border border-white mb-4">
            <ListTodo className="w-6 h-6 text-white mr-2" />
            <span className="text-sm font-semibold text-white tracking-wider uppercase">Task Management</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
            Your Command Center
          </h1>
          
          <p className="text-white max-w-2xl mx-auto text-lg md:text-xl">
            Organize, track, and conquer your daily tasks with intelligent calendar integration
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Left Column: Calendar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-black/70 border border-white rounded-3xl p-6 shadow-none">
              <div>
                {/* Calendar Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white">
                  <div className="p-2 rounded-xl bg-black border border-white">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Calendar</h2>
                </div>
                
                {/* Calendar Component */}
                {today && (
                  <CalendarWithTodos
                    onDateSelect={handleDateSelect}
                    className="w-full"
                    showYearNavigation={true}
                    calendarProps={{
                      classNames: {
                        months: "flex flex-col space-y-4 w-full",
                        month: "space-y-4 w-full",
                        caption: "flex justify-between items-center mb-4 px-2",
                        caption_label: "text-lg font-bold text-white",
                        nav: "flex gap-2",
                        nav_button: "h-9 w-9 rounded-xl bg-black border border-white hover:bg-white hover:text-black text-white flex items-center justify-center transition-all",
                        table: "w-full border-collapse",
                        head_row: "grid grid-cols-7 mb-2",
                        head_cell: "text-center text-xs font-medium text-white uppercase tracking-wider h-8 flex items-center justify-center",
                        row: "grid grid-cols-7 gap-1 mb-1",
                        cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
                        day: "h-11 w-11 rounded-xl flex items-center justify-center text-sm font-medium transition-all hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-white",
                        day_selected: "bg-white text-black font-bold scale-110",
                        day_today: "bg-black text-white border border-white font-bold",
                        day_outside: "text-gray-700 opacity-50",
                        day_disabled: "text-gray-800 opacity-30",
                        day_range_middle: "bg-white/10",
                        day_hidden: "invisible",
                      },
                    }}
                  />
                )}

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-white">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Complete</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white">
                    <div className="w-3 h-3 rounded-full border-2 border-white" />
                    <span>No Tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Todo List */}
          <div className="lg:col-span-7 xl:col-span-8">
            {selectedDate ? (
              <div className="bg-black/70 border border-white rounded-3xl p-6 md:p-8 shadow-none min-h-[600px]">
                <div className="h-full flex flex-col">
                  {/* Todo List Header */}
                  <div className="mb-8 pb-6 border-b border-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-black border border-white">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white">Tasks</h2>
                    </div>
                    <p className="text-white font-medium text-sm md:text-base ml-14">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  {/* Todo List Component */}
                  <div className="flex-1">
                    <TodoList date={selectedDate} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] flex items-center justify-center bg-black/70 rounded-3xl border border-white border-dashed p-12">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black border border-white mb-4">
                    <CalendarIcon className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white text-lg font-medium">Select a date to view tasks</p>
                  <p className="text-white text-sm">Click on any date in the calendar to get started</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

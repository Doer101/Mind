"use client";
import React, { useState } from "react";
import { CalendarWithTodos } from "@/components/calendar-with-todos";
import { YearlyCalendar } from "@/components/yearly-calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export default function CalendarShowcasePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Handle date selection from monthly calendar
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };
  
  // Handle month selection from yearly calendar
  const handleMonthSelect = (month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    setSelectedDate(newDate);
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
  <main className="flex-1 py-8 px-4 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6 text-center">Calendar Showcase</h1>
          
          <Tabs defaultValue="monthly" className="w-full max-w-4xl mx-auto">
            <TabsList className="mb-6 w-full justify-center">
              <TabsTrigger value="monthly" className="px-8 py-2">Monthly View</TabsTrigger>
              <TabsTrigger value="yearly" className="px-8 py-2">Yearly View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Monthly Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <CalendarWithTodos
                    onDateSelect={handleDateSelect}
                    showYearNavigation={true}
                    calendarProps={{
                      showOutsideDays: false,
                      className: "mx-auto max-w-md"
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="yearly">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Yearly Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <YearlyCalendar 
                    initialYear={selectedDate?.getFullYear()} 
                    onMonthSelect={handleMonthSelect}
                    className="max-w-3xl mx-auto"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
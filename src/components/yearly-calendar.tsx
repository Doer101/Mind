import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type YearlyCalendarProps = {
  className?: string;
  initialYear?: number;
  onMonthSelect?: (month: number, year: number) => void;
};

export function YearlyCalendar({
  className,
  initialYear = new Date().getFullYear(),
  onMonthSelect,
}: YearlyCalendarProps) {
  const [year, setYear] = React.useState<number>(initialYear);
  
  // Generate years for dropdown (10 years before and after current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  
  // Month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Month colors for visual distinction - using more subtle colors
  const monthColors = [
    "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100", 
    "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100",
    "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100"
  ];
  
  // Handle year change
  const handleYearChange = (newYear: string) => {
    const yearValue = parseInt(newYear, 10);
    if (!isNaN(yearValue)) {
      setYear(yearValue);
    }
  };
  
  // Navigate to previous year
  const prevYear = () => setYear(year - 1);
  
  // Navigate to next year
  const nextYear = () => setYear(year + 1);
  
  // Handle month selection
  const handleMonthClick = (monthIndex: number) => {
    if (onMonthSelect) {
      onMonthSelect(monthIndex, year);
    }
  };
  
  return (
    <div className={cn("p-4 rounded-lg bg-white shadow-md", className)}>
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prevYear}
          className="h-8 w-8"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center">
          <h2 className="text-2xl font-bold mr-2">{year}</h2>
          <Select
            value={year.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={nextYear}
          className="h-8 w-8"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
        {months.map((month, index) => (
          <button
            key={month}
            onClick={() => handleMonthClick(index)}
            className={cn(
              "p-3 rounded border border-gray-200 transition-all hover:border-primary text-center",
              monthColors[index],
              "hover:shadow-md"
            )}
          >
            <div className="font-medium text-gray-800">{month}</div>
            <div className="text-xs mt-1 text-gray-500">{year}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
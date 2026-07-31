"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parse } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  theme?: "primary" | "secondary";
  error?: boolean;
  minDate?: Date;
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  theme = "primary",
  error = false,
  minDate = new Date(),
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const [currentMonth, setCurrentMonth] = useState(selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date());

  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime()) && !isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(selectedDate);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    const checkMinDate = new Date(minDate);
    checkMinDate.setHours(0, 0, 0, 0);
    day.setHours(0, 0, 0, 0);

    if (day < checkMinDate) return;

    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const checkMinDate = new Date(minDate);
    checkMinDate.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = new Date(day);
        cloneDay.setHours(0, 0, 0, 0);
        const isDisabled = cloneDay < checkMinDate;
        const isSelected = selectedDate && !isNaN(selectedDate.getTime()) ? isSameDay(day, selectedDate) : false;
        
        let dayClasses = "flex items-center justify-center w-8 h-8 rounded-full text-sm cursor-pointer transition-colors ";
        
        if (isDisabled) {
           dayClasses += "text-brand-gray/30 cursor-not-allowed";
        } else if (isSelected) {
           dayClasses += theme === "primary" ? "bg-primary text-white font-bold" : "bg-secondary text-white font-bold";
        } else if (!isSameMonth(day, monthStart)) {
           dayClasses += "text-brand-gray/50 hover:bg-brand-light-gray";
        } else {
           dayClasses += "text-brand-black hover:bg-brand-light-gray font-medium";
        }

        days.push(
          <div
            className={dayClasses}
            key={day.toString()}
            onClick={() => !isDisabled && onDateClick(cloneDay)}
          >
            <span>{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex justify-between w-full mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <div className="relative w-full text-brand-black" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 bg-white border ${
          error ? "border-red-500" : "border-brand-border"
        } rounded-xl pl-10 pr-4 text-sm flex items-center cursor-pointer transition-colors ${
          isOpen
            ? theme === "primary"
              ? "ring-2 ring-primary/50 border-primary"
              : "ring-2 ring-secondary/50 border-secondary"
            : ""
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
          <CalendarIcon size={16} />
        </div>
        <span className={`block truncate ${selectedDate && !isNaN(selectedDate.getTime()) ? "text-brand-black font-medium" : "text-brand-gray"}`}>
          {selectedDate && !isNaN(selectedDate.getTime()) ? format(selectedDate, "dd/MM/yyyy") : placeholder}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full sm:w-[280px] mt-2 bg-white border border-brand-border rounded-xl shadow-lg p-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevMonth(); }}
              className="p-1 rounded-md hover:bg-brand-light-gray text-brand-black transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="font-bold text-sm text-brand-black">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextMonth(); }}
              className="p-1 rounded-md hover:bg-brand-light-gray text-brand-black transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex justify-between w-full mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="w-8 text-center text-xs font-bold text-brand-gray">
                {d}
              </div>
            ))}
          </div>

          <div className="flex flex-col">{renderCells()}</div>
        </div>
      )}
    </div>
  );
}

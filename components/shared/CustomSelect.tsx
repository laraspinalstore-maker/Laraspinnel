"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  theme?: "primary" | "secondary";
  error?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  icon,
  theme = "primary",
  error = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-brand-black" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 bg-white border ${
          error ? "border-red-500" : "border-brand-border"
        } rounded-xl ${icon ? "pl-10" : "pl-4"} pr-10 text-sm flex items-center cursor-pointer transition-colors ${
          isOpen
            ? theme === "primary"
              ? "ring-2 ring-primary/50 border-primary"
              : "ring-2 ring-secondary/50 border-secondary"
            : ""
        }`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
            {icon}
          </div>
        )}
        <span className={`block truncate flex-1 min-w-0 ${selectedOption ? "text-brand-black font-medium" : "text-brand-gray"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-gray">
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? theme === "primary"
                        ? "bg-primary-tint text-primary font-bold"
                        : "bg-secondary-tint text-secondary font-bold"
                      : "hover:bg-brand-light-gray"
                  }`}
                >
                  <span className="truncate pr-2">{option.label}</span>
                  {isSelected && <Check size={16} className="shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

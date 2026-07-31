"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import CustomSelect from "@/components/shared/CustomSelect";

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedBreed: string;
  onBreedChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  selectedTag: string;
  onTagChange: (val: string) => void;
  breeds: string[];
  tags: string[];
  theme: "primary" | "secondary";
  searchSuggestions?: string[];
}

export default function FilterBar({
  searchTerm,
  onSearchChange,
  selectedBreed,
  onBreedChange,
  sortBy,
  onSortChange,
  selectedTag,
  onTagChange,
  breeds = [],
  tags = [],
  theme,
  searchSuggestions = [],
}: FilterBarProps) {
  const isPrimary = theme === "primary";
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter suggestions based on current input
  const filteredSuggestions = searchSuggestions.filter(
    (s) => s.toLowerCase().includes(searchTerm.toLowerCase()) && s.toLowerCase() !== searchTerm.toLowerCase()
  ).slice(0, 5); // Limit to 5 suggestions


  return (
    <div className="bg-white border border-brand-border rounded-2xl p-3 md:p-5 space-y-4 shadow-card">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full lg:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={isPrimary ? "Search product name..." : "Search packages..."}
            className={`w-full h-11 pl-10 pr-4 bg-brand-light-gray/50 border border-brand-border rounded-xl text-sm text-brand-black outline-none focus:ring-2 transition-all ${
              isPrimary ? "focus:ring-primary" : "focus:ring-secondary"
            }`}
          />
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchTerm.length > 0 && filteredSuggestions.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-white border border-brand-border rounded-xl shadow-lg max-h-60 overflow-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 text-sm text-brand-black hover:bg-brand-light-gray cursor-pointer"
                  onClick={() => {
                    onSearchChange(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex w-full lg:w-auto items-center gap-3">
          {/* Breed/Filter Dropdown */}
          {isPrimary && (
            <div className="flex-1 min-w-0 lg:flex-none lg:w-44">
              <CustomSelect
                options={[
                  { label: "All Categories", value: "all" },
                  ...breeds.map((breed) => ({ label: breed, value: breed }))
                ]}
                value={selectedBreed}
                onChange={onBreedChange}
                theme={theme}
              />
            </div>
          )}

          {/* Sort Selector */}
          <div className="flex-1 min-w-0 lg:flex-none lg:w-44">
            <CustomSelect
              options={[
                { label: "Name (A-Z)", value: "name-asc" },
                { label: "Name (Z-A)", value: "name-desc" },
                ...(isPrimary
                  ? [{ label: "Featured First", value: "featured" }]
                  : [
                      { label: "Price (Low-High)", value: "price-asc" },
                      { label: "Price (High-Low)", value: "price-desc" }
                    ])
              ]}
              value={sortBy}
              onChange={onSortChange}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* Quick Tag Chips Row */}
      {tags.length > 0 && (
        <div className="pt-4 mt-2">
          {/* Toggle Button */}
          <div className="flex mb-2">
            <button
              onClick={() => setIsTagsExpanded(!isTagsExpanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-black uppercase tracking-wider"
            >
              <SlidersHorizontal size={14} />
              {isTagsExpanded ? "Hide Tags" : "Show Tags"}
            </button>
          </div>

          {/* Tags List */}
          <div className={`${isTagsExpanded ? 'flex' : 'hidden'} flex-col flex-wrap content-start items-start gap-2 max-h-[140px] overflow-x-auto pb-2 w-full text-xs font-semibold select-none transition-all`}>
            <span className="hidden lg:flex text-brand-gray uppercase tracking-wider font-bold mr-1 items-center gap-1 self-center">
              <SlidersHorizontal size={12} />
              <span>Tags:</span>
            </span>
            <button
              onClick={() => onTagChange("All")}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                selectedTag === "All"
                  ? isPrimary
                    ? "bg-primary-tint text-primary-text border-primary/20"
                    : "bg-secondary-tint text-secondary-text border-secondary/20"
                  : "bg-white text-brand-black border-brand-border hover:bg-brand-light-gray"
              }`}
            >
              All
            </button>
            {tags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTagChange(tag)}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? isPrimary
                        ? "bg-primary-tint text-primary-text border-primary/20"
                        : "bg-secondary-tint text-secondary-text border-secondary/20"
                      : "bg-white text-brand-black border-brand-border hover:bg-brand-light-gray"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

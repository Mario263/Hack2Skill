"use client";

import React, { useState } from "react";
import { GroceryItem } from "@/types/meal";
import { CheckSquare, Square, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";

interface GroceryListAccordionProps {
  items: GroceryItem[];
  onToggleItem: (id: string) => void;
}

const CATEGORIES = ["Produce", "Dairy", "Protein", "Frozen", "Pantry", "Bakery", "Miscellaneous"] as const;

export default function GroceryListAccordion({ items, onToggleItem }: GroceryListAccordionProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const groupItems = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => {
        const catItems = groupItems(category);
        if (catItems.length === 0) return null;

        const isCollapsed = collapsedCategories[category];
        const checkedCount = catItems.filter((i) => i.checked).length;
        const totalCount = catItems.length;

        return (
          <div key={category} className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-sm">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 bg-slate-900/40 text-left hover:bg-slate-900/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">{category}</span>
                <span className="text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-900">
                  {checkedCount}/{totalCount}
                </span>
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Category Content */}
            {!isCollapsed && (
              <div className="p-4 bg-slate-950/20 border-t border-slate-900 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {catItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggleItem(item.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer hover:bg-slate-900/40 ${
                        item.checked
                          ? "border-emerald-500/20 bg-emerald-500/5 text-slate-500 line-through"
                          : "border-slate-900 bg-slate-900/20 text-slate-200 hover:border-slate-800"
                      }`}
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                      )}
                      <div className="flex justify-between w-full text-sm">
                        <span>{item.name}</span>
                        <span className="font-mono text-slate-400 font-medium">
                          {item.quantity} {item.unit !== "unit" ? item.unit : ""}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

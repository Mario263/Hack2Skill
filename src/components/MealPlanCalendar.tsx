"use client";

import React, { useState } from "react";
import { WeeklyMealPlan } from "@/types/meal";
import { Clock } from "lucide-react";

interface MealPlanCalendarProps {
  mealPlan: WeeklyMealPlan;
}

export default function MealPlanCalendar({ mealPlan }: MealPlanCalendarProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const activeDay = mealPlan.days[selectedDayIndex];

  if (!activeDay) return null;

  const mealTypes = [
    { label: "Breakfast", data: activeDay.breakfast },
    { label: "Lunch", data: activeDay.lunch },
    { label: "Dinner", data: activeDay.dinner },
    ...(activeDay.snack ? [{ label: "Snack", data: activeDay.snack }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Day Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {mealPlan.days.map((day, idx) => {
          const isActive = idx === selectedDayIndex;
          return (
            <button
              key={day.dayName}
              type="button"
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                isActive
                  ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-lg shadow-emerald-500/10"
                  : "bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              {day.dayName}
            </button>
          );
        })}
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mealTypes.map((meal) => {
          if (!meal.data) return null;
          return (
            <div key={meal.label} className="p-5 rounded-2xl glass-card flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {meal.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {meal.data.preparationTime} mins
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-100 line-clamp-1 mb-2">
                  {meal.data.name}
                </h4>

                {/* Macro breakdown */}
                <div className="grid grid-cols-4 gap-2 mb-4 bg-slate-950/70 p-2 rounded-lg border border-slate-900/50 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Cals</div>
                    <div className="text-xs font-bold text-emerald-400">{meal.data.calories}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Prot</div>
                    <div className="text-xs font-bold text-indigo-400">{meal.data.protein}g</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Carb</div>
                    <div className="text-xs font-bold text-amber-400">{meal.data.carbs}g</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Fats</div>
                    <div className="text-xs font-bold text-rose-400">{meal.data.fats}g</div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 block mb-1">Ingredients</span>
                  <ul className="text-xs text-slate-400 space-y-1 pl-3 list-disc">
                    {meal.data.ingredients.map((ing, i) => (
                      <li key={i} className="line-clamp-1">
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

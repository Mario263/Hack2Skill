"use client";

import React from "react";
import { BudgetAndSubstitutionReport } from "@/types/meal";
import { AlertTriangle, DollarSign, RefreshCw } from "lucide-react";

interface BudgetReportProps {
  report: BudgetAndSubstitutionReport;
}

export default function BudgetReport({ report }: BudgetReportProps) {
  const { costs, substitutions } = report;
  const percentSpent = Math.min(100, Math.round((costs.estimatedWeeklyTotal / costs.weeklyBudgetLimit) * 100));

  const getProgressBarColor = () => {
    if (costs.exceedsBudget) return "bg-red-500";
    if (percentSpent > 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Cost Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weekly Cost */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <span className="text-xs uppercase font-extrabold text-slate-500 block mb-1">
            Weekly Estimated Cost
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-100">
              ${costs.estimatedWeeklyTotal}
            </span>
            <span className="text-xs text-slate-400">USD</span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <span className="text-xs uppercase font-extrabold text-slate-500 block mb-1">
            Daily Average Cost
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-100">
              ${costs.estimatedDailyTotal}
            </span>
            <span className="text-xs text-slate-400">/ day</span>
          </div>
        </div>

        {/* Weekly Budget Limit */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <span className="text-xs uppercase font-extrabold text-slate-500 block mb-1">
            Weekly Budget Limit
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-100">
              ${costs.weeklyBudgetLimit}
            </span>
            <span className="text-xs text-slate-400">limit</span>
          </div>
        </div>
      </div>

      {/* Budget Limit Progress Bar */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 space-y-3 shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 font-semibold">Budget Consumption</span>
          <span className={`font-bold ${costs.exceedsBudget ? "text-red-400" : "text-emerald-400"}`}>
            {percentSpent}% Spent
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${percentSpent}%` }}
          />
        </div>
        {costs.exceedsBudget && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mt-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Your weekly estimate exceeds your set budget limit of <strong>${costs.weeklyBudgetLimit}</strong>. Consider applying the budget friendly substitutions below to save costs!
            </span>
          </div>
        )}
      </div>

      {/* Substitutions panel */}
      {substitutions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <RefreshCw className="w-4.5 h-4.5 text-emerald-400" />
            Intelligent Substitution Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {substitutions.map((sub, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {sub.reason.includes("Allergen") || sub.reason.includes("avoid")
                        ? "Allergy Safety"
                        : sub.reason.includes("Vegan") || sub.reason.includes("Vegetarian")
                        ? "Dietary Choice"
                        : "Budget Alternative"}
                    </span>
                    {sub.alternativeCostSavings !== undefined && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        Save ${sub.alternativeCostSavings}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-red-400 line-through font-semibold">{sub.originalIngredient}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-bold">{sub.replacementIngredient}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{sub.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

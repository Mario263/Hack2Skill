"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";
import PreferencesForm from "@/components/PreferencesForm";
import MealPlanCalendar from "@/components/MealPlanCalendar";
import GroceryListAccordion from "@/components/GroceryListAccordion";
import BudgetReport from "@/components/BudgetReport";
import { UserPreferencesInput } from "@/schemas/preferences";
import { WeeklyMealPlan, GroceryItem, BudgetAndSubstitutionReport } from "@/types/meal";
import { 
  ChefHat, LogOut, Settings, Calendar, ShoppingBag, 
  DollarSign, ClipboardList, RefreshCw, Save, History, Plus
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const {
    preferences,
    setPreferences,
    activeMealPlan,
    setActiveMealPlan,
    activeGroceryList,
    setActiveGroceryList,
    toggleGroceryItem,
    isGenerating,
    setIsGenerating,
    error,
    setError,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"preferences" | "mealplan" | "groceries" | "budget" | "saved">("preferences");
  const [budgetReport, setBudgetReport] = useState<BudgetAndSubstitutionReport | null>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted true on client load
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch preferences and history on load
  useEffect(() => {
    if (status === "authenticated") {
      fetchPreferences();
      fetchSavedPlansHistory();
    }
  }, [status]);

  // Re-run budget calculation whenever meal plan or preferences change
  useEffect(() => {
    if (activeMealPlan && preferences) {
      calculateBudgetLocally(activeMealPlan, preferences);
    }
  }, [activeMealPlan, preferences]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/user-preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (err) {
      console.error("Failed to load preferences", err);
    }
  };

  const fetchSavedPlansHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/saved-plans");
      if (res.ok) {
        const data = await res.json();
        setSavedPlans(data.plans || []);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateBudgetLocally = async (mealPlan: WeeklyMealPlan, prefs: UserPreferencesInput) => {
    try {
      const res = await fetch("/api/budget-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlan, preferences: prefs }),
      });
      if (res.ok) {
        const data = await res.json();
        setBudgetReport({
          costs: data.costs,
          substitutions: data.substitutions,
        });
      }
    } catch (err) {
      console.error("Failed to calculate budget", err);
    }
  };

  const handleGenerateMealPlan = async (prefs: UserPreferencesInput) => {
    setIsGenerating(true);
    setError(null);
    try {
      // 1. Save preferences to database
      const prefRes = await fetch("/api/user-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!prefRes.ok) {
        throw new Error("Failed to save preferences to database");
      }
      setPreferences(prefs);

      // 2. Generate meal plan from AI
      const mealRes = await fetch("/api/meal-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!mealRes.ok) {
        throw new Error("AI Generation failed. Check OpenAI API configurations.");
      }

      const mealData = await mealRes.json();
      const mealPlan: WeeklyMealPlan = mealData.mealPlan;
      setActiveMealPlan(mealPlan);

      // 3. Generate grocery list
      const groceryRes = await fetch("/api/grocery-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealPlan),
      });

      if (!groceryRes.ok) {
        throw new Error("Failed to compile grocery list");
      }

      const groceryData = await groceryRes.json();
      setActiveGroceryList(groceryData.items);

      // Switch to meal plan tab
      setActiveTab("mealplan");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during plan generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlanToHistory = async () => {
    if (!activeMealPlan || !activeGroceryList) return;
    setSavingPlan(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/saved-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Weekly Meal Plan - ${preferences?.fitnessGoal || "Gourmet"}`,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          meals: activeMealPlan,
          groceryList: activeGroceryList,
          budgetCost: budgetReport?.costs.estimatedWeeklyTotal || 0,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        fetchSavedPlansHistory();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error("Failed to save to cloud");
      }
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleLoadPastPlan = (plan: any) => {
    setActiveMealPlan(plan.meals);
    if (plan.groceryList) {
      setActiveGroceryList(plan.groceryList.items);
    }
    setActiveTab("mealplan");
  };

  if (!mounted || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <ChefHat className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-400">Loading AI Kitchen Dashboard...</p>
        </div>
      </div>
    );
  }

  const username = session?.user?.name || "Gourmet Chef";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pb-20">
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight"><span className="gradient-text">AI Cooking To-Do</span></h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase">Micro-App Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <img
              src={session?.user?.image || "https://lh3.googleusercontent.com/a/default-user"}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900"
            />
            <span className="text-xs font-semibold text-slate-300">{username}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Tabs (Sidebar Layout) */}
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:col-span-1" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal border ${
              activeTab === "preferences"
                ? "bg-slate-900 border-slate-700 text-emerald-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            Schedule & Profile Setup
          </button>

          <button
            onClick={() => setActiveTab("mealplan")}
            disabled={!activeMealPlan}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal border ${
              !activeMealPlan ? "opacity-40 cursor-not-allowed" : ""
            } ${
              activeTab === "mealplan"
                ? "bg-slate-900 border-slate-700 text-emerald-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            AI Weekly Meal Plan
          </button>

          <button
            onClick={() => setActiveTab("groceries")}
            disabled={!activeGroceryList}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal border ${
              !activeGroceryList ? "opacity-40 cursor-not-allowed" : ""
            } ${
              activeTab === "groceries"
                ? "bg-slate-900 border-slate-700 text-emerald-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Smart Grocery Checklist
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            disabled={!budgetReport}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal border ${
              !budgetReport ? "opacity-40 cursor-not-allowed" : ""
            } ${
              activeTab === "budget"
                ? "bg-slate-900 border-slate-700 text-emerald-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Budget & Substitutions
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal border ${
              activeTab === "saved"
                ? "bg-slate-900 border-slate-700 text-emerald-400 font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            Plan History Archive
          </button>
        </nav>

        {/* Dynamic Content Panel */}
        <section className="lg:col-span-3 p-6 sm:p-8 rounded-2xl glass-panel relative shadow-2xl min-h-[500px]">
          
          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* 1. PREFERENCES FORM TAB */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                  Configure Schedule & Profile
                </h2>
                <p className="text-sm text-slate-400">
                  Provide your fitness goals, dietary restrictions, allergens, and day schedule to craft a targeted meal plan.
                </p>
              </div>
              <PreferencesForm onSubmit={handleGenerateMealPlan} isLoading={isGenerating} />
            </div>
          )}

          {/* 2. MEAL PLAN TAB */}
          {activeTab === "mealplan" && activeMealPlan && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                    Your Generated AI Meal Plan
                  </h2>
                  <p className="text-sm text-slate-400">
                    A personalized weekly meal calendar matching your fitness goals and daily schedules.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePlanToHistory}
                    disabled={savingPlan}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingPlan ? "Saving..." : saveSuccess ? "Saved Successfully!" : "Save Plan to History"}
                  </button>
                  <button
                    onClick={() => setActiveTab("preferences")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Modify
                  </button>
                </div>
              </div>
              <MealPlanCalendar mealPlan={activeMealPlan} />
            </div>
          )}

          {/* 3. GROCERY TAB */}
          {activeTab === "groceries" && activeGroceryList && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-100">Smart Grocery Checklist</h2>
                <p className="text-sm text-slate-400">
                  Deduplicated, aggregated quantities of ingredients sorted by kitchen categories.
                </p>
              </div>
              <GroceryListAccordion items={activeGroceryList} onToggleItem={toggleGroceryItem} />
            </div>
          )}

          {/* 4. BUDGET TAB */}
          {activeTab === "budget" && budgetReport && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-100">Cost Projections & Substitutions</h2>
                <p className="text-sm text-slate-400">
                  Track weekly grocery costs and find substitutions for allergen safety or budget constraints.
                </p>
              </div>
              <BudgetReport report={budgetReport} />
            </div>
          )}

          {/* 5. HISTORY TAB */}
          {activeTab === "saved" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                  Plan History Archive
                </h2>
                <p className="text-sm text-slate-400">
                  Load previously saved meal plans and shopping checklists from the cloud database.
                </p>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center p-12">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : savedPlans.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                  <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-300">No saved meal plans found</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Once you generate an AI meal plan, click &quot;Save Plan&quot; to archive it here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPlans.map((plan: any) => (
                    <div
                      key={plan.id}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-base font-bold text-slate-200">{plan.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Saved on: {new Date(plan.createdAt).toLocaleDateString()}
                        </p>
                        {plan.groceryList && (
                          <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-900">
                            <span>Grocery Items: {plan.groceryList.items?.length || 0}</span>
                            <span>Cost: ${plan.groceryList.budgetCost}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleLoadPastPlan(plan)}
                        className="w-full mt-4 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Load and View Plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Global Generating Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-50">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 animate-bounce">
                <ChefHat className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h3 className="text-lg font-black text-slate-200">Generating Your AI Cooking Plan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                We are validating your schedule, computing calories/macros, aggregating grocery categories, and ensuring budget matching. Please wait...
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

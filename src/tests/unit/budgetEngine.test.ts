import { describe, it, expect } from "vitest";
import { BudgetEngine } from "@/services/budgetEngine";
import { WeeklyMealPlan } from "@/types/meal";
import { UserPreferencesInput } from "@/schemas/preferences";

describe("BudgetEngine", () => {
  const dummyMealPlan: WeeklyMealPlan = {
    days: [
      {
        dayName: "Monday",
        breakfast: {
          name: "Oatmeal with Almonds & Banana",
          ingredients: ["Oats", "Almond milk", "Almonds", "Banana"],
          calories: 350,
          protein: 10,
          carbs: 55,
          fats: 10,
          preparationTime: 10,
        },
        lunch: {
          name: "Grilled Chicken Breast with Rice",
          ingredients: ["Chicken breast", "Brown rice", "Salad"],
          calories: 500,
          protein: 40,
          carbs: 45,
          fats: 8,
          preparationTime: 20,
        },
        dinner: {
          name: "Baked Salmon with Asparagus",
          ingredients: ["Salmon fillet", "Asparagus", "Garlic butter"],
          calories: 600,
          protein: 38,
          carbs: 10,
          fats: 30,
          preparationTime: 25,
        },
        snack: null,
      },
    ] as any[],
  };

  const fullMealPlan: WeeklyMealPlan = {
    days: Array.from({ length: 7 }, (_, i) => ({
      ...dummyMealPlan.days[0],
      dayName: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i] as any,
    })),
  };

  const basePreferences: UserPreferencesInput = {
    wakeUpTime: "07:00",
    sleepTime: "22:00",
    mealFrequency: 3,
    dailySchedule: "Desk job",
    fitnessGoal: "Maintenance",
    dietaryRestrictions: [],
    allergies: [],
    cuisinePreference: ["Mediterranean"],
    budget: 150,
    numberOfPeople: 1,
    cookingSkillLevel: "Intermediate",
    availableCookingTime: 30,
  };

  it("calculates estimated costs correctly", () => {
    const report = BudgetEngine.analyzeBudgetAndSubstitutions(fullMealPlan, basePreferences);
    expect(report.costs.estimatedWeeklyTotal).toBeGreaterThan(0);
    expect(report.costs.estimatedDailyTotal).toBeCloseTo(report.costs.estimatedWeeklyTotal / 7, 1);
  });

  it("flags if the cost exceeds budget", () => {
    const tightPreferences = { ...basePreferences, budget: 10 };
    const report = BudgetEngine.analyzeBudgetAndSubstitutions(fullMealPlan, tightPreferences);
    expect(report.costs.exceedsBudget).toBe(true);
    expect(report.substitutions.length).toBeGreaterThan(0);
    expect(report.substitutions[0].reason).toContain("Over Budget");
  });

  it("suggests allergy substitutions correctly", () => {
    const allergyPrefs = { ...basePreferences, allergies: ["Nuts"] };
    const report = BudgetEngine.analyzeBudgetAndSubstitutions(fullMealPlan, allergyPrefs);
    const nutSub = report.substitutions.find((sub) => sub.originalIngredient.toLowerCase().includes("almond"));
    expect(nutSub).toBeDefined();
    expect(nutSub?.replacementIngredient.toLowerCase()).toContain("seed");
  });

  it("suggests dietary substitutions correctly", () => {
    const veganPrefs = { ...basePreferences, dietaryRestrictions: ["Vegan"] };
    const report = BudgetEngine.analyzeBudgetAndSubstitutions(fullMealPlan, veganPrefs);
    const chickenSub = report.substitutions.find((sub) => sub.originalIngredient.toLowerCase().includes("chicken"));
    expect(chickenSub).toBeDefined();
    expect(chickenSub?.replacementIngredient).toContain("Tofu");
  });
});

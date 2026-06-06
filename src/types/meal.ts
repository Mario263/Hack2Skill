export interface Meal {
  name: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  preparationTime: number; // in minutes
}

export interface DailyMealPlan {
  dayName: string; // e.g. "Monday"
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack: Meal | null;
}

export interface WeeklyMealPlan {
  days: DailyMealPlan[];
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: "Produce" | "Dairy" | "Protein" | "Frozen" | "Pantry" | "Bakery" | "Miscellaneous";
  checked: boolean;
}

export interface GroceryCategoryGroup {
  category: string;
  items: GroceryItem[];
}

export interface BudgetCostEstimation {
  estimatedWeeklyTotal: number;
  estimatedDailyTotal: number;
  exceedsBudget: boolean;
  weeklyBudgetLimit: number;
}

export interface SubstitutionRecommendation {
  originalIngredient: string;
  replacementIngredient: string;
  reason: string; // e.g. "Allergen substitution", "Budget alternative"
  alternativeCostSavings?: number;
}

export interface BudgetAndSubstitutionReport {
  costs: BudgetCostEstimation;
  substitutions: SubstitutionRecommendation[];
}

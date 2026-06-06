import { WeeklyMealPlan, GroceryItem, BudgetAndSubstitutionReport, SubstitutionRecommendation } from "@/types/meal";
import { UserPreferencesInput } from "@/schemas/preferences";

// Simple ingredient cost index
const INGREDIENT_COSTS: Record<string, number> = {
  salmon: 8.5,
  chicken: 4.5,
  beef: 6.0,
  tofu: 2.0,
  tempeh: 2.5,
  shrimp: 9.0,
  avocado: 1.5,
  quinoa: 1.2,
  egg: 0.3,
  milk: 0.5,
  butter: 0.4,
  bread: 0.3,
  rice: 0.2,
  pasta: 0.4,
  oats: 0.1,
  almond: 0.8,
  honey: 0.5,
  banana: 0.4,
  blueberry: 1.0,
  salad: 0.7,
  greens: 0.5,
  sweet: 0.6,
  potato: 0.3,
  asparagus: 1.2,
  spinach: 0.5,
  broccoli: 0.6,
  sauce: 0.8,
  chia: 0.4,
  pumpkin: 0.3,
};

// Diet and Allergy substitution mappings
const SUBSTITUTION_RULES: {
  ingredientPattern: RegExp;
  allergy?: string;
  dietary?: string;
  replacement: string;
  reason: string;
}[] = [
  {
    ingredientPattern: /peanut|almond|cashew|walnut|nut/i,
    allergy: "Peanuts",
    replacement: "Sunflower seeds",
    reason: "Replace nuts with sunflower seeds to avoid nut allergen",
  },
  {
    ingredientPattern: /peanut|almond|cashew|walnut|nut/i,
    allergy: "Nuts",
    replacement: "Pumpkin seeds",
    reason: "Replace nuts with pumpkin seeds to avoid nut allergen",
  },
  {
    ingredientPattern: /milk|butter|cheese|cream|dairy/i,
    allergy: "Dairy",
    replacement: "Almond milk / Olive oil",
    reason: "Replace dairy with plant-based alternatives to avoid dairy allergen",
  },
  {
    ingredientPattern: /milk|butter|cheese|cream|dairy/i,
    dietary: "Vegan",
    replacement: "Almond milk / Coconut oil / Nutritional yeast",
    reason: "Vegan replacement for dairy product",
  },
  {
    ingredientPattern: /milk|butter|cheese|cream|dairy/i,
    dietary: "Dairy Free",
    replacement: "Almond milk / Olive oil",
    reason: "Dairy-free replacement",
  },
  {
    ingredientPattern: /egg/i,
    allergy: "Eggs",
    replacement: "Flax egg / Tofu scramble",
    reason: "Egg substitution for egg allergy",
  },
  {
    ingredientPattern: /egg/i,
    dietary: "Vegan",
    replacement: "Flax egg / Silken tofu",
    reason: "Vegan replacement for eggs",
  },
  {
    ingredientPattern: /wheat|bread|pasta|flour|rye|barley/i,
    dietary: "Gluten Free",
    replacement: "Gluten-free bread / Lentil pasta / Rice flour",
    reason: "Gluten-free replacement",
  },
  {
    ingredientPattern: /chicken|beef|pork|turkey|salmon|shrimp|fish/i,
    dietary: "Vegan",
    replacement: "Tofu / Tempeh / Beans",
    reason: "Plant-based protein replacement",
  },
  {
    ingredientPattern: /chicken|beef|pork|turkey|salmon|shrimp|fish/i,
    dietary: "Vegetarian",
    replacement: "Tofu / Beans / Lentils",
    reason: "Vegetarian protein replacement",
  },
];

// Budget substitution mappings (expensive ingredients to cheap)
const BUDGET_REPLACEMENTS: {
  ingredientPattern: RegExp;
  replacement: string;
  costSavings: number;
}[] = [
  { ingredientPattern: /salmon|shrimp|halibut|fish/i, replacement: "Canned Tuna / Tofu", costSavings: 5.5 },
  { ingredientPattern: /beef|steak|lamb/i, replacement: "Chicken Breast / Black beans", costSavings: 3.5 },
  { ingredientPattern: /chicken breast/i, replacement: "Leg Quarters / Lentils", costSavings: 2.0 },
  { ingredientPattern: /avocado/i, replacement: "Hummus", costSavings: 0.8 },
  { ingredientPattern: /almond milk/i, replacement: "Oat milk", costSavings: 0.3 },
  { ingredientPattern: /quinoa/i, replacement: "Brown rice", costSavings: 0.8 },
];

export class BudgetEngine {
  /**
   * Helper to estimate cost of a single ingredient string
   */
  static estimateIngredientCost(ingredient: string, numPeople: number): number {
    const ingLower = ingredient.toLowerCase();
    let unitCost = 0.5; // fallback default cost

    for (const [key, cost] of Object.entries(INGREDIENT_COSTS)) {
      if (ingLower.includes(key)) {
        unitCost = cost;
        break;
      }
    }

    // Cost scales with number of people (assumed base cost is per person)
    return parseFloat((unitCost * numPeople).toFixed(2));
  }

  /**
   * Analyze weekly meal plan and preferences, computing total costs and generating substitutions.
   */
  static analyzeBudgetAndSubstitutions(
    mealPlan: WeeklyMealPlan,
    preferences: UserPreferencesInput
  ): BudgetAndSubstitutionReport {
    let weeklyTotal = 0;
    const numPeople = preferences.numberOfPeople;
    const substitutions: SubstitutionRecommendation[] = [];

    // 1. Calculate costs & look for allergies/dietary violations
    mealPlan.days.forEach((day) => {
      const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(
        (m): m is Exclude<typeof m, null> => m !== null
      );

      meals.forEach((meal) => {
        meal.ingredients.forEach((ing) => {
          const cost = this.estimateIngredientCost(ing, numPeople);
          weeklyTotal += cost;

          // Check dietary/allergy rule violations
          SUBSTITUTION_RULES.forEach((rule) => {
            const matchesIng = rule.ingredientPattern.test(ing);
            if (!matchesIng) return;

            // Check allergy violation
            if (rule.allergy && preferences.allergies.some((a) => a.toLowerCase() === rule.allergy!.toLowerCase())) {
              substitutions.push({
                originalIngredient: ing,
                replacementIngredient: rule.replacement,
                reason: rule.reason,
              });
            }

            // Check dietary restriction violation
            if (
              rule.dietary &&
              preferences.dietaryRestrictions.some((r) => r.toLowerCase() === rule.dietary!.toLowerCase())
            ) {
              substitutions.push({
                originalIngredient: ing,
                replacementIngredient: rule.replacement,
                reason: rule.reason,
              });
            }
          });
        });
      });
    });

    weeklyTotal = parseFloat(weeklyTotal.toFixed(2));
    const dailyTotal = parseFloat((weeklyTotal / 7).toFixed(2));
    const weeklyBudgetLimit = preferences.budget;
    const exceedsBudget = weeklyTotal > weeklyBudgetLimit;

    // 2. If over budget, recommend budget-friendly alternatives
    if (exceedsBudget) {
      mealPlan.days.forEach((day) => {
        const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(
          (m): m is Exclude<typeof m, null> => m !== null
        );

        meals.forEach((meal) => {
          meal.ingredients.forEach((ing) => {
            BUDGET_REPLACEMENTS.forEach((item) => {
              if (item.ingredientPattern.test(ing)) {
                // Prevent duplicate recommendations
                if (substitutions.some((sub) => sub.originalIngredient === ing)) return;

                substitutions.push({
                  originalIngredient: ing,
                  replacementIngredient: item.replacement,
                  reason: `Over Budget Alternative (Weekly budget is $${weeklyBudgetLimit}, estimated cost is $${weeklyTotal})`,
                  alternativeCostSavings: parseFloat((item.costSavings * numPeople).toFixed(2)),
                });
              }
            });
          });
        });
      });
    }

    // Deduplicate recommendations by originalIngredient
    const uniqueSubstitutions: SubstitutionRecommendation[] = [];
    const seen = new Set<string>();
    substitutions.forEach((sub) => {
      const key = `${sub.originalIngredient}->${sub.replacementIngredient}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSubstitutions.push(sub);
      }
    });

    return {
      costs: {
        estimatedWeeklyTotal: weeklyTotal,
        estimatedDailyTotal: dailyTotal,
        exceedsBudget,
        weeklyBudgetLimit,
      },
      substitutions: uniqueSubstitutions,
    };
  }
}

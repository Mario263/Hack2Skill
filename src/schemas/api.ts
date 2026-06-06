import { z } from "zod";
import { userPreferencesSchema } from "./preferences";

// Generate Meal Plan API Request Schema
export const generateMealPlanRequestSchema = userPreferencesSchema;

// Save Meal Plan API Request Schema
export const saveMealPlanRequestSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  startDate: z.string().datetime("Start date must be a valid ISO string"),
  endDate: z.string().datetime("End date must be a valid ISO string"),
  meals: z.any(), // Structure checked by services/ai
});

// Save Grocery List API Request Schema
export const saveGroceryListRequestSchema = z.object({
  mealPlanId: z.string().uuid("Invalid meal plan ID"),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().nonnegative(),
      unit: z.string(),
      category: z.enum([
        "Produce",
        "Dairy",
        "Protein",
        "Frozen",
        "Pantry",
        "Bakery",
        "Miscellaneous",
      ]),
      checked: z.boolean(),
    })
  ),
  budgetCost: z.number().nonnegative(),
});

// Substitution request schema
export const substitutionRequestSchema = z.object({
  ingredient: z.string().min(1),
  dietaryRestrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
});

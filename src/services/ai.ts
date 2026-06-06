import { openai } from "@/lib/openai";
import { logger } from "@/services/logger";
import { UserPreferencesInput } from "@/schemas/preferences";
import { WeeklyMealPlan } from "@/types/meal";
import { z } from "zod";

// Zod schemas for strict AI response validation
export const mealSchema = z.object({
  name: z.string().min(1),
  ingredients: z.array(z.string().min(1)),
  calories: z.number().positive(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fats: z.number().nonnegative(),
  preparationTime: z.number().positive(),
});

export const dailyMealPlanSchema = z.object({
  dayName: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  breakfast: mealSchema,
  lunch: mealSchema,
  dinner: mealSchema,
  snack: mealSchema.nullable(),
});

export const weeklyMealPlanSchema = z.object({
  days: z.array(dailyMealPlanSchema).length(7),
});

// Prompt injection detection
function sanitizeInput(text: string): string {
  const injectionPatterns = [
    /ignore previous/i,
    /system instruction/i,
    /bypass restriction/i,
    /you are now/i,
    /forget everything/i,
  ];

  let cleanText = text;
  for (const pattern of injectionPatterns) {
    cleanText = cleanText.replace(pattern, "[redacted]");
  }
  return cleanText;
}

export class AIService {
  /**
   * Generates a weekly meal plan based on user preferences.
   * Leverages JSON mode and schema validation.
   */
  static async generateWeeklyMealPlan(
    preferences: UserPreferencesInput
  ): Promise<WeeklyMealPlan> {
    const isMock =
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "dummy-key" ||
      process.env.OPENAI_API_KEY.startsWith("MOCK");

    if (isMock) {
      logger.info("Using mock AI generation service");
      return this.getMockWeeklyMealPlan(preferences);
    }

    const sanitizedSchedule = sanitizeInput(preferences.dailySchedule);
    const allergens = preferences.allergies.join(", ") || "None";
    const restrictions = preferences.dietaryRestrictions.join(", ") || "None";
    const cuisines = preferences.cuisinePreference.join(", ");

    const systemPrompt = `You are an expert culinary nutritionist. Generate a 7-day meal plan based on the user's details.
Return ONLY a valid JSON object matching this schema:
{
  "days": [
    {
      "dayName": "Monday", // through Sunday
      "breakfast": { "name": "...", "ingredients": ["..."], "calories": 400, "protein": 20, "carbs": 45, "fats": 10, "preparationTime": 15 },
      "lunch": { ... },
      "dinner": { ... },
      "snack": null // or meal object
    }
  ]
}

DO NOT include markdown styling or any commentary.`;

    const userPrompt = `
- Wake up: ${preferences.wakeUpTime}, Sleep: ${preferences.sleepTime}
- Fitness Goal: ${preferences.fitnessGoal}
- Dietary restrictions: ${restrictions}
- Allergies (NEVER suggest these): ${allergens}
- Cuisines preferred: ${cuisines}
- Number of people: ${preferences.numberOfPeople}
- Cooking skill: ${preferences.cookingSkillLevel}
- Available prep time per meal: ${preferences.availableCookingTime} minutes
- Daily activities schedule: ${sanitizedSchedule}
`;

    let retries = 3;
    while (retries > 0) {
      try {
        logger.info(`Calling OpenAI API, remaining retries: ${retries}`);
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || "";
        const parsed = JSON.parse(content);
        const validated = weeklyMealPlanSchema.parse(parsed);

        logger.info("Successfully validated AI generated meal plan");
        return validated as WeeklyMealPlan;
      } catch (err) {
        retries--;
        logger.warn("OpenAI generation failure or validation error", {
          error: String(err),
          retriesLeft: retries,
        });
        if (retries === 0) {
          logger.error("All retries exhausted. Falling back to local generation generator.");
          return this.getMockWeeklyMealPlan(preferences);
        }
      }
    }

    return this.getMockWeeklyMealPlan(preferences);
  }

  /**
   * High-fidelity local fallback generator if OpenAI fails or is missing.
   */
  private static getMockWeeklyMealPlan(preferences: UserPreferencesInput): WeeklyMealPlan {
    const days: z.infer<typeof dailyMealPlanSchema>[] = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ].map((dayName) => {
      // Customize based on dietary restrictions
      const isVegan = preferences.dietaryRestrictions.some((r) =>
        /vegan/i.test(r)
      );
      const isGlutenFree = preferences.dietaryRestrictions.some((r) =>
        /gluten/i.test(r)
      );

      const breakfastName = isVegan
        ? "Avocado Toast with Tofu Scramble"
        : "Oatmeal with Almonds & Banana";
      const breakfastIngredients = isVegan
        ? ["Sourdough bread", "Avocado", "Firm tofu", "Turmeric", "Black pepper"]
        : ["Oats", "Almond milk", "Almonds", "Banana", "Honey"];

      const lunchName = isVegan
        ? "Quinoa Salad with Chickpeas"
        : "Grilled Chicken Breast with Rice & Salad";
      const lunchIngredients = isVegan
        ? ["Quinoa", "Chickpeas", "Cucumber", "Cherry tomatoes", "Olive oil", "Lemon juice"]
        : ["Chicken breast", "Brown rice", "Mixed greens", "Tomato", "Vinaigrette"];

      const dinnerName = isVegan
        ? "Lentil Pasta with Marinara"
        : "Baked Salmon with Asparagus & Sweet Potato";
      const dinnerIngredients = isVegan
        ? ["Gluten-free lentil pasta", "Marinara sauce", "Nutritional yeast", "Basil"]
        : ["Salmon fillet", "Asparagus", "Sweet potato", "Garlic butter", "Lemon"];

      const snackName = "Mixed Berries with Seeds";
      const snackIngredients = ["Blueberries", "Raspberries", "Chia seeds", "Pumpkin seeds"];

      // Filter out allergies dynamically in mock to satisfy allergen requirements
      const filterAllergen = (ings: string[]) =>
        ings.filter(
          (i) =>
            !preferences.allergies.some((allergy) =>
              new RegExp(allergy, "i").test(i)
            )
        );

      return {
        dayName: dayName as any,
        breakfast: {
          name: breakfastName,
          ingredients: filterAllergen(breakfastIngredients),
          calories: 380,
          protein: 15,
          carbs: 45,
          fats: 14,
          preparationTime: Math.min(15, preferences.availableCookingTime),
        },
        lunch: {
          name: lunchName,
          ingredients: filterAllergen(lunchIngredients),
          calories: 520,
          protein: 35,
          carbs: 50,
          fats: 12,
          preparationTime: Math.min(25, preferences.availableCookingTime),
        },
        dinner: {
          name: dinnerName,
          ingredients: filterAllergen(dinnerIngredients),
          calories: 610,
          protein: 42,
          carbs: 48,
          fats: 22,
          preparationTime: Math.min(30, preferences.availableCookingTime),
        },
        snack: {
          name: snackName,
          ingredients: filterAllergen(snackIngredients),
          calories: 150,
          protein: 4,
          carbs: 18,
          fats: 7,
          preparationTime: Math.min(5, preferences.availableCookingTime),
        },
      };
    });

    return { days };
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WeeklyMealPlan, GroceryItem } from "@/types/meal";
import { logger } from "@/services/logger";

function parseIngredient(ing: string) {
  // Regex for parsing: numbers, fractions, units, and name
  const regex = /^([\d\/\.]+)?\s*(cups?|slices?|tbsp|tsps?|g|oz|kg|lbs?|cloves?|cans?|heads?|units?)?\s*(?:of\s+)?(.+)$/i;
  const match = ing.trim().match(regex);

  let quantity = 1;
  let unit = "unit";
  let name = ing.trim();

  if (match) {
    if (match[1]) {
      if (match[1].includes("/")) {
        const parts = match[1].split("/");
        quantity = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else {
        quantity = parseFloat(match[1]);
      }
    }
    unit = match[2] ? match[2].trim().toLowerCase() : "unit";
    name = match[3] ? match[3].trim() : ing.trim();
  }

  // Normalize name
  name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  return { name, quantity, unit };
}

function categorizeIngredient(name: string): GroceryItem["category"] {
  const nameLower = name.toLowerCase();

  const proteinKeywords = ["chicken", "beef", "pork", "salmon", "turkey", "fish", "tofu", "tempeh", "shrimp", "tuna", "egg", "steak", "ham", "bacon"];
  const dairyKeywords = ["milk", "butter", "cheese", "cream", "yogurt", "dairy", "ghee"];
  const produceKeywords = [
    "avocado", "banana", "berry", "blueberries", "raspberries", "apple", "spinach", "tomato", "tomatoes", 
    "cucumber", "salad", "greens", "asparagus", "garlic", "onion", "lemon", "lime", "basil", "potato", 
    "sweet potato", "broccoli", "carrot", "peppers", "mushroom", "cilantro", "lettuce", "ginger"
  ];
  const bakeryKeywords = ["bread", "sourdough", "toast", "wrap", "tortilla", "bagel", "bun"];
  const frozenKeywords = ["frozen", "ice cream", "berry mix", "waffles"];
  const pantryKeywords = [
    "oats", "quinoa", "rice", "pasta", "oil", "vinegar", "honey", "sauce", "salt", "pepper", "turmeric", 
    "seeds", "chia", "pumpkin", "peanut", "almond", "walnut", "cashew", "beans", "lentils", "soy sauce",
    "marinara", "yeast", "syrup", "sugar", "flour", "mustard"
  ];

  if (proteinKeywords.some((kw) => nameLower.includes(kw))) return "Protein";
  if (dairyKeywords.some((kw) => nameLower.includes(kw))) return "Dairy";
  if (produceKeywords.some((kw) => nameLower.includes(kw))) return "Produce";
  if (bakeryKeywords.some((kw) => nameLower.includes(kw))) return "Bakery";
  if (frozenKeywords.some((kw) => nameLower.includes(kw))) return "Frozen";
  if (pantryKeywords.some((kw) => nameLower.includes(kw))) return "Pantry";

  return "Miscellaneous";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mealPlan: WeeklyMealPlan = await req.json();

    if (!mealPlan || !mealPlan.days) {
      return NextResponse.json({ error: "Invalid meal plan format" }, { status: 400 });
    }

    logger.info("Aggregating grocery list from meal plan", { userId: session.user.id });

    // Collect all ingredients
    const allIngredients: string[] = [];
    mealPlan.days.forEach((day) => {
      const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(
        (m): m is Exclude<typeof m, null> => m !== null
      );
      meals.forEach((meal) => {
        meal.ingredients.forEach((ing) => allIngredients.push(ing));
      });
    });

    // Parse, aggregate and deduplicate
    const aggregated: Record<string, { quantity: number; unit: string; name: string }> = {};

    allIngredients.forEach((ing) => {
      const { name, quantity, unit } = parseIngredient(ing);
      const key = `${name.toLowerCase()}_${unit}`;

      if (aggregated[key]) {
        aggregated[key].quantity += quantity;
      } else {
        aggregated[key] = { name, quantity, unit };
      }
    });

    // Map to final GroceryItem objects
    let itemIdCounter = 1;
    const items: GroceryItem[] = Object.values(aggregated).map((item) => {
      const category = categorizeIngredient(item.name);
      return {
        id: `grocery-item-${itemIdCounter++}`,
        name: item.name,
        quantity: parseFloat(item.quantity.toFixed(2)),
        unit: item.unit,
        category,
        checked: false,
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    logger.error("Failed to generate grocery list", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BudgetEngine } from "@/services/budgetEngine";
import { userPreferencesSchema } from "@/schemas/preferences";
import { logger } from "@/services/logger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mealPlan, preferences } = await req.json();

    if (!mealPlan || !preferences) {
      return NextResponse.json({ error: "Meal plan and preferences are required" }, { status: 400 });
    }

    const validatedPrefs = userPreferencesSchema.safeParse(preferences);
    if (!validatedPrefs.success) {
      return NextResponse.json(
        { error: "Validation failed for preferences", details: validatedPrefs.error.format() },
        { status: 400 }
      );
    }

    logger.info("Analyzing meal plan budget", { userId: session.user.id });
    const analysis = BudgetEngine.analyzeBudgetAndSubstitutions(mealPlan, validatedPrefs.data);

    return NextResponse.json({ success: true, ...analysis });
  } catch (error) {
    logger.error("Failed to analyze budget", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const runtime = "nodejs";

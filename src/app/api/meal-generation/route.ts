import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateMealPlanRequestSchema } from "@/schemas/api";
import { AIService } from "@/services/ai";
import { logger } from "@/services/logger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = generateMealPlanRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    logger.info("Generating weekly meal plan", { userId: session.user.id });
    const mealPlan = await AIService.generateWeeklyMealPlan(validated.data);

    return NextResponse.json({ success: true, mealPlan });
  } catch (error) {
    logger.error("Failed to generate meal plan", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const runtime = "nodejs";

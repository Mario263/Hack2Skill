import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveMealPlanRequestSchema } from "@/schemas/api";
import { logger } from "@/services/logger";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.savedMealPlan.findMany({
      where: { userId },
      include: { groceryList: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    logger.error("Failed to fetch saved meal plans", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, startDate, endDate, meals, groceryList, budgetCost } = body;

    const validatedMealPlan = saveMealPlanRequestSchema.safeParse({ name, startDate, endDate, meals });
    if (!validatedMealPlan.success) {
      return NextResponse.json(
        { error: "Validation failed for meal plan", details: validatedMealPlan.error.format() },
        { status: 400 }
      );
    }

    logger.info("Saving meal plan and grocery list", { userId });

    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.savedMealPlan.create({
        data: {
          userId,
          name: validatedMealPlan.data.name,
          startDate: new Date(validatedMealPlan.data.startDate),
          endDate: new Date(validatedMealPlan.data.endDate),
          meals: validatedMealPlan.data.meals as any,
        },
      });

      let savedGrocery = null;
      if (groceryList && Array.isArray(groceryList)) {
        savedGrocery = await tx.savedGroceryList.create({
          data: {
            mealPlanId: plan.id,
            items: groceryList as any,
            budgetCost: budgetCost || 0.0,
          },
        });
      }

      return { plan, groceryList: savedGrocery };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error("Failed to save meal plan", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userPreferencesSchema } from "@/schemas/preferences";
import { logger } from "@/services/logger";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    logger.error("Failed to fetch user preferences", { error: String(error) });
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
    const validated = userPreferencesSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const {
      wakeUpTime,
      sleepTime,
      mealFrequency,
      dailySchedule,
      fitnessGoal,
      dietaryRestrictions,
      allergies,
      cuisinePreference,
      budget,
      numberOfPeople,
      cookingSkillLevel,
      availableCookingTime,
    } = validated.data;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        wakeUpTime,
        sleepTime,
        mealFrequency,
        dailySchedule,
        fitnessGoal,
        dietaryRestrictions,
        allergies,
        cuisinePreference,
        budget,
        numberOfPeople,
        cookingSkillLevel,
        availableCookingTime,
      },
      create: {
        userId,
        wakeUpTime,
        sleepTime,
        mealFrequency,
        dailySchedule,
        fitnessGoal,
        dietaryRestrictions,
        allergies,
        cuisinePreference,
        budget,
        numberOfPeople,
        cookingSkillLevel,
        availableCookingTime,
      },
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    logger.error("Failed to save user preferences", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

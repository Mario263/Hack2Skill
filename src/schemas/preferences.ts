import { z } from "zod";

export const userPreferencesSchema = z.object({
  wakeUpTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Wake-up time must be in HH:MM 24-hour format.",
  }),
  sleepTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Sleep time must be in HH:MM 24-hour format.",
  }),
  mealFrequency: z.number().int().min(1).max(6, {
    message: "Meal frequency must be between 1 and 6 meals per day.",
  }),
  dailySchedule: z.string().min(5, {
    message: "Please describe your daily schedule (at least 5 characters).",
  }),
  fitnessGoal: z.enum(["Weight Loss", "Muscle Gain", "Maintenance", "Athletic Performance"]),
  dietaryRestrictions: z.array(z.string()),
  allergies: z.array(z.string()),
  cuisinePreference: z.array(z.string()).min(1, {
    message: "Please select at least one cuisine preference.",
  }),
  budget: z.number().positive({
    message: "Weekly budget must be a positive number.",
  }),
  numberOfPeople: z.number().int().positive().min(1, {
    message: "Number of people must be at least 1.",
  }),
  cookingSkillLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  availableCookingTime: z.number().int().min(5, {
    message: "Available cooking time must be at least 5 minutes.",
  }),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

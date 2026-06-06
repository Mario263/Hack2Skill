"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userPreferencesSchema, UserPreferencesInput } from "@/schemas/preferences";
import { useAppStore } from "@/store/useAppStore";
import { Save, Sparkles, AlertCircle, Clock, Users, Flame, BookOpen } from "lucide-react";

interface PreferencesFormProps {
  onSubmit: (data: UserPreferencesInput) => void;
  isLoading: boolean;
}

const CUISINES = ["Mediterranean", "Mexican", "Asian", "Italian", "Indian", "American"];
const DIETS = ["Vegan", "Vegetarian", "Gluten Free", "Dairy Free", "Low Carb", "Keto", "None"];

export default function PreferencesForm({ onSubmit, isLoading }: PreferencesFormProps) {
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferencesDraft = useAppStore((state) => state.updatePreferencesDraft);
  const preferencesDraft = React.useRef(useAppStore.getState().preferencesDraft).current;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserPreferencesInput>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      wakeUpTime: preferences?.wakeUpTime || preferencesDraft.wakeUpTime || "07:00",
      sleepTime: preferences?.sleepTime || preferencesDraft.sleepTime || "22:00",
      mealFrequency: preferences?.mealFrequency || preferencesDraft.mealFrequency || 3,
      dailySchedule: preferences?.dailySchedule || preferencesDraft.dailySchedule || "9-5 desk job, workout in evening",
      fitnessGoal: preferences?.fitnessGoal || preferencesDraft.fitnessGoal || "Maintenance",
      dietaryRestrictions: preferences?.dietaryRestrictions || preferencesDraft.dietaryRestrictions || [],
      allergies: preferences?.allergies || preferencesDraft.allergies || [],
      cuisinePreference: preferences?.cuisinePreference || preferencesDraft.cuisinePreference || ["Mediterranean"],
      budget: preferences?.budget || preferencesDraft.budget || 100,
      numberOfPeople: preferences?.numberOfPeople || preferencesDraft.numberOfPeople || 1,
      cookingSkillLevel: preferences?.cookingSkillLevel || preferencesDraft.cookingSkillLevel || "Intermediate",
      availableCookingTime: preferences?.availableCookingTime || preferencesDraft.availableCookingTime || 30,
    },
  });

  // Save drafts to Zustand store on change
  useEffect(() => {
    const subscription = watch((value) => {
      updatePreferencesDraft(value as Partial<UserPreferencesInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch, updatePreferencesDraft]);

  const selectedDiets = watch("dietaryRestrictions") || [];
  const selectedCuisines = watch("cuisinePreference") || [];

  const handleDietToggle = (diet: string) => {
    const current = [...selectedDiets];
    const index = current.indexOf(diet);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(diet);
    }
    setValue("dietaryRestrictions", current, { shouldValidate: true });
  };

  const handleCuisineToggle = (cuisine: string) => {
    const current = [...selectedCuisines];
    const index = current.indexOf(cuisine);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(cuisine);
    }
    setValue("cuisinePreference", current, { shouldValidate: true });
  };

  // Convert raw text allergies into array
  const handleAllergiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arrayVal = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
    setValue("allergies", arrayVal, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wake up & Sleep Times */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Sleep Schedule
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Wake-up Time</label>
              <input
                type="time"
                {...register("wakeUpTime")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              {errors.wakeUpTime && <p className="text-red-400 text-xs mt-1">{errors.wakeUpTime.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sleep Time</label>
              <input
                type="time"
                {...register("sleepTime")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              {errors.sleepTime && <p className="text-red-400 text-xs mt-1">{errors.sleepTime.message}</p>}
            </div>
          </div>
        </div>

        {/* Meal Config */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Portion & Frequency
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Weekly Budget ($)</label>
              <input
                type="number"
                {...register("budget", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Meal Count / Day</label>
              <input
                type="number"
                {...register("mealFrequency", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              {errors.mealFrequency && <p className="text-red-400 text-xs mt-1">{errors.mealFrequency.message}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferences / Skills */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            Fitness & Skill
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fitness Goal</label>
              <select
                {...register("fitnessGoal")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Athletic Performance">Athletic Performance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cooking Skill</label>
              <select
                {...register("cookingSkillLevel")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">No. of People</label>
              <input
                type="number"
                {...register("numberOfPeople", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              {errors.numberOfPeople && <p className="text-red-400 text-xs mt-1">{errors.numberOfPeople.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Prep Time (mins)</label>
              <input
                type="number"
                {...register("availableCookingTime", { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
              {errors.availableCookingTime && (
                <p className="text-red-400 text-xs mt-1">{errors.availableCookingTime.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule description */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Daily Routine
          </h3>
          <label className="block text-xs text-slate-400 mb-1">Describe your typical day / activity level</label>
          <textarea
            rows={4}
            {...register("dailySchedule")}
            placeholder="e.g. Work at a desk 9am-5pm, run 3 miles in the morning, go to bed early"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
          />
          {errors.dailySchedule && <p className="text-red-400 text-xs mt-1">{errors.dailySchedule.message}</p>}
        </div>
      </div>

      {/* Diet & Cuisine selectors */}
      <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Dietary Restrictions</label>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((diet) => {
              const active = selectedDiets.includes(diet);
              return (
                <button
                  key={diet}
                  type="button"
                  onClick={() => handleDietToggle(diet)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {diet}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Cuisine Preferences</label>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((cuisine) => {
              const active = selectedCuisines.includes(cuisine);
              return (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => handleCuisineToggle(cuisine)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {cuisine}
                </button>
              );
            })}
          </div>
          {errors.cuisinePreference && (
            <p className="text-red-400 text-xs mt-1">{errors.cuisinePreference.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Allergies (comma-separated)</label>
          <input
            type="text"
            defaultValue={preferences?.allergies.join(", ") || preferencesDraft.allergies?.join(", ") || ""}
            onChange={handleAllergiesChange}
            placeholder="e.g. Peanuts, Dairy, Shellfish, Gluten"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        {isLoading ? "Generating Custom Meal Plan..." : "Generate AI Meal Plan & List"}
      </button>
    </form>
  );
}

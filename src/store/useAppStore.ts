import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserPreferencesInput } from "@/schemas/preferences";
import { WeeklyMealPlan, GroceryItem } from "@/types/meal";

interface AppState {
  preferences: UserPreferencesInput | null;
  setPreferences: (prefs: UserPreferencesInput | null) => void;

  preferencesDraft: Partial<UserPreferencesInput>;
  updatePreferencesDraft: (draft: Partial<UserPreferencesInput>) => void;
  clearPreferencesDraft: () => void;

  activeMealPlan: WeeklyMealPlan | null;
  setActiveMealPlan: (plan: WeeklyMealPlan | null) => void;

  activeGroceryList: GroceryItem[] | null;
  setActiveGroceryList: (list: GroceryItem[] | null) => void;
  toggleGroceryItem: (itemId: string) => void;

  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      preferences: null,
      setPreferences: (prefs) => set({ preferences: prefs }),

      preferencesDraft: {},
      updatePreferencesDraft: (draft) =>
        set((state) => ({
          preferencesDraft: { ...state.preferencesDraft, ...draft },
        })),
      clearPreferencesDraft: () => set({ preferencesDraft: {} }),

      activeMealPlan: null,
      setActiveMealPlan: (plan) => set({ activeMealPlan: plan }),

      activeGroceryList: null,
      setActiveGroceryList: (list) => set({ activeGroceryList: list }),
      toggleGroceryItem: (itemId) =>
        set((state) => ({
          activeGroceryList: state.activeGroceryList
            ? state.activeGroceryList.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              )
            : null,
        })),

      isGenerating: false,
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: "cooking-todo-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        preferencesDraft: state.preferencesDraft,
        activeMealPlan: state.activeMealPlan,
        activeGroceryList: state.activeGroceryList,
      }),
    }
  )
);

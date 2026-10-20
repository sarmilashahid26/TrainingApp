import React, { createContext, useContext, useState, useMemo } from 'react';
import { FoodItem, INITIAL_TODAY_LOGS, LoggedFoodItem, PLACEHOLDER_FOODS } from '../data/placeholderFoods';
import { RecipeResult } from '../utils/yieldEngine';
import { trendWeights } from '../engine/weightTrend';
import { estimateTdee, TdeeResult } from '../engine/tdee';
import { weeklyTarget, calculateMacros } from '../engine/target';

export interface SavedRecipeItem {
  name: string;
  cookedWeightGrams: number;
  result: RecipeResult;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number | null;
}

export interface UserCalibrations {
  katoriGrams: number; // default 150g
  rotiGrams: number; // default 30g
}

export interface UserTargets {
  currentWeightKg: number;
  targetWeightKg: number;
  weeklyRateKg: number; // e.g. -0.4 kg/week (cut)
  proteinPerKg: number; // e.g. 2.0 g/kg
  formulaPriorTdee: number; // demographic prior (Mifflin-St Jeor), e.g. 2400
  trainingDay: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  restDay: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface NutritionContextType {
  logs: LoggedFoodItem[];
  foods: FoodItem[];
  targets: UserTargets;
  activeDayType: 'training' | 'rest';
  setActiveDayType: (type: 'training' | 'rest') => void;
  addLog: (log: Omit<LoggedFoodItem, 'id'>) => void;
  removeLog: (id: string) => void;
  clearLogs: () => void;
  copyYesterday: () => void;
  savedRecipes: SavedRecipeItem[];
  saveRecipe: (name: string, cookedWeightGrams: number, result: RecipeResult) => void;
  activeTarget: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  totals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    remainingKcal: number;
    proteinPercent: number;
  };
  streakDays: number;
  // Adaptive Coaching & Weight Trend
  weightLogs: WeightEntry[];
  calculatedTrends: number[];
  currentScaleWeight: number;
  currentTrendWeight: number;
  adaptiveTdee: TdeeResult;
  addWeightLog: (weightKg: number | null, dateStr?: string) => void;
  applyWeeklyCheckIn: (rateKgPerWeek: number) => void;
  // Household Calibrations
  userCalibrations: UserCalibrations;
  updateCalibrations: (newCal: Partial<UserCalibrations>) => void;
}

// 28 days of realistic synthetic baseline data for an Indian lifter on a cutting phase
const SEED_WEIGHT_LOGS: WeightEntry[] = [
  { date: 'Day -27', weightKg: 75.8 },
  { date: 'Day -26', weightKg: 75.6 },
  { date: 'Day -25', weightKg: null }, // missed weigh-in
  { date: 'Day -24', weightKg: 75.9 }, // water spike
  { date: 'Day -23', weightKg: 75.4 },
  { date: 'Day -22', weightKg: 75.3 },
  { date: 'Day -21', weightKg: 75.2 },
  { date: 'Day -20', weightKg: 75.4 },
  { date: 'Day -19', weightKg: 75.1 },
  { date: 'Day -18', weightKg: null },
  { date: 'Day -17', weightKg: 74.9 },
  { date: 'Day -16', weightKg: 74.8 },
  { date: 'Day -15', weightKg: 75.0 },
  { date: 'Day -14', weightKg: 74.7 },
  { date: 'Day -13', weightKg: 74.6 },
  { date: 'Day -12', weightKg: 74.5 },
  { date: 'Day -11', weightKg: 74.7 },
  { date: 'Day -10', weightKg: 74.4 },
  { date: 'Day -9', weightKg: null },
  { date: 'Day -8', weightKg: 74.3 },
  { date: 'Day -7', weightKg: 74.2 },
  { date: 'Day -6', weightKg: 74.4 },
  { date: 'Day -5', weightKg: 74.1 },
  { date: 'Day -4', weightKg: 74.0 },
  { date: 'Day -3', weightKg: 74.2 },
  { date: 'Day -2', weightKg: 73.9 },
  { date: 'Day -1', weightKg: 73.8 },
  { date: 'Today', weightKg: 73.9 },
];

// Matched historical intake (averaging ~2150 kcal/day)
const SEED_DAILY_INTAKES: (number | null)[] = [
  2200, 2180, 2150, 2220, 2100, 2160, 2140,
  2190, 2120, null, 2150, 2180, 2200, 2110,
  2170, 2130, 2210, 2150, null, 2180, 2140,
  2160, 2190, 2110, 2150, 2130, 2180, 2150,
];

const DEFAULT_TARGETS: UserTargets = {
  currentWeightKg: 74.0,
  targetWeightKg: 71.5,
  weeklyRateKg: -0.4, // standard lifter cut
  proteinPerKg: 2.0,
  formulaPriorTdee: 2450,
  trainingDay: {
    kcal: 2150,
    protein: 148,
    carbs: 235,
    fat: 55,
    fiber: 35,
  },
  restDay: {
    kcal: 1850,
    protein: 148,
    carbs: 165,
    fat: 55,
    fiber: 35,
  },
};

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LoggedFoodItem[]>(INITIAL_TODAY_LOGS);
  const [foods, setFoods] = useState<FoodItem[]>(PLACEHOLDER_FOODS);
  const [targets, setTargets] = useState<UserTargets>(DEFAULT_TARGETS);
  const [activeDayType, setActiveDayType] = useState<'training' | 'rest'>('training');
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeItem[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>(SEED_WEIGHT_LOGS);
  const [userCalibrations, setUserCalibrations] = useState<UserCalibrations>({
    katoriGrams: 150,
    rotiGrams: 30,
  });

  const streakDays = 14;
  const activeTarget = activeDayType === 'training' ? targets.trainingDay : targets.restDay;

  // Run two-state Kalman weight trend filter across scale log history
  const calculatedTrends = useMemo(() => {
    const rawWeights = weightLogs.map((entry) => entry.weightKg);
    return trendWeights(rawWeights);
  }, [weightLogs]);

  const currentScaleWeight = useMemo(() => {
    for (let i = weightLogs.length - 1; i >= 0; i--) {
      if (weightLogs[i].weightKg != null) return weightLogs[i].weightKg as number;
    }
    return targets.currentWeightKg;
  }, [weightLogs, targets.currentWeightKg]);

  const currentTrendWeight = useMemo(() => {
    for (let i = calculatedTrends.length - 1; i >= 0; i--) {
      if (!Number.isNaN(calculatedTrends[i])) return calculatedTrends[i];
    }
    return currentScaleWeight;
  }, [calculatedTrends, currentScaleWeight]);

  // Compute adaptive TDEE from energy balance
  const adaptiveTdee = useMemo(() => {
    return estimateTdee({
      intake: SEED_DAILY_INTAKES,
      trend: calculatedTrends,
      prior: targets.formulaPriorTdee,
      windowDays: 28,
    });
  }, [calculatedTrends, targets.formulaPriorTdee]);

  const totals = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;

    for (const item of logs) {
      kcal += item.kcal;
      protein += item.protein;
      carbs += item.carbs;
      fat += item.fat;
      fiber += item.fiber;
    }

    const round1 = (v: number) => Math.round(v * 10) / 10;
    const remainingKcal = Math.max(0, activeTarget.kcal - Math.round(kcal));
    const proteinPercent = Math.min(100, Math.round((protein / activeTarget.protein) * 100));

    return {
      kcal: Math.round(kcal),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
      fiber: round1(fiber),
      remainingKcal,
      proteinPercent,
    };
  }, [logs, activeTarget]);

  const addLog = (newLog: Omit<LoggedFoodItem, 'id'>) => {
    const item: LoggedFoodItem = {
      ...newLog,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setLogs((prev) => [item, ...prev]);
  };

  const removeLog = (id: string) => {
    setLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyYesterday = () => {
    setLogs(INITIAL_TODAY_LOGS);
  };

  const saveRecipe = (name: string, cookedWeightGrams: number, result: RecipeResult) => {
    setSavedRecipes((prev) => [{ name, cookedWeightGrams, result }, ...prev]);
    const gramsPerServing = result.gramsPerServing ?? Math.round(cookedWeightGrams / 2);
    const newFood: FoodItem = {
      id: `custom-${Date.now()}`,
      name: `${name} (Yield Cooked)`,
      category: 'Dal & Curries',
      regionalNames: {},
      synonyms: [name.toLowerCase(), `${name.toLowerCase()} cooked`],
      source: 'own_measurement',
      method: 'weighed',
      confidence: 1.0,
      supportsOilSlider: true,
      supportsKatori: true,
      isCookedRecipe: true,
      densityKcalPerGram: Math.round(result.perGramCooked.kcal * 100) / 100,
      per100g: {
        kcal: Math.round(result.per100gCooked.kcal),
        protein: Math.round(result.per100gCooked.protein * 10) / 10,
        carbs: Math.round(result.per100gCooked.carbs * 10) / 10,
        fat: Math.round(result.per100gCooked.fat * 10) / 10,
        fiber: Math.round(result.per100gCooked.fibre * 10) / 10,
      },
      defaultPortionIndex: 0,
      portions: [
        { name: 'serving', label: `1 Serving (${Math.round(gramsPerServing)}g)`, grams: Math.round(gramsPerServing) },
        { name: 'katori', label: '1 Katori (150g)', grams: 150 },
        { name: 'custom', label: '100g Cooked', grams: 100 },
      ],
      verifiedNote: `Calculated with MAXIII Yield Engine (${cookedWeightGrams}g finished weight)`,
    };
    setFoods((prev) => [newFood, ...prev]);
  };

  const addWeightLog = (weightKg: number | null, dateStr?: string) => {
    const todayLabel = dateStr || 'Today';
    setWeightLogs((prev) => {
      const idx = prev.findIndex((entry) => entry.date === todayLabel);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { date: todayLabel, weightKg };
        return copy;
      }
      return [...prev, { date: todayLabel, weightKg }];
    });
  };

  const applyWeeklyCheckIn = (rateKgPerWeek: number) => {
    const newKcal = weeklyTarget({
      tdee: adaptiveTdee.tdee,
      rateKgPerWeek,
      previousTarget: targets.trainingDay.kcal,
      floorKcal: 1600, // Safe calorie floor for lifters
    });

    const trainingMacros = calculateMacros({
      totalKcal: newKcal,
      weightKg: currentTrendWeight,
      proteinPerKg: targets.proteinPerKg,
      isTrainingDay: true,
    });

    const restMacros = calculateMacros({
      totalKcal: Math.max(1600, newKcal - 250), // 250 kcal rest day reduction
      weightKg: currentTrendWeight,
      proteinPerKg: targets.proteinPerKg,
      isTrainingDay: false,
    });

    setTargets((prev) => ({
      ...prev,
      weeklyRateKg: rateKgPerWeek,
      currentWeightKg: currentTrendWeight,
      trainingDay: trainingMacros,
      restDay: restMacros,
    }));
  };

  const updateCalibrations = (newCal: Partial<UserCalibrations>) => {
    setUserCalibrations((prev) => ({ ...prev, ...newCal }));
  };

  return (
    <NutritionContext.Provider
      value={{
        logs,
        foods,
        targets,
        activeDayType,
        setActiveDayType,
        addLog,
        removeLog,
        clearLogs,
        copyYesterday,
        savedRecipes,
        saveRecipe,
        activeTarget,
        totals,
        streakDays,
        weightLogs,
        calculatedTrends,
        currentScaleWeight,
        currentTrendWeight,
        adaptiveTdee,
        addWeightLog,
        applyWeeklyCheckIn,
        userCalibrations,
        updateCalibrations,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};

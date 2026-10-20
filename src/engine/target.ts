/**
 * MAXIII Weekly Target and Macro Engine
 * Computes weekly auto-adjusted calorie targets from adaptive TDEE and rate of change,
 * clamping step changes (<= 150 kcal/step) to prevent jarring oscillations,
 * and enforcing strict health floors (1,600 kcal male / 1,200 kcal female).
 */

export interface WeeklyTargetOptions {
  tdee: number;
  rateKgPerWeek: number; // negative = lose (e.g. -0.4), 0 = maintain, positive = gain (+0.25)
  previousTarget?: number;
  floorKcal: number; // 1600 male, 1200 female
  kcalPerKg?: number; // default 7700 kcal/kg
  maxStepKcal?: number; // default 150 kcal max shift per week
}

export function weeklyTarget(opts: WeeklyTargetOptions): number {
  const { tdee, rateKgPerWeek, previousTarget, floorKcal } = opts;
  const kcalPerKg = opts.kcalPerKg ?? 7700;
  const maxStep = opts.maxStepKcal ?? 150;

  let target = tdee + (rateKgPerWeek * kcalPerKg) / 7;
  if (previousTarget != null && Number.isFinite(previousTarget)) {
    target = previousTarget + Math.max(-maxStep, Math.min(maxStep, target - previousTarget));
  }
  return Math.max(floorKcal, Math.round(target));
}

export interface MacroDistributionOptions {
  totalKcal: number;
  weightKg: number;
  proteinPerKg?: number; // default 2.0g/kg for lifters
  minFatRatio?: number; // default 0.25 of total calories for hormonal health
  isTrainingDay?: boolean;
}

export interface CalculatedMacros {
  kcal: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
}

/**
 * Calculates evidence-based macro split for lifters:
 * 1. Protein prioritized: 1.6 - 2.2 g per kg bodyweight
 * 2. Fat floor: 20-30% of total calories
 * 3. Carbs from the remainder
 * 4. Fiber: ~14g per 1000 kcal
 */
export function calculateMacros(opts: MacroDistributionOptions): CalculatedMacros {
  const {
    totalKcal,
    weightKg,
    proteinPerKg = 2.0,
    minFatRatio = 0.25,
    isTrainingDay = true,
  } = opts;

  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinKcal = proteinGrams * 4;

  // On training days, slight shift towards carbs for performance
  const effectiveFatRatio = isTrainingDay ? minFatRatio : Math.min(0.35, minFatRatio + 0.05);
  const targetFatKcal = Math.max(totalKcal * effectiveFatRatio, 40 * 9); // at least 40g fat
  const fatGrams = Math.round(targetFatKcal / 9);
  const fatKcal = fatGrams * 9;

  const remainingKcal = Math.max(0, totalKcal - (proteinKcal + fatKcal));
  const carbGrams = Math.round(remainingKcal / 4);

  // Fiber recommendation: ~14g per 1000 kcal
  const fiberGrams = Math.max(25, Math.round((totalKcal / 1000) * 14));

  return {
    kcal: totalKcal,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
    fiber: fiberGrams,
  };
}

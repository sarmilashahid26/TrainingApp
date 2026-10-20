/**
 * MAXIII Adaptive TDEE (Total Daily Energy Expenditure) Estimator
 * Deterministic calculation based on energy conservation:
 * TDEE = average intake - (kcalPerKg * daily trend weight slope)
 *
 * Blends observed energy expenditure with formula prior depending on
 * the volume and completeness of logging data.
 */

export interface TdeeInput {
  intake: (number | null)[]; // kcal per day; null = day NOT fully logged
  trend: number[];           // trend weight per day (same length as intake)
  prior: number;             // formula TDEE, e.g. Mifflin-St Jeor x activity factor
  kcalPerKg?: number;        // default 7700 kcal/kg, keep tunable
  windowDays?: number;       // default 28 days
}

export interface TdeeResult {
  tdee: number;
  confidence: number; // 0 to 1 (show this to the user)
  daysLogged: number;
  totalWindowDays: number;
  completeness: number;
  observedBurn?: number;
}

export function estimateTdee({
  intake,
  trend,
  prior,
  kcalPerKg = 7700,
  windowDays = 28,
}: TdeeInput): TdeeResult {
  const n = Math.min(windowDays, trend.length, intake.length);
  if (n <= 1) {
    return {
      tdee: Math.round(prior),
      confidence: 0,
      daysLogged: 0,
      totalWindowDays: n,
      completeness: 0,
    };
  }

  const start = trend.length - n;

  let sum = 0;
  let count = 0;
  for (let i = start; i < intake.length; i++) {
    const kcal = intake[i];
    if (kcal != null && kcal > 0) {
      sum += kcal;
      count++;
    }
  }

  const completeness = count / n;
  if (count < 7 || completeness < 0.6) {
    const partialConf = Math.min(0.4, (count / 21) * (completeness / 0.9));
    return {
      tdee: Math.round(prior),
      confidence: Math.round(partialConf * 100) / 100,
      daysLogged: count,
      totalWindowDays: n,
      completeness: Math.round(completeness * 100) / 100,
    };
  }

  const slopePerDay = (trend[trend.length - 1] - trend[start]) / (n - 1);
  const observed = sum / count - kcalPerKg * slopePerDay;

  const confidence = Math.min(1, count / 21) * Math.min(1, completeness / 0.9);
  const bounded = Math.min(prior * 1.6, Math.max(prior * 0.6, observed));
  const tdee = confidence * bounded + (1 - confidence) * prior;

  return {
    tdee: Math.round(tdee),
    confidence: Math.round(confidence * 100) / 100,
    daysLogged: count,
    totalWindowDays: n,
    completeness: Math.round(completeness * 100) / 100,
    observedBurn: Math.round(observed),
  };
}

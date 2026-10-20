import { trendWeights } from './weightTrend';
import { estimateTdee } from './tdee';
import { weeklyTarget, calculateMacros } from './target';

describe('Weight Trend Kalman Filter', () => {
  it('returns NaNs if no weights are recorded', () => {
    const res = trendWeights([null, null, null]);
    expect(res).toEqual([NaN, NaN, NaN]);
  });

  it('smooths high-frequency daily water fluctuations', () => {
    // True trend is flat 75.0 kg, but scale bounces between 74.2 and 75.8
    const scale = [75.0, 75.8, 74.3, 75.6, 74.5, 75.4, 74.7, 75.2, 74.9, 75.1];
    const trend = trendWeights(scale);

    expect(trend).toHaveLength(scale.length);
    // Every smoothed weight should stay much closer to 75.0 than raw extremes (74.3, 75.8)
    for (const w of trend) {
      expect(w).toBeGreaterThan(74.5);
      expect(w).toBeLessThan(75.5);
    }
  });

  it('handles missed weigh-in days gracefully', () => {
    const scale = [76.0, null, 75.8, null, null, 75.5, 75.4];
    const trend = trendWeights(scale);

    expect(trend).toHaveLength(7);
    expect(trend.every((w) => !Number.isNaN(w))).toBe(true);
    // Downward trend is preserved through null gaps
    expect(trend[6]).toBeLessThan(trend[0]);
  });
});

describe('Adaptive TDEE Estimator', () => {
  const priorTdee = 2400;

  it('relies on formula prior when logging is incomplete (<7 days)', () => {
    const intake = [2200, 2150, 2300, 2250, null, null];
    const trend = [75.0, 74.9, 74.9, 74.8, 74.8, 74.7];

    const result = estimateTdee({ intake, trend, prior: priorTdee });
    expect(result.tdee).toBe(priorTdee);
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.daysLogged).toBe(4);
  });

  it('calculates expenditure from energy balance when data is sufficient', () => {
    // 28 days of eating 2200 kcal/day while losing 0.05 kg/day (trend slope)
    // Observed burn = 2200 - (7700 * -0.05) = 2200 + 385 = 2585 kcal
    const intake = Array(28).fill(2200);
    const trend = Array.from({ length: 28 }, (_, i) => 75.0 - i * 0.05);

    const result = estimateTdee({ intake, trend, prior: priorTdee, windowDays: 28 });
    expect(result.confidence).toBeGreaterThan(0.9);
    // Should be close to 2585 kcal
    expect(result.tdee).toBeGreaterThan(2550);
    expect(result.tdee).toBeLessThan(2620);
  });

  it('bounds extreme outliers', () => {
    // Extreme uncalibrated deficit
    const intake = Array(28).fill(800);
    const trend = Array.from({ length: 28 }, (_, i) => 75.0 - i * 0.5); // impossible slope

    const result = estimateTdee({ intake, trend, prior: priorTdee });
    // Should be bounded by prior * 1.6
    expect(result.tdee).toBeLessThanOrEqual(priorTdee * 1.6);
  });
});

describe('Weekly Target & Macros', () => {
  it('calculates deficit for targeted weight loss', () => {
    const target = weeklyTarget({
      tdee: 2500,
      rateKgPerWeek: -0.4, // lose ~400g per week: -(0.4 * 7700)/7 = -440 kcal
      floorKcal: 1600,
    });
    expect(target).toBe(2060); // 2500 - 440
  });

  it('clamps weekly target jumps to maxStepKcal (e.g. 150 kcal)', () => {
    const target = weeklyTarget({
      tdee: 3000,
      rateKgPerWeek: 0,
      previousTarget: 2200,
      floorKcal: 1600,
      maxStepKcal: 150,
    });
    // Jump from 2200 towards 3000 clamped to 2200 + 150 = 2350
    expect(target).toBe(2350);
  });

  it('respects safety floor and never drops below minimum', () => {
    const target = weeklyTarget({
      tdee: 1800,
      rateKgPerWeek: -1.0, // aggressive deficit = -1100 kcal
      floorKcal: 1600,
    });
    expect(target).toBe(1600);
  });

  it('splits macros prioritizing protein and fat floors for lifters', () => {
    const macros = calculateMacros({
      totalKcal: 2200,
      weightKg: 75,
      proteinPerKg: 2.0,
      isTrainingDay: true,
    });

    expect(macros.protein).toBe(150); // 75 kg * 2.0 = 150g
    expect(macros.fat).toBeGreaterThanOrEqual(40);
    expect(macros.carbs).toBeGreaterThan(150);
    expect(macros.fiber).toBeGreaterThanOrEqual(25);
  });
});

describe('Adaptive Engine Synthetic Lifter Simulation (200 Users)', () => {
  // Simple deterministic PRNG (Linear Congruential Generator) so tests are 100% reproducible
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const gaussianRandom = () => {
    const u1 = Math.max(1e-6, pseudoRandom());
    const u2 = pseudoRandom();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };

  it('achieves median error < 200 kcal over 28-42 days on 200 simulated users', () => {
    const userCount = 200;
    const days = 35;
    const trueBurn = 2600;
    const formulaPrior = 2300; // prior is off by 300 kcal

    const errors: number[] = [];

    for (let u = 0; u < userCount; u++) {
      // True daily intake: around 2200 kcal with 5% food reporting variance
      const intake: (number | null)[] = [];
      const scaleWeights: (number | null)[] = [];
      let currentTrueWeight = 78.0;

      for (let d = 0; d < days; d++) {
        // Daily true intake
        const dailyIntake = 2200 + gaussianRandom() * 110; // 5% noise
        // Energy balance: weight change per day = (intake - burn) / 7700
        const deltaWeight = (dailyIntake - trueBurn) / 7700;
        currentTrueWeight += deltaWeight;

        // Logging habits: 10% missed logging days
        if (pseudoRandom() < 0.1) {
          intake.push(null);
        } else {
          // 3% under-reporting
          intake.push(Math.round(dailyIntake * 0.97));
        }

        // Weigh-in habits: 20% missed weigh-ins, plus daily water fluctuation (std dev = 0.6 kg)
        if (pseudoRandom() < 0.2) {
          scaleWeights.push(null);
        } else {
          scaleWeights.push(currentTrueWeight + gaussianRandom() * 0.6);
        }
      }

      // Filter trend weights with Kalman
      const trend = trendWeights(scaleWeights);

      // Estimate TDEE
      const estimate = estimateTdee({
        intake,
        trend,
        prior: formulaPrior,
        windowDays: 28,
      });

      errors.push(Math.abs(estimate.tdee - trueBurn));
    }

    errors.sort((a, b) => a - b);
    const medianError = errors[Math.floor(userCount / 2)];
    const p90Error = errors[Math.floor(userCount * 0.9)];

    // Formula prior error was 300 kcal.
    // The adaptive engine should beat the formula prior and achieve median error under 200 kcal.
    expect(medianError).toBeLessThan(200);
    expect(p90Error).toBeLessThan(450);
  });
});

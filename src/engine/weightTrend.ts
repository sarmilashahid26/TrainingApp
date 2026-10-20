/**
 * MAXIII Weight Trend Filter
 * Two-state Kalman filter tracking true trend weight and velocity (slope).
 * Ignores daily water/glycogen scale noise while seamlessly coping with missed weigh-ins.
 */

export interface TrendOptions {
  qw?: number; // process noise: trend weight (kg^2/day)
  qv?: number; // process noise: slope ((kg/day)^2)
  r?: number;  // measurement noise: daily scale noise (kg^2)
}

/** daily[i] = scale weight in kg for day i, or null if not weighed. */
export function trendWeights(
  daily: (number | null)[],
  { qw = 0.002, qv = 1e-5, r = 0.5 }: TrendOptions = {},
): number[] {
  const first = daily.findIndex((x) => x != null);
  if (first < 0) return daily.map(() => NaN);

  let w = daily[first] as number;
  let v = 0;
  let p00 = r, p01 = 0, p10 = 0, p11 = 1e-3;
  const out: number[] = [];

  for (let i = 0; i < daily.length; i++) {
    if (i > first) {
      // predict
      w = w + v;
      const a = p00 + p01 + p10 + p11 + qw;
      const b = p01 + p11;
      const c = p10 + p11;
      const d = p11 + qv;
      p00 = a; p01 = b; p10 = c; p11 = d;
    }
    const z = daily[i];
    if (i >= first && z != null) {
      // update
      const y = z - w;
      const s = p00 + r;
      const k0 = p00 / s;
      const k1 = p10 / s;
      w += k0 * y;
      v += k1 * y;
      const n00 = (1 - k0) * p00;
      const n01 = (1 - k0) * p01;
      const n10 = p10 - k1 * p00;
      const n11 = p11 - k1 * p01;
      p00 = n00; p01 = n01; p10 = n10; p11 = n11;
    }
    out.push(Math.round(w * 100) / 100);
  }
  return out;
}

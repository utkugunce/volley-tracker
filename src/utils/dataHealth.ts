export type DataHealthState = "ok" | "upstream_partial" | "stale" | "missing";

export function evaluateDataHealth(
  files: { file: string; exists: boolean; updatedAt: string | null }[],
  expected: string[],
  now = Date.now(),
  maxAgeHours = 24
) {
  const missing = expected.filter(name => !files.some(f => f.file === name && f.exists));
  const stale = files.filter(f => {
    const timestamp = f.updatedAt ? Date.parse(f.updatedAt) : NaN;
    return !Number.isFinite(timestamp) || now - timestamp > maxAgeHours * 3_600_000 || timestamp > now + 300_000;
  }).map(f => f.file);
  const healthy = missing.length === 0 && stale.length === 0 && expected.length > 0;
  const freshCount = expected.filter(name => {
    const found = files.find(f => f.file === name && f.exists);
    return Boolean(found && !stale.includes(name));
  }).length;
  const indexFresh = !stale.includes("data/cities.json") && !stale.includes("data/fixtures.json");
  let healthState: DataHealthState = "ok";
  if (!healthy) {
    if (missing.length > 0 || expected.length === 0) {
      healthState = "missing";
    } else if (indexFresh && freshCount > 0) {
      healthState = "upstream_partial";
    } else {
      healthState = "stale";
    }
  }
  return { healthy, healthState, freshCount, missing, stale, maxAgeHours };
}

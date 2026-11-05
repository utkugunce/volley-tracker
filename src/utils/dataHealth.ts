export function evaluateDataHealth(files: { file: string; exists: boolean; updatedAt: string | null }[], expected: string[], now = Date.now(), maxAgeHours = 24) {
  const missing = expected.filter(name => !files.some(f => f.file === name && f.exists));
  const stale = files.filter(f => {
    const timestamp = f.updatedAt ? Date.parse(f.updatedAt) : NaN;
    return !Number.isFinite(timestamp) || now - timestamp > maxAgeHours * 3_600_000 || timestamp > now + 300_000;
  }).map(f => f.file);
  return { healthy: missing.length === 0 && stale.length === 0 && expected.length > 0, missing, stale, maxAgeHours };
}

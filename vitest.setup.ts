import '@testing-library/jest-dom/vitest';
import { afterAll, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

// Testler gerçek data/ dosyalarına (manual-overrides.json, push-subscriptions.json) yazmasın:
// her test dosyası için geçici bir dizine yönlendir.
const tmpDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'volley-tracker-test-'));
process.env.MANUAL_OVERRIDES_FILE = path.join(tmpDataDir, 'manual-overrides.json');
process.env.PUSH_SUBSCRIPTIONS_FILE = path.join(tmpDataDir, 'push-subscriptions.json');

afterAll(() => {
  fs.rmSync(tmpDataDir, { recursive: true, force: true });
});

/** Stable source snapshots: domain tests must not depend on the hourly data import. */
import { vi } from "vitest";
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const path = await import("path");
  const root = path.join(process.cwd(), "data");
  const fixtures = path.join(process.cwd(), "tests", "fixtures");
  function redirect(file: unknown) {
    if (typeof file !== "string") return file;
    if (file === path.join(root, "cities") || file.startsWith(path.join(root, "cities") + path.sep)) return file.replace(root, fixtures);
    if (file === path.join(root, "fixtures.json")) return path.join(fixtures, "cities", "istanbul.json");
    return file;
  }
  return { ...actual, default: { ...actual,
    readFileSync: (...args: unknown[]) => Reflect.apply(actual.readFileSync, actual, [redirect(args[0]), ...args.slice(1)]),
    readdirSync: (...args: unknown[]) => Reflect.apply(actual.readdirSync, actual, [redirect(args[0]), ...args.slice(1)]),
    existsSync: (file: string) => actual.existsSync(redirect(file) as string),
  } };
});

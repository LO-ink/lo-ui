import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = resolve(process.cwd());
const packages = ["design-tokens", "ui"].map((name) =>
  resolve(root, "packages", name),
);
if (!packages.includes(directory))
  throw new Error("Build must run from a supported UI package directory");

// Composite compilation must forget its cache when generated output is removed.
rmSync(join(directory, "dist"), { recursive: true, force: true });
rmSync(join(directory, "tsconfig.tsbuildinfo"), { force: true });
execFileSync(
  process.execPath,
  [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
  { cwd: directory, stdio: "inherit" },
);
execFileSync(process.execPath, ["scripts/copy-assets.mjs"], {
  cwd: directory,
  stdio: "inherit",
});

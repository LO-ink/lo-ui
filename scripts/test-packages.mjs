import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const temp = await mkdtemp(join(tmpdir(), "lo-ui-packages-"));
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
try {
  const source = join(temp, "source");
  const consumer = join(temp, "consumer");
  await mkdir(source);
  await mkdir(consumer);
  for (const file of [
    "packages",
    "LICENSE",
    "package.json",
    "package-lock.json",
  ]) {
    await cp(join(root, file), join(source, file), {
      recursive: true,
      filter: (path) =>
        !path
          .split("/")
          .some(
            (part) =>
              part === "dist" ||
              part === "node_modules" ||
              part.endsWith(".tsbuildinfo"),
          ),
    });
  }
  await symlink(
    join(root, "node_modules"),
    join(source, "node_modules"),
    "dir",
  );
  const archives = [];
  for (const name of ["design-tokens", "ui"]) {
    const directory = join(source, "packages", name);
    const packed = JSON.parse(
      run("npm", ["pack", "--json", "--cache", join(temp, "cache")], directory),
    )[0];
    for (const path of [
      "dist/index.js",
      "dist/index.d.ts",
      "dist/LICENSE",
      name === "ui" ? "dist/styles.css" : "dist/tokens.css",
    ]) {
      assert.ok(
        packed.files.some((file) => file.path === path),
        `Missing ${name}/${path}`,
      );
    }
    archives.push(join(directory, packed.filename));
  }
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--legacy-peer-deps",
      "--no-audit",
      "--no-fund",
      "--cache",
      join(temp, "cache"),
      ...archives,
    ],
    consumer,
  );
  // Supply the consumer's React peers separately from the packed LO libraries.
  for (const name of ["react", "react-dom", "@types"]) {
    await symlink(
      join(root, "node_modules", name),
      join(consumer, "node_modules", name),
      "dir",
    );
  }
  await writeFile(
    join(consumer, "check.mjs"),
    `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Cell, List } from '@lo/ui';
const html = renderToStaticMarkup(createElement(List, null, createElement(Cell, {title:'Saved app', trailingAction:createElement(Button,null,'Open')})));
if (!html.includes('Saved app') || !html.includes('Open')) throw new Error('Render failed');
`,
  );
  run(process.execPath, ["check.mjs"], consumer);
  await writeFile(
    join(consumer, "check.tsx"),
    `import {Button, Cell, List, Switch} from '@lo/ui';
const ui = <List><Cell title="Preferences" trailingAction={<Switch label="Updates" />} /><Cell title="App" onPress={() => {}} trailingAction={<Button>Open</Button>} /></List>;
void ui;
`,
  );
  for (const resolution of ["NodeNext", "Bundler"]) {
    run(
      process.execPath,
      [
        join(root, "node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--strict",
        "--target",
        "ES2022",
        "--jsx",
        "react-jsx",
        "--module",
        resolution === "NodeNext" ? "NodeNext" : "ESNext",
        "--moduleResolution",
        resolution,
        "check.tsx",
      ],
      consumer,
    );
  }
  await writeFile(
    join(consumer, "index.html"),
    '<main class="lo-ui-root">CSS package smoke</main><script type="module" src="/styles-smoke.js"></script>',
  );
  await writeFile(
    join(consumer, "styles-smoke.js"),
    'import "@lo/ui/styles.css";\n',
  );
  run(
    process.execPath,
    [join(root, "node_modules/vite/bin/vite.js"), "build"],
    consumer,
  );
  const assets = await readdir(join(consumer, "dist", "assets"));
  const cssAsset = assets.find((file) => file.endsWith(".css"));
  assert.ok(cssAsset, "Vite did not emit the packed stylesheet");
  assert.match(
    await readFile(join(consumer, "dist", "assets", cssAsset), "utf8"),
    /--lo-color-canvas/,
  );

  const react18Consumer = join(temp, "consumer-react18");
  await mkdir(react18Consumer);
  await writeFile(
    join(react18Consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--legacy-peer-deps",
      "--no-audit",
      "--no-fund",
      "--cache",
      join(temp, "cache"),
      ...archives,
    ],
    react18Consumer,
  );
  const react18Modules = join(react18Consumer, "node_modules");
  const react18FixtureModules = join(
    root,
    "apps",
    "react18-compat",
    "node_modules",
  );
  await mkdir(join(react18Modules, "@types"), { recursive: true });
  for (const [source, target] of [
    [join(react18FixtureModules, "react"), "react"],
    [join(react18FixtureModules, "react-dom"), "react-dom"],
    [join(react18FixtureModules, "@types", "react"), "@types/react"],
    [join(react18FixtureModules, "@types", "react-dom"), "@types/react-dom"],
    [join(react18FixtureModules, "scheduler"), "scheduler"],
    [join(root, "node_modules", "@types", "prop-types"), "@types/prop-types"],
    [join(root, "node_modules", "csstype"), "csstype"],
  ]) {
    await symlink(source, join(react18Modules, target), "dir");
  }
  await writeFile(
    join(react18Consumer, "check.mjs"),
    `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Switch } from '@lo/ui';
const html = renderToStaticMarkup(createElement(Switch, {label:'Updates'}));
if (!html.includes('Updates')) throw new Error('React 18 render failed');
`,
  );
  run(process.execPath, ["--preserve-symlinks", "check.mjs"], react18Consumer);
  await writeFile(
    join(react18Consumer, "check.tsx"),
    `import {Button, Cell, List, Switch} from '@lo/ui';
const ui = <List><Cell title="Preferences" trailingAction={<Switch label="Updates" />} /><Cell title="App" trailing="Current" onPress={() => {}} /><Button>Open</Button></List>;
void ui;
`,
  );
  for (const resolution of ["NodeNext", "Bundler"]) {
    run(
      process.execPath,
      [
        join(root, "node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--strict",
        "--preserveSymlinks",
        "--target",
        "ES2022",
        "--jsx",
        "react-jsx",
        "--module",
        resolution === "NodeNext" ? "NodeNext" : "ESNext",
        "--moduleResolution",
        resolution,
        "check.tsx",
      ],
      react18Consumer,
    );
  }
  console.log(
    "Clean UI tarballs: CSS build, license, React 18/19 SSR, and NodeNext/Bundler types pass.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}

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
import { createHash } from "node:crypto";
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
    "scripts/build-package.mjs",
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
    const pack = () =>
      JSON.parse(
        run(
          "npm",
          ["pack", "--json", "--cache", join(temp, "cache")],
          directory,
        ),
      )[0];
    const contents = async (packed) =>
      Promise.all(
        packed.files.map(async (file) => [
          file.path,
          createHash("sha256")
            .update(await readFile(join(directory, file.path)))
            .digest("hex"),
        ]),
      );
    const packed = pack();
    const cleanContents = await contents(packed);
    // Generate actual output, then remove its source without cleaning dist/cache.
    const obsoleteSource = join(directory, "src", "removed-source.ts");
    await writeFile(obsoleteSource, "export const obsolete = true;\n");
    const obsoleteFont = join(directory, "src", "fonts", "removed-font.woff2");
    if (name === "design-tokens")
      await writeFile(obsoleteFont, "Synthetic obsolete font fixture");
    run("npm", ["run", "build"], directory);
    assert.ok(await readFile(join(directory, "dist", "removed-source.js")));
    await rm(obsoleteSource);
    if (name === "design-tokens") {
      assert.ok(
        await readFile(join(directory, "dist", "fonts", "removed-font.woff2")),
      );
      await rm(obsoleteFont);
    }
    assert.deepEqual(
      await contents(pack()),
      cleanContents,
      `${name}: removed source or assets survived prepack`,
    );
    // Rebuilding with retained incremental metadata must regenerate every output.
    await rm(join(directory, "dist"), { recursive: true });
    assert.deepEqual(
      await contents(pack()),
      cleanContents,
      `${name}: incremental metadata hid missing output`,
    );
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
  const peerDirectory = join(temp, "peers");
  await mkdir(peerDirectory);
  async function packPeer(modules, name) {
    const packed = JSON.parse(
      run(
        "npm",
        [
          "pack",
          "--json",
          "--ignore-scripts",
          "--pack-destination",
          peerDirectory,
          "--cache",
          join(temp, "cache"),
        ],
        join(modules, name),
      ),
    )[0];
    return join(peerDirectory, packed.filename);
  }
  async function peerArchives(modules, react18 = false) {
    const peers = [];
    for (const name of [
      "react",
      "react-dom",
      "scheduler",
      "@types/react",
      "@types/react-dom",
    ])
      peers.push(await packPeer(modules, name));
    for (const name of react18
      ? ["csstype", "@types/prop-types", "loose-envify", "js-tokens"]
      : ["csstype"])
      peers.push(await packPeer(join(root, "node_modules"), name));
    return peers;
  }
  async function installConsumer(directory, peers, libraries = archives) {
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    );
    run(
      "npm",
      [
        "install",
        "--offline",
        "--ignore-scripts",
        "--strict-peer-deps",
        "--no-audit",
        "--no-fund",
        "--cache",
        join(temp, "cache"),
        ...libraries,
        ...peers,
      ],
      directory,
    );
    run("npm", ["ls", "--all"], directory);
  }
  const react19Peers = await peerArchives(join(root, "node_modules"));
  await installConsumer(consumer, react19Peers);
  await writeFile(
    join(consumer, "check.mjs"),
    `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Cell, List, Dialog, TextArea, Progress, Surface, Tabs } from '@lo-ink/ui';
const html = renderToStaticMarkup(createElement(List, null, createElement(Cell, {title:'Saved app', trailingAction:createElement(Button,null,'Open')})));
if (!html.includes('Saved app') || !html.includes('Open')) throw new Error('Render failed');
`,
  );
  run(process.execPath, ["check.mjs"], consumer);
  await writeFile(
    join(consumer, "check.tsx"),
    `import {Button, Cell, List, Switch, Dialog, TextArea, Progress, Surface, Tabs} from '@lo-ink/ui';
const ui = <List><Cell title="Preferences" trailingAction={<Switch label="Updates" />} /><Cell title="App" onPress={() => {}} trailingAction={<Button>Open</Button>} /></List>;
const tabs = <Tabs value="all" onValueChange={() => {}} options={[{value:"all",label:"All"}]} />;
const extended = <Surface><Dialog><TextArea label="Notes" /><Progress value={10} max={100} /></Dialog></Surface>;
void extended;
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
    'import "@lo-ink/ui/styles.css";\n',
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
  const react18Peers = await peerArchives(
    join(root, "apps", "react18-compat", "node_modules"),
    true,
  );
  await installConsumer(react18Consumer, react18Peers);
  await writeFile(
    join(react18Consumer, "check.mjs"),
    `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Switch } from '@lo-ink/ui';
const html = renderToStaticMarkup(createElement(Switch, {label:'Updates'}));
if (!html.includes('Updates')) throw new Error('React 18 render failed');
`,
  );
  run(process.execPath, ["check.mjs"], react18Consumer);
  await writeFile(
    join(react18Consumer, "check.tsx"),
    `import {Button, Cell, List, Switch, Dialog, TextArea, Progress, Surface, Tabs} from '@lo-ink/ui';
const ui = <List><Cell title="Preferences" trailingAction={<Switch label="Updates" />} /><Cell title="App" trailing="Current" onPress={() => {}} /><Button>Open</Button></List>;
const tabs = <Tabs value="all" onValueChange={() => {}} options={[{value:"all",label:"All"}]} />;
const extended = <Surface><Dialog><TextArea label="Notes" /><Progress value={10} max={100} /></Dialog></Surface>;
void extended;
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
      react18Consumer,
    );
  }
  // An incompatible published peer contract must fail at installation.
  const invalidDirectory = join(temp, "incompatible-peer");
  await mkdir(invalidDirectory);
  await writeFile(
    join(invalidDirectory, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  const uiDirectory = join(source, "packages", "ui");
  const uiManifestPath = join(uiDirectory, "package.json");
  const uiManifest = JSON.parse(await readFile(uiManifestPath, "utf8"));
  uiManifest.peerDependencies.react = ">=20 <21";
  await writeFile(uiManifestPath, JSON.stringify(uiManifest));
  const incompatible = JSON.parse(
    run("npm", ["pack", "--json", "--cache", join(temp, "cache")], uiDirectory),
  )[0];
  const refusal = spawnSync(
    "npm",
    [
      "install",
      "--offline",
      "--ignore-scripts",
      "--strict-peer-deps",
      "--no-audit",
      "--no-fund",
      "--cache",
      join(temp, "cache"),
      archives[0],
      join(uiDirectory, incompatible.filename),
      ...react19Peers,
    ],
    { cwd: invalidDirectory, encoding: "utf8" },
  );
  assert.notEqual(refusal.status, 0, "Incompatible React peer was installed");
  assert.match(refusal.stderr, /ERESOLVE/);
  assert.match(refusal.stderr, /peer react@">=20 <21"/);
  console.log(
    "Clean UI tarballs: strict React 18/19 installation, incompatible-peer rejection, CSS build, license, SSR, and NodeNext/Bundler types pass.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}

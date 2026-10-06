import { copyFile, mkdir, cp } from "node:fs/promises";

await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await copyFile(
  new URL("../src/tokens.css", import.meta.url),
  new URL("../dist/tokens.css", import.meta.url),
);
await copyFile(
  new URL("../LICENSE", import.meta.url),
  new URL("../dist/LICENSE", import.meta.url),
);

await copyFile(
  new URL("../src/fonts.css", import.meta.url),
  new URL("../dist/fonts.css", import.meta.url),
);
await cp(
  new URL("../src/fonts/", import.meta.url),
  new URL("../dist/fonts/", import.meta.url),
  { recursive: true },
);

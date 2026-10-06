# LO UI

Small, accessible React components for LO miniapps. The library contains presentation only: no host bridge, identity, networking, permissions, or routing behavior.

## Packages

- `@lo-ink/design-tokens` — semantic color, spacing, size, radius, type, and motion tokens for light and dark themes.
- `@lo-ink/ui` — React controls and layout primitives styled by those tokens.

React 18 and 19 are supported. Components use native buttons and inputs, visible focus states, 44px minimum action targets, and reduced-motion preferences.

## Install

```sh
npm install @lo-ink/ui @lo-ink/design-tokens
```

Import the stylesheet once, then put the scope class on the part of the page that uses the components. With no `data-lo-theme`, the theme follows the operating system.

```tsx
import { Button, Cell, List, Switch, TextField } from "@lo-ink/ui";
import "@lo-ink/ui/styles.css";

export function Settings() {
  return (
    <main className="lo-ui-root" data-lo-theme="system">
      <TextField
        label="List name"
        description="Visible to people who can open this list."
      />

      <List label="Preferences">
        <Cell
          title="Updates"
          subtitle="Let me know when a saved item changes"
          trailingAction={<Switch label="Updates" labelHidden />}
        />
      </List>

      <Button>Save changes</Button>
    </main>
  );
}
```

Set `data-lo-theme="light"` or `data-lo-theme="dark"` for an explicit theme. Apps can customize semantic CSS variables on the scope without changing component CSS:

```css
.my-miniapp {
  --lo-color-accent: #34784b;
  --lo-color-accent-fill: #34784b;
  --lo-color-accent-text: #28603b;
  --lo-color-accent-hover: #28603b;
  --lo-color-accent-soft: #e8f5ec;
}
```

The initial component set is `Button`, `TextField`, `Switch`, `Checkbox`, `List`, `Cell`, `AppIcon`, `EmptyState`, `Stack`, `Inline`, `Heading`, and `Text`.

Use `Cell.trailing` for read-only status or metadata that belongs to the row action. Use `Cell.trailingAction` for a switch, checkbox, button, or other independently operable control; it is rendered as a sibling so interactive elements are never nested.

## Development

```sh
npm install
npm run dev       # gallery at http://127.0.0.1:5173
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run ci
```

`npm run build` emits package entrypoints and the production gallery. Package exports are limited to the documented JavaScript entrypoint and stylesheet; internal files are not public API.

## License

[MIT](./LICENSE)

## Quality checks

Run `make install` and `make ci` with Node.js 22.13 or newer. The same targets run
in GitHub Actions. CI checks formatting, ESLint (including typed promises),
TypeScript, dependency cycles and package boundaries, tests, published package
contents, vulnerable dependencies and secrets. English documentation and comments
are enforced; unfinished development notes and retired repository URLs fail CI.

Coverage includes unimported production files and fails below 90% lines and
statements, 90% functions, or 80% branches. Reports are uploaded as CI artifacts.

`make browser` checks the gallery at 320px, keyboard controls, dark theme and
reduced motion after installing Chromium with `npx playwright install chromium`.

Repository policy checks require Python 3 for Python comment tokenization. YAML
comments are parsed as YAML; embedded scripts and localized scalar values retain
their own language. LO credentials are checked by the root Gitleaks configuration
and a synthetic scanner regression before each repository scan.

## Native LO baseline

Base canvas, surface, text and brand accent follow LO `reactnative-ui/src/theme/v2/colors.ts`. Buttons follow `ButtonWrapper`: 50px default height, pill corners and tinted secondary controls. Caption contrast and keyboard focus are web accessibility adaptations; the kit does not reproduce native glass effects . `--lo-color-accent-text` separates readable text accents from the filled brand color, especially in dark mode. Theme overrides should set it alongside `--lo-color-accent` when the host supplies a different brand.

`Heading` accepts `level={2}` (levels 1–6) so galleries and nested sections preserve heading order. All components retain semantic HTML, accessible names and keyboard interactions.

The brand accent remains `#5969FC`. Filled web controls use
`--lo-color-accent-fill` (`#5060E8`) so normal-size white labels pass WCAG AA;
`--lo-color-accent-text` separates text on pale surfaces from that fill.
`--lo-color-control-border` provides a 3:1 control boundary without darkening
list separators. These are accessibility adaptations of the native palette.
Custom themes must provide equivalent foreground, fill, hover, and boundary
contrast; overriding the brand accent alone does not replace those roles.

`List` and `EmptyState` accept `headingLevel` (2–6, default 2) for embedded section titles.

`EmptyState` follows native `sections/SectionEmptyListInformation.tsx`: a solid
subtle border, 22 px corners, a 26 px title and height determined by its content.
The icon keeps its own visual appearance rather than gaining an extra tile.

`Surface` separates groups using shared surface, border and spacing tokens.
`Dialog` wraps the native dialog element and forwards its ref; callers control
`showModal()`, `close()` and cancellation. `TextArea` connects its visible label,
help and validation to a multiline field. `Progress` retains native determinate
and indeterminate semantics. `TextField` also supports file selection.

The design tokens ship LO Pro UI, LO Pro Display and LO Pro Mono as WOFF2,
with the supplied weights and verified italic faces. Importing the UI stylesheet loads the
font declarations; browsers download only the faces used by the page. UI text
uses LO Pro UI, headings use LO Pro UI Bold, and code uses LO Pro Mono. The font
assets retain LO's embedded license in `dist/fonts/FONT-LICENSE.txt`; that license
limits their use to LO products and the LO ecosystem. The MIT license covers the
library code and does not relicense the fonts.

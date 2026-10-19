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

The components are `AppIcon`, `Button`, `Cell`, `Checkbox`, `Dialog`,
`Disclosure`, `EmptyState`, `Heading`, `Inline`, `List`, `Progress`, `Stack`,
`Surface`, `Switch`, `Tabs`, `Text`, `TextArea`, and `TextField`.

Use `Cell.trailing` for read-only status or metadata that belongs to the row action. Use `Cell.trailingAction` for a switch, checkbox, button, or other independently operable control; it is rendered as a sibling so interactive elements are never nested.

## Native LO baseline

Base canvas, surface, text and brand accent follow LO `reactnative-ui/src/theme/v2/colors.ts`. Buttons follow `ButtonWrapper`: 50px default height, pill corners and tinted secondary controls. Caption contrast and keyboard focus are web accessibility adaptations; the kit does not reproduce native glass effects. `--lo-color-accent-text` separates readable text accents from the filled brand color, especially in dark mode. Theme overrides should set it alongside `--lo-color-accent` when the host supplies a different brand.

The brand accent remains `#5969FC`. Filled web controls use
`--lo-color-accent-fill` (`#5060E8`) so normal-size white labels pass WCAG AA;
`--lo-color-accent-text` separates text on pale surfaces from that fill.
`--lo-color-control-border` provides a 3:1 control boundary without darkening
list separators. These are accessibility adaptations of the native palette.
Custom themes must provide equivalent foreground, fill, hover, and boundary
contrast; overriding the brand accent alone does not replace those roles.

## Component behavior

`Heading` accepts `level` (1–6, default 1). `List` and `EmptyState` accept
`headingLevel` (2–6, default 2) for embedded section titles.

`EmptyState` follows native `sections/SectionEmptyListInformation.tsx`: a solid
subtle border, 22 px corners, a 26 px title and height determined by its content.
The icon keeps its own visual appearance rather than gaining an extra tile.

`AppIcon` follows native miniapp identity geometry: a square with a corner radius
of 20% of its size. Image content uses cover fitting; accessible labels and
explicit child content remain controlled by the caller.

`Surface` separates groups using shared surface, border and spacing tokens.
`Dialog` wraps the native dialog element and forwards its ref; callers control
`showModal()`, `close()` and cancellation. `TextArea` connects its visible label,
help and validation to a multiline field. `Progress` retains native determinate
and indeterminate semantics. `TextField` also supports file selection.

`Disclosure` wraps native `details` and `summary`, with shared row spacing and
focus tokens. Supply `summary` for its label and optional `trailing` for
noninteractive status. Put buttons and fields in its body. Native `open`,
`onToggle`, `name` and ref attributes remain available; collapsing preserves
body state. The chevron is decorative and keyboard behavior stays native.

```tsx
<Disclosure summary="Detailed result" trailing="Confirmed">
  <Text>Saved result details</Text>
  <Button variant="secondary">Download report</Button>
</Disclosure>
```

`Text` supports inline, emphasis and code/pre semantics through `as`, shared
regular/medium/bold weights, success/error tones, title/display sizes and the
three LO font families. Consumers can format report data without defining a
second typography system.

## Tabs and compact fields

`Tabs` provides controlled, horizontally scrollable navigation with a single selected pill, whole labels, arrow/Home/End keyboard navigation, and optional panel relationships. Use tabs for navigation instead of action buttons. Disabled options are skipped by keyboard navigation.

```tsx
<Tabs
  aria-label="Sections"
  value={section}
  onValueChange={setSection}
  options={[
    { value: "checks", label: "Checks", panelId: "content" },
    { value: "manual", label: "Manual", panelId: "content" },
  ]}
/>
```

Outlined `TextField` geometry follows LO inputs: 44 px minimum height, 10 px corners and padding. Borders retain the accessible contrast token. `variant="search"` provides the compact filled search appearance. `Surface` defaults to a 10 px inset; explicit spacing tokens remain supported.

## Fonts and license

The design tokens ship LO Pro UI, LO Pro Display and LO Pro Mono as WOFF2,
with the supplied weights and verified italic faces. Importing the UI stylesheet loads the
font declarations; browsers download only the faces used by the page. UI text
uses LO Pro UI, headings use LO Pro UI Bold, and code uses LO Pro Mono. The font
assets retain LO's embedded license in `dist/fonts/FONT-LICENSE.txt`; that license
limits their use to LO products and the LO ecosystem. The [MIT license](./LICENSE) covers the
library code and does not relicense the fonts.

The supplied Mono BoldItalic file has upright glyph metadata and is excluded
from the web font declarations. The remaining 47 faces preserve their original
glyphs, character mappings, metrics and embedded license metadata.

## Development

Use Node.js 22.13 or newer and Python 3 (required by repository policy checks).

```sh
make install
npm run dev       # gallery at http://127.0.0.1:5173
make ci
npx playwright install chromium webkit
make browser
```

`npm run build` emits package entrypoints and the production gallery. Package
exports are limited to the documented JavaScript entrypoint and stylesheet;
internal files are not public API.

CI checks formatting, ESLint, TypeScript, dependency boundaries, packed React
18/19 consumers, vulnerable dependencies and secrets. Coverage includes
unimported production files and requires 90% lines/statements/functions and
80% branches. The browser gate checks the gallery at 320px, keyboard controls,
dark theme and reduced motion in Chromium and WebKit. Axe scans all 18
primitives in light/dark themes at desktop and narrow widths, including
validation, selection, disclosure and modal states. Automated scans complement
keyboard tests; they do not replace screen-reader testing.

Documentation and comments must be in English; unfinished development notes and
retired repository URLs fail policy checks. Gitleaks uses the repository
configuration and a synthetic credential-scanner regression.

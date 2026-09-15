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

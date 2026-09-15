import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AppIcon,
  Button,
  Cell,
  Checkbox,
  EmptyState,
  Heading,
  Inline,
  List,
  Stack,
  Switch,
  Text,
  TextField,
} from "@lo-ink/ui";
import "@lo-ink/ui/styles.css";
import "./gallery.css";

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10h16v10H4V10Zm-1-4h18v4H3V6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 6v14M12 6c-2.8 0-5-1.1-5-3 2.6 0 5 1.2 5 3Zm0 0c2.8 0 5-1.1 5-3-2.6 0-5 1.2-5 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [alerts, setAlerts] = useState(true);
  const [privateList, setPrivateList] = useState(false);
  const [name, setName] = useState("");

  return (
    <main className="lo-ui-root gallery" data-lo-theme={theme}>
      <header className="gallery-header">
        <div>
          <Text size="caption" tone="secondary">
            COMPONENT GALLERY
          </Text>
          <Heading>LO UI</Heading>
          <Text tone="secondary">
            Themeable React primitives with mobile-sized targets and no host
            dependencies.
          </Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? "Dark theme" : "Light theme"}
        </Button>
      </header>

      <div className="gallery-grid">
        <section className="gallery-panel" aria-labelledby="controls-title">
          <Stack gap={6}>
            <div>
              <h2 id="controls-title" className="gallery-title">
                Controls
              </h2>
              <Text size="label" tone="secondary">
                Primary, secondary, pending, and validation states.
              </Text>
            </div>
            <Inline gap={2}>
              <Button>Save changes</Button>
              <Button variant="secondary">Cancel</Button>
              <Button variant="danger">Remove</Button>
              <Button variant="quiet">Learn more</Button>
            </Inline>
            <Inline gap={2}>
              <Button loading loadingLabel="Saving">
                Save
              </Button>
              <Button disabled>Unavailable</Button>
              <Button size="small">Compact action</Button>
            </Inline>
            <TextField
              label="List name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Birthday ideas"
              description="Visible to people who can open this list."
              error={
                name.length > 0 && name.length < 3
                  ? "Use at least 3 characters."
                  : undefined
              }
            />
          </Stack>
        </section>

        <section className="gallery-panel" aria-labelledby="settings-title">
          <Stack gap={4}>
            <div>
              <h2 id="settings-title" className="gallery-title">
                Settings
              </h2>
              <Text size="label" tone="secondary">
                Native inputs preserve keyboard and screen-reader behavior.
              </Text>
            </div>
            <List label="Preferences">
              <Cell
                title="Notifications"
                subtitle="Updates when a saved item changes"
                trailingAction={
                  <Switch
                    label="Notifications"
                    labelHidden
                    checked={alerts}
                    onChange={(event) => setAlerts(event.target.checked)}
                  />
                }
              />
              <Cell
                title="Private list"
                subtitle="Only invited people can open it"
                trailingAction={
                  <Checkbox
                    label="Private list"
                    labelHidden
                    checked={privateList}
                    onChange={(event) => setPrivateList(event.target.checked)}
                  />
                }
              />
              <Cell
                title="Appearance"
                subtitle="Follows your preference"
                trailing={theme === "light" ? "Light" : "Dark"}
                onPress={() => setTheme(theme === "light" ? "dark" : "light")}
              />
            </List>
          </Stack>
        </section>

        <section className="gallery-panel" aria-labelledby="list-title">
          <Stack gap={4}>
            <div>
              <h2 id="list-title" className="gallery-title">
                List and app icons
              </h2>
              <Text size="label" tone="secondary">
                Rows carry content, actions, and compact metadata.
              </Text>
            </div>
            <List label="My apps">
              <Cell
                leading={
                  <AppIcon>
                    <GiftIcon />
                  </AppIcon>
                }
                title="Wish list"
                subtitle="12 saved ideas"
                trailing="Updated today"
                onPress={() => undefined}
              />
              <Cell
                leading={
                  <AppIcon className="gallery-green">
                    <span aria-hidden="true">🌱</span>
                  </AppIcon>
                }
                title="Garden"
                subtitle="Ready for care"
                onPress={() => undefined}
              />
            </List>
          </Stack>
        </section>

        <section className="gallery-panel" aria-labelledby="empty-title">
          <h2 id="empty-title" className="gallery-title gallery-title--hidden">
            Empty state
          </h2>
          <EmptyState
            icon={<GiftIcon />}
            title="Nothing saved yet"
            description="Add your first idea so it is easy to find later."
            action={<Button size="small">Add an idea</Button>}
          />
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

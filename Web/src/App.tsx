import { useEffect, useState, type FC } from "react";
import { onNavigate, notifyReady, isNative, type ScreenId } from "./bridge";
import { LoremIpsumScreen } from "./screens/LoremIpsumScreen";
import { DolorSitScreen } from "./screens/DolorSitScreen";
import { DevSwitcher } from "./components/DevSwitcher";

// Keyed by Screen.rawValue from the Swift side. No router and no view swap at
// the native layer — the sidebar just changes which screen renders here.
const SCREENS: Record<ScreenId, FC> = {
  loremIpsum: LoremIpsumScreen,
  dolorSit: DolorSitScreen,
};

export function App() {
  const [screen, setScreen] = useState<ScreenId>("loremIpsum");
  const native = isNative();

  useEffect(() => {
    const off = onNavigate((id) => {
      if (id in SCREENS) setScreen(id);
    });

    // Outside the native app (plain-browser dev) follow the OS theme so the
    // page still looks right. Inside the app, the native appearance picker
    // drives the theme via the bridge.
    if (!native) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () =>
        document.documentElement.setAttribute(
          "data-theme",
          mq.matches ? "dark" : "light",
        );
      apply();
      mq.addEventListener("change", apply);
    }

    // Hand back control: the native side flushes the current selection, theme,
    // and insets once it hears this.
    notifyReady();
    return off;
  }, [native]);

  const Screen = SCREENS[screen];

  return (
    <div className="app">
      {!native && <DevSwitcher current={screen} onSelect={setScreen} />}
      <Screen />
    </div>
  );
}

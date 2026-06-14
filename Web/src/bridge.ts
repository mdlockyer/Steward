// Native <-> web bridge.
//
// The native app injects `window.__native` (see WebBridge.bootstrapScript in
// the Swift side) before any app code runs. When the sidebar selection, the
// appearance, or the safe-area insets change, Swift calls into `window.__native`,
// which re-dispatches the change as a CustomEvent on `window` and (for theme /
// insets) applies it to <html> directly. This module is the typed subscription
// layer over those events, plus the one message we send back: `ready`.
//
// Screen ids are exactly the raw values of the Swift `Screen` enum.

export type ScreenId = "loremIpsum" | "dolorSit";
export type Theme = "light" | "dark";

interface NativeBridge {
  navigate(screenId: string): void;
  setTheme(theme: string): void;
  setInsets(top: number, bottom: number): void;
}

declare global {
  interface Window {
    __native?: NativeBridge;
    webkit?: {
      messageHandlers?: {
        native?: { postMessage(message: unknown): void };
      };
    };
  }
}

/** True when running inside the native app's WKWebView (vs. a plain browser). */
export function isNative(): boolean {
  return typeof window.webkit?.messageHandlers?.native !== "undefined";
}

/** Tell the native side the web app has mounted and is listening. */
export function notifyReady(): void {
  window.webkit?.messageHandlers?.native?.postMessage({ type: "ready" });
}

/** Subscribe to sidebar-driven navigation. Returns an unsubscribe function. */
export function onNavigate(callback: (screenId: ScreenId) => void): () => void {
  const handler = (event: Event) => {
    callback((event as CustomEvent<string>).detail as ScreenId);
  };
  window.addEventListener("native:navigate", handler);
  return () => window.removeEventListener("native:navigate", handler);
}

/**
 * Subscribe to theme changes. The bootstrap already sets `data-theme` on
 * <html>, so CSS reacts without this; subscribe only if you need theme in JS.
 */
export function onTheme(callback: (theme: Theme) => void): () => void {
  const handler = (event: Event) => {
    callback((event as CustomEvent<string>).detail as Theme);
  };
  window.addEventListener("native:theme", handler);
  return () => window.removeEventListener("native:theme", handler);
}

/**
 * Subscribe to safe-area inset changes (toolbar height etc.). The bootstrap
 * already writes `--safe-top` / `--safe-bottom` CSS vars; subscribe only if you
 * need the values in JS.
 */
export function onInsets(
  callback: (insets: { top: number; bottom: number }) => void,
): () => void {
  const handler = (event: Event) => {
    callback((event as CustomEvent<{ top: number; bottom: number }>).detail);
  };
  window.addEventListener("native:insets", handler);
  return () => window.removeEventListener("native:insets", handler);
}

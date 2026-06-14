import Foundation

/// Constants and the JS bootstrap shared by the native side of the web bridge.
///
/// The contract with the web app (see Web/src/bridge.ts):
///   Swift -> JS : window.__native.navigate(id) / setTheme(t) / setInsets(top, bottom)
///   JS -> Swift : window.webkit.messageHandlers.native.postMessage({ type: "ready" })
enum WebBridge {
    /// Custom scheme used to serve the bundled web app in RELEASE builds.
    static let scheme = "app"
    static let host = "local"

    /// Name of the WKScriptMessageHandler the web app posts to.
    static let messageHandlerName = "native"

    /// Entry point for the bundled web app (RELEASE).
    static let indexURL = URL(string: "\(scheme)://\(host)/index.html")!

    #if DEBUG
    /// Vite dev server (DEBUG). Run `make web-dev` to start it.
    static let devServerURL = URL(string: "http://localhost:5173/")!
    #endif

    /// Injected at documentStart, before any web app code runs. Defines
    /// `window.__native` so Swift can push navigation / theme / inset changes
    /// in as DOM CustomEvents. Theme and insets are also applied to <html>
    /// directly so they take effect even before React mounts.
    static let bootstrapScript = """
    (function () {
      function emit(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail: detail }));
      }
      window.__native = {
        navigate: function (screenId) {
          emit('native:navigate', screenId);
        },
        setTheme: function (theme) {
          document.documentElement.setAttribute('data-theme', theme);
          emit('native:theme', theme);
        },
        setInsets: function (top, bottom) {
          var style = document.documentElement.style;
          style.setProperty('--safe-top', top + 'px');
          style.setProperty('--safe-bottom', bottom + 'px');
          emit('native:insets', { top: top, bottom: bottom });
        }
      };
    })();
    """
}

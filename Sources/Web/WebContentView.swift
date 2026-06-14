import SwiftUI
import WebKit

/// The detail content of the app: a single, persistent, transparent WKWebView
/// that hosts the React app. The native sidebar never swaps this view — it
/// pushes a `navigate` event in (see `updateNSView`) and the web app changes
/// the page internally.
///
/// DEBUG loads the Vite dev server; RELEASE loads the bundled assets over the
/// `app://` scheme (see `AppSchemeHandler`).
struct WebContentView: NSViewRepresentable {
    /// The selected `Screen`'s rawValue — the web screen id.
    let screenID: String
    /// Resolved appearance (the web app mirrors this for its own light/dark).
    let colorScheme: ColorScheme
    /// Toolbar / safe-area insets, forwarded so web content can scroll under
    /// the native glass toolbar instead of being clipped below it.
    let safeAreaInsets: EdgeInsets
    /// Called when the web app navigates itself (e.g. Inspector → Studio), so the
    /// native sidebar selection can follow. Defaults to a no-op.
    var onRouteChange: (String) -> Void = { _ in }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()

        let controller = WKUserContentController()
        controller.add(context.coordinator, name: WebBridge.messageHandlerName)
        controller.addUserScript(
            WKUserScript(
                source: WebBridge.bootstrapScript,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )
        configuration.userContentController = controller
        configuration.setURLSchemeHandler(AppSchemeHandler(), forURLScheme: WebBridge.scheme)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator

        // Transparency is what sells the native illusion: the glass toolbar and
        // window material show through as web content scrolls beneath them.
        // `underPageBackgroundColor` is the public knob; `drawsBackground` (via
        // KVC) is the long-standing fallback some macOS versions still require.
        // It isn't formal public API — fine for in-house / Developer ID builds,
        // but revisit before App Store submission.
        webView.underPageBackgroundColor = .clear
        if webView.responds(to: Selector(("setDrawsBackground:"))) {
            webView.setValue(false, forKey: "drawsBackground")
        }

        context.coordinator.onRouteChange = onRouteChange
        context.coordinator.attach(to: webView)
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        context.coordinator.onRouteChange = onRouteChange
        context.coordinator.apply(
            screenID: screenID,
            theme: colorScheme == .dark ? "dark" : "light",
            top: safeAreaInsets.top,
            bottom: safeAreaInsets.bottom
        )
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private weak var webView: WKWebView?
        private var isReady = false

        /// Forwarded to `ContentView` so web-initiated navigation updates the sidebar.
        var onRouteChange: (String) -> Void = { _ in }

        // Latest desired state; flushed to JS once the page signals `ready`.
        private var screenID = "desk"
        private var theme = "light"
        private var top: CGFloat = 0
        private var bottom: CGFloat = 0
        private var lastSent: (screenID: String, theme: String, top: CGFloat, bottom: CGFloat)?

        func attach(to webView: WKWebView) {
            self.webView = webView
            #if DEBUG
            webView.load(URLRequest(url: WebBridge.devServerURL))
            #else
            webView.load(URLRequest(url: WebBridge.indexURL))
            #endif
        }

        func apply(screenID: String, theme: String, top: CGFloat, bottom: CGFloat) {
            self.screenID = screenID
            self.theme = theme
            self.top = top
            self.bottom = bottom
            flushIfNeeded()
        }

        private func flushIfNeeded() {
            guard isReady else { return }
            let next = (screenID, theme, top, bottom)
            if let last = lastSent,
               last.screenID == next.0, last.theme == next.1,
               last.top == next.2, last.bottom == next.3 {
                return
            }
            lastSent = next
            run("window.__native.setTheme('\(theme)')")
            run("window.__native.setInsets(\(Int(top.rounded())), \(Int(bottom.rounded())))")
            run("window.__native.navigate('\(screenID)')")
        }

        private func run(_ javaScript: String) {
            webView?.evaluateJavaScript(javaScript)
        }

        // MARK: JS -> Swift

        func userContentController(
            _ controller: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard let body = message.body as? [String: Any],
                  let type = body["type"] as? String else { return }
            switch type {
            case "ready":
                isReady = true
                lastSent = nil // force a fresh flush after a (re)load
                flushIfNeeded()
            case "route":
                // The page navigated itself; mirror it to the native sidebar.
                if let id = body["id"] as? String { onRouteChange(id) }
            default:
                break
            }
        }

        // MARK: Navigation

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            // A new document is loading; wait for its `ready` before pushing state.
            isReady = false
            lastSent = nil
        }
    }
}

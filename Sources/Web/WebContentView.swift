import SwiftUI
import WebKit

/// A single, persistent, transparent `WKWebView` that fills the window and hosts
/// the React app. The web app owns all navigation and chrome (its own sidebar),
/// so the native side only needs to load the app and forward the appearance
/// (light/dark). No native sidebar, no per-screen swapping.
///
/// DEBUG loads the Vite dev server; RELEASE loads the bundled assets over the
/// `app://` scheme (see `AppSchemeHandler`).
struct WebContentView: NSViewRepresentable {
    /// Resolved appearance (the web app mirrors this for its own light/dark).
    let colorScheme: ColorScheme

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

        // Transparency lets the window material show through behind the web app.
        // `underPageBackgroundColor` is the public knob; `drawsBackground` (via
        // KVC) is the long-standing fallback some macOS versions still require.
        // Not formal public API — fine for in-house / Developer ID builds, but
        // revisit before App Store submission.
        webView.underPageBackgroundColor = .clear
        if webView.responds(to: Selector(("setDrawsBackground:"))) {
            webView.setValue(false, forKey: "drawsBackground")
        }

        context.coordinator.attach(to: webView)
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        context.coordinator.apply(theme: colorScheme == .dark ? "dark" : "light")
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private weak var webView: WKWebView?
        private var isReady = false

        // Latest desired appearance; flushed to JS once the page signals `ready`.
        private var theme = "light"
        private var lastTheme: String?

        func attach(to webView: WKWebView) {
            self.webView = webView
            #if DEBUG
            webView.load(URLRequest(url: WebBridge.devServerURL))
            #else
            webView.load(URLRequest(url: WebBridge.indexURL))
            #endif
        }

        func apply(theme: String) {
            self.theme = theme
            flushIfNeeded()
        }

        private func flushIfNeeded() {
            guard isReady, lastTheme != theme else { return }
            lastTheme = theme
            webView?.evaluateJavaScript("window.__native.setTheme('\(theme)')")
        }

        // MARK: JS -> Swift

        func userContentController(
            _ controller: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard let body = message.body as? [String: Any],
                  let type = body["type"] as? String else { return }
            if type == "ready" {
                isReady = true
                lastTheme = nil // force a fresh flush after a (re)load
                flushIfNeeded()
            }
        }

        // MARK: Navigation

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            // A new document is loading; wait for its `ready` before pushing state.
            isReady = false
            lastTheme = nil
        }
    }
}

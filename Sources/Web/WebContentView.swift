import SwiftUI
import WebKit
import UserNotifications

/// Height of the transparent drag strip across the top of the window — the
/// "titlebar" region. The web app pads its sidebar and main column by the same
/// amount so nothing interactive ever sits beneath it.
private let dragStripHeight: CGFloat = 34

/// A single, persistent, transparent `WKWebView` that fills the window and hosts
/// the React app, plus a thin transparent strip across the top that the user can
/// drag to move the window. Without that strip the WebView swallows every mouse
/// event, so the hidden titlebar's drag region and `isMovableByWindowBackground`
/// never get a chance — the window can't be moved at all.
///
/// The web app owns all navigation and chrome (its own sidebar), so the native
/// side only loads the app and forwards the appearance (light/dark).
/// DEBUG loads the Vite dev server; RELEASE loads the bundled assets over the
/// `app://` scheme (see `AppSchemeHandler`).
struct WebContentView: NSViewRepresentable {
    /// Resolved appearance (the web app mirrors this for its own light/dark).
    let colorScheme: ColorScheme

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> NSView {
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

        // Container: the WebView fills it, the drag strip floats on top. The
        // traffic lights live in the window frame above both, so they stay
        // clickable; everything below the strip stays interactive web content.
        let container = NSView()
        webView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(webView)

        let dragStrip = WindowDragStrip()
        dragStrip.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(dragStrip, positioned: .above, relativeTo: webView)

        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            webView.topAnchor.constraint(equalTo: container.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            dragStrip.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            dragStrip.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            dragStrip.topAnchor.constraint(equalTo: container.topAnchor),
            dragStrip.heightAnchor.constraint(equalToConstant: dragStripHeight),
        ])

        context.coordinator.attach(to: webView)
        return container
    }

    func updateNSView(_ nsView: NSView, context: Context) {
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
            switch type {
            case "ready":
                isReady = true
                lastTheme = nil // force a fresh flush after a (re)load
                flushIfNeeded()
            case "notify":
                postNotification(
                    title: body["title"] as? String ?? "Steward",
                    body: body["body"] as? String ?? ""
                )
            default:
                break
            }
        }

        /// Posts a real macOS notification. Requests authorization on first use;
        /// silently no-ops if the user declines.
        private func postNotification(title: String, body: String) {
            let center = UNUserNotificationCenter.current()
            center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
                guard granted else { return }
                let content = UNMutableNotificationContent()
                content.title = title
                content.body = body
                content.sound = .default
                let request = UNNotificationRequest(
                    identifier: UUID().uuidString, content: content, trigger: nil
                )
                center.add(request)
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

/// A transparent view that designates itself a window-drag region. `WKWebView`
/// otherwise consumes the mouse-down, so this strip — layered above it — is what
/// makes the top edge behave like a titlebar you can grab.
private final class WindowDragStrip: NSView {
    override var mouseDownCanMoveWindow: Bool { true }

    // Belt-and-suspenders: if AppKit doesn't auto-move (some configurations),
    // start the drag explicitly.
    override func mouseDown(with event: NSEvent) {
        window?.performDrag(with: event)
    }
}

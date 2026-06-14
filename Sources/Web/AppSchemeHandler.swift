import Foundation
import UniformTypeIdentifiers
import WebKit

/// Serves the bundled web app over `app://local/<path>`.
///
/// A custom scheme (rather than `file://`) gives the React build a real,
/// stable origin, so its ES modules and relative asset URLs load without the
/// restrictions WebKit places on `file://`. Only used by RELEASE builds; DEBUG
/// loads the Vite dev server directly.
final class AppSchemeHandler: NSObject, WKURLSchemeHandler {
    /// Directory containing the built web assets (index.html, assets/...).
    private let root: URL?

    override init() {
        var candidates: [URL] = []
        // Xcode .app bundle: Contents/Resources/web.
        if let main = Bundle.main.resourceURL?.appending(path: "web") {
            candidates.append(main)
        }
        // `swift run` of the SPM executable keeps resources in Bundle.module.
        // `Bundle.module` only exists when built by SwiftPM, so guard on it.
        #if SWIFT_PACKAGE
        if let module = Bundle.module.resourceURL?.appending(path: "web") {
            candidates.append(module)
        }
        #endif
        root = candidates.first { FileManager.default.fileExists(atPath: $0.path) }
        super.init()
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url, let root else {
            task.didFailWithError(URLError(.badURL))
            return
        }

        var relativePath = url.path
        if relativePath.hasPrefix("/") { relativePath.removeFirst() }
        if relativePath.isEmpty { relativePath = "index.html" }

        let fileURL = root.appending(path: relativePath)
        if let data = try? Data(contentsOf: fileURL) {
            respond(to: task, url: url, data: data, fileURL: fileURL)
        } else {
            // SPA fallback: serve index.html for unknown paths.
            let indexURL = root.appending(path: "index.html")
            if let data = try? Data(contentsOf: indexURL) {
                respond(to: task, url: url, data: data, fileURL: indexURL)
            } else {
                task.didFailWithError(URLError(.fileDoesNotExist))
            }
        }
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    private func respond(to task: WKURLSchemeTask, url: URL, data: Data, fileURL: URL) {
        let response = HTTPURLResponse(
            url: url,
            statusCode: 200,
            httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": Self.mimeType(for: fileURL),
                "Content-Length": "\(data.count)",
                "Access-Control-Allow-Origin": "*",
            ]
        )!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    private static func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        default:
            let ext = url.pathExtension.lowercased()
            return UTType(filenameExtension: ext)?.preferredMIMEType ?? "application/octet-stream"
        }
    }
}

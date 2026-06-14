import Foundation

/// Registry for sidebar screens. Each case's `rawValue` is the contract shared
/// with the web app — it's the screen id sent over the bridge (see
/// `WebContentView`) and is matched against the React app's `route` state in
/// `steward-app/src/Steward.jsx`.
///
/// Adding a new screen:
///
///   1. Add a case here (its rawValue becomes the web screen id / route).
///   2. Provide its `title` and `systemImage` for the sidebar.
///   3. Handle the matching id in the web app's `route` switch.
///
/// `ContentView` iterates `Screen.allCases` automatically.
enum Screen: String, CaseIterable, Hashable, Identifiable {
    case desk
    case carrying
    case meetings
    case roadmap
    case vault
    case studio
    case sources
    case log
    case settings

    var id: Self { self }

    var title: String {
        switch self {
        case .desk: "Desk"
        case .carrying: "Carrying"
        case .meetings: "Meetings"
        case .roadmap: "Roadmap"
        case .vault: "Vault"
        case .studio: "Studio"
        case .sources: "Sources"
        case .log: "Log"
        case .settings: "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .desk: "tray"
        case .carrying: "square.stack.3d.up"
        case .meetings: "calendar"
        case .roadmap: "arrow.triangle.branch"
        case .vault: "books.vertical"
        case .studio: "sparkles"
        case .sources: "powerplug"
        case .log: "checkmark.circle"
        case .settings: "gearshape"
        }
    }
}

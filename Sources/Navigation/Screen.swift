import SwiftUI

/// Registry for sidebar screens. Adding a new screen:
///
///   1. Add a case here.
///   2. Provide its `title`, `systemImage`, and `destination`.
///
/// `ContentView` iterates `Screen.allCases` automatically.
enum Screen: String, CaseIterable, Hashable, Identifiable {
    case loremIpsum
    case dolorSit

    var id: Self { self }

    var title: String {
        switch self {
        case .loremIpsum:
            "Lorem Ipsum"
        case .dolorSit:
            "Dolor Sit"
        }
    }

    var systemImage: String {
        switch self {
        case .loremIpsum:
            "snowflake"
        case .dolorSit:
            "wind.snow"
        }
    }

    @ViewBuilder
    var destination: some View {
        switch self {
        case .loremIpsum:
            LoremIpsumScreen()
        case .dolorSit:
            DolorSitScreen()
        }
    }
}

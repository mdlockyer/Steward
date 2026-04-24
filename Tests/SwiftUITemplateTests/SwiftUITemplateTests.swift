import Testing
@testable import SwiftUITemplate

@Suite("SwiftUITemplate Tests")
struct SwiftUITemplateTests {
    @Test("Content view exists")
    @MainActor
    func contentViewExists() {
        let content = ContentView()
        _ = content.body
    }
}

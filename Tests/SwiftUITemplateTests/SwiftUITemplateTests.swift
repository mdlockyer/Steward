import Testing
import SwiftUI
@testable import SwiftUITemplate

@Suite("TestView Helper")
struct TestViewTests {
    @Test("hosts arbitrary content for test evaluation")
    @MainActor
    func hostsContent() {
        struct Inner: View {
            var body: some View { Text("inner") }
        }
        let wrapper = TestView { Inner() }
        _ = wrapper.body
    }
}

@Suite("ColorSchemeMode Tests")
struct ColorSchemeModeTests {
    @Test("id returns self for each case")
    func idReturnsSelf() {
        for mode in ColorSchemeMode.allCases {
            #expect(mode.id == mode)
        }
    }

    @Test("title returns correct string for each case")
    func titleReturnsCorrectString() {
        #expect(ColorSchemeMode.system.title == "Automatic")
        #expect(ColorSchemeMode.light.title == "Light")
        #expect(ColorSchemeMode.dark.title == "Dark")
    }

    @Test("nsAppearance returns nil for system")
    func nsAppearanceSystem() {
        #expect(ColorSchemeMode.system.nsAppearance == nil)
    }

    @Test("nsAppearance returns aqua for light")
    func nsAppearanceLight() {
        #expect(ColorSchemeMode.light.nsAppearance == NSAppearance(named: .aqua))
    }

    @Test("nsAppearance returns darkAqua for dark")
    func nsAppearanceDark() {
        #expect(ColorSchemeMode.dark.nsAppearance == NSAppearance(named: .darkAqua))
    }
}

@Suite("Screen Tests")
struct ScreenTests {
    @Test("desk and studio are distinct")
    func distinctCases() {
        #expect(Screen.desk != Screen.studio)
    }

    @Test("desk hashValue matches desk")
    func deskHashable() {
        var hashSet = Set<Screen>()
        hashSet.insert(.desk)
        #expect(hashSet.contains(.desk))
        #expect(!hashSet.contains(.studio))
    }

    @Test("studio hashValue matches studio")
    func studioHashable() {
        var hashSet = Set<Screen>()
        hashSet.insert(.studio)
        #expect(hashSet.contains(.studio))
        #expect(!hashSet.contains(.desk))
    }

    @Test("raw values match the web bridge contract")
    func rawValueContract() {
        // These strings are the screen ids / routes the web app keys on
        // (steward-app/src/Steward.jsx); changing them silently breaks sidebar
        // navigation.
        #expect(Screen.desk.rawValue == "desk")
        #expect(Screen.carrying.rawValue == "carrying")
        #expect(Screen.meetings.rawValue == "meetings")
        #expect(Screen.roadmap.rawValue == "roadmap")
        #expect(Screen.vault.rawValue == "vault")
        #expect(Screen.studio.rawValue == "studio")
        #expect(Screen.sources.rawValue == "sources")
        #expect(Screen.log.rawValue == "log")
        #expect(Screen.settings.rawValue == "settings")
        #expect(Screen(rawValue: "desk") == .desk)
        #expect(Screen(rawValue: "carrying") == .carrying)
        #expect(Screen(rawValue: "vault") == .vault)
        #expect(Screen(rawValue: "studio") == .studio)
        #expect(Screen.allCases.count == 9)
    }
}

@Suite("SortMode Tests")
struct SortModeTests {
    @Test("id returns self for each case")
    func idReturnsSelf() {
        for mode in SortMode.allCases {
            #expect(mode.id == mode)
        }
    }

    @Test("title returns correct string for each case")
    func titleReturnsCorrectString() {
        #expect(SortMode.dateEdited.title == "First Choice")
        #expect(SortMode.dateCreated.title == "Second Choice")
        #expect(SortMode.title.title == "Third Choice")
    }
}

@Suite("ContentView Tests")
struct ContentViewTests {
    @Test("body can be evaluated")
    @MainActor
    func bodyCanBeEvaluated() {
        var colorSchemeMode = ColorSchemeMode.system
        let content = ContentView(colorSchemeMode: Binding(
            get: { colorSchemeMode },
            set: { colorSchemeMode = $0 }
        ))
        _ = content.body
    }
}

@Suite("WebContentView Tests")
struct WebContentViewTests {
    @Test("carries the screen id, theme, and insets it is given")
    @MainActor
    func storesInputs() {
        let view = WebContentView(
            screenID: Screen.desk.rawValue,
            colorScheme: .dark,
            safeAreaInsets: EdgeInsets(top: 52, leading: 0, bottom: 0, trailing: 0)
        )
        #expect(view.screenID == "desk")
        #expect(view.colorScheme == .dark)
        #expect(view.safeAreaInsets.top == 52)
    }
}

@Suite("SettingsToggleLabel Tests")
struct SettingsToggleLabelTests {
    @Test("body renders title and message")
    @MainActor
    func bodyWithMessage() {
        let label = SettingsToggleLabel(title: "Title", message: "Message")
        _ = label.body
    }
}

@Suite("SettingsToggleRow Tests")
struct SettingsToggleRowTests {
    @Test("body renders toggle with message")
    @MainActor
    func bodyWithMessage() {
        var isOn = true
        let row = SettingsToggleRow(
            title: "Title",
            message: "Message",
            isOn: Binding(get: { isOn }, set: { isOn = $0 })
        )
        _ = row.body
    }

    @Test("body renders toggle without message")
    @MainActor
    func bodyWithoutMessage() {
        var isOn = false
        let row = SettingsToggleRow(
            title: "Title",
            isOn: Binding(get: { isOn }, set: { isOn = $0 })
        )
        _ = row.body
    }
}

@Suite("SettingsLabeledRow Tests")
struct SettingsLabeledRowTests {
    @Test("body renders title and content")
    @MainActor
    func bodyRendersTitleAndContent() {
        let row = SettingsLabeledRow("Title") {
            Text("Content")
        }
        _ = row.body
    }
}

@Suite("SettingsView Tests")
struct SettingsViewTests {
    @Test("body can be evaluated")
    @MainActor
    func bodyCanBeEvaluated() {
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.sortMode.rawValue)
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.colorSchemeMode.rawValue)
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.sampleToggle.rawValue)
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.defaultTextSize.rawValue)
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.useDarkBackgrounds.rawValue)
        let view = SettingsView()
        _ = view.body
    }

    @Test("title(for:) returns correct value for SortMode")
    @MainActor
    func titleForSortMode() {
        let view = SettingsView()
        #expect(view.title(for: SortMode.dateEdited) == "First Choice")
        #expect(view.title(for: SortMode.dateCreated) == "Second Choice")
        #expect(view.title(for: SortMode.title) == "Third Choice")
    }

    @Test("allModeTitles returns titles for all ColorSchemeMode cases")
    @MainActor
    func allModeTitles() {
        let view = SettingsView()
        let titles = view.allModeTitles()
        #expect(titles.count == 3)
        #expect(titles.contains("Automatic"))
        #expect(titles.contains("Light"))
        #expect(titles.contains("Dark"))
    }

    @Test("sortMode binding round-trip")
    @MainActor
    func sortModeBinding() {
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.sortMode.rawValue)
        let view = SettingsView()
        #expect(view.sortMode == .dateEdited)
        view.$sortMode.wrappedValue = .dateCreated
        #expect(view.sortMode == .dateCreated)
        view.$sortMode.wrappedValue = .title
        #expect(view.sortMode == .title)
    }

    @Test("colorSchemeMode binding round-trip")
    @MainActor
    func colorSchemeModeBinding() {
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.colorSchemeMode.rawValue)
        let view = SettingsView()
        #expect(view.colorSchemeMode == .system)
        view.$colorSchemeMode.wrappedValue = .light
        #expect(view.colorSchemeMode == .light)
        view.$colorSchemeMode.wrappedValue = .dark
        #expect(view.colorSchemeMode == .dark)
    }

    @Test("settingsDivider renders")
    @MainActor
    func settingsDivider() {
        let view = SettingsView()
        _ = view.settingsDivider
    }

    @Test("sortMode default value is dateEdited")
    @MainActor
    func sortModeDefaultValue() {
        UserDefaults.standard.removeObject(forKey: SettingsStorageKey.sortMode.rawValue)
        let view = SettingsView()
        #expect(view.sortMode == .dateEdited)
    }
}
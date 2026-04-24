import SwiftUI

struct SettingsView: View {
    @AppStorage(SettingsStorageKey.sortMode.rawValue) private var sortModeRawValue = SortMode.dateEdited.rawValue
    @AppStorage(SettingsStorageKey.colorSchemeMode.rawValue) private var colorSchemeModeRawValue = ColorSchemeMode.system.rawValue
    @AppStorage(SettingsStorageKey.sampleToggle.rawValue) private var sampleToggle = true
    @AppStorage(SettingsStorageKey.defaultTextSize.rawValue) private var defaultTextSize = 14.0
    @AppStorage(SettingsStorageKey.useDarkBackgrounds.rawValue) private var useDarkBackgrounds = true

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            settingsPickerRow("Sample option one:", selection: sortMode)

            settingsDivider

            SettingsToggleRow(
                title: "Sample toggle option",
                message: "Example supporting text for a demo setting row.",
                isOn: $sampleToggle
            )

            settingsDivider

            SettingsLabeledRow("Sample slider:") {
                HStack(spacing: 12) {
                    Text("Low")
                        .foregroundStyle(.secondary)

                    Slider(value: $defaultTextSize, in: 0 ... 100)
                        .frame(width: 240)

                    Text("High")
                        .foregroundStyle(.secondary)
                }
            }

            SettingsToggleRow(
                title: "Use sample visual treatment",
                isOn: $useDarkBackgrounds
            )

            settingsDivider

            SettingsLabeledRow("Appearance:") {
                Picker("Appearance", selection: colorSchemeMode) {
                    ForEach(ColorSchemeMode.allCases) { mode in
                        Text(mode.title).tag(mode)
                    }
                }
                .labelsHidden()
                .pickerStyle(.segmented)
                .frame(width: 240)
            }
        }
        .controlSize(.regular)
        .padding(24)
        .frame(width: 560)
        .windowResizeBehavior(.disabled)
        .windowMinimizeBehavior(.disabled)
        .windowFullScreenBehavior(.disabled)
    }

    var settingsDivider: some View {
        Divider()
            .padding(.leading, 160)
            .padding(.vertical, 4)
    }

    private func settingsPickerRow<Value: Hashable & Identifiable & SettingsTitleProviding>(
        _ rowTitle: String,
        selection: Binding<Value>
    ) -> some View where Value.AllCases: RandomAccessCollection, Value: CaseIterable {
        SettingsLabeledRow(rowTitle) {
            Picker(rowTitle, selection: selection) {
                ForEach(Value.allCases) { value in
                    Text(title(for: value)).tag(value)
                }
            }
            .labelsHidden()
        }
    }

    @_transparent
    func title(for value: some SettingsTitleProviding) -> String {
        value.title
    }

    @_transparent
    func allModeTitles() -> [String] {
        ColorSchemeMode.allCases.map { $0.title }
    }

    var sortMode: Binding<SortMode> {
        Binding(
            get: { SortMode(rawValue: sortModeRawValue) ?? .dateEdited },
            set: { sortModeRawValue = $0.rawValue }
        )
    }

    var colorSchemeMode: Binding<ColorSchemeMode> {
        Binding(
            get: { ColorSchemeMode(rawValue: colorSchemeModeRawValue) ?? .system },
            set: { colorSchemeModeRawValue = $0.rawValue }
        )
    }
}

protocol SettingsTitleProviding {
    var title: String { get }
}

enum SortMode: String, CaseIterable, Identifiable, SettingsTitleProviding {
    case dateEdited
    case dateCreated
    case title

    var id: Self { self }

    var title: String {
        switch self {
        case .dateEdited:
            "First Choice"
        case .dateCreated:
            "Second Choice"
        case .title:
            "Third Choice"
        }
    }
}

enum SettingsStorageKey: String {
    case sortMode
    case colorSchemeMode
    case sampleToggle
    case defaultTextSize
    case useDarkBackgrounds
}

struct SettingsToggleLabel: View {
    let title: String
    let message: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)

            Text(message)
                .font(.callout)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

struct SettingsToggleRow: View {
    let title: String
    let message: String?
    @Binding var isOn: Bool

    init(title: String, message: String? = nil, isOn: Binding<Bool>) {
        self.title = title
        self.message = message
        _isOn = isOn
    }

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Color.clear
                .frame(width: 140)

            Toggle(isOn: $isOn) {
                if let message {
                    SettingsToggleLabel(title: title, message: message)
                } else {
                    Text(title)
                }
            }

            Spacer(minLength: 0)
        }
    }
}

struct SettingsLabeledRow<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    init(_ title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        HStack(alignment: .center, spacing: 16) {
            Text(title)
                .frame(width: 140, alignment: .trailing)

            content

            Spacer(minLength: 0)
        }
    }
}

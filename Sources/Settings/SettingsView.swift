import SwiftUI

struct SettingsView: View {
    @AppStorage(SettingsStorageKey.sortMode.rawValue) var sortMode: SortMode = .dateEdited
    @AppStorage(SettingsStorageKey.colorSchemeMode.rawValue) var colorSchemeMode: ColorSchemeMode = .system
    @AppStorage(SettingsStorageKey.sampleToggle.rawValue) private var sampleToggle = true
    @AppStorage(SettingsStorageKey.defaultTextSize.rawValue) private var defaultTextSize = 14.0
    @AppStorage(SettingsStorageKey.useDarkBackgrounds.rawValue) private var useDarkBackgrounds = true

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            settingsPickerRow("Sample option one:", selection: $sortMode)

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
                Picker("Appearance", selection: $colorSchemeMode) {
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
                    Text(value.title).tag(value)
                }
            }
            .labelsHidden()
        }
    }

    func title(for value: some SettingsTitleProviding) -> String {
        value.title
    }

    func allModeTitles() -> [String] {
        ColorSchemeMode.allCases.map(\.title)
    }
}

#Preview {
    SettingsView()
}

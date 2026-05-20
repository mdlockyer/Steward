import SwiftUI

protocol SettingsTitleProviding {
    var title: String { get }
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

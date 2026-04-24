import SwiftUI

struct ContentView: View {
    @State private var selection: Screen? = .loremIpsum
    @Binding var colorSchemeMode: ColorSchemeMode

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("Lorem") {
                    Label("Lorem Ipsum", systemImage: "snowflake")
                        .tag(Screen.loremIpsum)

                    Label("Dolor Sit", systemImage: "wind.snow")
                        .tag(Screen.dolorSit)
                }
            }
            .listStyle(.sidebar)
        } detail: {
            detailView
        }
        .toolbar {
            ToolbarItem {
                Picker("Appearance", selection: $colorSchemeMode) {
                    Image(systemName: "sun.max")
                        .tag(ColorSchemeMode.light)
                        .accessibilityLabel("Light Appearance")
                    Image(systemName: "moon.fill")
                        .tag(ColorSchemeMode.dark)
                        .accessibilityLabel("Dark Appearance")
                    Image(systemName: "circle.lefthalf.filled")
                        .tag(ColorSchemeMode.system)
                        .accessibilityLabel("Inherit the system appearance")
                }
                .pickerStyle(.segmented)
                .glassEffect()
                .labelsHidden()
                .help("Choose the app appearance")
            }
        }
        .toolbarBackgroundVisibility(.hidden, for: .windowToolbar)
    }

    @ViewBuilder
    private var detailView: some View {
        switch selection ?? .loremIpsum {
        case .loremIpsum:
            DetailScreen(
                title: "Lorem Ipsum",
                message: "Lorem ipsum dolor sit amet."
            )
        case .dolorSit:
            DetailScreen(
                title: "Dolor Sit",
                message: "Dolor sit amet, consectetur adipiscing elit."
            )
        }
    }
}

private enum Screen: Hashable {
    case loremIpsum
    case dolorSit
}

enum ColorSchemeMode: String, CaseIterable, Hashable, Identifiable {
    case system
    case light
    case dark

    var id: Self { self }

    var title: String {
        switch self {
        case .system:
            "Automatic"
        case .light:
            "Light"
        case .dark:
            "Dark"
        }
    }
}

private struct DetailScreen: View {
    let title: String
    let message: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.largeTitle)

            Text(message)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(24)
        .navigationTitle(title)
    }
}

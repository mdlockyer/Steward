import SwiftUI

struct ContentView: View {
    @State private var selection: Screen?
    @Binding var colorSchemeMode: ColorSchemeMode

    init(colorSchemeMode: Binding<ColorSchemeMode>, initialSelection: Screen? = .loremIpsum) {
        self._colorSchemeMode = colorSchemeMode
        self._selection = State(initialValue: initialSelection)
    }

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("Lorem") {
                    ForEach(Screen.allCases) { screen in
                        Label(screen.title, systemImage: screen.systemImage)
                            .tag(screen)
                    }
                }
            }
            .listStyle(.sidebar)
        } detail: {
            detailView
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
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
                // Must be .automatic (not .hidden): suppressing the toolbar background
                // removes the glass material that scrollEdgeEffectStyle renders against,
                // causing the top edge effect to silently do nothing.
                .toolbarBackgroundVisibility(.automatic, for: .windowToolbar)
        }
    }

    @ViewBuilder
    var detailView: some View {
        (selection ?? .loremIpsum).destination
    }
}

#Preview {
    ContentView(colorSchemeMode: .constant(.system))
        .frame(width: 960, height: 640)
}

import SwiftUI

struct ContentView: View {
    @State private var selection: Screen?
    @State private var columnVisibility: NavigationSplitViewVisibility = .all
    @Binding var colorSchemeMode: ColorSchemeMode
    @Environment(\.colorScheme) private var colorScheme

    init(colorSchemeMode: Binding<ColorSchemeMode>, initialSelection: Screen? = .desk) {
        self._colorSchemeMode = colorSchemeMode
        self._selection = State(initialValue: initialSelection)
    }

    private var activeScreen: Screen { selection ?? .desk }

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            List(selection: $selection) {
                ForEach(Screen.allCases) { screen in
                    Label(screen.title, systemImage: screen.systemImage)
                        .tag(screen)
                }
            }
            .listStyle(.sidebar)
        } detail: {
            // The detail is ONE persistent WebView, not a per-screen view. The
            // sidebar selection doesn't swap this — it pushes a `navigate` event
            // into the web app, which changes the page internally. The native
            // title still tracks the selection so the window chrome feels native.
            //
            // GeometryReader reads the safe-area insets (the top inset is the
            // toolbar height); the WebView then draws full-bleed under the
            // toolbar and the web content pads itself by that amount, so content
            // scrolls beneath the glass exactly like the old native screens did.
            GeometryReader { proxy in
                WebContentView(
                    screenID: activeScreen.rawValue,
                    colorScheme: colorScheme,
                    safeAreaInsets: proxy.safeAreaInsets,
                    // Web-initiated navigation (Inspector → Studio, crystallize →
                    // Desk) mirrors its route back so the native sidebar highlight
                    // stays in sync with what the page is showing.
                    onRouteChange: { id in
                        if let screen = Screen(rawValue: id) { selection = screen }
                    }
                )
                // Slide under the top glass toolbar only. Respecting the leading
                // edge keeps the WebView out from under the translucent sidebar,
                // so web content is never occluded by it (the leading safe-area
                // inset the split view reports IS the sidebar width).
                .ignoresSafeArea(edges: [.top, .bottom])
            }
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
            // removes the glass material the WebView content scrolls beneath.
            .toolbarBackgroundVisibility(.automatic, for: .windowToolbar)
            .navigationTitle(activeScreen.title)
        }
        // Tile the sidebar beside the detail. Without this the automatic style
        // picks the prominent-detail presentation and floats the sidebar as a
        // translucent overlay over the full-bleed WebView (the detail ignores its
        // safe area), occluding the web content's leading edge.
        .navigationSplitViewStyle(.balanced)
    }
}

#Preview {
    ContentView(colorSchemeMode: .constant(.system))
        .frame(width: 960, height: 640)
}

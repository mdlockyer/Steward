import SwiftUI

/// The window is a hollow shell around the web app. There is no native sidebar,
/// toolbar, or navigation chrome — a single full-bleed `WKWebView` fills the
/// window, and the web app supplies its own sidebar and headers exactly as it
/// does in a browser. The only native chrome is the transparent titlebar's
/// traffic lights, which float over the top-left.
struct ContentView: View {
    @Binding var colorSchemeMode: ColorSchemeMode
    @Environment(\.colorScheme) private var colorScheme

    init(colorSchemeMode: Binding<ColorSchemeMode>) {
        self._colorSchemeMode = colorSchemeMode
    }

    var body: some View {
        WebContentView(colorScheme: colorScheme)
            // Draw under the (hidden) titlebar so the web app is truly edge-to-edge;
            // the web sidebar pads its own top to clear the traffic lights.
            .ignoresSafeArea()
    }
}

#Preview {
    ContentView(colorSchemeMode: .constant(.system))
        .frame(width: 1100, height: 720)
}

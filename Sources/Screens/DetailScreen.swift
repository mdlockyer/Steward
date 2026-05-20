import SwiftUI

// Reusable scaffold for new placeholder screens — see Screen.destination for the registry.
struct DetailScreen: View {
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

#Preview {
    DetailScreen(title: "Sample Title", message: "Sample supporting message.")
        .frame(width: 720, height: 600)
}

import SwiftUI

// MARK: - Lorem Ipsum Screen (cards)

struct LoremIpsumScreen: View {
    private struct Card: Identifiable {
        let id = UUID()
        let title: String
        let body: String
    }

    private let cards: [Card] = [
        Card(
            title: "Consectetur Adipiscing",
            body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."
        ),
        Card(
            title: "Ullamco Laboris",
            body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt."
        ),
        Card(
            title: "Sunt in Culpa",
            body: "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error."
        ),
        Card(
            title: "Officia Deserunt",
            body: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        ),
        Card(
            title: "Nemo Enim Ipsam",
            body: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est."
        ),
        Card(
            title: "Veritatis et Quasi",
            body: "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit."
        ),
        Card(
            title: "Architecto Beatae",
            body: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit. Ut labore et dolore magnam aliquam quaerat voluptatem."
        ),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Lorem Ipsum")
                    .font(.largeTitle)
                    .padding(.bottom, 4)

                ForEach(cards) { card in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(card.title)
                            .font(.headline)
                        Text(card.body)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.background, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(.separator, lineWidth: 0.5))
                }
            }
            .padding(24)
        }
        // Scroll-under-toolbar glass effect recipe:
        // - scrollContentBackground + background(.clear): makes the scroll view transparent
        //   so the toolbar's glass material is visible as content passes beneath it.
        // - scrollEdgeEffectStyle(.soft): applies a gradient fade where content meets the top
        //   safe area boundary. Requires toolbarBackgroundVisibility(.automatic) on the parent.
        // - safeAreaInset bottom: registers a non-zero bottom safe area so content isn't
        //   clipped behind any bottom bar.
        .scrollContentBackground(.hidden)
        .background(.clear)
        .scrollEdgeEffectStyle(.soft, for: .top)
        .safeAreaInset(edge: .bottom, spacing: 0) { Color.clear.frame(height: 56) }
        .navigationTitle("Lorem Ipsum")
    }
}

#Preview {
    LoremIpsumScreen()
        .frame(width: 720, height: 600)
}

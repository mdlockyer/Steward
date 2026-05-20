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
                    Label("Lorem Ipsum", systemImage: "snowflake")
                        .tag(Screen.loremIpsum)

                    Label("Dolor Sit", systemImage: "wind.snow")
                        .tag(Screen.dolorSit)
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
        switch selection ?? .loremIpsum {
        case .loremIpsum:
            LoremIpsumScreen()
        case .dolorSit:
            DolorSitScreen()
        }
    }
}

struct TestView<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    var body: some View { content }
}

enum Screen: Hashable {
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

// MARK: - Dolor Sit Screen (list rows)

struct DolorSitScreen: View {
    private struct Row: Identifiable {
        let id = UUID()
        let icon: String
        let title: String
        let subtitle: String
    }

    private let rows: [Row] = [
        Row(icon: "doc.text",       title: "Lorem Ipsum Document",   subtitle: "Dolor sit amet, consectetur adipiscing elit"),
        Row(icon: "folder",         title: "Consectetur Folder",     subtitle: "Sed do eiusmod tempor incididunt ut labore"),
        Row(icon: "star",           title: "Adipiscing Favourite",   subtitle: "Ut enim ad minim veniam quis exercitation"),
        Row(icon: "bookmark",       title: "Dolore Magna Bookmark",  subtitle: "Ullamco laboris nisi ut aliquip ex commodo"),
        Row(icon: "tag",            title: "Magna Aliqua Tag",       subtitle: "Duis aute irure dolor in reprehenderit"),
        Row(icon: "clock",          title: "Voluptate History",      subtitle: "Velit esse cillum dolore eu fugiat nulla"),
        Row(icon: "bell",           title: "Pariatur Notification",  subtitle: "Excepteur sint occaecat cupidatat non proident"),
        Row(icon: "person",         title: "Culpa Qui Officia",      subtitle: "Deserunt mollit anim id est laborum lorem"),
        Row(icon: "map",            title: "Perspiciatis Unde",      subtitle: "Omnis iste natus error sit voluptatem"),
        Row(icon: "photo",          title: "Accusantium Image",      subtitle: "Doloremque laudantium totam rem aperiam"),
        Row(icon: "music.note",     title: "Eaque Ipsa Audio",       subtitle: "Quae ab illo inventore veritatis quasi"),
        Row(icon: "gear",           title: "Architecto Beatae",      subtitle: "Vitae dicta sunt explicabo nemo enim ipsam"),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Dolor Sit")
                    .font(.largeTitle)
                    .padding(.bottom, 16)

                ForEach(rows) { row in
                    Divider()
                    HStack(spacing: 14) {
                        Image(systemName: row.icon)
                            .font(.title2)
                            .foregroundStyle(.tint)
                            .frame(width: 32, alignment: .center)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(row.title)
                                .font(.body)
                            Text(row.subtitle)
                                .font(.callout)
                                .foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(.vertical, 10)
                }
                Divider()
            }
            .padding(24)
        }
        // See LoremIpsumScreen for a full explanation of this recipe.
        .scrollContentBackground(.hidden)
        .background(.clear)
        .scrollEdgeEffectStyle(.soft, for: .top)
        .safeAreaInset(edge: .bottom, spacing: 0) { Color.clear.frame(height: 56) }
        .navigationTitle("Dolor Sit")
    }
}

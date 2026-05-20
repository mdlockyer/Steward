import SwiftUI

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

#Preview {
    DolorSitScreen()
        .frame(width: 720, height: 600)
}

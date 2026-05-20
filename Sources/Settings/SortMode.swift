import Foundation

enum SortMode: String, CaseIterable, Identifiable, SettingsTitleProviding {
    case dateEdited
    case dateCreated
    case title

    var id: Self { self }

    var title: String {
        switch self {
        case .dateEdited:
            "First Choice"
        case .dateCreated:
            "Second Choice"
        case .title:
            "Third Choice"
        }
    }
}

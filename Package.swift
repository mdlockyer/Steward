// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "SwiftUITemplate",
    platforms: [
        .macOS(.v26)
    ],
    products: [
        .executable(
            name: "SwiftUITemplate",
            targets: ["SwiftUITemplate"]
        )
    ],
    targets: [
        .executableTarget(
            name: "SwiftUITemplate",
            linkerSettings: [
                .unsafeFlags([
                    "-Xlinker", "-sectcreate",
                    "-Xlinker", "__TEXT",
                    "-Xlinker", "__info_plist",
                    "-Xlinker", "Sources/EmbeddedInfo.plist"
                ])
            ]
        ),
        .testTarget(
            name: "SwiftUITemplateTests",
            dependencies: ["SwiftUITemplate"]
        )
    ],
    swiftLanguageModes: [.v6]
)

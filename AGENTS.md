# AGENTS.md

## Project Shape

- This is a standalone Swift Package macOS SwiftUI app; there is intentionally no `.xcodeproj` or `.xcworkspace`.
- Open `Package.swift` directly in Xcode and run the `SwiftUITemplate` scheme for the normal Xcode development path.
- The executable target uses flat sources under `Sources/` rather than `Sources/SwiftUITemplate/`.

## Commands

- Build a real app bundle with `make build`; output is `build/app/SwiftUITemplate.app`.
- Build and launch the app bundle with `make run`; this calls `run-app.sh`, which rebuilds via `build-app.sh` before `open`.
- Clean packaged outputs with `make clean`; this removes `build/` only, not SwiftPM `.build/`.
- Run package tests with `swift test`. Current verification fails because `Tests/SwiftUITemplateTests/SwiftUITemplateTests.swift` calls `ContentView()` but `ContentView` requires `colorSchemeMode:`.

## Packaging Gotchas

- `build-app.sh` requires Apple command line tools/Xcode (`xcodebuild`, `plutil`, optional `codesign`) and writes the Xcode build log to `/tmp/${APP_NAME}-xcodebuild.log`.
- `APP_NAME`, `BUNDLE_IDENTIFIER`, `CONFIGURATION`, `MIN_SYSTEM_VERSION`, `VERSION`, `BUILD`, `DERIVED_DATA_PATH`, and `OUTPUT_DIR` can override packaging defaults. `APP_NAME` is also used as the xcodebuild scheme and executable lookup name, so keep it aligned with the package product/scheme.
- There are two plist sources: `Sources/EmbeddedInfo.plist` is linked into the executable for direct SwiftPM/Xcode Run behavior, while `Resources/Info.plist.template` is used when producing the `.app` bundle.
- `Package.swift` embeds `Sources/EmbeddedInfo.plist` through linker `unsafeFlags`; do not move or rename that plist without updating the linker path.
- `swift test` currently warns that `Sources/EmbeddedInfo.plist` is unhandled; that file is intentionally not a package resource because it is consumed by the linker flags.

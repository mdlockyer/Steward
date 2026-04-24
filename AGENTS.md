# AGENTS.md

## Project Shape

- This is a standalone Swift Package macOS SwiftUI app; there is intentionally no `.xcodeproj` or `.xcworkspace`.
- Open `Package.swift` directly in Xcode and run the `SwiftUITemplate` scheme for the normal Xcode development path.
- The executable target uses flat sources under `Sources/` rather than `Sources/SwiftUITemplate/`.

## Commands

- Build a real app bundle with `make build`; output is `Build/app/SwiftUITemplate.app`.
- Build and launch the app bundle with `make run`; this calls `./Scripts/run-app.sh`, which rebuilds via `./Scripts/build-app.sh` before `open`.
- Clean packaged outputs with `make clean`; this removes `Build/` only, not SwiftPM `.Build/`.
- Run package tests with `swift test`.

## Packaging Gotchas

- `./Scripts/build-app.sh` requires Apple command line tools/Xcode (`xcodebuild`, `plutil`, `actool`, `iconutil`, optional `codesign`) and writes the Xcode build log to `/tmp/${APP_NAME}-xcodebuild.log`.
- `APP_NAME`, `BUNDLE_IDENTIFIER`, `CONFIGURATION`, `MIN_SYSTEM_VERSION`, `VERSION`, `BUILD`, `DERIVED_DATA_PATH`, and `OUTPUT_DIR` can override packaging defaults. `APP_NAME` is also used as the xcodebuild scheme and executable lookup name, so keep it aligned with the package product/scheme.
- There are two plist sources: `Sources/EmbeddedInfo.plist` is linked into the executable for direct SwiftPM/Xcode Run behavior, while `Resources/Info.plist.template` is used when producing the `.app` bundle.
- `Package.swift` embeds `Sources/EmbeddedInfo.plist` through linker `unsafeFlags`; do not move or rename that plist without updating the linker path.
- `swift test` currently warns that `Sources/EmbeddedInfo.plist` is unhandled; that file is intentionally not a package resource because it is consumed by the linker flags.

## App Icon Pipeline

- Source art: `Resources/AppIcon.icon/Assets/` contains the SVG sources
  (`01-background.svg`, `02-frame 3.svg`, `03-asterisk.svg`).
- Build script (`./Scripts/build-app.sh`) compiles these via `actool` into:
  - `AppIcon.icns` — legacy icon format
  - `Assets.car` — asset catalog format
- Both are embedded in `Contents/Resources/` of the built `.app` bundle.
- To update the icon: edit the SVG sources in `Resources/AppIcon.icon/Assets/`,
  then rebuild with `make build`.

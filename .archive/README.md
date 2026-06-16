# SwiftUITemplate

Minimal macOS SwiftUI window app as a standalone Swift Package.

## What this is

- No `.xcodeproj`
- Open the package directly in Xcode
- Uses a normal Swift Package manifest and executable target
- Includes a tiny Apple-toolchain packaging script that wraps the built executable into a real `.app` bundle

## Quick start

### Open in Xcode

Open `Package.swift` in Xcode.

### Run from Xcode

Select the `SwiftUITemplate` scheme and run it.

### Build a `.app` bundle from Terminal

```bash
make build
```

Output:

```bash
Build/app/SwiftUITemplate.app
```

### Build and launch

```bash
make run
```

## Configuration

Override these when needed:

```bash
APP_NAME=MyApp \
BUNDLE_IDENTIFIER=com.example.MyApp \
MIN_SYSTEM_VERSION=15.0 \
VERSION=1.0 \
BUILD=1 \
./Scripts/build-app.sh
```

## Notes

- The package itself stays in the standard standalone Swift package shape.
- The final `.app` is produced without introducing an Xcode project file.
- The packaging step uses Apple tooling (`xcodebuild`, `plutil`, `codesign`) and a minimal `Info.plist` template.


## Notes on package-run behavior

Xcode's normal Run action for a standalone executable package launches the built executable directly, not a packaged `.app` bundle. To keep the template `.xcodeproj`-free while still making that Run path behave like an app, this template embeds an `Info.plist` into the executable at link time and also provides the packaging script for building a real `.app` bundle.

The real app bundle build path remains:

```sh
make build
```

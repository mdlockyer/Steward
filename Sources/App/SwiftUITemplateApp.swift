import AppKit
import SwiftUI

@main
struct SwiftUITemplateApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @AppStorage(SettingsStorageKey.colorSchemeMode.rawValue) private var colorSchemeMode: ColorSchemeMode = .system

    init() {
        NSWindow.allowsAutomaticWindowTabbing = false
        NSApplication.shared.setActivationPolicy(.regular)

        DispatchQueue.main.async {
            NSApp.activate(ignoringOtherApps: true)
        }
    }

    var body: some Scene {
        Window("SwiftUITemplate", id: "main") {
            ContentView(colorSchemeMode: $colorSchemeMode)
                .onAppear {
                    applyColorScheme()
                }
                .onChange(of: colorSchemeMode) {
                    applyColorScheme()
                }
        }
        .commands {
            CommandGroup(replacing: .windowArrangement) {
            }
        }

        Settings {
            SettingsView()
        }
        .defaultSize(width: 560, height: 340)
    }

    private func applyColorScheme() {
        NSApp.appearance = colorSchemeMode.nsAppearance
    }
}

@MainActor
private final class AppDelegate: NSObject, NSApplicationDelegate, NSMenuDelegate {
    private var menuObservers: [NSObjectProtocol] = []

    func applicationDidFinishLaunching(_ notification: Notification) {
        removeEditMenu()
        installWindowMenuDelegate()

        DispatchQueue.main.async {
            self.removeEditMenu()
            self.removeUnsupportedWindowMenuItems()
            self.configureMainWindow()
        }
    }

    func menuNeedsUpdate(_ menu: NSMenu) {
        guard menu == windowMenu else {
            return
        }

        removeUnsupportedWindowMenuItems()
    }

    private func removeUnsupportedWindowMenuItems() {
        guard let windowMenu else {
            return
        }

        removeMenuItems(
            titled: ["Bring All to Front", "Remove Window from Set"],
            from: windowMenu
        )
    }

    private func installWindowMenuDelegate() {
        guard let windowMenu else {
            return
        }

        windowMenu.delegate = self
        installWindowMenuObservers(for: windowMenu)
        windowMenu.update()
    }

    private var windowMenu: NSMenu? {
        NSApp.windowsMenu ?? NSApp.mainMenu?.items.first(where: { $0.title == "Window" })?.submenu
    }

    private func installWindowMenuObservers(for menu: NSMenu) {
        let center = NotificationCenter.default

        let addedObserver = center.addObserver(
            forName: NSMenu.didAddItemNotification,
            object: menu,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.removeUnsupportedWindowMenuItems()
            }
        }

        let changedObserver = center.addObserver(
            forName: NSMenu.didChangeItemNotification,
            object: menu,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.removeUnsupportedWindowMenuItems()
            }
        }

        menuObservers.append(contentsOf: [addedObserver, changedObserver])
    }

    private func configureMainWindow() {
        guard let window = NSApp.windows.first(where: { $0.canBecomeMain }) else { return }
        window.minSize = NSSize(width: 760, height: 420)
        if window.frame.width < 960 || window.frame.height < 640 {
            window.setContentSize(NSSize(width: 960, height: 640))
            window.center()
        }
    }

    private func removeEditMenu() {
        guard let mainMenu = NSApp.mainMenu,
              let editMenuItem = mainMenu.items.first(where: { $0.title == "Edit" })
        else {
            return
        }

        mainMenu.removeItem(editMenuItem)
    }

    private func removeMenuItems(titled titles: Set<String>, from menu: NSMenu) {
        for item in menu.items.reversed() {
            if let submenu = item.submenu {
                removeMenuItems(titled: titles, from: submenu)
            }

            if titles.contains(item.title) {
                menu.removeItem(item)
            }
        }
    }
}

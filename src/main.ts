import { app, BrowserWindow, Tray, shell, ipcMain } from "electron";
// Vite-Forge injected constants for renderer entries
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
declare const TRAY_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const TRAY_WINDOW_VITE_NAME: string;
import path from "node:path";
import started from "electron-squirrel-startup";
import { exec } from "child_process";
import os from "os";
import Store from "electron-store";

// Initialize electron-store for persisting settings window bounds
const store = new Store();

// Keep reference so the Tray isn't garbage-collected
let tray: Tray | null = null;
let settingsWindow: BrowserWindow | null = null;
let trayWindow: BrowserWindow | null = null;

// When running in development
let iconPath: string;
if (app.isPackaged) {
  iconPath = path.join(
    process.resourcesPath,
    "assets",
    "IconEnergyTemplate.png"
  );
} else {
  iconPath = path.join(process.cwd(), "assets", "IconEnergyTemplate.png");
}

function createTray() {
  tray = new Tray(iconPath);

  tray.on("click", (_event, bounds) => {
    const windowWidth = 320;
    const windowHeight = 420;

    const x = Math.round(bounds.x - windowWidth / 2);
    const y = Math.round(bounds.y - windowHeight);

    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.setBounds({ x, y, width: windowWidth, height: windowHeight });
      trayWindow.isVisible() ? trayWindow.hide() : trayWindow.show();
      return;
    }

    trayWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      frame: false,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      fullscreenable: false,
      backgroundColor: "#00000000",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load from the Vite dev server in development
    // In production, load the bundled version
    if (TRAY_WINDOW_VITE_DEV_SERVER_URL) {
      // Development: load from Vite dev server
      const windowurl = `${TRAY_WINDOW_VITE_DEV_SERVER_URL}/src/renderer/tray_window/index.html`;
      trayWindow.loadURL(windowurl);
      console.log("Loading tray window from dev server", windowurl);
    } else {
      trayWindow.loadFile(
        path.join(
          __dirname,
          `../renderer/${TRAY_WINDOW_VITE_NAME ?? "tray_window"}/index.html`
        )
      );
    }

    trayWindow.once("ready-to-show", () => trayWindow?.show());
    trayWindow.on("blur", () => trayWindow?.hide());
    trayWindow.on("closed", () => {
      trayWindow = null;
    });
  });
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    return;
  }

  const savedBounds = (store.get(
    "settingsWindowBounds"
  ) as Electron.Rectangle) ?? {
    width: 670,
    height: 670,
    x: undefined,
    y: undefined,
  };

  settingsWindow = new BrowserWindow({
    ...savedBounds,
    minWidth: 570,
    minHeight: 570,
    maxWidth: 770,
    maxHeight: 770,
    frame: false,
    titleBarStyle: "hidden",
    show: false,
    fullscreenable: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // A simple placeholder HTML will be created later in /views
  settingsWindow.loadFile("views/settings.html");

  settingsWindow.once("ready-to-show", () => {
    setTimeout(() => settingsWindow?.show(), 240);
  });

  settingsWindow.on("close", () => {
    if (!settingsWindow?.isDestroyed()) {
      store.set("settingsWindowBounds", settingsWindow?.getBounds());
    }
  });

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

function openVSCodeNewWindow() {
  const script =
    'osascript -e \'tell application "Visual Studio Code" to activate\' -e \'tell application "System Events" to keystroke "n" using {shift down, command down}\'';
  exec(script, (err) => {
    if (err) console.error("Error opening new VS Code window:", err);
  });
}

function openFinderAtHome() {
  const homeDir = os.homedir();
  const script = `osascript -e 'tell application "Finder" to make new Finder window to POSIX file "${homeDir}"'`;
  exec(script, (err) => {
    if (err) console.error("Error opening Finder:", err);
  });
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log("Loading main window from dev server");
    // Try the standard forge path first (e.g. http://localhost:5173/renderer/main_window/index.html)
    const devUrl = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/renderer/main_window/index.html`;
    mainWindow.loadURL(devUrl).catch(() => {
      console.log("Failed to load dev URL", devUrl);
      // Fallback to direct root if the plugin serves at /main_window/index.html
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL!);
    });
  } else {
    console.log("Loading main window from production");
    // Production: use renderer bundle created by Forge Vite plugin
    mainWindow.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME ?? "main_window"}/index.html`
      )
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createTray();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  console.log("All windows were closed.");
  // Keep app running so tray survives unless user quits explicitly
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// ──────────────────────────────────────────
// IPC handlers for renderer→main actions
// ──────────────────────────────────────────
ipcMain.on("open-browser", (_evt, browser: string) => {
  exec(`open -n -a "${browser}"`);
});

ipcMain.on("open-vscode", () => openVSCodeNewWindow());
ipcMain.on("open-home", () => openFinderAtHome());
ipcMain.on("open-github", () =>
  shell.openExternal("https://github.com/sebfried/menubarmaid")
);
ipcMain.on("quit-app", () => app.quit());

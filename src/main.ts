import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  shell,
  nativeImage,
  ipcMain,
} from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { exec } from "child_process";
import os from "os";
import { menubar } from "menubar";
import Store from "electron-store";
import fs from "fs";

// Initialize electron-store for persisting settings window bounds
const store = new Store();

// Keep reference so the Tray isn't garbage-collected
let tray: Tray | null = null;
let settingsWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;

// When running in development
let iconPath: string;
if (app.isPackaged) {
  iconPath = path.join(process.resourcesPath, "assets", "IconEnergyTemplate.png");
} else {
  iconPath = path.join(process.cwd(), "assets", "IconEnergyTemplate.png");
}

function createTray() {
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Browser",
      submenu: [
        {
          label: "Firefox",
          accelerator: "Command+F",
          click: () => exec('open -n -a "Firefox"'),
        },
        {
          label: "Librewolf",
          accelerator: "Command+L",
          click: () => exec('open -n -a "Librewolf"'),
        },
        {
          label: "Brave Browser",
          accelerator: "Command+B",
          click: () => exec('open -n -a "Brave Browser"'),
        },
        {
          label: "Google Chrome",
          accelerator: "Command+G",
          click: () => exec('open -n -a "Google Chrome"'),
        },
        {
          label: "Microsoft Edge",
          accelerator: "Command+M",
          click: () => exec('open -n -a "Microsoft Edge"'),
        },
      ],
    },
    {
      label: "Open Visual Studio Code",
      accelerator: "Command+V",
      click: openVSCodeNewWindow,
    },
    {
      label: "Open Home Directory",
      accelerator: "Command+H",
      click: openFinderAtHome,
    },
    { type: "separator" },
    {
      label: "GitHub",
      accelerator: "Command+,?",
      click: () =>
        shell.openExternal("https://github.com/sebfried/menubarmaid"),
    },
    {
      label: "Settings...",
      accelerator: "Command+,",
      click: openSettingsWindow,
    },
    { type: "separator" },
    { label: "⏻ Quit Menu Barmaid", accelerator: "Command+Q", role: "quit" },
  ]);
  tray.setContextMenu(contextMenu);

  // Optional menubar helper (creates invisible window & keeps tray reliable)
  menubar({ tray });
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

const desktopDir = path.join(os.homedir(), "Desktop");

function readScreenshots(): string[] {
  try {
    const files = fs.readdirSync(desktopDir);
    return files
      .filter((f) =>
        /screenshot/i.test(f) && /\.(png|jpe?g|gif|bmp|webp)$/i.test(f)
      )
      .map((f) => path.join(desktopDir, f));
  } catch (e) {
    console.error("Failed reading Desktop", e);
    return [];
  }
}

function watchScreenshots() {
  fs.watch(desktopDir, { persistent: false }, () => {
    if (mainWindow) {
      mainWindow.webContents.send("screenshots-updated", readScreenshots());
    }
  });
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow?.webContents.send("screenshots-updated", readScreenshots());
  });
}; 

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createTray();
  createWindow();
  watchScreenshots();

  ipcMain.handle("get-screenshots", () => readScreenshots());
  ipcMain.handle("open-file", (_e, p: string) => shell.openPath(p));
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

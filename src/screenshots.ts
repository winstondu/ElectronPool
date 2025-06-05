import fs from "fs";
import os from "os";
import path from "node:path";
import { BrowserWindow } from "electron";

const desktopDir = path.join(os.homedir(), "Desktop");

export function readScreenshots(): string[] {
  try {
    const files = fs.readdirSync(desktopDir);
    return files
      .filter(
        (f) => /screenshot/i.test(f) && /\.(png|jpe?g|gif|bmp|webp)$/i.test(f)
      )
      .map((f) => path.join(desktopDir, f));
  } catch (e) {
    console.error("Failed reading Desktop", e);
    return [];
  }
}

export function watchScreenshots(window: BrowserWindow | null) {
  fs.watch(desktopDir, { persistent: false }, () => {
    if (window) {
      window.webContents.send("screenshots-updated", readScreenshots());
    }
  });
}

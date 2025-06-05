/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./index.css";

declare global {
  interface Window {
    electronAPI: {
      getScreenshots: () => Promise<string[]>;
      onScreenshotsUpdated: (cb: (paths: string[]) => void) => void;
      openFile: (p: string) => Promise<void>;
    };
  }
}

const grid = document.getElementById("grid") as HTMLElement;

function renderGrid(paths: string[]) {
  grid.innerHTML = "";
  paths.forEach((p) => {
    const item = document.createElement("div");
    item.className = "grid-item";
    const img = document.createElement("img");
    img.src = `file://${p}`;
    item.appendChild(img);
    item.ondblclick = () => window.electronAPI.openFile(p);
    grid.appendChild(item);
  });
}

window.electronAPI.getScreenshots().then(renderGrid);
window.electronAPI.onScreenshotsUpdated(renderGrid);


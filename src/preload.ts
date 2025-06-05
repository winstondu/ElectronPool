// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  openBrowser: (browser: string) => ipcRenderer.send("open-browser", browser),
  openVSCode: () => ipcRenderer.send("open-vscode"),
  openHome: () => ipcRenderer.send("open-home"),
  openGitHub: () => ipcRenderer.send("open-github"),
  quitApp: () => ipcRenderer.send("quit-app"),
});

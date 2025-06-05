import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getScreenshots: () => ipcRenderer.invoke("get-screenshots"),
  onScreenshotsUpdated: (cb: (paths: string[]) => void) =>
    ipcRenderer.on("screenshots-updated", (_e, paths) => cb(paths)),
  openFile: (p: string) => ipcRenderer.invoke("open-file", p),
});


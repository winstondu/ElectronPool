# Electron Pool – Menu Barmaid

Tiny macOS menu-bar utility built with **Electron Forge + Vite + TypeScript**.
It adds a tray icon that opens browsers, VS Code, Finder at ~, and a small Settings window.

---
## 1  Prerequisites
| Tool | Version |
|------|---------|
| Node | ≥ 18 (tested on 20+) |
| Yarn or npm | latest LTS |
| macOS | required for AppleScript helpers |

```bash
# macOS only – ensure Xcode CLT for node-gyp
xcode-select --install   # if not installed
```

---
## 2  Project Setup (first time)
```bash
git clone <repo-url>
cd electron-pool

# install deps (peer warnings OK)
yarn install        # or: npm install --legacy-peer-deps
```

### 🔑 Notes
* Electron 32 is pinned to keep `menubar` happy.
* `electron-store@8.x` is used (9.x not yet published).

---
## 3  Development
```bash
yarn start          # launches Forge in dev-mode
```
The command concurrently:
1. Runs Vite dev server for renderer (`localhost:5173`).
2. Bundles main/preload with esbuild.
3. Starts Electron with live-reload.

---
## 4  Project Layout (simplified)
```
.
├── assets/              # tray icon & screenshots
├── src/
│   ├── main.ts          # Electron main process (tray logic)
│   ├── preload.ts       # Preload (empty by default)
│   ├── renderer.ts      # Example renderer entry
│   └── views/
│       └── settings.html
├── forge.config.ts      # Electron-Forge + Vite plugin
└── package.json
```

---
## 5  Packaging / Distribution
```bash
yarn make              # create dmg/zip in out/ folder
```
The `make` script uses the default **Electron-Forge makers** for macOS (DMG).

---
## 6  Customising the Tray Icon
* Replace `assets/IconEnergyTemplate.png` (+ @2x variant).
* For production, icons are auto-copied to `resources/assets/`.

---
## 7  Troubleshooting
| Symptom | Fix |
|---------|-----|
| Tray icon missing in prod | Ensure icon exists in `assets/` before packaging. |
| Peer-dependency warnings | Safe to ignore with current Electron 32. |
| Type errors for `menubar` | We stub `declare module 'menubar';` in `src/types`. |

Enjoy hacking!

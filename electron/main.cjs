const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

const START_URL = process.env.ELECTRON_START_URL || "http://localhost:8080";
const IS_DEV = !app.isPackaged || Boolean(process.env.ELECTRON_START_URL);

function getAppUrl() {
  if (process.env.ELECTRON_START_URL) return process.env.ELECTRON_START_URL;
  if (!app.isPackaged) return START_URL;
  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  return pathToFileURL(indexPath).toString();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(getAppUrl());

  // In dev, map keyboard refresh to explicit reload so F5/Ctrl+R works reliably.
  if (IS_DEV) {
    win.webContents.on("before-input-event", (event, input) => {
      const isF5 = input.type === "keyDown" && input.key === "F5";
      const isCtrlOrCmdR =
        input.type === "keyDown" &&
        input.key.toLowerCase() === "r" &&
        (input.control || input.meta);

      if (isF5 || isCtrlOrCmdR) {
        event.preventDefault();
        win.webContents
          .executeJavaScript(
            "try { sessionStorage.setItem('__electron_reloading__', '1'); } catch (_) {}",
            true
          )
          .finally(() => {
            win.webContents.reload();
          });
      }
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

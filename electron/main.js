const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");

let mainWindow;
let nextServer;

const PORT = 3456;
const isDev = !app.isPackaged;

// 与 scripts/encrypt-config.js 保持一致
const ENCRYPTION_KEY = Buffer.from(
  process.env.CONFIG_ENCRYPTION_KEY || "oc-workbench-default-key-32bytes!!",
  "utf8"
).subarray(0, 32);

function decrypt(base64, key) {
  const buf = Buffer.from(base64, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext, null, "utf8") + decipher.final("utf8");
}

function loadEncryptedConfig() {
  // 打包后在 resourcesPath，开发时在项目根目录的 resources/
  const encPath = isDev
    ? path.join(__dirname, "..", "resources", "config.enc")
    : path.join(process.resourcesPath, "config.enc");

  if (!fs.existsSync(encPath)) {
    console.warn("[config] config.enc not found, skipping encrypted config");
    return {};
  }

  try {
    const encrypted = fs.readFileSync(encPath, "utf8");
    const plaintext = decrypt(encrypted, ENCRYPTION_KEY);
    return JSON.parse(plaintext);
  } catch (err) {
    console.error("[config] Failed to decrypt config.enc:", err.message);
    return {};
  }
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    const serverPath = isDev
      ? path.join(__dirname, "..")
      : path.join(process.resourcesPath, "app");

    const encryptedConfig = loadEncryptedConfig();

    const env = {
      ...process.env,
      ...encryptedConfig,   // 注入解密后的配置
      PORT: String(PORT),
      NODE_ENV: "production",
      HOSTNAME: "localhost",
    };

    nextServer = spawn(
      "node",
      [
        path.join(serverPath, "node_modules", "next", "dist", "bin", "next"),
        "start",
        "--port",
        String(PORT),
      ],
      { cwd: serverPath, env, stdio: "pipe" }
    );

    nextServer.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[next]", output);
      if (output.includes("Ready") || output.includes(`:${PORT}`)) {
        resolve();
      }
    });

    nextServer.stderr.on("data", (data) => {
      console.error("[next:err]", data.toString());
    });

    nextServer.on("error", reject);

    // Fallback: resolve after 8s even if we didn't see the Ready message
    setTimeout(resolve, 8000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", async () => {
  try {
    await startNextServer();
  } catch (err) {
    console.error("Failed to start Next.js server:", err);
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
    nextServer = null;
  }
});

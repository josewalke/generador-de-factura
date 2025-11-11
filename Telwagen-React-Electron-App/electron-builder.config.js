// Configuración adicional para Electron Builder
const config = {
  appId: "com.telwagen.generador-facturas",
  productName: "Generador de Facturas Telwagen",
  directories: {
    output: "dist-electron"
  },
  files: [
    "electron/**/*",
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  extraResources: [
    {
      from: "../backend",
      to: "backend",
      filter: ["**/*", "!node_modules/**/*", "!logs/**/*", "!temp/**/*"]
    }
  ],
  mac: {
    category: "public.app-category.business",
    icon: "assets/icon.png",
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"]
      }
    ]
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ],
    icon: "assets/icon.png"
  },
  linux: {
    target: [
      {
        target: "AppImage",
        arch: ["x64"]
      }
    ],
    icon: "assets/icon.png"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Telwagen Facturas"
  },
  publish: null
};

module.exports = config;

/* 2>nul
@echo off
setlocal DisableDelayedExpansion
chcp 65001 >nul
title Birarada - AAB Olustur
where.exe node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. https://nodejs.org/ adresinden LTS surumunu kur.
  pause
  exit /b 1
)
node "%~f0"
set "BIRARADA_BUILD_EXIT=%errorlevel%"
pause
exit /b %BIRARADA_BUILD_EXIT%
*/
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { nodeVersionSupported, javaMajor } = require(path.join(sourceRoot(__dirname), "scripts/start-local.cjs"));
const {
  checkIdentityEnvironment,
  checkReleaseEnvironment,
  RELEASE_IDENTITY,
} = require(path.join(sourceRoot(__dirname), "scripts/release-check.cjs"));

const EAS_CLI = "eas-cli@25.2.0";
const MARKER = "birarada-no-github-build-v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_FILES = [
  "App.tsx",
  "app.config.ts",
  "app.json",
  "eas.json",
  "index.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}
function sourceRoot(directory) {
  for (const root of [directory, path.join(directory, "mobile")]) {
    if (
      fs.existsSync(path.join(root, "scripts/release-check.cjs")) &&
      fs.existsSync(path.join(root, "app.json"))
    )
      return path.resolve(root);
  }
  throw Error(
    "Bu dosyayı package.json ve app.json ile aynı Birarada klasörüne koy.",
  );
}

function commandSpec(
  command,
  args,
  platform = process.platform,
  comspec = process.env.ComSpec || "cmd.exe",
) {
  if (platform === "win32" && (command === "npm" || command === "npx")) {
    // Only fixed CLI flags are passed to cmd; account names, paths and credentials
    // are never inserted into a shell command. Paths are supplied through cwd/env.
    if (args.some((arg) => !/^[a-zA-Z0-9@_:./=\-]+$/.test(arg)))
      throw Error("Güvensiz komut argümanı reddedildi.");
    return [comspec, ["/d", "/s", "/c", [command, ...args].join(" ")]];
  }
  return [command, args];
}

function runCommand(command, args, { cwd, env, capture = false }) {
  const [binary, commandArgs] = commandSpec(command, args);
  const result = spawnSync(binary, commandArgs, {
    cwd,
    env,
    stdio: capture ? "pipe" : "inherit",
    encoding: "utf8",
    windowsHide: false,
  });
  if (result.error)
    throw Error(
      `${command} başlatılamadı; Node.js LTS ve Java 21 kurulumunu kontrol et.`,
    );
  if (result.signal) throw Error("İşlem kesildi; derleme tamamlanmadı.");
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function environmentValue(env, name) {
  // A spread copy of process.env loses Windows' case-insensitive property access.
  const key = Object.keys(env).find(
    (key) => key.toUpperCase() === name.toUpperCase(),
  );
  return env[name] ?? (key ? env[key] : undefined);
}

function chromePath(env, exists = fs.existsSync, platform = process.platform) {
  const override = environmentValue(env, "CHROMIUM_PATH");
  if (override) {
    const executable = override.trim().replace(/^"(.*)"$/, "$1");
    return exists(executable) ? executable : null;
  }
  const paths = platform === "win32" ? path.win32 : path;
  const roots = [
    ...new Set(
      ["ProgramW6432", "ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"]
        .map((key) => environmentValue(env, key))
        .filter(Boolean),
    ),
  ];
  const candidates = roots.flatMap((root) => [
    paths.join(root, "Google", "Chrome", "Application", "chrome.exe"),
    paths.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
  ]);
  if (platform !== "win32")
    candidates.push(
      "/usr/bin/chromium",
      "/usr/bin/google-chrome",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    );
  return candidates.find((p) => p && exists(p)) || null;
}

function checkTools(root, env, run = runCommand) {
  if (!nodeVersionSupported(process.versions.node))
    throw Error(
      "Node.js 20.19.4 veya üzeri gerekiyor; güncel LTS sürümünü kur.",
    );
  const cfg = readJson(path.join(root, "app.json")).expo;
  if (
    cfg.android?.package !== RELEASE_IDENTITY.package ||
    cfg.ios?.bundleIdentifier !== RELEASE_IDENTITY.package ||
    cfg.version !== RELEASE_IDENTITY.version ||
    cfg.android?.versionCode !== RELEASE_IDENTITY.versionCode
  )
    throw Error(
      "Uygulama kimliği veya ilk sürüm bilgileri değişmiş; derleme durduruldu.",
    );
  checkIdentityEnvironment(env);
  const java = run("java", ["-version"], { cwd: root, env, capture: true });
  if (java.status || (javaMajor(java.stderr + java.stdout) || 0) < 21)
    throw Error("Firebase testleri için Java 21 veya üzerini kur.");
  const browser = chromePath(env);
  if (!browser)
    throw Error(
      "Arayüz testi için Chrome veya Edge kur; özel konum için CHROMIUM_PATH kullan.",
    );
  return {
    ...env,
    CHROMIUM_PATH: browser,
    EXPO_NO_TELEMETRY: "1",
    FIREBASE_CLI_DISABLE_MOTD: "1",
  };
}

function assertNoLinks(file) {
  const stat = fs.lstatSync(file);
  if (stat.isSymbolicLink())
    throw Error(
      "Kaynak içinde sembolik bağlantı bulundu; özel dosyaların kopyalanmasını önlemek için duruldu.",
    );
  if (stat.isDirectory())
    for (const entry of fs.readdirSync(file))
      assertNoLinks(path.join(file, entry));
}

function ownedState(root) {
  const state = path.join(root, ".birarada-release");
  const marker = path.join(state, "owner.json");
  if (fs.existsSync(state)) {
    if (
      fs.lstatSync(state).isSymbolicLink() ||
      !fs.existsSync(marker) ||
      readJson(marker).kind !== MARKER
    )
      throw Error(
        ".birarada-release klasörü bu yardımcıya ait değil; mevcut dosyalar korunarak işlem durduruldu.",
      );
  } else {
    fs.mkdirSync(state);
    writeJson(marker, { kind: MARKER });
  }
  return state;
}

function resetOwnedDirectory(state, name) {
  if (
    !["init", "project", "checks"].includes(name) ||
    readJson(path.join(state, "owner.json")).kind !== MARKER
  )
    throw Error("Çalışma klasörü doğrulanamadı.");
  const directory = path.join(state, name);
  if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink())
    throw Error("Çalışma klasöründe beklenmeyen bağlantı var.");
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory);
  return directory;
}

function acquireRunLock(state) {
  const lock = path.join(state, "run.lock");
  if (fs.existsSync(lock)) {
    const previous = readJson(lock);
    if (!Number.isSafeInteger(previous.pid) || previous.pid <= 0)
      throw Error(
        "Önceki derleme kilidi doğrulanamadı; mevcut dosyalar korundu.",
      );
    try {
      process.kill(previous.pid, 0);
    } catch (error) {
      if (error.code !== "ESRCH")
        throw Error(
          "Başka bir derleme çalışıyor olabilir; açık derleme penceresini kontrol et.",
        );
      fs.unlinkSync(lock);
    }
    if (fs.existsSync(lock))
      throw Error(
        "Başka bir derleme zaten çalışıyor; açık derleme penceresini kullan.",
      );
  }
  const nonce = randomUUID();
  fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, nonce }), {
    flag: "wx",
    mode: 0o600,
  });
  return () => {
    if (fs.existsSync(lock) && readJson(lock).nonce === nonce)
      fs.unlinkSync(lock);
  };
}

function validProject(project) {
  if (
    !project ||
    !UUID.test(project.projectId || "") ||
    !/^[a-zA-Z0-9_-]+$/.test(project.owner || "") ||
    project.slug !== "birarada"
  )
    throw Error(
      "Expo gerçek ve geçerli bir Birarada proje kimliği döndürmedi; kimlik uydurulmadan duruldu.",
    );
  return project;
}

function attachModules(root, destination) {
  const modules = path.join(root, "node_modules");
  if (!fs.existsSync(modules))
    throw Error("Bağımlılıklar kurulamadı; npm ci adımını kontrol et.");
  fs.symlinkSync(
    modules,
    path.join(destination, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
}

function prepareBootstrap(root, state, previous) {
  const bootstrap = resetOwnedDirectory(state, "init");
  const app = readJson(path.join(root, "app.json"));
  // A static config lets the official EAS init write its real ID and owner.
  // The original dynamic app.config.ts and source app.json remain untouched.
  if (previous) {
    app.expo.extra = {
      ...app.expo.extra,
      eas: { projectId: validProject(previous).projectId },
    };
    app.expo.owner = previous.owner;
  }
  writeJson(path.join(bootstrap, "app.json"), app);
  writeJson(
    path.join(bootstrap, "package.json"),
    readJson(path.join(root, "package.json")),
  );
  assertNoLinks(path.join(root, "assets"));
  fs.cpSync(path.join(root, "assets"), path.join(bootstrap, "assets"), {
    recursive: true,
  });
  attachModules(root, bootstrap);
  return bootstrap;
}

function prepareProject(root, state, project) {
  validProject(project);
  const work = resetOwnedDirectory(state, "project");
  for (const name of [...PUBLIC_FILES, "src", "assets"]) {
    const from = path.join(root, name);
    assertNoLinks(from);
    fs.cpSync(from, path.join(work, name), { recursive: true });
  }
  fs.mkdirSync(path.join(work, "scripts"));
  fs.copyFileSync(
    path.join(root, "scripts/release-check.cjs"),
    path.join(work, "scripts/release-check.cjs"),
  );
  const app = readJson(path.join(work, "app.json"));
  app.expo.owner = project.owner;
  app.expo.extra = { ...app.expo.extra, eas: { projectId: project.projectId } };
  writeJson(path.join(work, "app.json"), app);
  const eas = readJson(path.join(work, "eas.json"));
  for (const name of ["preview", "production"]) {
    const profile = eas.build[name];
    profile.env = {
      ...profile.env,
      EAS_PROJECT_ID: project.projectId,
      EXPO_ACCOUNT_OWNER: project.owner,
    };
  }
  writeJson(path.join(work, "eas.json"), eas);
  fs.writeFileSync(
    path.join(work, ".easignore"),
    "node_modules\n.git\n.env*\n**/.env*\ncredentials.json\n**/*.keystore\n**/*.jks\n**/*.p12\n**/*.pem\n**/*.key\n**/*.log\n.birarada-release\n",
  );
  attachModules(root, work);
  return work;
}

function easEnvironment(env, directory, project) {
  return {
    ...env,
    EAS_NO_VCS: "1",
    EAS_PROJECT_ROOT: path.resolve(directory),
    EXPO_NO_TELEMETRY: "1",
    ...(project
      ? { EAS_PROJECT_ID: project.projectId, EXPO_ACCOUNT_OWNER: project.owner }
      : {}),
  };
}

function prepareUiCheck(root, state) {
  const checks = resetOwnedDirectory(state, "checks");
  const config = {
    testDir: path.join(root, "e2e"),
    use: {
      baseURL: "http://127.0.0.1:8081",
      viewport: { width: 390, height: 844 },
      launchOptions: {
        executablePath: process.env.CHROMIUM_PATH,
        args: ["--no-sandbox"],
      },
    },
    webServer: {
      command: "node start-web.cjs",
      cwd: checks,
      port: 8081,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        CI: "1",
        EXPO_NO_TELEMETRY: "1",
        EXPO_PUBLIC_USE_EMULATORS: "true",
        EXPO_PUBLIC_STORAGE_ENABLED: "false",
        APP_ENV: "development",
        EAS_BUILD_PROFILE: "",
      },
    },
  };
  // executablePath is supplied by the helper environment, also on Windows.
  fs.writeFileSync(
    path.join(checks, "playwright.config.cjs"),
    `const config = ${JSON.stringify(config, null, 2)};\nconfig.use.launchOptions.executablePath = process.env.CHROMIUM_PATH;\nmodule.exports = config;\n`,
  );
  const entry = `const path = require('node:path');\nprocess.chdir(${JSON.stringify(root)});\nconst cli = path.join(path.dirname(require.resolve('expo/package.json', {paths: [${JSON.stringify(root)}]})), 'bin/cli');\nprocess.argv = [process.execPath, cli, 'start', '--web', '--offline', '--port', '8081'];\nrequire(cli);\n`;
  fs.writeFileSync(path.join(checks, "start-web.cjs"), entry);
  return checks;
}

async function buildWithoutGithub({
  root,
  profile = "production",
  env = process.env,
  run = runCommand,
  verifyTools = checkTools,
  log = console.log,
}) {
  if (!["production", "preview"].includes(profile))
    throw Error("Yalnız production veya preview profili kullanılabilir.");
  const baseEnv = verifyTools(root, { ...env });
  const state = ownedState(root);
  const unlock = acquireRunLock(state);
  try {
    // Previous generated TS sources must not be included in the original
    // project's typecheck, including when this single BAT is used with an old ZIP.
    resetOwnedDirectory(state, "project");
    const mustRun = (command, args, cwd = root, childEnv = baseEnv) => {
      const result = run(command, args, { cwd, env: childEnv });
      if (result.status !== 0)
        throw Error(
          `${command === "npm" ? args.join(" ") : "Expo işlemi"} başarısız. Derleme tamamlanmadı; yukarıdaki hatayı kontrol et.`,
        );
    };
    log("1/4 Bağımlılıklar ve gerçek yerel kontroller çalıştırılıyor.");
    mustRun("npm", ["ci", "--include=dev", "--no-audit", "--no-fund"]);
    for (const script of [
      "typecheck",
      "test",
      "test:release",
      "test:auth",
      "test:rules",
    ])
      mustRun("npm", ["run", script]);
    const checks = prepareUiCheck(root, state);
    mustRun(
      "npx",
      ["--no-install", "playwright", "test", "--config=playwright.config.cjs"],
      checks,
    );
    const saved = path.join(state, "project.json");
    const previous = fs.existsSync(saved)
      ? validProject(readJson(saved))
      : undefined;
    const bootstrap = prepareBootstrap(root, state, previous);
    const initEnv = easEnvironment(baseEnv, bootstrap);
    log(
      "2/4 Expo hesabı güvenli girişle bağlanıyor. Parola/token bu yardımcıya kaydedilmez.",
    );
    const who = run("npx", ["--yes", EAS_CLI, "whoami"], {
      cwd: bootstrap,
      env: initEnv,
      capture: true,
    });
    if (who.status !== 0) {
      if (!/not logged in/i.test(who.stdout + who.stderr))
        throw Error(
          "Expo hesabına erişilemedi; ağ hatası giderilmeden giriş veya proje oluşturma denenmedi.",
        );
      mustRun(
        "npx",
        ["--yes", EAS_CLI, "login", "--browser"],
        bootstrap,
        initEnv,
      );
    }
    log(
      "3/4 Birarada projesi gerçek Expo hesabında oluşturuluyor veya doğrulanıyor.",
    );
    mustRun("npx", ["--yes", EAS_CLI, "init"], bootstrap, initEnv);
    const linked = readJson(path.join(bootstrap, "app.json")).expo;
    const project = validProject({
      projectId: linked.extra?.eas?.projectId,
      owner: linked.owner,
      slug: linked.slug,
    });
    if (previous && previous.projectId !== project.projectId)
      throw Error(
        "Önceden bağlanan Expo projesi değişmiş; yanlış hesaba derleme göndermemek için duruldu.",
      );
    writeJson(saved, project);
    const work = prepareProject(root, state, project);
    const buildEnv = {
      ...easEnvironment(baseEnv, work, project),
      APP_ENV: "production",
      EXPO_PUBLIC_USE_EMULATORS: "false",
      EXPO_PUBLIC_STORAGE_ENABLED: "false",
    };
    checkReleaseEnvironment(buildEnv);
    mustRun("npx", ["--yes", EAS_CLI, "project:info"], work, buildEnv);
    log(
      `4/4 ${profile === "production" ? "İmzalı AAB" : "Test APK"} için EAS Build çalıştırılıyor. Git/GitHub bağlantısı kullanılmaz.`,
    );
    mustRun(
      "npx",
      [
        "--yes",
        EAS_CLI,
        "build",
        "--platform",
        "android",
        "--profile",
        profile,
        "--wait",
      ],
      work,
      buildEnv,
    );
    log(
      "EAS komutu tamamlandı. Dosya bağlantısı yukarıdaki EAS çıktısındadır. Mağazaya otomatik yükleme yapılmaz; cihaz, canlı Firebase/yasal sayfalar ve Play Console doğrulamaları ayrıca gerekir.",
    );
    return { project, work, profile };
  } finally {
    unlock();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((a) => !["--check", "--preview"].includes(a)))
    throw Error(
      "Kullanım: node scripts/build-no-github.cjs [--check | --preview]",
    );
  const root = sourceRoot(
    path.basename(__dirname) === "scripts"
      ? path.dirname(__dirname)
      : __dirname,
  );
  if (args.includes("--check")) {
    checkTools(root, process.env);
    console.log(
      "Yerel Node/Java/tarayıcı ve uygulama kimliği önkontrolü geçti. Expo hesabı, ağ testleri veya AAB derlemesi çalıştırılmadı.",
    );
    return;
  }
  await buildWithoutGithub({
    root,
    profile: args.includes("--preview") ? "preview" : "production",
  });
}

module.exports = {
  EAS_CLI,
  commandSpec,
  chromePath,
  checkTools,
  sourceRoot,
  validProject,
  ownedState,
  prepareBootstrap,
  prepareProject,
  prepareUiCheck,
  easEnvironment,
  acquireRunLock,
  buildWithoutGithub,
};
if (require.main === module)
  main().catch((error) => {
    console.error(`\nDerleme tamamlanmadı: ${error.message}`);
    process.exitCode = 1;
  });

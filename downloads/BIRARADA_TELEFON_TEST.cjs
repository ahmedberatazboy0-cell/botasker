"use strict";

// Runs on the owner's Windows PC. No accounts, credentials or reports are uploaded.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const PACKAGE = "com.birarada.app";
const ALLOWED_TARGETS = new Set(["Ana Sayfa", "Keşfet", "Profil", "Mesajlar", "Geri", "Reels"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function packageVersion(text) {
  return {
    versionName: /\bversionName=([^\s]+)/.exec(text)?.[1] || null,
    versionCode: /\bversionCode=(\d+)/.exec(text)?.[1] || null,
  };
}
function isAppForeground(text) {
  const rows = text.split(/\r?\n/).filter((row) => /\b(?:topResumedActivity|mResumedActivity)\b/.test(row));
  const top = rows.filter((row) => /\btopResumedActivity\b/.test(row));
  return (top.length ? top : rows).some((row) => row.includes(PACKAGE + "/"));
}
function parseNodes(xml) {
  return [...xml.matchAll(/<node\b([^>]*?)>/g)].map((match) => {
    const attrs = {};
    for (const pair of match[1].matchAll(/([\w-]+)="([^"]*)"/g)) {
      attrs[pair[1]] = pair[2].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    }
    return attrs;
  });
}
function tapTarget(xml, label) {
  if (!ALLOWED_TARGETS.has(label)) throw Error("Bu islem salt-okunur gezinme listesinde degil.");
  const candidates = parseNodes(xml).filter((node) =>
    node.clickable === "true" && node.enabled === "true" &&
    (node["content-desc"] === label || node.text === label),
  ).map((node) => {
    const b = /^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/.exec(node.bounds || "");
    if (!b) return null;
    const [left, top, right, bottom] = b.slice(1).map(Number);
    return right > left && bottom > top
      ? { x: Math.floor((left + right) / 2), y: Math.floor((top + bottom) / 2) }
      : null;
  }).filter(Boolean);
  // Never guess coordinates or tap a similarly named action.
  return candidates.length === 1 ? candidates[0] : null;
}
function progressCount(xml) {
  return parseNodes(xml).filter((node) => /ProgressBar/.test(node.class || "")).length;
}
function chooseDevice(list, requested) {
  const rows = list.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
    .filter((row) => row.length >= 2 && ["device", "offline", "unauthorized"].includes(row[1]));
  if (requested) {
    if (!rows.some((row) => row[0] === requested && row[1] === "device")) throw Error("Secilen telefon hazir degil.");
    return requested;
  }
  if (rows.length !== 1 || rows[0][1] !== "device") throw Error("Tek bir yetkili telefon bagla; birden cok cihaz varsa cihaz kimligini komut sonuna ekle.");
  return rows[0][0];
}

async function main() {
  const adb = process.env.BIRARADA_ADB || path.join(process.env.LOCALAPPDATA || "", "BiraradaTools", "platform-tools", "adb.exe");
  if (!fs.existsSync(adb)) throw Error("ADB bulunamadi. Once verilen resmi Google ADB kurulumunu tamamla.");
  const devices = spawnSync(adb, ["devices"], { encoding: "utf8", windowsHide: true, timeout: 15000 });
  if (devices.error || devices.status !== 0) throw Error("ADB cihaz listesi okunamadi.");
  const serial = chooseDevice(devices.stdout, process.argv[2]);
  if (!/^[a-zA-Z0-9_.:-]{1,100}$/.test(serial)) throw Error("Gecersiz cihaz kimligi.");
  const downloads = path.join(os.homedir(), "Downloads");
  const output = fs.mkdtempSync(path.join(fs.existsSync(downloads) ? downloads : process.cwd(), "Birarada-Telefon-Test-"));
  const report = {
    generatedAt: new Date().toISOString(), package: PACKAGE, serial,
    scope: "Physical Android launch and safe navigation observations, run by the owner on their PC",
    sourceCandidate: "1.1.6 / code8; this script does not install or update it",
    installed: null, device: {}, launches: [], pages: [], errors: [],
    automaticWritesTested: false, physicalPushDeliveryVerified: false,
    allScreensPassed: false,
    limitations: [
      "Android TotalTime is native activity launch time, NOT feed or full content loading time.",
      "Spinner disappearance is an observation, NOT proof that all content is loaded or correct.",
      "No posting, following, messaging, group creation, login, permission acceptance or account changes are automated.",
      "Screenshots and UI XML can contain personal content. They stay on this PC; share only material you intend to disclose.",
      "No backend deployment, APK/AAB installation or Play Console action is performed.",
    ],
  };
  const save = () => fs.writeFileSync(path.join(output, "rapor.json"), JSON.stringify(report, null, 2) + "\n");
  function command(args, { binary = false, timeout = 25000 } = {}) {
    const result = spawnSync(adb, ["-s", serial, ...args], {
      encoding: binary ? undefined : "utf8", windowsHide: true, timeout,
      maxBuffer: 24 * 1024 * 1024,
    });
    if (result.error) throw Error("ADB calistirilamadi: " + result.error.message);
    if (result.status !== 0) throw Error("ADB islemi basarisiz: " + String(result.stderr || "").trim().slice(0, 250));
    return result.stdout;
  }
  function ensureApp() {
    if (!isAppForeground(command(["shell", "dumpsys", "activity", "activities"])))
      throw Error("Birarada on planda degil. Telefonun kilidini ac ve uygulamayi ac. Baska ekrana dokunulmadi.");
  }
  function readUi() {
    ensureApp();
    const remote = "/sdcard/birarada-owned-ui-" + process.pid + ".xml";
    try {
      command(["shell", "uiautomator", "dump", remote], { timeout: 20000 });
      const xml = command(["exec-out", "cat", remote]);
      if (!xml.includes("<hierarchy")) throw Error("Android ekran agaci okunamadi.");
      return xml;
    } finally {
      try { command(["shell", "rm", "-f", remote]); } catch {}
    }
  }
  function capture(name, xml) {
    ensureApp();
    const bytes = command(["exec-out", "screencap", "-p"], { binary: true });
    if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw Error("Gecerli ekran goruntusu alinamadi.");
    fs.writeFileSync(path.join(output, name + ".png"), bytes);
    if (xml) fs.writeFileSync(path.join(output, name + ".xml"), xml);
  }
  console.log("Telefon testi basliyor. Telefonun kilidi acik kalsin; test sirasinda ekrana dokunma.");
  console.log("Rapor klasoru: " + output);
  try {
    if (command(["get-state"]).trim() !== "device") throw Error("Telefon yetkilendirilmemis veya cevrimdisi.");
    report.device = {
      model: command(["shell", "getprop", "ro.product.model"]).trim(),
      android: command(["shell", "getprop", "ro.build.version.release"]).trim(),
    };
    report.installed = packageVersion(command(["shell", "dumpsys", "package", PACKAGE]));
    if (!report.installed.versionName || !report.installed.versionCode) throw Error("Birarada bu cihazda kurulu bulunamadi.");
    console.log("Kurulu surum: " + report.installed.versionName + " / code " + report.installed.versionCode);
    save();
    for (let i = 1; i <= 3; i++) {
      console.log("Android baslatma olcumu " + i + "/3...");
      const raw = command(["shell", "am", "start", "-W", "-S", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-p", PACKAGE], { timeout: 60000 });
      const status = /^Status:\s*(.+)$/m.exec(raw)?.[1]?.trim() || "unknown";
      const activity = /^Activity:\s*(.+)$/m.exec(raw)?.[1]?.trim() || "";
      report.launches.push({
        run: i, status, activity,
        totalTimeMs: Number(/^TotalTime:\s*(\d+)/m.exec(raw)?.[1]) || null,
        waitTimeMs: Number(/^WaitTime:\s*(\d+)/m.exec(raw)?.[1]) || null,
        meaning: "Native activity launch only, not content readiness",
      });
      if (status !== "ok" || !activity.startsWith(PACKAGE + "/")) throw Error("Uygulama beklenen etkinlikte baslatilamadi.");
      await sleep(3000);
      ensureApp();
      capture("acilis-" + i);
      save();
    }
    console.log("Uygulamanin gezinme cubugu en fazla 45 saniye bekleniyor...");
    const navigationStarted = Date.now();
    let readyUi = readUi();
    while (!tapTarget(readyUi, "Ana Sayfa") && Date.now() - navigationStarted < 45000) {
      if (parseNodes(readyUi).some((node) => node.password === "true")) {
        report.errors.push({ step: "login", message: "Telefonda resmi giris ekranindan kendin giris yap, sonra testi tekrar calistir. Sifre bu araca verilmez." });
        capture("giris-gerekli", readyUi);
        return;
      }
      await sleep(1000);
      readyUi = readUi();
    }
    report.navigationControlsObservedAfterMs = Date.now() - navigationStarted;
    if (!tapTarget(readyUi, "Ana Sayfa")) {
      report.errors.push({ step: "navigation", message: "45 saniyede Ana Sayfa dugmesi bulunamadi; ekranlarin hazir oldugu soylenemez." });
      capture("gezinme-hazir-degil", readyUi);
      return;
    }
    const targets = ["Ana Sayfa", "Keşfet", "Profil", "Ana Sayfa", "Mesajlar", "Geri", "Reels", "Ana Sayfa"];
    for (let index = 0; index < targets.length; index++) {
      const label = targets[index];
      console.log("Ekran kontrolu: " + label);
      const page = { target: label, result: "not_tested", samples: [] };
      report.pages.push(page);
      try {
        const initial = readUi(), target = tapTarget(initial, label);
        if (!target) {
          page.result = "target_not_uniquely_accessible";
          page.note = "No coordinate guess or unrelated tap was made. Login may be required.";
          capture("sayfa-" + (index + 1) + "-bulunamadi", initial);
          save();
          continue;
        }
        const began = Date.now();
        command(["shell", "input", "tap", String(target.x), String(target.y)]);
        await sleep(800);
        let ui = readUi();
        page.samples.push({ elapsedMs: Date.now() - began, progressIndicators: progressCount(ui) });
        capture("sayfa-" + (index + 1) + "-ilk", ui);
        while (progressCount(ui) > 0 && Date.now() - began < 30000) {
          await sleep(1000);
          ui = readUi();
          page.samples.push({ elapsedMs: Date.now() - began, progressIndicators: progressCount(ui) });
        }
        page.result = progressCount(ui) > 0 ? "loading_indicator_still_visible" : "navigation_observed";
        page.contentReadinessVerified = false;
        capture("sayfa-" + (index + 1) + "-son", ui);
      } catch (error) {
        page.result = "observation_failed";
        page.error = error.message;
        report.errors.push({ step: label, message: error.message });
        // Permission dialogs, lock screen or another app must never receive test taps.
        if (!isAppForeground(command(["shell", "dumpsys", "activity", "activities"]))) break;
      }
      save();
    }
    const observed = report.pages.filter((page) => page.result === "navigation_observed").length;
    console.log("Gezinme gozlemi: " + observed + "/" + targets.length + ". Bu tum uygulama islevlerinin gectigi anlamina gelmez.");
  } catch (error) {
    report.errors.push({ step: "test", message: error.message });
    console.error("Test durdu: " + error.message);
    process.exitCode = 1;
  } finally {
    save();
    console.log("Tamamlandi. rapor.json ve ekran goruntuleri: " + output);
    console.log("Rapor otomatik yuklenmedi. Incelemek icin rapor.json dosyasini paylasabilirsin.");
  }
}

module.exports = { packageVersion, isAppForeground, parseNodes, tapTarget, progressCount, chooseDevice };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

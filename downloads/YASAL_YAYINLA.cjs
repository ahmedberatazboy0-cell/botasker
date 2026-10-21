"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const https = require("node:https");
const { Readable } = require("node:stream");
const { spawnSync } = require("node:child_process");

const PROJECT = "birarada-5650c";
const SITE = "birarada-5650c";
const OWNER = "ahmedberatazboy0@gmail.com";
const LIVE_URL = "https://" + SITE + ".web.app";
const PREFIX = "/__birarada_legal_20261021_free1";
const ROUTES = ["privacy", "delete-account", "terms", "child-safety"];
const sha = (data) => crypto.createHash("sha256").update(data).digest("hex");
const clone = (data) => JSON.parse(JSON.stringify(data));
function versionName(value) {
  const match =
    /^(?:projects\/[^/]+\/)?sites\/birarada-5650c\/versions\/([a-zA-Z0-9_-]+)$/
      .exec(value || "");
  if (!match) {
    throw Error("Beklenmeyen Hosting surum kimligi; yayin durduruldu.");
  }
  return "projects/" + PROJECT + "/sites/" + SITE + "/versions/" + match[1];
}
function releaseStamp(channel) {
  const r = channel?.release;
  return JSON.stringify(
    r
      ? {
        name: r.name || "",
        version: r.version?.name ? versionName(r.version.name) : null,
        type: r.type || "",
      }
      : null,
  );
}
function legalPaths(route) {
  return [
    "/" + route,
    "/" + route + "/",
    "/" + route + ".html",
    "/" + route + "/index.html",
  ];
}
function filesMap(files) {
  const map = new Map();
  for (const file of files) {
    if (
      typeof file.path !== "string" || !file.path.startsWith("/") ||
      !/^[a-f0-9]{64}$/i.test(file.hash || "") || map.has(file.path)
    ) throw Error("Hosting dosya listesi dogrulanamadi.");
    map.set(file.path, file.hash);
  }
  return map;
}
function prepareLegal(config, originalFiles, sources) {
  const previous = filesMap(originalFiles),
    payload = new Map(),
    pages = new Map();
  const legal = new Set(ROUTES.flatMap(legalPaths));
  for (const route of ROUTES) {
    const source = sources[route + ".html"]?.toString("utf8");
    if (
      !source || !source.includes("2026-10-21-free1") ||
      !source.includes("com.birarada.app") || !source.includes(OWNER) ||
      !source.includes('href="/birarada-legal.css"') ||
      /<script[\s>]/i.test(source) ||
      (route === "privacy" && !source.includes("Supabase"))
    ) throw Error("Guncel yasal kaynak dogrulanamadi: " + route);
    const bytes = Buffer.from(
      source.replace(
        'href="/birarada-legal.css"',
        'href="' + PREFIX + '/birarada-legal.css"',
      ),
    );
    pages.set(route, bytes);
    payload.set(PREFIX + "/" + route + ".html", bytes);
    // Existing static assets win over rewrites. Replace only already-existing
    // legal variants, without inventing file/directory conflicts in the site.
    for (const p of legalPaths(route)) {
      if (previous.has(p)) payload.set(p, bytes);
    }
  }
  if (!sources["birarada-legal.css"]?.length) {
    throw Error("Yasal sayfa stili bulunamadi.");
  }
  payload.set(PREFIX + "/birarada-legal.css", sources["birarada-legal.css"]);
  const merged = clone(config || {});
  for (const key of ["rewrites", "redirects", "headers"]) {
    if (merged[key] !== undefined && !Array.isArray(merged[key])) {
      throw Error("Mevcut Hosting yapilandirmasi desteklenmiyor: " + key);
    }
  }
  merged.rewrites = [
    ...ROUTES.flatMap((route) =>
      legalPaths(route).map((glob) => ({
        glob,
        path: PREFIX + "/" + route + ".html",
      }))
    ),
    ...(merged.rewrites || []).filter((rule) => !legal.has(rule.glob)),
  ];
  if (merged.redirects) {
    merged.redirects = merged.redirects.filter((rule) => !legal.has(rule.glob));
  }
  const headerTargets = new Map();
  for (const route of ROUTES) {
    for (const p of [...legalPaths(route), PREFIX + "/" + route + ".html"]) {
      headerTargets.set(p, "text/html; charset=utf-8");
    }
  }
  headerTargets.set(PREFIX + "/birarada-legal.css", "text/css; charset=utf-8");
  const previousHeaders = merged.headers || [];
  merged.headers = previousHeaders.filter((rule) =>
    !headerTargets.has(rule.glob)
  );
  for (const [glob, contentType] of headerTargets) {
    const headers = Object.assign(
      {},
      ...previousHeaders.filter((rule) => rule.glob === glob).map((rule) =>
        rule.headers || {}
      ),
    );
    for (const key of Object.keys(headers)) {
      if (["cache-control", "content-type"].includes(key.toLowerCase())) {
        delete headers[key];
      }
    }
    merged.headers.push({
      glob,
      headers: {
        ...headers,
        "Cache-Control": "no-cache, max-age=0",
        "Content-Type": contentType,
      },
    });
  }
  const expected = new Map(previous);
  for (const [p, bytes] of payload) {
    expected.set(p, sha(zlib.gzipSync(bytes, { level: 9 })));
  }
  return { config: merged, payload, pages, expected };
}
function assertPreserved(actual, expected) {
  const map = filesMap(actual);
  if (map.size !== expected.size) {
    throw Error(
      "Kopyalanan site dosya sayisi degisti; canli yayin durduruldu.",
    );
  }
  for (const [p, hash] of expected) {
    if (map.get(p) !== hash) {
      throw Error(
        "Site dosyasi korunamadi: " + p + ". Canli yayin durduruldu.",
      );
    }
  }
}
function allowedPublicUrl(value) {
  const u = new URL(value);
  if (
    u.protocol !== "https:" || u.username || u.password || u.port ||
    !(u.hostname === SITE + ".web.app" ||
      u.hostname === SITE + ".firebaseapp.com" ||
      (u.hostname.startsWith(SITE + "--") && u.hostname.endsWith(".web.app")))
  ) throw Error("Beklenmeyen Hosting adresi.");
  return u;
}
async function readPublic(base, resource, redirects = 0) {
  const u = allowedPublicUrl(new URL(resource, base).href);
  u.searchParams.set("birarada_policy_check", Date.now().toString(36));
  return new Promise((resolve, reject) => {
    const request = https.get(u, {
      timeout: 20000,
      headers: { "Cache-Control": "no-cache", "Accept-Encoding": "identity" },
    }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        if (redirects >= 5 || !response.headers.location) {
          return reject(Error("Yasal adres yonlendirmesi tamamlanamadi."));
        }
        let next;
        try {
          next =
            allowedPublicUrl(new URL(response.headers.location, u).href).href;
        } catch (e) {
          return reject(e);
        }
        return readPublic(next, "", redirects + 1).then(resolve, reject);
      }
      let size = 0;
      const chunks = [];
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > 2000000) {
          response.destroy(Error("Hosting yaniti cok buyuk."));
        } else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        try {
          let body = Buffer.concat(chunks);
          if (response.headers["content-encoding"] === "gzip") {
            body = zlib.gunzipSync(body, { maxOutputLength: 2000000 });
          }
          resolve({
            status: response.statusCode,
            body,
            contentType: response.headers["content-type"] || "",
          });
        } catch (e) {
          reject(e);
        }
      });
    });
    request.on(
      "timeout",
      () => request.destroy(Error("Hosting baglantisi zaman asimina ugradi.")),
    );
    request.on("error", reject);
  });
}
function verifyResponse(response, expected, mime, label) {
  const actual = Buffer.from(response.body);
  const contentType = String(response.contentType || "");
  if (response.status === 200 && mime.test(contentType) && actual.equals(expected)) return;
  // Public response metadata only; never print authentication headers or content.
  const error = Error("Yasal sayfa dogrulanamadi: " + label +
    "; HTTP " + response.status + "; tur=" + contentType.replace(/[^a-zA-Z0-9;= /.+_-]/g, "").slice(0, 100) +
    "; alinan=" + actual.length + " bayt; beklenen=" + expected.length +
    " bayt; alinanSHA256=" + sha(actual) + "; beklenenSHA256=" + sha(expected));
  error.diagnostic = {path: label, status: response.status, contentType,
    actualBytes: actual.length, expectedBytes: expected.length,
    actualSha256: sha(actual), expectedSha256: sha(expected)};
  throw error;
}
async function checkPublished(base, plan, read, { wait, log, record }) {
  const targets = [
    ...ROUTES.map(route => ({path: "/" + route, expected: plan.pages.get(route), mime: /^text\/html/i})),
    {path: PREFIX + "/birarada-legal.css", expected: plan.payload.get(PREFIX + "/birarada-legal.css"), mime: /^text\/css/i},
  ];
  for (const target of targets) {
    const delays = [2000, 4000, 8000, 12000, 15000];
    for (let attempt = 0; ; attempt++) {
      try {
        verifyResponse(await read(base, target.path), target.expected, target.mime, target.path);
        break;
      } catch (error) {
        record({base, path: target.path, attempt: attempt + 1,
          ...(error.diagnostic || {networkError: error.code || error.message})});
        if (attempt >= delays.length) throw error;
        log("Hosting dagitimi bekleniyor: " + target.path + " (" +
          (attempt + 1) + "/" + delays.length + ", " + delays[attempt] / 1000 + " sn). " +
          (error.diagnostic ? "HTTP " + error.diagnostic.status + ", " + error.diagnostic.actualBytes + " bayt" : "Gecici baglanti hatasi"));
        await wait(delays[attempt]);
      }
    }
  }
}
async function publishLegal(
  {
    api,
    sources,
    read = readPublic,
    record = () => {},
    log = console.log,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    channelId = "birarada-legal-" + Date.now().toString(36) + "-" +
      crypto.randomBytes(3).toString("hex"),
  },
) {
  log("1/5 Mevcut canli Hosting surumu ve tum dosya hashleri okunuyor...");
  await api.ensureSite();
  const baseline = await api.getLive(),
    oldName = baseline?.release?.version?.name
      ? versionName(baseline.release.version.name)
      : null;
  const original = oldName ? await api.getVersion(oldName) : { config: {} };
  const originalFiles = oldName ? await api.listFiles(oldName) : [];
  const plan = prepareLegal(original.config, originalFiles, sources);
  const state = {
    project: PROJECT,
    site: SITE,
    oldVersion: oldName,
    originalConfig: original.config || {},
    originalFiles,
    changedPaths: [...plan.payload.keys()],
    nextConfig: plan.config,
    phase: "prepared",
  };
  record(state);
  log("2/5 Mevcut site korunarak yeni surum hazirlaniyor...");
  const created = await api.createVersion(plan.config);
  const next = versionName(
    typeof created === "string" ? created : created.name,
  );
  if (oldName === next) {
    throw Error("Mevcut surum degistirilmez; kopya olusturulamadi.");
  }
  state.newVersion = next;
  record(state);
  // Populate the complete original manifest plus the legal overlays. Existing
  // content hashes are reused by Hosting; unrelated assets are never omitted.
  await api.upload(next, plan.payload, plan.expected);
  assertPreserved(await api.listFiles(next), plan.expected);
  await api.finalize(next, plan.config);
  log("3/5 Yasal sayfalar gecici onizleme adresinde kontrol ediliyor...");
  const preview = await api.createPreview(channelId);
  allowedPublicUrl(preview.url);
  await api.release(channelId, next);
  state.previewUrl = preview.url;
  state.phase = "preview-released";
  record(state);
  log("Onizleme: " + preview.url);
  const verifyOptions = {wait, log, record: (diagnostic) => {
    state.lastVerification = diagnostic;
    record(state);
  }};
  await checkPublished(preview.url, plan, read, verifyOptions);
  state.phase = "preview-verified";
  record(state);
  if (releaseStamp(await api.getLive()) !== releaseStamp(baseline)) {
    throw Error(
      "Canli site baska bir islemde degisti. Bu surum yayimlanmadi; yeniden calistir.",
    );
  }
  log("4/5 Yalniz dogrulanan Hosting surumu canliya aliniyor...");
  try {
    await api.release("live", next);
    state.phase = "released";
    record(state);
    log("5/5 Canli dort yasal sayfa ve stil kontrol ediliyor...");
    await checkPublished(LIVE_URL, plan, read, verifyOptions);
    if (versionName((await api.getLive())?.release?.version?.name) !== next) {
      throw Error("Canli surum yayin sirasinda yeniden degisti.");
    }
    state.phase = "verified";
    record(state);
    log(
      "YASAL_SAYFALAR_HAZIR. Mevcut site dosyalari korunarak dort yasal sayfa dogrulandi.",
    );
    return state;
  } catch (error) {
    const current = await api.getLive().catch(() => null);
    if (
      oldName && current?.release?.version?.name &&
      versionName(current.release.version.name) === next
    ) {
      await api.release("live", oldName);
      state.phase = "rolled-back";
      record(state);
      throw Error(
        "Canli kontrol basarisiz; onceki Hosting surumune donuldu. " +
          error.message,
      );
    }
    throw error;
  }
}
function createAdapter(root) {
  const auth = require("firebase-tools/lib/auth");
  const { requireAuth } = require("firebase-tools/lib/requireAuth");
  const hosting = require("firebase-tools/lib/hosting/api");
  const { Client } = require("firebase-tools/lib/apiv2");
  const client = new Client({
    urlPrefix: "https://firebasehosting.googleapis.com",
    apiVersion: "v1beta1",
    auth: true,
  });
  async function authorize() {
    let account = auth.getAllAccounts().find((a) =>
      a.user?.email?.toLowerCase() === OWNER
    );
    if (!account) {
      console.log(
        "Firebase icin resmi Google girisi aciliyor. " + OWNER +
          " hesabini sec.",
      );
      const cli = require.resolve("firebase-tools/lib/bin/firebase.js");
      const args = auth.getAllAccounts().length
        ? ["login:add", OWNER]
        : ["login"];
      const result = spawnSync(process.execPath, [cli, ...args], {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, NO_UPDATE_NOTIFIER: "1" },
      });
      if (result.status !== 0) throw Error("Firebase girisi tamamlanmadi.");
      account = auth.getAllAccounts().find((a) =>
        a.user?.email?.toLowerCase() === OWNER
      );
    }
    if (!account) throw Error("Beklenen Firebase hesabi bagli degil: " + OWNER);
    const options = {
      project: PROJECT,
      projectRoot: root,
      cwd: root,
      nonInteractive: true,
    };
    auth.setActiveAccount(options, account);
    await requireAuth(options);
  }
  return {
    authorize,
    async ensureSite() {
      try {
        await hosting.getSite(PROJECT, SITE);
      } catch (e) {
        if (e.status !== 404) throw e;
        await hosting.createSite(PROJECT, SITE);
      }
    },
    getLive: () => hosting.getChannel(PROJECT, SITE, "live"),
    async getVersion(name) {
      return (await client.get("/" + versionName(name))).body;
    },
    async listFiles(name) {
      const files = [];
      let token = "";
      do {
        const res = await client.get("/" + versionName(name) + "/files", {
          queryParams: {
            pageSize: 1000,
            ...(token ? { pageToken: token } : {}),
          },
        });
        files.push(...(res.body.files || []));
        token = res.body.nextPageToken || "";
      } while (token);
      return files;
    },
    createVersion: (config) => hosting.createVersion(PROJECT, SITE, { config }),
    async upload(name, payload, expected) {
      const compressed = new Map();
      for (const [, bytes] of payload) {
        const gzip = zlib.gzipSync(bytes, { level: 9 });
        compressed.set(sha(gzip), gzip);
      }
      const allFiles = [...expected];
      for (let at = 0; at < allFiles.length; at += 1000) {
        const response = await client.post(
          "/" + versionName(name) + ":populateFiles",
          { files: Object.fromEntries(allFiles.slice(at, at + 1000)) },
        );
        const required = response.body.uploadRequiredHashes || [];
        if (!required.length) continue;
        const u = new URL(response.body.uploadUrl);
        if (
          u.protocol !== "https:" ||
          u.hostname !== "upload-firebasehosting.googleapis.com" ||
          u.username || u.password || u.port
        ) throw Error("Beklenmeyen resmi Hosting yukleme adresi.");
        const uploader = new Client({ urlPrefix: u.href, auth: true });
        for (const hash of required) {
          const bytes = compressed.get(hash);
          if (!bytes) {
            throw Error(
              "Mevcut site dosyasi sunucuda yeniden yukleme istiyor; kaynak site korunarak duruldu.",
            );
          }
          const uploaded = await uploader.request({
            method: "POST",
            path: "/" + hash,
            body: Readable.from([bytes]),
            responseType: "stream",
            resolveOnHTTPError: true,
            signal: AbortSignal.timeout(60000),
          });
          let responseBytes = 0;
          for await (const chunk of uploaded.body) {
            responseBytes += chunk.length;
            if (responseBytes > 1000000) {
              throw Error("Hosting yukleme yaniti cok buyuk.");
            }
          }
          if (uploaded.status !== 200) {
            throw Error(
              "Hosting dosya yuklemesi basarisiz: HTTP " + uploaded.status,
            );
          }
        }
      }
    },
    finalize: (name, config) =>
      hosting.updateVersion(
        PROJECT,
        SITE,
        versionName(name).split("/").at(-1),
        { status: "FINALIZED", config },
      ),
    createPreview: (id) => hosting.createChannel(PROJECT, SITE, id, 86400000),
    release: (id, name) =>
      hosting.createRelease(PROJECT, SITE, id, versionName(name), {
        message:
          "Birarada public legal pages 2026-10-21-free1; existing files preserved",
      }),
  };
}

function installLiveChecker(root, backupDir) {
  const data = Buffer.from(
    "InVzZSBzdHJpY3QiOwpjb25zdCBodHRwcyA9IHJlcXVpcmUoIm5vZGU6aHR0cHMiKTsKY29uc3QgeyByZWFkUHVibGljLCBMSVZFX1VSTCB9ID0gcmVxdWlyZSgiLi4vWUFTQUxfWUFZSU5MQS5janMiKTsKZnVuY3Rpb24gZ2V0KHVybCkgewogIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7CiAgICBjb25zdCBxID0gaHR0cHMuZ2V0KHVybCwgeyB0aW1lb3V0OiAyMDAwMCB9LCAocikgPT4gewogICAgICBsZXQgYm9keSA9ICIiOwogICAgICByLnNldEVuY29kaW5nKCJ1dGY4Iik7CiAgICAgIHIub24oImRhdGEiLCAoeCkgPT4gewogICAgICAgIGJvZHkgKz0geDsKICAgICAgICBpZiAoYm9keS5sZW5ndGggPiAxMDAwMDAwKSByLmRlc3Ryb3koRXJyb3IoIlJlc3BvbnNlIHRvbyBsYXJnZSIpKTsKICAgICAgfSk7CiAgICAgIHIub24oImVycm9yIiwgcmVqZWN0KTsKICAgICAgci5vbigiZW5kIiwgKCkgPT4gcmVzb2x2ZSh7IHN0YXR1czogci5zdGF0dXNDb2RlLCBib2R5IH0pKTsKICAgIH0pOwogICAgcS5vbigiZXJyb3IiLCByZWplY3QpOwogICAgcS5vbigidGltZW91dCIsICgpID0+IHEuZGVzdHJveShFcnJvcigiQ29ubmVjdGlvbiB0aW1lZCBvdXQiKSkpOwogIH0pOwp9CmFzeW5jIGZ1bmN0aW9uIGNoZWNrQmFja2VuZCgpIHsKICBjb25zdCByID0gYXdhaXQgZ2V0KAogICAgImh0dHBzOi8vcWluZXZoaGhkdHNsbnpydGNhbnEuc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2JpcmFyYWRhL2hlYWx0aCIsCiAgKTsKICBsZXQgdmFsdWU7CiAgdHJ5IHsKICAgIHZhbHVlID0gSlNPTi5wYXJzZShyLmJvZHkpOwogIH0gY2F0Y2ggewogICAgdGhyb3cgRXJyb3IoCiAgICAgICJTdXBhYmFzZSBzdW51Y3VzdSBoZW51eiBkYWdpdGlsbWFtaXMuIFVDUkVUU0laX0tVUi5iYXQgY2FsaXN0aXIuIiwKICAgICk7CiAgfQogIGlmICgKICAgIHIuc3RhdHVzICE9PSAyMDAgfHwgdmFsdWUuc2VydmljZSAhPT0gImJpcmFyYWRhLXNvY2lhbC1mcmVlIiB8fAogICAgdmFsdWUucHJvdG9jb2wgIT09IDMgfHwKICAgIHZhbHVlLnN1cGFiYXNlUHJvamVjdElkICE9PSAicWluZXZoaGhkdHNsbnpydGNhbnEiIHx8CiAgICB2YWx1ZS5maXJlYmFzZVByb2plY3RJZCAhPT0gImJpcmFyYWRhLTU2NTBjIiB8fAogICAgdmFsdWUuc3RvcmFnZVJlYWR5ICE9PSB0cnVlIHx8IHZhbHVlLnRlcm1zVmVyc2lvbiAhPT0gIjIwMjYtMTAtMjEtZnJlZTEiCiAgKSB0aHJvdyBFcnJvcigiVWNyZXRzaXogc3VudWN1IHZlIG96ZWwgU3RvcmFnZSBrdXJ1bHVtdSB0YW1hbWxhbm1hbWlzLiIpOwogIGNvbnNvbGUubG9nKCJVY3JldHNpeiBzdW51Y3UgdmUgb3plbCBidWNrZXQgc2FnbGlrIGtvbnRyb2x1IGdlY3RpLiIpOwp9CmFzeW5jIGZ1bmN0aW9uIGNoZWNrTGl2ZSgpIHsKICBhd2FpdCBjaGVja0JhY2tlbmQoKTsKICBmb3IgKGNvbnN0IHJvdXRlIG9mIFsicHJpdmFjeSIsICJkZWxldGUtYWNjb3VudCIsICJ0ZXJtcyIsICJjaGlsZC1zYWZldHkiXSkgewogICAgY29uc3QgcHVibGljUmVzcG9uc2UgPSBhd2FpdCByZWFkUHVibGljKExJVkVfVVJMLCAiLyIgKyByb3V0ZSk7CiAgICBjb25zdCByID0geyAuLi5wdWJsaWNSZXNwb25zZSwgYm9keTogcHVibGljUmVzcG9uc2UuYm9keS50b1N0cmluZygidXRmOCIpIH07CiAgICBpZiAoCiAgICAgIHIuc3RhdHVzICE9PSAyMDAgfHwgIS9edGV4dFwvaHRtbC9pLnRlc3Qoci5jb250ZW50VHlwZSkgfHwKICAgICAgIXIuYm9keS5pbmNsdWRlcygiY29tLmJpcmFyYWRhLmFwcCIpIHx8CiAgICAgICFyLmJvZHkuaW5jbHVkZXMoIjIwMjYtMTAtMjEtZnJlZTEiKSB8fAogICAgICAocm91dGUgPT09ICJwcml2YWN5IiAmJiAhci5ib2R5LmluY2x1ZGVzKCJTdXBhYmFzZSIpKSB8fAogICAgICAhci5ib2R5LmluY2x1ZGVzKCJhaG1lZGJlcmF0YXpib3kwQGdtYWlsLmNvbSIpCiAgICApIHRocm93IEVycm9yKCJHdW5jZWwgeWFzYWwgc2F5ZmEgeWF5aW5sYW5tYW1pczogIiArIHJvdXRlKTsKICB9CiAgY29uc29sZS5sb2coCiAgICAiQ2FubGkgc3VudWN1L3lhc2FsIHNheWZhIGtvbnRyb2xsZXJpIGdlY3RpLiBDaWhheiwgZ2VyY2VrIHB1c2ggdmUgc29uIEFBQiBkZW5ldGltbGVyaSBheXJpY2EgZ2VyZWtpci4iLAogICk7Cn0KbW9kdWxlLmV4cG9ydHMgPSB7IGNoZWNrQmFja2VuZCwgY2hlY2tMaXZlIH07CmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkgewogIChwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoIi0tYmFja2VuZC1vbmx5IikgPyBjaGVja0JhY2tlbmQoKSA6IGNoZWNrTGl2ZSgpKQogICAgLmNhdGNoKChlKSA9PiB7CiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTsKICAgICAgcHJvY2Vzcy5leGl0Q29kZSA9IDE7CiAgICB9KTsKfQo=",
    "base64",
  );
  const target = path.join(root, "scripts", "check-live.cjs");
  if (
    fs.lstatSync(path.dirname(target)).isSymbolicLink() ||
    fs.lstatSync(target).isSymbolicLink()
  ) throw Error("Yayin kontrolu baglanti dosyasina yazilmaz.");
  const before = fs.readFileSync(target), current = sha(before);
  if (current === sha(data)) return;
  if (
    current !==
      "13dbc7ae5eeb4ef1f965db41ef27f638ce6517a6378a0ca28741c49994355280"
  ) {
    throw Error(
      "Yayin kontrol dosyasi beklenen surumden farkli; ozel degisikliklerin korunarak duruldu.",
    );
  }
  fs.writeFileSync(path.join(backupDir, "previous-check-live.cjs"), before, {
    flag: "wx",
  });
  const temporary = target + ".birarada-" + crypto.randomUUID() + ".tmp";
  try {
    fs.writeFileSync(temporary, data, { flag: "wx" });
    fs.renameSync(temporary, target);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

async function main() {
  const root = process.cwd();
  const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
  if (app.expo?.android?.package !== "com.birarada.app") {
    throw Error(
      "Bu komutu Birarada package.json dosyasinin oldugu klasorde calistir.",
    );
  }
  const sources = {};
  for (
    const name of [...ROUTES.map((r) => r + ".html"), "birarada-legal.css"]
  ) sources[name] = fs.readFileSync(path.join(root, "hosting/public", name));
  prepareLegal({}, [], sources); // Validate all local content before authentication or writes.
  const stateDir = fs.mkdtempSync(path.join(root, ".birarada-legal-"));
  installLiveChecker(root, stateDir);
  const api = createAdapter(root);
  await api.authorize();
  console.log("Surum/yapilandirma yedegi: " + path.basename(stateDir));
  await publishLegal({
    api,
    sources,
    record: (state) =>
      fs.writeFileSync(
        path.join(stateDir, "hosting-release.json"),
        JSON.stringify(state, null, 2) + "\n",
      ),
  });
  console.log("Sonraki kontrol: npm run release:live");
}
module.exports = {
  installLiveChecker,
  prepareLegal,
  assertPreserved,
  publishLegal,
  createAdapter,
  readPublic,
  versionName,
  releaseStamp,
  PREFIX,
  ROUTES,
  LIVE_URL,
};
if (require.main === module) {
  main().catch((error) => {
    console.error("Yasal sayfa yayini tamamlanmadi: " + error.message);
    process.exitCode = 1;
  });
}

/*
 * WastEye Portal — Google Sheets backend
 * ────────────────────────────────────────
 * Two ways to use this script:
 *
 *  A) BOUND to a sheet (recommended)
 *     - Open the Google Sheet you want to use.
 *     - Extensions → Apps Script. Paste this whole file.
 *     - Deploy → New deployment → Web app.
 *     - Leave SHEET_ID below as "" — the script uses the bound sheet.
 *
 *  B) STANDALONE script (script.google.com)
 *     - Create a Google Sheet and copy its ID from the URL
 *       (the part between /d/ and /edit).
 *     - Paste this whole file into the standalone Apps Script.
 *     - Set SHEET_ID below to that ID.
 *     - Deploy → New deployment → Web app.
 *
 * Deploy settings (both modes):
 *   - Execute as: Me
 *   - Who has access: Anyone
 *   - Copy the resulting "/exec" URL into the portal under
 *     Admin → Backend connection.
 */

// EITHER leave blank (if the script is bound to a Sheet)
// OR paste the Sheet ID here (if the script is standalone).
const SHEET_ID = "";

// Google Drive folder ID where product images are stored.
// Paste the folder ID from the share URL — e.g. for
// https://drive.google.com/drive/folders/1Z7znFIbldIjt5EK3WAfmAPYo9nU-g25T
// use:
const DRIVE_FOLDER_ID = "1Z7znFIbldIjt5EK3WAfmAPYo9nU-g25T";

const SHEET_TABS = {
  quotes:       ["id","status","createdAt","updatedAt","sentAt","createdBy","createdByName","client","quoteRef","total","tier","bandKey","sites_json","input_json"],
  users:        ["email","name","initials","role","title","password","suspended"],
  pricingBands: ["key","label","desc","minCD","maxCD","fee"],
  pricingTiers: ["key","minCams","disc","r7w","r7g","r14w","r14g","r28w","r28g"],
  mobilisation: ["key","label","desc","fee"],
  addons:       ["id","label","unit","price"],
  scenarios:    ["id","label","sub","iconKey","sites_json"],
  caseStudies:  ["id","title","client","sector","summary","results","tags","featured","link","addedAt","addedBy","dataUrl"],
  productImages:["id","name","description","tags","addedAt","addedBy","dataUrl"],
  tender:       ["catId","catNum","catLabel","catDesc","qId","question","tags","note","answerId","answerLength","answerText"],
  activityLog:  ["id","ts","action","actor","actorName","actorRole","client","ref","total","status","from","to","quoteId","sourceId"],
  settings:     ["key","value"],
};

function getSpreadsheet() {
  if (SHEET_ID && SHEET_ID.trim()) {
    return SpreadsheetApp.openById(SHEET_ID.trim());
  }
  const ss = SpreadsheetApp.getActive();
  if (!ss) {
    throw new Error(
      "No active spreadsheet. Either bind this script to a Sheet (open the Sheet → Extensions → Apps Script), " +
      "OR set SHEET_ID at the top of this file to the ID of a Google Sheet you own."
    );
  }
  return ss;
}

// ─────────────── HTTP entry points ───────────────

function doGet(e) {
  const op = (e.parameter.op || "").trim();
  try {
    if (op === "ping")      return json({ ok: true, ts: Date.now(), tabs: Object.keys(SHEET_TABS), driveFolder: DRIVE_FOLDER_ID });
    if (op === "pull")      return json({ ok: true, data: pullAll() });
    if (op === "pullTab")   return json({ ok: true, tab: e.parameter.tab, rows: pullTab(e.parameter.tab) });
    if (op === "listImages")return json({ ok: true, images: listDriveImages() });
    return json({ ok: false, error: "Unknown GET op. Try ?op=ping, ?op=pull, ?op=pullTab&tab=quotes, ?op=listImages." });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {
    return json({ ok: false, error: "Body must be valid JSON." });
  }
  const op = (body.op || "").trim();
  try {
    if (op === "push")        { pushAll(body.data || {}); return json({ ok: true, ts: Date.now() }); }
    if (op === "pushTab")     { pushTab(body.tab, body.rows || []); return json({ ok: true, tab: body.tab, count: body.rows.length }); }
    if (op === "log")         { appendLog(body.entry || {}); return json({ ok: true }); }
    if (op === "uploadImage") { return json({ ok: true, image: uploadDriveImage(body.name, body.mime, body.dataBase64) }); }
    if (op === "deleteImage") { deleteDriveImage(body.fileId); return json({ ok: true }); }
    if (op === "sendEmail")   { return json({ ok: true, sentAt: sendQuoteEmail(body) }); }
    return json({ ok: false, error: "Unknown POST op. Try op=push, op=pushTab, op=log, op=uploadImage, op=deleteImage." });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────── Helpers ───────────────

function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const headers = SHEET_TABS[name];
    if (headers) sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  }
  return sh;
}

function pullTab(name) {
  const sh = getOrCreateSheet(name);
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return [];
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const data = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return data.map(r => {
    const o = {};
    headers.forEach((h, i) => {
      const v = r[i];
      if (typeof v === "string" && (h.endsWith("_json") || h === "tags")) {
        try { o[h.replace(/_json$/, "")] = JSON.parse(v); } catch (e) { o[h.replace(/_json$/, "")] = v; }
      } else {
        o[h] = v;
      }
    });
    return o;
  });
}

function pullAll() {
  const out = {};
  for (const tab of Object.keys(SHEET_TABS)) out[tab] = pullTab(tab);
  return out;
}

function pushTab(name, rows) {
  if (!SHEET_TABS[name]) throw new Error("Unknown tab: " + name);
  const sh = getOrCreateSheet(name);
  const headers = SHEET_TABS[name];
  // Clear existing rows (preserve header)
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).clearContent();
  if (!rows || !rows.length) return;
  const data = rows.map(r => headers.map(h => {
    const baseKey = h.replace(/_json$/, "");
    let v = r[h] != null ? r[h] : r[baseKey];
    if (v == null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return v;
  }));
  sh.getRange(2, 1, data.length, headers.length).setValues(data);
}

function pushAll(data) {
  for (const tab of Object.keys(SHEET_TABS)) {
    if (data[tab]) pushTab(tab, data[tab]);
  }
}

function appendLog(entry) {
  const sh = getOrCreateSheet("activityLog");
  const headers = SHEET_TABS.activityLog;
  const row = headers.map(h => entry[h] != null ? entry[h] : "");
  sh.appendRow(row);
}

// ─────────────── Google Drive (product images) ───────────────

function getDriveFolder() {
  if (!DRIVE_FOLDER_ID) throw new Error("DRIVE_FOLDER_ID is not configured in the script.");
  return DriveApp.getFolderById(DRIVE_FOLDER_ID);
}

function listDriveImages() {
  const folder = getDriveFolder();
  const files = folder.getFiles();
  const out = [];
  while (files.hasNext()) {
    const f = files.next();
    const mime = f.getMimeType();
    if (!mime || mime.indexOf("image/") !== 0) continue;
    out.push({
      id: f.getId(),
      name: f.getName(),
      mime: mime,
      url: "https://drive.google.com/uc?export=view&id=" + f.getId(),
      thumbnailUrl: "https://drive.google.com/thumbnail?id=" + f.getId() + "&sz=w400",
      size: f.getSize(),
      addedAt: f.getDateCreated().getTime(),
    });
  }
  out.sort((a, b) => b.addedAt - a.addedAt);
  return out;
}

function uploadDriveImage(name, mime, dataBase64) {
  const folder = getDriveFolder();
  // Strip data URL prefix if present
  let b64 = dataBase64 || "";
  const m = b64.match(/^data:[^;]+;base64,(.*)$/);
  if (m) b64 = m[1];
  const bytes = Utilities.base64Decode(b64);
  const blob = Utilities.newBlob(bytes, mime || "image/jpeg", name || ("image-" + Date.now() + ".jpg"));
  const f = folder.createFile(blob);
  // Make readable to anyone with the link so the portal can render via the public URL
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  return {
    id: f.getId(),
    name: f.getName(),
    mime: f.getMimeType(),
    url: "https://drive.google.com/uc?export=view&id=" + f.getId(),
    thumbnailUrl: "https://drive.google.com/thumbnail?id=" + f.getId() + "&sz=w400",
    size: f.getSize(),
    addedAt: f.getDateCreated().getTime(),
  };
}

function deleteDriveImage(fileId) {
  if (!fileId) throw new Error("fileId required");
  const f = DriveApp.getFileById(fileId);
  // Apps Script's removeFile only removes from the folder; setTrashed actually trashes.
  f.setTrashed(true);
}

// Run this manually from the Apps Script editor (Run → forceAuth) ONCE after
// adding new Drive features. It exercises every Drive permission the script
// needs (read folder, create file, trash file) so Google asks for the FULL
// drive scope in one go — not the limited drive.readonly scope.
function forceAuth() {
  const folder = getDriveFolder();
  const probe = folder.createFile(Utilities.newBlob("forceAuth", "text/plain", "wasteeye-forceAuth.txt"));
  probe.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  probe.setTrashed(true);
  return { ok: true, folder: folder.getName() };
}

// ─────────────── Email (quote send) ───────────────
//
// Uses GmailApp (so the email comes from the script-owner's Gmail account,
// with the rep's reply-to address). Apps Script allows ~100 messages/day on a
// personal Gmail account, 1500/day on a Workspace account.

function sendQuoteEmail(opts) {
  const to = String(opts.to || "").trim();
  const subject = String(opts.subject || "WastEye quote").trim();
  const bodyHtml = String(opts.bodyHtml || "");
  const bodyText = String(opts.bodyText || stripHtml(bodyHtml));
  const replyTo = String(opts.replyTo || "").trim();
  const cc = (opts.cc || []).filter(Boolean).join(",");
  const bcc = (opts.bcc || []).filter(Boolean).join(",");

  if (!to) throw new Error("Recipient email is required.");
  if (!subject) throw new Error("Subject is required.");

  const params = {
    htmlBody: bodyHtml,
    name: opts.fromName || "Shrunk · WastEye",
  };
  if (replyTo) params.replyTo = replyTo;
  if (cc) params.cc = cc;
  if (bcc) params.bcc = bcc;

  GmailApp.sendEmail(to, subject, bodyText, params);
  return Date.now();
}

function stripHtml(html) {
  return String(html||"")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

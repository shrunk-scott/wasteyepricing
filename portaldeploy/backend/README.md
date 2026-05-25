# WastEye Portal — Google Sheets Backend Setup

The portal currently stores everything in your browser's localStorage. To
move to a shared, server-backed store, connect a Google Sheet. Setup takes
~10 minutes.

## What you get

- One source of truth for pricing, tender library, users, quotes, case
  studies, product images, and activity log
- Reps share the same data — edits made in admin are visible everywhere
  after a sync
- Audit log is appended in real time as actions happen
- Free, no infrastructure to run — Google hosts the Apps Script

## What you'll need

- A Google account with edit access to the Sheet
- An empty Google Sheet (or copy the **WastEye Backend** template if you
  have one)
- The portal admin URL

## Step 1 — Create the Sheet

1. Go to https://sheets.new and name the spreadsheet `WastEye Backend`.
   Don't add tabs — the script creates them on first push.
2. (Optional) Share the Sheet with anyone who needs raw read access.

## Step 2 — Install the Apps Script

1. In the Sheet, choose **Extensions → Apps Script**.
2. Delete the placeholder `function myFunction() {}` and paste the entire
   contents of [`sheets-backend.gs`](./sheets-backend.gs).
3. Click the disk icon to save. Name the project **WastEye Backend**.

## Step 3 — Deploy as a web app

1. Click **Deploy → New deployment** (top-right).
2. Click the gear → **Web app**.
3. Fill in:
   - Description: `WastEye portal backend v1`
   - Execute as: **Me** (your Google account)
   - Who has access: **Anyone** (the portal does its own auth, the
     endpoint only handles data)
4. Click **Deploy**. Authorise when prompted (Google will warn that this
   is an unverified app — that's expected for personal Apps Scripts).
5. Copy the **Web app URL** (ends in `/exec`).

## Step 4 — Connect the portal

1. Sign into the portal as an admin.
2. Open **Admin → Settings → Backend connection**.
3. Paste the Web app URL into **Apps Script web-app URL**.
4. Click **Test connection** — you should see "Connected · X tabs ready".
5. Click **Push current state to Sheets** to do the first full sync.
6. From now on, the portal will pull from and push to the Sheet on
   demand (or you can enable auto-sync in settings).

## Tab structure

The script creates these tabs automatically. Each tab has a header row
and one row per record.

| Tab            | Notes                                              |
|----------------|----------------------------------------------------|
| `quotes`       | Saved quotations (draft + sent). Sites and input as JSON columns. |
| `users`        | Portal sign-in accounts.                           |
| `pricingBands` | Report fee bands.                                  |
| `pricingTiers` | Camera rental tier prices.                         |
| `mobilisation` | Mobilisation bands and fees.                       |
| `addons`       | Optional uplifts.                                  |
| `scenarios`    | Quick-fill scenarios. `sites_json` holds the JSON. |
| `caseStudies`  | Case-study library. `dataUrl` may be a large base64. |
| `productImages`| Product image library.                             |
| `tender`       | Tender library, flattened: one row per answer.     |
| `activityLog`  | Action history. Appended as actions happen.        |
| `settings`     | Currency, GST, validity, etc.                      |

## Updating the script

When the portal ships a new backend version, paste the updated
`sheets-backend.gs` into the same Apps Script project (replacing the
old code). Then **Deploy → Manage deployments → ✎ Edit → Version: New
version → Deploy**. The Web app URL stays the same.

## Troubleshooting

**"Authorisation required" loop**
- The first time you call any function, Google asks you to authorise
  the script. After authorising, redeploy.

**"You do not have permission"**
- The Apps Script must be deployed as **Me**, not as the signed-in
  user. Double-check Step 3 part 3.

**Empty pull but the Sheet has data**
- The script reads from tab names that exactly match the tab list
  above. Renaming a tab will cause the script to create a new (empty)
  one. Don't rename.

**CORS errors in the browser console**
- Apps Script web-app endpoints add `Access-Control-Allow-Origin: *`
  automatically. If you see CORS errors, you're hitting a different
  URL (often the dev URL `/dev` instead of the deployment `/exec`).
  Re-copy the URL from **Deploy → Manage deployments → … → Web app**.

**Sheets quota**
- The free Apps Script tier allows 20,000 reads/day and 6
  minutes/execution. The portal pulls < 1 MB per sync — you'll hit
  rate limits long before quota.

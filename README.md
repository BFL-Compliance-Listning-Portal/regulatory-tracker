# Regulatory Updates Tracker — Setup Guide

This replaces "live scraping from the browser" (which kept getting blocked by
CORS proxies and anti-bot protection) with a **scheduled server-side scraper**
that runs on GitHub's servers and publishes a plain JSON file. The tracker HTML
just reads that JSON — no proxies, no CORS issues, works via double-click.

## How it works

```
GitHub Actions (every 3 hours)
   → runs scraper/scraper.js
   → writes data/regulatory_data.json
   → commits it to your repo
Your tracker HTML
   → fetches that JSON from raw.githubusercontent.com
   → renders the table + calls Claude for AI summaries (using each user's own API key)
```

## One-time setup (~10 minutes)

### 1. Create a GitHub repository
- Go to https://github.com/new
- Name it anything, e.g. `regulatory-tracker` — **Public** repo (raw.githubusercontent.com
  only serves public repos for free; if you need it private, see the note at the bottom)
- Don't add a README/gitignore (we already have files to upload)

### 2. Upload these files
Upload this entire folder's contents to your new repo, keeping the structure:
```
your-repo/
├── .github/workflows/scrape.yml
├── scraper/
│   ├── package.json
│   ├── scraper.js
│   └── sources.js
├── data/
│   └── regulatory_data.json   (placeholder — the Action will overwrite this)
└── regulatory_tracker_live.html
```
Easiest way: on the repo's GitHub page, click **"Add file" → "Upload files"**, drag
the whole folder in, and commit.

### 3. Enable Actions (usually on by default for a new repo)
- Go to your repo's **Actions** tab
- If prompted, click **"I understand my workflows, go ahead and enable them"**

### 4. Run the scraper once manually
- Actions tab → **"Scrape Regulatory Data"** workflow (left sidebar) →
  **"Run workflow"** button → **Run workflow**
- Wait ~1–2 minutes, refresh the page — you should see a green checkmark
- This also creates the first real `data/regulatory_data.json` commit

After this, it re-runs automatically every 3 hours (edit the `cron` line in
`.github/workflows/scrape.yml` to change the schedule).

### 5. Point the tracker at your data file
- Open `regulatory_tracker_live.html` in a text editor
- Find this line near the top of the `<script>` block:
  ```js
  const DATA_JSON_URL = 'https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/data/regulatory_data.json';
  ```
- Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME` with your actual values.
  You can double-check the exact raw URL by opening the JSON file on GitHub and
  clicking the **"Raw"** button — copy that URL exactly.
- Save the file.

### 6. Distribute the HTML file
The `regulatory_tracker_live.html` file now works completely standalone —
double-click it, no server needed, on anyone's machine. It just needs internet
access to reach `raw.githubusercontent.com` (for data) and `api.anthropic.com`
(only if a user has set up their own AI key in ⚙️ AI Settings).

## Maintaining it

- **A source's HTML layout changes and parsing breaks:** edit the matching
  parser in `scraper/scraper.js` (or tweak `sources.js` if it's just a URL
  change), commit, and it'll pick up on the next scheduled run — or trigger
  it manually via the Actions tab.
- **Add a new tab/source:** add an entry to `scraper/sources.js` under the
  right regulator, and add a matching entry in the `REGULATORS` object inside
  `regulatory_tracker_live.html` (for the tab label / "Visit Source" link).
- **Check what's failing:** the Actions tab shows full logs for every run —
  each source prints `OK (N rows)` or `FAILED: <reason>`. If a source fails,
  the JSON keeps last-known-good data for that tab rather than going blank.

## Note on BSE/NSE

These two exchanges run active bot-protection (Cloudflare/similar). Running
the scraper from GitHub's servers is *more* reliable than the old
browser-proxy approach, but not bulletproof — datacenter IPs (including
GitHub Actions runners) can still occasionally get blocked. If these sources
fail often, the realistic options are: (a) accept "Visit Source" as the
fallback for these two, or (b) look into whether BSE/NSE offer any official
data API you can register for.

## Note on private repos

If you don't want the data public, you can make the repo private, but then
`raw.githubusercontent.com` requires an auth token to fetch — which means
embedding a GitHub token in the HTML (same tradeoffs as the Anthropic key
discussion). For an internal compliance tool this is usually fine to keep
public since it's just re-publishing already-public regulatory notices, but
worth flagging if your org has a policy against public repos.

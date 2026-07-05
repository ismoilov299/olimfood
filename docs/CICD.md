# CI/CD

Pipeline: [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

## What runs

| Trigger | `backend` | `frontend` | `deploy` |
|---|:---:|:---:|:---:|
| Pull request → `master` | ✅ | ✅ | — |
| Push → `master`         | ✅ | ✅ | ✅ |

- **backend** — installs `backend/` + `telegram_bot/` deps (Python 3.10), byte-compiles all sources, and imports the FastAPI app as a smoke test.
- **frontend** — `npm ci`, `npm run lint` (non-blocking), `npm run build` (Node 20).
- **deploy** — only on push to `master`, only after both checks pass. SSHes to the
  server and runs [`scripts/deploy.sh`](../scripts/deploy.sh).

## Deploy flow (on the server, `/opt/olimfood`)

```
git fetch --prune origin master && git reset --hard origin/master   # (in the workflow)
scripts/deploy.sh:
  backend/venv       pip install -r backend/requirements.txt
  telegram_bot/venv  pip install -r telegram_bot/requirements.txt
  frontend           npm ci && npm run build         # nginx serves frontend/dist
  systemctl restart olimfood-backend olimfood-bot
  systemctl reload nginx
```

Left untouched by design:

- **`cf-tunnel.service`** — Cloudflare *quick tunnel*; its public URL changes on
  every restart and would break the bot's `WEBAPP_URL`. Never restarted by deploy.
- **`.env`** — untracked; holds `BOT_TOKEN` / `WEBAPP_URL`. Never modified.

## Database (`backend/olimfood.db`)

The SQLite DB is **normally preserved** across deploys, so orders and admin edits
made on the server are never lost by a code-only deploy.

When you *want* the server DB to change, push the DB file explicitly:

```bash
git add -f backend/olimfood.db
git commit -m "data: update menu"
git push
```

On that deploy the script detects the DB changed in the push, replaces the server
DB with the pushed one, and saves the previous live DB to
`backend/olimfood.db.bak-<timestamp>`. Deploys that do **not** include a DB change
keep the live server DB untouched.

> ⚠️ Pushing the DB overwrites live server data (any orders/edits since your local
> copy) with your committed snapshot — a timestamped backup is kept on the server.
> `backend/uploads/` is not versioned; keep product images in sync separately.

## Required GitHub secrets

Add these under **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | server IP / hostname |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | the **private** deploy key (full contents, incl. BEGIN/END lines) |

The matching **public** key is already installed in the server's
`/root/.ssh/authorized_keys` (key comment: `github-actions-deploy@olimfood`).

## Manual deploy

```bash
ssh root@<host> 'cd /opt/olimfood && git fetch --prune origin master && git reset --hard origin/master && bash scripts/deploy.sh'
```

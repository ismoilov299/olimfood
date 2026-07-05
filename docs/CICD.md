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
- **`backend/olimfood.db`** and **`backend/uploads/`** — gitignored, so `git reset`
  never touches production data.

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

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
scripts/deploy.sh (SKIP_FRONTEND_BUILD=1 from CI):
  backend/venv       pip install -r backend/requirements.txt
  telegram_bot/venv  pip install -r telegram_bot/requirements.txt
  systemctl restart olimfood-backend olimfood-bot ; systemctl reload nginx
then the deploy job ships the CI-built frontend dist and swaps it in atomically.
```

The frontend is **built in the CI `frontend` job** (uploaded as the `frontend-dist`
artifact) and shipped to the server — the 1 GB VPS never runs `npm build`. A manual
`bash scripts/deploy.sh` run (without `SKIP_FRONTEND_BUILD`) still builds on the box
as a fallback.

Server ops (configured on the box, outside git): 2 GB swap, daily SQLite backup at
03:00 → `/opt/backups` (7 kept), `ufw` (22/80/443 only), `fail2ban` (sshd), and
uvicorn bound to `127.0.0.1:8000` (reachable only through nginx).

Left untouched by design:

- **`cf-tunnel.service`** — Cloudflare *quick tunnel*; its public URL changes on
  every restart and would break the bot's `WEBAPP_URL`. Never restarted by deploy.
- **`.env`** — untracked; holds `BOT_TOKEN` / `WEBAPP_URL`. Never modified.

## Database migrations (Alembic)

Schema changes are managed by **Alembic** (`backend/alembic/`), not by runtime
`create_all`. Deploys run `alembic upgrade head` automatically before restarting.

Typical workflow after editing `backend/models.py`:

```bash
cd backend
venv/bin/alembic revision --autogenerate -m "describe change"   # generate
venv/bin/alembic upgrade head                                   # apply locally
git add alembic/versions/*.py && git commit && git push          # ship it
```

- Fresh DBs are created by `alembic upgrade head`.
- The pre-existing production DB (created before Alembic) is auto-stamped to
  `head` on the first migrated deploy, then upgraded normally afterwards.
- `render_as_batch=True` is enabled so column changes work on SQLite.
- CI runs `alembic upgrade head` on a throwaway DB to validate every migration.

## Database file (`backend/olimfood.db`)

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

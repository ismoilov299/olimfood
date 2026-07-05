#!/usr/bin/env bash
#
# OlimFood production deploy — runs ON THE SERVER (/opt/olimfood).
#
# The CI/CD workflow already ran, before calling this script:
#     git fetch --prune origin master && git reset --hard origin/master
# So the working tree is already at the latest master. This script only
# installs dependencies, rebuilds the frontend, and restarts services.
#
# IMPORTANT:
#   * cf-tunnel.service is intentionally NOT restarted. It is a Cloudflare
#     *quick tunnel* whose public URL changes on every restart, which would
#     break the bot's WEBAPP_URL. Leave it running untouched.
#   * The untracked .env file (BOT_TOKEN, WEBAPP_URL, ...) is never modified.
#   * The SQLite DB (backend/olimfood.db) and uploads/ are gitignored, so the
#     git reset above never touches production data.
#
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
echo "==> Deploying $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

echo "==> Installing backend dependencies"
backend/venv/bin/pip install --quiet --disable-pip-version-check -r backend/requirements.txt

echo "==> Installing telegram bot dependencies"
telegram_bot/venv/bin/pip install --quiet --disable-pip-version-check -r telegram_bot/requirements.txt

echo "==> Building frontend"
( cd frontend && npm ci && npm run build )

echo "==> Restarting application services (cf-tunnel left untouched)"
systemctl restart olimfood-backend olimfood-bot
systemctl reload nginx

echo "==> Verifying health"
sleep 2
systemctl is-active olimfood-backend olimfood-bot
curl -fsS http://127.0.0.1:8000/health && echo
echo "==> Deploy complete."

#!/usr/bin/env bash
#
# OlimFood production deploy — runs ON THE SERVER (/opt/olimfood).
#
# Invoked by the CI/CD workflow (and can be run manually) as:
#     cd /opt/olimfood && git fetch --prune origin master \
#       && bash <(git show origin/master:scripts/deploy.sh)
#
# It is run from a process substitution (not the on-disk file) so that the
# 'git reset --hard' below can safely replace scripts/deploy.sh itself.
#
# Data-safety rules:
#   * cf-tunnel.service is NEVER restarted — it is a Cloudflare *quick tunnel*
#     whose public URL changes on restart and would break the bot's WEBAPP_URL.
#   * .env (untracked) is never modified.
#   * The SQLite DB (backend/olimfood.db) is preserved across deploys, EXCEPT
#     when a push deliberately includes a new committed DB — then the server DB
#     is replaced with the pushed one and the previous live DB is backed up.
#     (To push the DB: `git add -f backend/olimfood.db && git commit && push`.)
#
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

DB="backend/olimfood.db"
OLD="$(git rev-parse HEAD)"
echo "==> Current commit: $(git rev-parse --short HEAD)"

echo "==> Fetching latest master"
git fetch --prune origin master
NEW="$(git rev-parse origin/master)"

# Blob hashes of the tracked DB at the old and new commits (empty if untracked).
old_db_blob="$(git rev-parse -q --verify "$OLD:$DB" 2>/dev/null || true)"
new_db_blob="$(git rev-parse -q --verify "$NEW:$DB" 2>/dev/null || true)"

# Snapshot the current live DB before the reset can touch it.
live_backup=""
if [ -f "$DB" ]; then
  live_backup="/tmp/olimfood.live.$(date +%s).db"
  cp -f "$DB" "$live_backup"
fi

echo "==> Updating working tree -> ${NEW:0:7}"
git reset --hard "$NEW"

if [ -n "$new_db_blob" ] && [ "$old_db_blob" != "$new_db_blob" ]; then
  echo "==> DB change included in this push -> server DB updated from the repo"
  if [ -n "$live_backup" ]; then
    bak="${DB}.bak-$(date +%Y%m%d-%H%M%S)"
    cp -f "$live_backup" "$bak"
    echo "    previous live DB backed up to $bak"
  fi
elif [ -n "$new_db_blob" ]; then
  echo "==> No DB change in this push -> keeping live production DB"
  [ -n "$live_backup" ] && cp -f "$live_backup" "$DB"
else
  echo "==> DB is not tracked in the repo -> live DB left untouched"
fi

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
echo "==> Deploy complete: now at $(git rev-parse --short HEAD)"

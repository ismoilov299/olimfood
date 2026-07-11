#!/bin/bash
cd "$(dirname "$0")/frontend" || exit 1
echo "Starting Olimbrand Frontend on http://localhost:5173"
echo
npm run dev

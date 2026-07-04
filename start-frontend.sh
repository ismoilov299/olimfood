#!/bin/bash
cd "$(dirname "$0")/frontend" || exit 1
echo "Starting OlimFood Frontend on http://localhost:5173"
echo
npm run dev

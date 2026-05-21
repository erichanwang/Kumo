#!/bin/bash
# Kumo - Chrome Extension Quick Load (macOS/Linux)
# Usage: bash test/load-extension.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

echo
echo "  ======================================"
echo "    Kumo - Chrome Extension Quick Load"
echo "  ======================================"
echo

if [ ! -f "$DIST/manifest.json" ]; then
    echo "  [ERROR] Extension not built yet."
    echo "  Run: npm run build"
    echo
    exit 1
fi

# Find Chrome/Chromium
CHROME=""
for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/usr/bin/google-chrome" \
    "/usr/bin/chromium" \
    "/usr/bin/chromium-browser"; do
    if [ -x "$candidate" ]; then
        CHROME="$candidate"
        break
    fi
done

if [ -z "$CHROME" ]; then
    echo "  [ERROR] Chrome/Chromium not found."
    exit 1
fi

echo "  Chrome:  $CHROME"
echo "  Dist:    $DIST"
echo

# Start the test server in background
node "$ROOT/test/server.js" &
SERVER_PID=$!
sleep 2

# Open Chrome with extension loaded + test page
"$CHROME" --load-extension="$DIST" --new-window "http://localhost:3456" &

echo
echo "  Chrome launched with Kumo extension!"
echo "  Test server: http://localhost:3456"
echo "  Press Ctrl+C to stop test server"
echo

# Wait for server to be killed
trap "kill $SERVER_PID 2>/dev/null" EXIT
wait $SERVER_PID

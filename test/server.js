/**
 * Kumo Local Test Server
 * 
 * Serves:
 *   - The test page (test-page.html) at /
 *   - The built extension (dist/) at /dist/
 * 
 * Usage:
 *   node test/server.js
 *   Then open http://localhost:3456 in Chrome
 *   Load the extension from http://localhost:3456/dist/ as an unpacked extension
 * 
 * Or use: npm run test:server
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const PORT = 3456

// MIME types for serving
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.gz': 'application/gzip',
  '.dat': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
}

function serveFile(url, res) {
  // Resolve path safely
  let filePath

  if (url === '/' || url === '/index.html') {
    filePath = path.join(root, 'test', 'test-page.html')
  } else if (url.startsWith('/dist/')) {
    // Strip /dist and resolve from project dist/
    const rel = url.slice('/dist/'.length)
    filePath = path.join(root, 'dist', rel)
  } else {
    // Try as relative to root
    filePath = path.join(root, url.slice(1))
  }

  // Security: don't escape root
  if (!filePath.startsWith(root)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  const ext = path.extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'

  try {
    const data = fs.readFileSync(filePath)
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    })
    res.end(data)
  } catch (e) {
    // Check if dist exists
    const distExists = fs.existsSync(path.join(root, 'dist'))
    const manifestExists = fs.existsSync(path.join(root, 'dist', 'manifest.json'))

    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>404 - Kumo Test Server</title>
      <style>
        body { font-family: system-ui; max-width: 600px; margin: 60px auto; padding: 0 20px; color: #333; }
        pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
        .warn { background: #fffbe6; border: 1px solid #ffe58f; padding: 16px; border-radius: 8px; margin: 20px 0; }
      </style>
      </head>
      <body>
        <h1>404 — Not Found</h1>
        <p><code>${url}</code></p>
        ${!distExists ? '<div class="warn"><strong>⚠ dist/ not found.</strong> Run <code>npm run build</code> first to build the extension.</div>' : ''}
        ${distExists && !manifestExists ? '<div class="warn"><strong>⚠ manifest.json missing in dist/.</strong> Rebuild the extension.</div>' : ''}
        <p><a href="/">← Back to test page</a></p>
        <hr />
        <h2>How to test Kumo:</h2>
        <ol>
          <li>Run <code>npm run build</code> to build the extension</li>
          <li>Start this server: <code>npm run test:server</code></li>
          <li>Open <a href="/">the test page</a> in Chrome</li>
          <li>Go to <code>chrome://extensions</code>, enable Developer Mode</li>
          <li>Click "Load unpacked" and select the <code>dist/</code> folder</li>
          <li>Refresh this page — furigana should appear!</li>
        </ol>
      </body>
      </html>
    `)
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' })
    res.end()
    return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`).pathname
  serveFile(url, res)
})

server.listen(PORT, () => {
  // Check what's available
  const distExists = fs.existsSync(path.join(root, 'dist'))
  const testPageExists = fs.existsSync(path.join(root, 'test', 'test-page.html'))

  console.log()
  console.log('  ☁️  Kumo Test Server')
  console.log('  ────────────────────────────────────')
  console.log(`  Local:    http://localhost:${PORT}`)
  console.log(`  Test:     http://localhost:${PORT}/test-page.html`)
  console.log()
  if (testPageExists) {
    console.log('  ✅ test-page.html found')
  } else {
    console.log('  ❌ test-page.html missing!')
  }
  if (distExists) {
    const manifestExists = fs.existsSync(path.join(root, 'dist', 'manifest.json'))
    if (manifestExists) {
      console.log(`  ✅ Extension built — ready at /dist/`)
      console.log()
      console.log('  📋 Quick Start:')
      console.log('     1. Open http://localhost:3456 in Chrome')
      console.log('     2. chrome://extensions → Load unpacked → select dist/')
      console.log('     3. Refresh test page — furigana should appear!')
    } else {
      console.log('  ⚠️  dist/ exists but no manifest.json — run "npm run build"')
    }
  } else {
    console.log('  ⚠️  dist/ not found — run "npm run build" first')
    console.log('     Then restart this server.')
  }
  console.log('  ────────────────────────────────────')
  console.log('  Press Ctrl+C to stop')
  console.log()
})

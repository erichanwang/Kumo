import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { resolve } from 'path'
import { readFileSync } from 'fs'

/** Get the last git commit date for the extension's manifest.json. */
function getExtensionLastUpdated(): string {
  try {
    const date = execSync(
      'git log -1 --format=%ci -- manifest.json',
      { cwd: resolve(__dirname, '..'), encoding: 'utf-8' }
    ).trim()
    if (!date) return 'Unknown'
    return new Date(date).toISOString().split('T')[0]
  } catch {
    return 'Unknown'
  }
}

/** Read the extension version from the root manifest.json. */
function getExtensionVersion(): string {
  try {
    const raw = readFileSync(resolve(__dirname, '..', 'manifest.json'), 'utf-8')
    const manifest = JSON.parse(raw)
    return manifest.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/** Inject build-time constants. */
function buildInfoPlugin(): Plugin {
  return {
    name: 'build-info',
    config() {
      return {
        define: {
          __WEBSITE_BUILD_TIME__: JSON.stringify(new Date().toISOString().split('T')[0]),
          __EXTENSION_LAST_UPDATED__: JSON.stringify(getExtensionLastUpdated()),
          __EXTENSION_VERSION__: JSON.stringify(getExtensionVersion())
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), buildInfoPlugin()],
  server: {
    port: 5173
  }
})

import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }
import fs from 'fs'
import path from 'path'

const ZLIB_VIRTUAL_ID = '\0zlibjs:gunzip'

function zlibjsPlugin(): Plugin {
  return {
    name: 'fix-zlibjs-export',
    enforce: 'pre',
    resolveId(id: string) {
      if (id === 'zlibjs/bin/gunzip.min.js') {
        return ZLIB_VIRTUAL_ID
      }
      return null
    },
    load(id: string) {
      if (id === ZLIB_VIRTUAL_ID) {
        const zlibjsPath = path.resolve('node_modules/zlibjs/bin/gunzip.min.js')
        let code = fs.readFileSync(zlibjsPath, 'utf-8')

        // FIX: The zlibjs IIFE does (function() { var aa=this; ... }).call(this);
        // In a <script> tag, top-level `this` is window, but when Vite bundles
        // this as an ES module, top-level `this` is `undefined` (strict mode).
        // So `aa` captures undefined, and later `'Zlib' in aa` throws:
        //   TypeError: Cannot use 'in' operator to search for 'Zlib' in undefined
        // Fix by replacing .call(this) with .call(globalThis).
        code = code.replace(
          '}).call(this);',
          '}).call(typeof globalThis!=="undefined"?globalThis:typeof window!=="undefined"?window:{});'
        )

        // The zlibjs IIFE sets globalThis.Zlib.Gunzip synchronously but doesn't export anything.
        // kuromoji does: var zlib = require("zlibjs/bin/gunzip.min.js"); new zlib.Zlib.Gunzip(...)
        //
        // KEY INSIGHT: With "export default", Vite wraps the default in a namespace:
        //   require() → { default: {Zlib:...}, [Symbol.toStringTag]:"Module" }
        //   Then zlib.Zlib is undefined because it's at zlib.default.Zlib
        //
        // With a NAMED export, require() returns the namespace directly:
        //   require() → { Zlib:..., [Symbol.toStringTag]:"Module" }
        //   Then zlib.Zlib.Gunzip works because Zlib IS on the namespace!
        code += ';export const Zlib=((typeof globalThis!=="undefined"?globalThis:typeof window!=="undefined"?window:{})).Zlib??{}'

        return code
      }
      return null
    }
  }
}

// Builds the content script as a standalone IIFE with a FIXED filename.
// This avoids the @crxjs/vite-plugin dynamic import pattern which produces
// hashed filenames that fail with ERR_FILE_NOT_FOUND when Chrome's module
// cache is cleared or the service worker restarts.
function contentScriptIIFE(): Plugin {
  let resolvedConfig: ResolvedConfig

  return {
    name: 'content-script-iife',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config
    },
    async closeBundle() {
      const { build } = await import('vite')

      // Build the content script as a self-contained IIFE (no dynamic imports, no hashes)
      await build({
        configFile: false,
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          lib: {
            entry: path.resolve('src/content/index.ts'),
            formats: ['iife'],
            name: '__kumo_content_init__',
            fileName: () => 'content.js'
          },
          rollupOptions: {
            external: [] // bundle everything — no external deps
          }
        },
        resolve: {
          ...resolvedConfig.resolve,
          alias: {
            path: 'path-browserify'
          }
        },
        plugins: [zlibjsPlugin()],
        define: resolvedConfig.define
      })

      // Update manifest to use the fixed-filename content.js directly
      const manifestPath = path.resolve('dist/manifest.json')
      const distManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

      distManifest.content_scripts[0].js = ['content.js']

      // Remove the loader and dynamic-import chunks from web_accessible_resources
      // Use exact prefix matching to avoid accidentally removing unrelated files
      if (distManifest.web_accessible_resources?.[0]?.resources) {
        distManifest.web_accessible_resources[0].resources =
          distManifest.web_accessible_resources[0].resources.filter(
            (r: string) =>
              !r.startsWith('assets/index.ts-') &&
              !r.startsWith('assets/index.ts-loader-')
          )
      }

      // Clean up stale root .css files (HTML pages reference hashed assets/ versions)
      const staleCssFiles = ['kanji.css', 'stats.css', 'sentences.css', 'backup.css', 'quiz.css', 'popup.css', 'srs.css', 'wordbank.css']
      for (const f of staleCssFiles) {
        const p = path.resolve('dist', f)
        if (fs.existsSync(p)) {
          fs.unlinkSync(p)
          console.log(`Kumo: Removed stale ${f} from dist root`)
        }
      }

      fs.writeFileSync(manifestPath, JSON.stringify(distManifest, null, 2) + '\n')
    }
  }
}

export default defineConfig({
  plugins: [zlibjsPlugin(), crx({ manifest }), contentScriptIIFE()],
  resolve: {
    alias: {
      path: 'path-browserify'
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html',
        wordbank: 'wordbank.html',
        srs: 'srs.html',
        kanji: 'kanji.html',
        stats: 'stats.html',
        sentences: 'sentences.html',
        backup: 'backup.html',
        quiz: 'quiz.html'
      }
    }
  }
})

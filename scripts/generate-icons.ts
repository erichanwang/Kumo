// Generate icon PNGs for Kumo extension from the transparent favicon
// Trims transparent padding, scales the cloud to fill ~85% of the canvas,
// then outputs 16x16, 48x48, and 128x128 PNGs with alpha preserved.
// Run: npx tsx scripts/generate-icons.ts

import sharp from 'sharp'
import * as path from 'path'

const FAVICON_PATH = path.resolve('app/public/favicon.png')
const OUTPUT_DIR = path.resolve('public')
const SIZES = [16, 48, 128]

/** How much of the icon canvas the cloud should occupy (0-1). */
const FILL_RATIO = 0.85

async function generateIcons(): Promise<void> {
  // Step 1: Trim transparent edges and measure the actual cloud content
  const trimmed = await sharp(FAVICON_PATH)
    .trim({ threshold: 10 })
    .toBuffer()

  const trimmedMeta = await sharp(trimmed).metadata()
  const contentW = trimmedMeta.width!
  const contentH = trimmedMeta.height!
  const contentMax = Math.max(contentW, contentH)
  console.log(
    `Cloud content: ${contentW}x${contentH} (${Math.round((contentMax / 128) * 100)}% of 128px canvas)`
  )

  // Step 2: Scale the cloud so it fills FILL_RATIO of the target icon size.
  // We build a 128x128 canvas, scale the cloud to fill 85% of it,
  // and center it on a transparent background.
  const baseSize = 128
  const targetCloudSize = Math.round(baseSize * FILL_RATIO)
  const scale = targetCloudSize / contentMax

  const newCloudW = Math.round(contentW * scale)
  const newCloudH = Math.round(contentH * scale)

  // Resize the trimmed cloud to the target size
  const scaledCloud = await sharp(trimmed)
    .resize(newCloudW, newCloudH)
    .toBuffer()

  // Step 3: Place the scaled cloud centered on a 128x128 transparent canvas
  const left = Math.round((baseSize - newCloudW) / 2)
  const top = Math.round((baseSize - newCloudH) / 2)

  const base128 = await sharp({
    create: {
      width: baseSize,
      height: baseSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: scaledCloud, left, top }])
    .png()
    .toBuffer()

  console.log(`Placed ${newCloudW}x${newCloudH} cloud at (${left},${top}) on 128x128 canvas`)

  // Step 4: Resize to all required icon sizes
  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon${size}.png`)
    await sharp(base128)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`Generated ${outputPath} (${size}x${size}, transparent)`)
  }

  console.log('All icons generated from transparent favicon!')
}

generateIcons().catch((err) => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})

import sharp from "sharp"
import { mkdir, rename } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.join(__dirname, "..")
const publicDir = path.join(root, "public")
const source = path.join(publicDir, "logo-source.png")
const legacy = path.join(publicDir, "logo.png")
const outDir = path.join(publicDir, "logo")

/** Display sizes; assets are generated at 1x and 2x for retina. */
const sizes = [32, 48, 64, 96, 128, 192, 256, 512]

let input = source
try {
  await sharp(source).metadata()
} catch {
  input = legacy
}

await mkdir(outDir, { recursive: true })

for (const size of sizes) {
  const resized = sharp(input).resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })

  await resized
    .clone()
    .webp({ quality: 92, effort: 6, smartSubsample: true })
    .toFile(path.join(outDir, `icon-${size}.webp`))

  const png = resized.clone()
  if (size <= 48) {
    await png.png({ compressionLevel: 9, palette: true }).toFile(path.join(outDir, `icon-${size}.png`))
  } else {
    await png.png({ compressionLevel: 9 }).toFile(path.join(outDir, `icon-${size}.png`))
  }
}

await sharp(input)
  .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(publicDir, "favicon-32x32.png"))

await sharp(input)
  .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(publicDir, "apple-touch-icon.png"))

// Keep a small default og/icon reference without shipping the 1MB+ master as logo.png
await sharp(input)
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 92 })
  .toFile(path.join(publicDir, "logo.webp"))

try {
  await sharp(legacy).metadata()
  if (input === legacy) {
    await rename(legacy, source)
    console.log("Moved public/logo.png → public/logo-source.png (master asset)")
  }
} catch {
  /* logo-source.png is the canonical master */
}

console.log(`Optimized ${sizes.length} sizes → public/logo/ (WebP q92 + PNG)`)

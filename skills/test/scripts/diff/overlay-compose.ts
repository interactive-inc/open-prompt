#!/usr/bin/env bun

/**
 * 2つの画像（A: reference / B: target）から比較用の3枚を生成するスクリプト
 *
 * Usage:
 *   bun overlay-compose.ts <a-png> <b-png> <output-prefix> [flags]
 *
 * Flags:
 *   --opacity=0.5     Aを何%透過で重ねるか (0.0-1.0、既定 0.5)
 *   --offset-y=N      BがAより Npx 下にコンテンツがあるとき、B の上 Npx を飛ばして整列する
 *                     負値を渡すと逆に A の上 |N|px を飛ばす
 *   --crop-top=N      両方の画像の上から Npx を削ってから比較する（ヒーロー部を除外する用途）
 *
 * 出力:
 *   <prefix>-overlay.png       B の上に A を透過で重ねた画像
 *   <prefix>-difference.png    各ピクセルの RGB 差を白ほど強く描画した画像
 *   <prefix>-side-by-side.png  左=A / 右=B で横並び
 *
 * 依存: pngjs
 */

import { readFileSync, writeFileSync } from "node:fs"
import { PNG } from "pngjs"

type Size = {
  width: number
  height: number
}

type Flags = {
  opacity: number
  offsetY: number
  cropTop: number
}

type OverlayInput = {
  aPath: string
  bPath: string
  outputPrefix: string
  flags: Flags
}

type Preprocessing = {
  opacity: number
  offsetY: number
  cropTop: number
}

type ComposeResult = {
  aSize: Size
  bSize: Size
  comparedSize: Size
  differenceMean: number
  differenceMax: number
  preprocessing: Preprocessing
}

function loadPng(path: string): PNG {
  let buffer: Buffer

  try {
    buffer = readFileSync(path)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read "${path}": ${message}`)
  }

  try {
    return PNG.sync.read(buffer)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse "${path}" as PNG: ${message}`)
  }
}

function cropTopLeft(img: PNG, width: number, height: number): PNG {
  if (img.width === width && img.height === height) {
    return img
  }

  if (width > img.width || height > img.height) {
    throw new Error(`Cannot crop ${img.width}x${img.height} to larger ${width}x${height}`)
  }

  const cropped = new PNG({ width, height })
  const srcBytesPerRow = img.width * 4
  const dstBytesPerRow = width * 4

  for (let y = 0; y < height; y++) {
    const srcOffset = y * srcBytesPerRow
    const dstOffset = y * dstBytesPerRow
    img.data.copy(cropped.data, dstOffset, srcOffset, srcOffset + dstBytesPerRow)
  }

  return cropped
}

function trimTopRows(img: PNG, rows: number): PNG {
  if (rows <= 0) {
    return img
  }

  if (rows >= img.height) {
    throw new Error(
      `trimTopRows: rows (${rows}) >= image height (${img.height}). 画像全体より多く削れません。`,
    )
  }

  const newHeight = img.height - rows
  const out = new PNG({ width: img.width, height: newHeight })
  const bytesPerRow = img.width * 4

  img.data.copy(out.data, 0, rows * bytesPerRow, (rows + newHeight) * bytesPerRow)

  return out
}

function composeOverlay(top: PNG, bottom: PNG, opacity: number): PNG {
  const width = top.width
  const height = top.height
  const out = new PNG({ width, height })

  for (let i = 0; i < top.data.length; i += 4) {
    const tr = top.data[i]
    const tg = top.data[i + 1]
    const tb = top.data[i + 2]
    const br = bottom.data[i]
    const bg = bottom.data[i + 1]
    const bb = bottom.data[i + 2]

    out.data[i] = Math.round(tr * opacity + br * (1 - opacity))
    out.data[i + 1] = Math.round(tg * opacity + bg * (1 - opacity))
    out.data[i + 2] = Math.round(tb * opacity + bb * (1 - opacity))
    out.data[i + 3] = 255
  }

  return out
}

function composeDifference(a: PNG, b: PNG): { png: PNG; mean: number; max: number } {
  const width = a.width
  const height = a.height
  const out = new PNG({ width, height })
  let total = 0
  let max = 0
  const pixels = (a.data.length / 4) | 0

  for (let i = 0; i < a.data.length; i += 4) {
    const dr = Math.abs(a.data[i] - b.data[i])
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1])
    const db = Math.abs(a.data[i + 2] - b.data[i + 2])

    const luminance = Math.round((dr + dg + db) / 3)

    if (luminance > max) {
      max = luminance
    }
    total += luminance

    out.data[i] = luminance
    out.data[i + 1] = luminance
    out.data[i + 2] = luminance
    out.data[i + 3] = 255
  }

  return {
    png: out,
    mean: total / pixels,
    max,
  }
}

function drawLabelBand(png: PNG, bandHeight: number): PNG {
  const width = png.width
  const height = png.height + bandHeight
  const out = new PNG({ width, height })

  for (let y = 0; y < bandHeight; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      out.data[i] = 235
      out.data[i + 1] = 235
      out.data[i + 2] = 235
      out.data[i + 3] = 255
    }
  }

  const srcBytesPerRow = width * 4

  for (let y = 0; y < png.height; y++) {
    const srcOffset = y * srcBytesPerRow
    const dstOffset = (y + bandHeight) * srcBytesPerRow
    png.data.copy(out.data, dstOffset, srcOffset, srcOffset + srcBytesPerRow)
  }

  return out
}

function composeSideBySide(left: PNG, right: PNG, gap: number): PNG {
  const leftBanded = drawLabelBand(left, 24)
  const rightBanded = drawLabelBand(right, 24)
  const height = Math.max(leftBanded.height, rightBanded.height)
  const width = leftBanded.width + gap + rightBanded.width
  const out = new PNG({ width, height })

  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 255
    out.data[i + 1] = 255
    out.data[i + 2] = 255
    out.data[i + 3] = 255
  }

  for (let y = 0; y < leftBanded.height; y++) {
    for (let x = 0; x < leftBanded.width; x++) {
      const srcIdx = (y * leftBanded.width + x) * 4
      const dstIdx = (y * width + x) * 4
      out.data[dstIdx] = leftBanded.data[srcIdx]
      out.data[dstIdx + 1] = leftBanded.data[srcIdx + 1]
      out.data[dstIdx + 2] = leftBanded.data[srcIdx + 2]
      out.data[dstIdx + 3] = 255
    }
  }

  const offsetX = leftBanded.width + gap

  for (let y = 0; y < rightBanded.height; y++) {
    for (let x = 0; x < rightBanded.width; x++) {
      const srcIdx = (y * rightBanded.width + x) * 4
      const dstIdx = (y * width + (x + offsetX)) * 4
      out.data[dstIdx] = rightBanded.data[srcIdx]
      out.data[dstIdx + 1] = rightBanded.data[srcIdx + 1]
      out.data[dstIdx + 2] = rightBanded.data[srcIdx + 2]
      out.data[dstIdx + 3] = 255
    }
  }

  return out
}

function compose(input: OverlayInput): ComposeResult {
  const aOriginal = loadPng(input.aPath)
  const bOriginal = loadPng(input.bPath)

  console.log(`A: ${aOriginal.width}x${aOriginal.height}`)
  console.log(`B: ${bOriginal.width}x${bOriginal.height}`)

  let a = aOriginal
  let b = bOriginal

  if (input.flags.cropTop > 0) {
    a = trimTopRows(a, input.flags.cropTop)
    b = trimTopRows(b, input.flags.cropTop)
    console.log(`Applied --crop-top=${input.flags.cropTop}`)
  }

  if (input.flags.offsetY > 0) {
    b = trimTopRows(b, input.flags.offsetY)
    console.log(`Applied --offset-y=${input.flags.offsetY} (B を ${input.flags.offsetY}px 上寄せ)`)
  } else if (input.flags.offsetY < 0) {
    a = trimTopRows(a, -input.flags.offsetY)
    console.log(`Applied --offset-y=${input.flags.offsetY} (A を ${-input.flags.offsetY}px 上寄せ)`)
  }

  const width = Math.min(a.width, b.width)
  const height = Math.min(a.height, b.height)

  if (a.width !== b.width || a.height !== b.height) {
    const widthRatio = Math.max(a.width, b.width) / Math.min(a.width, b.width)

    if (widthRatio > 1.2) {
      console.warn(
        `WARNING: 画像の幅が大きく異なる (${a.width} vs ${b.width})。ビューポート幅を揃えてください。`,
      )
    }

    console.log(`Cropping to common area: ${width}x${height}`)
  }

  const aCropped = cropTopLeft(a, width, height)
  const bCropped = cropTopLeft(b, width, height)

  const overlay = composeOverlay(aCropped, bCropped, input.flags.opacity)
  const difference = composeDifference(aCropped, bCropped)
  const sideBySide = composeSideBySide(aCropped, bCropped, 16)

  writeFileSync(`${input.outputPrefix}-overlay.png`, PNG.sync.write(overlay))
  writeFileSync(`${input.outputPrefix}-difference.png`, PNG.sync.write(difference.png))
  writeFileSync(`${input.outputPrefix}-side-by-side.png`, PNG.sync.write(sideBySide))

  return {
    aSize: { width: aOriginal.width, height: aOriginal.height },
    bSize: { width: bOriginal.width, height: bOriginal.height },
    comparedSize: { width, height },
    differenceMean: difference.mean,
    differenceMax: difference.max,
    preprocessing: {
      opacity: input.flags.opacity,
      offsetY: input.flags.offsetY,
      cropTop: input.flags.cropTop,
    },
  }
}

function parseArgs(argv: string[]): { positional: string[]; flags: Flags } {
  const positional: string[] = []
  const raw: Record<string, string> = {}

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=")
      if (eq === -1) {
        raw[arg.slice(2)] = "true"
      } else {
        raw[arg.slice(2, eq)] = arg.slice(eq + 1)
      }
    } else {
      positional.push(arg)
    }
  }

  const opacityStr = raw.opacity
  const opacity = opacityStr ? Number.parseFloat(opacityStr) : 0.5

  if (Number.isNaN(opacity) || opacity < 0 || opacity > 1) {
    throw new Error(`Invalid --opacity="${opacityStr}". Must be 0.0-1.0.`)
  }

  const offsetY = raw["offset-y"] ? Number.parseInt(raw["offset-y"], 10) : 0

  if (Number.isNaN(offsetY)) {
    throw new Error(`Invalid --offset-y="${raw["offset-y"]}". Must be integer.`)
  }

  const cropTop = raw["crop-top"] ? Number.parseInt(raw["crop-top"], 10) : 0

  if (Number.isNaN(cropTop) || cropTop < 0) {
    throw new Error(`Invalid --crop-top="${raw["crop-top"]}". Must be non-negative integer.`)
  }

  return { positional, flags: { opacity, offsetY, cropTop } }
}

// --- Main ---
try {
  const { positional, flags } = parseArgs(process.argv.slice(2))

  if (positional.length < 3) {
    console.error(
      "Usage: bun overlay-compose.ts <a-png> <b-png> <output-prefix> [--opacity=0.5] [--offset-y=N] [--crop-top=N]",
    )
    process.exit(1)
  }

  const [aPath, bPath, outputPrefix] = positional

  console.log(`A:       ${aPath}`)
  console.log(`B:       ${bPath}`)
  console.log(`Prefix:  ${outputPrefix}`)
  console.log(
    `Flags:   opacity=${flags.opacity} offset-y=${flags.offsetY} crop-top=${flags.cropTop}\n`,
  )

  const result = compose({ aPath, bPath, outputPrefix, flags })

  console.log("\n--- Results ---")
  console.log(`Compared area: ${result.comparedSize.width}x${result.comparedSize.height}`)
  console.log(
    `Difference mean (0-255): ${result.differenceMean.toFixed(1)} / max: ${result.differenceMax}`,
  )
  console.log(`Output:`)
  console.log(`  ${outputPrefix}-overlay.png`)
  console.log(`  ${outputPrefix}-difference.png`)
  console.log(`  ${outputPrefix}-side-by-side.png`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\nError: ${message}`)
  process.exit(1)
}

#!/usr/bin/env bun

/**
 * 複数ページの A/B 画像を overlay-compose で一括処理するスクリプト
 *
 * 前提: <output-dir> に `a-<page>-<viewport>.png` と `b-<page>-<viewport>.png` が
 * 全ページ分揃っている（playwright-cli などで先に取得しておく）
 *
 * Usage:
 *   bun batch-overlay.ts <output-dir> --pages=top,about,news --viewports=pc,sp [flags]
 *
 * Flags（全ページ共通に適用）:
 *   --opacity=0.5
 *   --offset-y=N      全ページ共通で適用。ページごとに変えたい場合は --offset-map を使う
 *   --crop-top=N      同上
 *   --offset-map=top:60,news:30
 *   --crop-map=top:0,news:200
 *
 * 出力:
 *   <page>-<viewport>-overlay.png / -difference.png / -side-by-side.png
 */

import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

type MapFlag = Record<string, number>

type ParsedArgs = {
  outputDir: string
  pages: string[]
  viewports: string[]
  opacity: number | null
  offsetY: number | null
  cropTop: number | null
  offsetMap: MapFlag
  cropMap: MapFlag
}

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return []
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function parseMapFlag(value: string | undefined): MapFlag {
  if (!value) {
    return {}
  }

  const result: MapFlag = {}

  for (const pair of value.split(",")) {
    const [key, raw] = pair.split(":")
    if (!key || raw === undefined) {
      continue
    }
    const num = Number.parseInt(raw, 10)
    if (Number.isNaN(num)) {
      throw new Error(`Invalid map entry: "${pair}". Expected key:number.`)
    }
    result[key.trim()] = num
  }

  return result
}

function parseArgs(argv: string[]): ParsedArgs {
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

  if (positional.length < 1) {
    throw new Error("Usage: bun batch-overlay.ts <output-dir> --pages=... --viewports=... [flags]")
  }

  const pages = parseCsv(raw.pages)
  const viewports = parseCsv(raw.viewports)

  if (pages.length === 0) {
    throw new Error("--pages は必須。例: --pages=top,about,news")
  }

  if (viewports.length === 0) {
    throw new Error("--viewports は必須。例: --viewports=pc,sp")
  }

  const opacity = raw.opacity ? Number.parseFloat(raw.opacity) : null
  const offsetY = raw["offset-y"] ? Number.parseInt(raw["offset-y"], 10) : null
  const cropTop = raw["crop-top"] ? Number.parseInt(raw["crop-top"], 10) : null

  return {
    outputDir: positional[0],
    pages,
    viewports,
    opacity,
    offsetY,
    cropTop,
    offsetMap: parseMapFlag(raw["offset-map"]),
    cropMap: parseMapFlag(raw["crop-map"]),
  }
}

type RunResult = {
  slug: string
  ok: boolean
  reason: string
}

function runOne(props: {
  outputDir: string
  overlayScript: string
  page: string
  viewport: string
  args: ParsedArgs
}): RunResult {
  const slug = `${props.page}-${props.viewport}`
  const aFile = join(props.outputDir, `a-${slug}.png`)
  const bFile = join(props.outputDir, `b-${slug}.png`)
  const outputPrefix = join(props.outputDir, slug)

  if (!existsSync(aFile) || !existsSync(bFile)) {
    return {
      slug,
      ok: false,
      reason: `skip: a-${slug}.png または b-${slug}.png が見つからない`,
    }
  }

  const flags: string[] = []

  if (props.args.opacity !== null) {
    flags.push(`--opacity=${props.args.opacity}`)
  }

  const pageOffset = props.args.offsetMap[props.page]
  const offsetY = pageOffset !== undefined ? pageOffset : props.args.offsetY
  if (offsetY !== null && offsetY !== undefined && offsetY !== 0) {
    flags.push(`--offset-y=${offsetY}`)
  }

  const pageCrop = props.args.cropMap[props.page]
  const cropTop = pageCrop !== undefined ? pageCrop : props.args.cropTop
  if (cropTop !== null && cropTop !== undefined && cropTop > 0) {
    flags.push(`--crop-top=${cropTop}`)
  }

  console.log(`\n=== ${slug} ===`)

  const result = spawnSync("bun", [props.overlayScript, aFile, bFile, outputPrefix, ...flags], {
    stdio: "inherit",
  })

  if (result.status !== 0) {
    return { slug, ok: false, reason: `overlay-compose failed (exit ${result.status})` }
  }

  return { slug, ok: true, reason: "ok" }
}

// --- Main ---
try {
  const args = parseArgs(process.argv.slice(2))

  if (!existsSync(args.outputDir)) {
    throw new Error(`Output dir not found: ${args.outputDir}`)
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const overlayScript = join(scriptDir, "overlay-compose.ts")

  if (!existsSync(overlayScript)) {
    throw new Error(`overlay-compose.ts not found at ${overlayScript}`)
  }

  console.log(`Output dir: ${args.outputDir}`)
  console.log(`Pages:      ${args.pages.join(", ")}`)
  console.log(`Viewports:  ${args.viewports.join(", ")}`)

  const results: RunResult[] = []

  for (const page of args.pages) {
    for (const viewport of args.viewports) {
      results.push(runOne({ outputDir: args.outputDir, overlayScript, page, viewport, args }))
    }
  }

  console.log("\n\n=== Summary ===")

  const okCount = results.filter((r) => r.ok).length
  const skipCount = results.filter((r) => !r.ok && r.reason.startsWith("skip")).length
  const failCount = results.filter((r) => !r.ok && !r.reason.startsWith("skip")).length

  for (const r of results) {
    const mark = r.ok ? "OK" : r.reason.startsWith("skip") ? "--" : "NG"
    console.log(`  [${mark}] ${r.slug}${r.ok ? "" : ` — ${r.reason}`}`)
  }

  console.log(`\nOK: ${okCount} / Skip: ${skipCount} / Fail: ${failCount}`)

  if (failCount > 0) {
    process.exit(1)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\nError: ${message}`)
  process.exit(1)
}

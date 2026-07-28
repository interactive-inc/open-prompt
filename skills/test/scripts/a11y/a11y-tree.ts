#!/usr/bin/env bun

/**
 * アクセシビリティツリー取得スクリプト
 * Playwright の locator.ariaSnapshot() を使ってレンダリング済みの
 * アクセシビリティツリーをテキスト形式で出力する。
 *
 * SPA/動的コンテンツも JS 実行後の状態を正しく取得できる。
 *
 * 使い方:
 *   bun a11y-tree.ts <URL> [--output <file>]
 *   bun a11y-tree.ts https://example.com > data/a11y-tree.txt
 */

import { writeFile } from "node:fs/promises"
import { chromium } from "playwright"

function parseArgs() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args[0].startsWith("--")) {
    console.error("Usage: bun a11y-tree.ts <URL> [--output <file>]")
    process.exit(1)
  }
  const url = args[0]
  let output: string | null = null
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      output = args[i + 1]
      i++
    }
  }
  return { url, output }
}

async function getAccessibilityTree(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    locale: "ja-JP",
    viewport: { width: 1280, height: 720 },
  })
  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })

    // JS実行後の状態を待つ（networkidleはアナリティクス等で失敗しやすいため固定待機）
    await page.waitForTimeout(3000)

    const snapshot = await page.locator("body").ariaSnapshot()

    if (!snapshot) {
      return "# アクセシビリティツリー\n\n(取得できませんでした)\n"
    }

    const header = [
      `# アクセシビリティツリー`,
      `URL: ${url}`,
      `取得日時: ${new Date().toISOString()}`,
      ``,
    ].join("\n")

    return `${header}${snapshot}\n`
  } finally {
    await browser.close()
  }
}

const args = parseArgs()

getAccessibilityTree(args.url)
  .then(async (tree) => {
    if (args.output) {
      await writeFile(args.output, tree, "utf-8")
      console.error(`✅ アクセシビリティツリーを保存: ${args.output}`)
    } else {
      process.stdout.write(tree)
    }
  })
  .catch((err) => {
    console.error("Error:", err.message)
    process.exit(1)
  })

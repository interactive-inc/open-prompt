#!/usr/bin/env bun

/**
 * overlay-compose.ts の出力から、ブラウザで比較できる index.html を生成するスクリプト
 *
 * Usage:
 *   bun generate-report.ts <output-dir>
 *
 * 入力想定:
 *   <prefix>-overlay.png / -difference.png / -side-by-side.png
 *   a-<prefix>.png / b-<prefix>.png       （slider 用。なくても overlay等は表示可）
 *
 * prefix の解釈:
 *   ハイフンを含む場合、最後のハイフン以降を viewport、それ以前を page として扱う
 *     例: `top-pc` → page=top, viewport=pc
 *     例: `news-list-sp` → page=news-list, viewport=sp
 *   ハイフンを含まない場合、viewport のみ（page=null）として扱う
 *     例: `pc` → page=null, viewport=pc
 *
 * 出力 HTML の構造:
 *   - page が複数あれば、左サイドバーにページリスト + 上部タブにビューポート
 *   - page が null のみ（単一ページ比較）なら、上部タブにビューポートのみ
 */

import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"

const RUN_DIR_PATTERN = /^\d{4}-\d{2}-\d{2}_\d{6}$/

type ComparisonSet = {
  prefix: string
  page: string | null
  viewport: string
  aFile: string | null
  bFile: string | null
  overlayFile: string
  differenceFile: string
  sideBySideFile: string
}

function parsePrefix(prefix: string): { page: string | null; viewport: string } {
  const idx = prefix.lastIndexOf("-")
  if (idx === -1) {
    return { page: null, viewport: prefix }
  }
  return {
    page: prefix.slice(0, idx),
    viewport: prefix.slice(idx + 1),
  }
}

function discoverPrefixes(dir: string): string[] {
  const entries = readdirSync(dir)
  const prefixes: string[] = []

  for (const name of entries) {
    const match = name.match(/^(.+)-overlay\.png$/)
    if (match) {
      prefixes.push(match[1])
    }
  }

  prefixes.sort()
  return prefixes
}

function buildComparisonSet(dir: string, prefix: string): ComparisonSet {
  const overlayFile = `${prefix}-overlay.png`
  const differenceFile = `${prefix}-difference.png`
  const sideBySideFile = `${prefix}-side-by-side.png`
  const aFileName = `a-${prefix}.png`
  const bFileName = `b-${prefix}.png`

  const aFile = existsSync(join(dir, aFileName)) ? aFileName : null
  const bFile = existsSync(join(dir, bFileName)) ? bFileName : null

  if (!existsSync(join(dir, overlayFile))) {
    throw new Error(`Missing: ${overlayFile}`)
  }

  if (!existsSync(join(dir, differenceFile))) {
    throw new Error(`Missing: ${differenceFile}`)
  }

  if (!existsSync(join(dir, sideBySideFile))) {
    throw new Error(`Missing: ${sideBySideFile}`)
  }

  const { page, viewport } = parsePrefix(prefix)

  return { prefix, page, viewport, aFile, bFile, overlayFile, differenceFile, sideBySideFile }
}

function uniqueSorted(values: Array<string | null>): string[] {
  const set = new Set<string>()
  for (const v of values) {
    if (v !== null) {
      set.add(v)
    }
  }
  return Array.from(set).sort()
}

function renderPanel(set: ComparisonSet): string {
  const hasSlider = set.aFile !== null && set.bFile !== null
  const pageAttr = set.page ?? "__none__"

  const sliderBlock = hasSlider
    ? `
          <section class="mode" data-mode="slider">
            <figure class="stage">
              <div class="stage-corners"><i></i><i></i><i></i><i></i></div>
              <div class="slider-box" data-prefix="${set.prefix}">
                <img class="slider-img slider-a" src="${set.aFile}" alt="specimen A" draggable="false">
                <img class="slider-img slider-b" src="${set.bFile}" alt="specimen B" draggable="false">
                <div class="slider-handle" data-prefix="${set.prefix}">
                  <span class="handle-label handle-label-a">A</span>
                  <span class="handle-label handle-label-b">B</span>
                  <span class="handle-target" aria-label="Drag to compare"></span>
                </div>
              </div>
              <figcaption class="stage-caption">
                <span>Reference · A</span>
                <span>drag to compare</span>
                <span>Target · B</span>
              </figcaption>
            </figure>
          </section>`
    : `
          <section class="mode" data-mode="slider">
            <p class="notice">a-${set.prefix}.png / b-${set.prefix}.png が揃っていないため、slider mode は利用できません。</p>
          </section>`

  return `
        <div class="panel" data-page="${pageAttr}" data-viewport="${set.viewport}">
          <div class="panel-meta">
            <span class="meta-label">specimen</span>
            <span class="meta-value">${set.prefix}</span>
            <span class="meta-divider"></span>
            <span class="meta-label">page</span>
            <span class="meta-value">${set.page ?? "—"}</span>
            <span class="meta-divider"></span>
            <span class="meta-label">viewport</span>
            <span class="meta-value">${set.viewport}</span>
          </div>
          <nav class="mode-nav" role="tablist">
            <button class="mode-btn" data-mode="slider"${hasSlider ? "" : " disabled"}><span class="mode-num">01</span>Slider</button>
            <button class="mode-btn" data-mode="overlay"><span class="mode-num">02</span>Overlay</button>
            <button class="mode-btn" data-mode="difference"><span class="mode-num">03</span>Difference</button>
            <button class="mode-btn" data-mode="side-by-side"><span class="mode-num">04</span>Matrix</button>
          </nav>
          ${sliderBlock}
          <section class="mode" data-mode="overlay">
            <figure class="stage">
              <div class="stage-corners"><i></i><i></i><i></i><i></i></div>
              <img class="full-img" src="${set.overlayFile}" alt="Overlay">
              <figcaption class="stage-caption">
                <span>Overlay · A @ 50% on B</span>
                <span>position check</span>
                <span>${set.prefix}</span>
              </figcaption>
            </figure>
          </section>
          <section class="mode" data-mode="difference">
            <figure class="stage">
              <div class="stage-corners"><i></i><i></i><i></i><i></i></div>
              <img class="full-img" src="${set.differenceFile}" alt="Difference">
              <figcaption class="stage-caption">
                <span>Difference · RGB delta</span>
                <span>brighter = larger gap</span>
                <span>${set.prefix}</span>
              </figcaption>
            </figure>
          </section>
          <section class="mode" data-mode="side-by-side">
            <figure class="stage">
              <div class="stage-corners"><i></i><i></i><i></i><i></i></div>
              <img class="full-img" src="${set.sideBySideFile}" alt="Side by side">
              <figcaption class="stage-caption">
                <span>Matrix · A / B side-by-side</span>
                <span>existence check</span>
                <span>${set.prefix}</span>
              </figcaption>
            </figure>
          </section>
        </div>`
}

function buildHtml(sets: ComparisonSet[]): string {
  if (sets.length === 0) {
    return '<!doctype html><meta charset="utf-8"><title>UI Diff Review</title><p>比較対象が見つかりませんでした。</p>'
  }

  const pages = uniqueSorted(sets.map((s) => s.page))
  const viewports = uniqueSorted(sets.map((s) => s.viewport))
  const hasPages = pages.length > 0

  const pageSidebar = hasPages
    ? `
    <aside class="sidebar">
      <div class="sidebar-head">
        <span class="sidebar-rule"></span>
        <span class="sidebar-title">Specimens</span>
        <span class="sidebar-count">${String(pages.length).padStart(2, "0")}</span>
      </div>
      <ul class="page-list">
        ${pages
          .map(
            (p, i) =>
              `<li><button class="page-btn${i === 0 ? " is-active" : ""}" data-page="${p}"><span class="page-num">${String(i + 1).padStart(2, "0")}</span><span class="page-name">${p}</span><span class="page-arrow" aria-hidden="true">→</span></button></li>`,
          )
          .join("\n        ")}
      </ul>
    </aside>`
    : ""

  const viewportLabels: Record<string, string> = {
    pc: "PC · 1920",
    sp: "SP · 375",
    tablet: "Tablet",
  }

  const viewportTabs = viewports
    .map((v, i) => {
      const label = viewportLabels[v] ?? v.toUpperCase()
      return `<button class="viewport-btn${i === 0 ? " is-active" : ""}" data-viewport="${v}"><span class="viewport-mark"></span>${label}</button>`
    })
    .join("")

  const panels = sets.map(renderPanel).join("")

  const initialPage = hasPages ? pages[0] : "__none__"
  const initialViewport = viewports[0] ?? ""

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}`
  const specimensCount = String(sets.length).padStart(3, "0")

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Overlay Inspection · ${specimensCount}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #0a0908;
  --ink-2: #141210;
  --ink-3: #1d1a16;
  --paper: #ede4d0;
  --paper-2: #d9cdb1;
  --paper-muted: #8a8270;
  --crimson: #d4333f;
  --crimson-soft: rgba(212, 51, 63, 0.14);
  --amber: #e8a23d;
  --rule: rgba(237, 228, 208, 0.14);
  --rule-strong: rgba(237, 228, 208, 0.35);
  --grid: rgba(237, 228, 208, 0.05);
  --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --sans: "IBM Plex Sans", system-ui, -apple-system, "Hiragino Sans", sans-serif;
  --serif: "Fraunces", Georgia, serif;
}
* { box-sizing: border-box; }
html { overflow-x: hidden; }
body {
  margin: 0;
  padding: 0;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
  background-image:
    linear-gradient(to right, var(--grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid) 1px, transparent 1px),
    radial-gradient(circle at 20% 10%, rgba(212, 51, 63, 0.06), transparent 55%),
    radial-gradient(circle at 85% 90%, rgba(232, 162, 61, 0.04), transparent 50%);
  background-size: 48px 48px, 48px 48px, 100% 100%, 100% 100%;
}
img { max-width: 100%; }

/* MASTHEAD */
.masthead {
  position: sticky; top: 0; z-index: 20;
  background: color-mix(in srgb, var(--ink) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--rule);
}
.masthead-inner {
  padding: 20px 28px 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: end;
  gap: 24px;
}
.brand { display: grid; gap: 6px; }
.brand-tag {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--paper-muted);
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-tag::before {
  content: "";
  width: 7px; height: 7px;
  background: var(--crimson);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(212, 51, 63, 0.2);
}
.brand-title {
  font-family: var(--serif);
  font-weight: 400;
  font-style: italic;
  font-size: 38px;
  line-height: 1;
  margin: 0;
  letter-spacing: -0.018em;
  color: var(--paper);
}
.brand-title em {
  font-style: normal;
  color: var(--crimson);
  font-weight: 500;
  margin: 0 0.08em;
}
.brand-sub {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.metastrip {
  display: flex;
  align-items: end;
  gap: 22px;
  justify-self: end;
}
.metastrip > div {
  display: grid;
  gap: 4px;
  text-align: right;
  font-family: var(--mono);
}
.metastrip span {
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.metastrip b {
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--paper);
}

.viewport-bar {
  border-top: 1px solid var(--rule);
  padding: 10px 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.viewport-bar-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.viewport-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.viewport-btn {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--paper-muted);
  background: transparent;
  border: 1px solid var(--rule-strong);
  padding: 7px 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.viewport-btn .viewport-mark {
  width: 6px; height: 6px;
  border: 1px solid var(--paper-muted);
  border-radius: 50%;
  transition: background 0.15s, border-color 0.15s;
}
.viewport-btn:hover { color: var(--paper); border-color: var(--paper); }
.viewport-btn.is-active {
  color: var(--ink);
  background: var(--paper);
  border-color: var(--paper);
}
.viewport-btn.is-active .viewport-mark { background: var(--crimson); border-color: var(--crimson); }

/* LAYOUT */
.layout { display: grid; grid-template-columns: 272px 1fr; min-height: calc(100vh - 170px); }

/* Tablet */
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; min-height: 0; }
  .sidebar { position: relative !important; top: auto !important; max-height: none !important; border-right: none !important; border-bottom: 1px solid var(--rule); }
  main { padding: 20px 18px 64px !important; }
  .masthead-inner { grid-template-columns: 1fr; gap: 14px; padding: 16px 18px; }
  .metastrip { justify-self: start; }
  .brand-title { font-size: 30px; }
  .panel-meta { gap: 10px; }
  .stage { padding: 10px; }
  .stage-caption { grid-template-columns: 1fr; gap: 6px; text-align: left !important; }
  .stage-caption > * { text-align: left !important; }
}

/* Phone (SP) */
@media (max-width: 540px) {
  body { font-size: 13px; }
  .masthead-inner { padding: 12px 14px; gap: 8px; }
  .brand-title { font-size: 22px; letter-spacing: -0.02em; }
  .brand-tag, .brand-sub { font-size: 9px; letter-spacing: 0.18em; }
  .brand-tag::before { width: 6px; height: 6px; }
  .metastrip { gap: 14px; }
  .metastrip span { font-size: 8px; letter-spacing: 0.18em; }
  .metastrip b { font-size: 12px; }
  .viewport-bar { padding: 8px 14px; gap: 10px; }
  .viewport-bar-label { font-size: 9px; }
  .viewport-btn { padding: 6px 10px; font-size: 10px; letter-spacing: 0.12em; gap: 7px; }
  .viewport-btn .viewport-mark { width: 5px; height: 5px; }
  .sidebar { padding: 16px 14px; max-height: 220px; }
  .sidebar-head { margin-bottom: 12px; }
  .page-btn { padding: 10px 4px; }
  .page-name { font-size: 13px; }
  main { padding: 16px 14px 56px !important; }
  .panel-meta { padding: 9px 12px; gap: 8px 10px; font-size: 10px; flex-wrap: wrap; }
  .panel-meta .meta-divider { display: none; }
  .meta-label { font-size: 9px; letter-spacing: 0.14em; }
  .mode-nav { padding: 4px; gap: 2px; }
  .mode-btn { padding: 8px 10px; font-size: 10px; gap: 7px; letter-spacing: 0.1em; flex: 1 1 0; min-width: 0; justify-content: center; }
  .mode-btn .mode-num { padding-right: 6px; font-size: 8px; }
  .stage { padding: 8px; }
  .stage-corners { inset: 4px; }
  .stage-corners i { width: 10px; height: 10px; }
  .stage-caption { font-size: 9px; letter-spacing: 0.1em; margin-top: 10px; padding-top: 10px; gap: 4px; }
  .handle-target { width: 44px; height: 44px; }
  .handle-target::before { left: 6px; right: 6px; }
  .handle-target::after { top: 6px; bottom: 6px; }
  .handle-label { font-size: 9px; padding: 2px 5px; letter-spacing: 0.16em; }
  .handle-label-a { top: 10px; }
  .handle-label-b { bottom: 10px; }
  .footrule { margin: 28px 14px 0; padding: 16px 0; flex-direction: column; align-items: flex-start; gap: 6px; font-size: 9px; }
  .notice { padding: 18px; font-size: 11px; }
  .missing-panel { padding: 48px 18px; font-size: 11px; letter-spacing: 0.14em; }
}

/* SIDEBAR */
.sidebar {
  border-right: 1px solid var(--rule);
  padding: 26px 20px;
  position: sticky;
  top: 170px;
  align-self: flex-start;
  max-height: calc(100vh - 170px);
  overflow-y: auto;
}
.sidebar-head {
  display: grid;
  grid-template-columns: 20px auto 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.sidebar-rule { height: 1px; background: var(--paper-muted); display: block; }
.sidebar-title {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.sidebar-count {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--paper-muted);
  text-align: right;
}
.page-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0; }
.page-btn {
  display: grid;
  grid-template-columns: 30px 1fr 18px;
  align-items: center;
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--paper);
  border: none;
  border-bottom: 1px dashed var(--rule);
  padding: 12px 6px;
  cursor: pointer;
  font-family: var(--sans);
  transition: color 0.18s, background 0.18s, padding 0.18s;
}
.page-num {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--paper-muted);
  letter-spacing: 0.12em;
}
.page-name {
  font-size: 14px;
  letter-spacing: -0.005em;
  font-weight: 400;
}
.page-arrow {
  font-family: var(--mono);
  opacity: 0;
  color: var(--crimson);
  transform: translateX(-4px);
  transition: opacity 0.18s, transform 0.18s;
  font-size: 14px;
}
.page-btn:hover { background: var(--ink-2); padding-left: 10px; }
.page-btn:hover .page-arrow { opacity: 0.6; transform: translateX(0); }
.page-btn.is-active {
  color: var(--paper);
  background: linear-gradient(90deg, var(--crimson-soft), transparent 75%);
  padding-left: 10px;
}
.page-btn.is-active .page-num { color: var(--crimson); }
.page-btn.is-active .page-name { font-weight: 500; }
.page-btn.is-active .page-arrow { opacity: 1; transform: translateX(0); }

/* MAIN */
main { padding: 32px 32px 96px; min-width: 0; max-width: 1400px; }
.panel { display: none; animation: panelIn 0.28s ease-out; }
.panel.is-active { display: block; }
@keyframes panelIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: 1px solid var(--rule-strong);
  border-left: 3px solid var(--crimson);
  background: var(--ink-2);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.meta-label {
  color: var(--paper-muted);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 10px;
}
.meta-value { color: var(--paper); font-weight: 500; }
.meta-divider { width: 1px; height: 14px; background: var(--rule-strong); }

.mode-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 22px;
  flex-wrap: wrap;
  padding: 5px;
  border: 1px solid var(--rule);
  background: var(--ink-2);
}
.mode-btn {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--paper-muted);
  background: transparent;
  border: 1px solid transparent;
  padding: 10px 16px 10px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.mode-btn .mode-num {
  font-size: 9px;
  color: var(--paper-muted);
  letter-spacing: 0.2em;
  border-right: 1px solid var(--rule-strong);
  padding-right: 8px;
}
.mode-btn:hover { color: var(--paper); }
.mode-btn.is-active {
  color: var(--ink);
  background: var(--paper);
  border-color: var(--paper);
}
.mode-btn.is-active .mode-num { color: var(--crimson); border-right-color: rgba(10, 9, 8, 0.2); }
.mode-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.mode { display: none; }
.mode.is-active { display: block; }

/* STAGE (image surround) */
.stage {
  position: relative;
  margin: 0;
  padding: 14px;
  background: var(--ink-2);
  border: 1px solid var(--rule-strong);
}
.stage-corners { position: absolute; inset: 6px; pointer-events: none; z-index: 1; }
.stage-corners i {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1px solid var(--crimson);
  opacity: 0.9;
}
.stage-corners i:nth-child(1) { top: 0; left: 0; border-right: none; border-bottom: none; }
.stage-corners i:nth-child(2) { top: 0; right: 0; border-left: none; border-bottom: none; }
.stage-corners i:nth-child(3) { bottom: 0; left: 0; border-right: none; border-top: none; }
.stage-corners i:nth-child(4) { bottom: 0; right: 0; border-left: none; border-top: none; }
.stage-caption {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--rule-strong);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.stage-caption > :first-child { text-align: left; color: var(--paper); }
.stage-caption > :nth-child(2) { text-align: center; color: var(--crimson); }
.stage-caption > :last-child { text-align: right; }

.full-img {
  display: block;
  max-width: 100%;
  width: 100%;
  height: auto;
  background: #000;
  position: relative;
  z-index: 0;
}

/* SP viewport: render slider/overlay/difference at 375px (phone-style) */
.panel[data-viewport="sp"] .mode[data-mode="slider"] .stage,
.panel[data-viewport="sp"] .mode[data-mode="overlay"] .stage,
.panel[data-viewport="sp"] .mode[data-mode="difference"] .stage {
  max-width: 403px;
  margin-left: auto;
  margin-right: auto;
}
.panel[data-viewport="sp"] .mode[data-mode="side-by-side"] .stage {
  max-width: 820px;
  margin-left: auto;
  margin-right: auto;
}

/* SLIDER */
.slider-box {
  position: relative;
  max-width: 100%;
  background: #000;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
  cursor: ew-resize;
  overflow: hidden;
  z-index: 0;
}
.slider-img {
  display: block;
  max-width: 100%;
  width: 100%;
  height: auto;
  pointer-events: none;
  -webkit-user-drag: none;
}
.slider-a { position: relative; z-index: 1; }
.slider-b { position: absolute; top: 0; left: 0; z-index: 2; clip-path: inset(0 0 0 50%); }

.slider-handle {
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;
  width: 1px;
  background: var(--crimson);
  transform: translateX(-50%);
  z-index: 3;
  pointer-events: none;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 51, 63, 0.45);
}
.handle-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--mono);
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.2em;
  padding: 3px 7px;
  background: var(--crimson);
  color: var(--ink);
  pointer-events: none;
  text-transform: uppercase;
}
.handle-label-a { top: 14px; }
.handle-label-b { bottom: 14px; }

.handle-target {
  position: absolute;
  top: 50%; left: 50%;
  width: 52px; height: 52px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background:
    radial-gradient(circle at center, rgba(212, 51, 63, 0.22) 0, rgba(212, 51, 63, 0) 70%),
    rgba(10, 9, 8, 0.6);
  border: 1px solid var(--crimson);
  pointer-events: none;
  box-shadow: 0 0 0 4px rgba(10, 9, 8, 0.35), 0 0 24px rgba(212, 51, 63, 0.35);
  animation: pulse 2.8s ease-in-out infinite;
}
.handle-target::before, .handle-target::after {
  content: "";
  position: absolute;
  background: var(--crimson);
}
.handle-target::before { top: 50%; left: 7px; right: 7px; height: 1px; transform: translateY(-50%); }
.handle-target::after { left: 50%; top: 7px; bottom: 7px; width: 1px; transform: translateX(-50%); }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(10, 9, 8, 0.35), 0 0 18px rgba(212, 51, 63, 0.3); }
  50% { box-shadow: 0 0 0 4px rgba(10, 9, 8, 0.35), 0 0 28px rgba(212, 51, 63, 0.55); }
}

.notice {
  color: var(--paper-muted);
  font-family: var(--mono);
  font-size: 12px;
  padding: 28px;
  border: 1px dashed var(--rule-strong);
  background: var(--ink-2);
}

.missing-panel {
  color: var(--paper-muted);
  padding: 80px 28px;
  border: 1px dashed var(--rule-strong);
  text-align: center;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: var(--ink-2);
}

.footrule {
  margin: 40px 32px 0;
  padding: 18px 0;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--paper-muted);
  gap: 12px;
  flex-wrap: wrap;
}
</style>
</head>
<body>
<header class="masthead">
  <div class="masthead-inner">
    <div class="brand">
      <span class="brand-tag">Overlay Inspection Viewer</span>
      <h1 class="brand-title">Visual<em>/</em>diff</h1>
      <span class="brand-sub">A · reference ↔ B · target</span>
    </div>
    <div></div>
    <div class="metastrip">
      <div><span>Specimens</span><b>${specimensCount}</b></div>
      <div><span>Compiled</span><b>${timestamp}</b></div>
    </div>
  </div>
  <div class="viewport-bar">
    <span class="viewport-bar-label">Viewport</span>
    <nav class="viewport-tabs">${viewportTabs}</nav>
  </div>
</header>
<div class="layout">
  ${pageSidebar}
  <main>
    ${panels}
    <div class="missing-panel" style="display:none">— no specimen for this combination —</div>
  </main>
</div>
<footer class="footrule">
  <span>ui-diff-review · inspection protocol</span>
  <span>drag · tap · swipe</span>
  <span>${timestamp}</span>
</footer>
<script>
(function() {
  const state = { page: ${JSON.stringify(initialPage)}, viewport: ${JSON.stringify(initialViewport)} };
  const panels = Array.from(document.querySelectorAll(".panel"));
  const pageButtons = Array.from(document.querySelectorAll(".page-btn"));
  const viewportButtons = Array.from(document.querySelectorAll(".viewport-btn"));
  const missingEl = document.querySelector(".missing-panel");

  function findPanel(page, viewport) {
    return panels.find((p) => p.dataset.page === page && p.dataset.viewport === viewport);
  }

  function activateMode(panel, mode) {
    panel.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === mode));
    panel.querySelectorAll(".mode").forEach((m) => m.classList.toggle("is-active", m.dataset.mode === mode));
  }

  function render() {
    pageButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.page === state.page));
    viewportButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.viewport === state.viewport));

    panels.forEach((p) => p.classList.remove("is-active"));
    const panel = findPanel(state.page, state.viewport);
    if (panel) {
      panel.classList.add("is-active");
      if (missingEl) missingEl.style.display = "none";
      const already = panel.querySelector(".mode-btn.is-active");
      if (!already) {
        const first = panel.querySelector(".mode-btn:not(:disabled)");
        if (first) activateMode(panel, first.dataset.mode);
      }
    } else {
      if (missingEl) missingEl.style.display = "block";
    }
  }

  pageButtons.forEach((b) => b.addEventListener("click", () => { state.page = b.dataset.page; render(); }));
  viewportButtons.forEach((b) => b.addEventListener("click", () => { state.viewport = b.dataset.viewport; render(); }));

  panels.forEach((panel) => {
    panel.querySelectorAll(".mode-btn").forEach((b) => {
      b.addEventListener("click", () => activateMode(panel, b.dataset.mode));
    });
  });

  // Slider: ハンドル or 画像上をドラッグ / タップして比較（マウスとタッチ両対応）
  document.querySelectorAll(".slider-box").forEach((sliderBox) => {
    const imgB = sliderBox.querySelector(".slider-b");
    const handle = sliderBox.querySelector(".slider-handle");
    if (!imgB || !handle) return;

    let dragging = false;

    function update(percent) {
      const clamped = Math.min(100, Math.max(0, percent));
      imgB.style.clipPath = "inset(0 0 0 " + clamped + "%)";
      handle.style.left = clamped + "%";
    }

    function percentFromClientX(clientX) {
      const rect = sliderBox.getBoundingClientRect();
      if (rect.width === 0) return 50;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    // マウス
    sliderBox.addEventListener("mousedown", function (e) {
      dragging = true;
      update(percentFromClientX(e.clientX));
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      update(percentFromClientX(e.clientX));
    });
    window.addEventListener("mouseup", function () {
      dragging = false;
    });

    // タッチ（SP / タブレット）
    // 初動の方向で「縦スクロール」か「横ドラッグ（スライダー操作）」かを判定する。
    // 縦スクロールに見えたらブラウザに任せ、横移動と判明したら preventDefault して
    // 自分でスライダー位置を更新する。これでページ縦スクロールが死なない。
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDecided = false;

    sliderBox.addEventListener("touchstart", function (e) {
      if (e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDecided = false;
      dragging = false;
    }, { passive: true });

    sliderBox.addEventListener("touchmove", function (e) {
      if (e.touches.length === 0) return;
      const t = e.touches[0];

      if (!touchDecided) {
        const dx = Math.abs(t.clientX - touchStartX);
        const dy = Math.abs(t.clientY - touchStartY);
        if (dx < 6 && dy < 6) return; // まだ動きが小さい
        touchDecided = true;
        dragging = dx > dy; // 横方向の動きが大きければスライダー
      }

      if (dragging) {
        update(percentFromClientX(t.clientX));
        e.preventDefault();
      }
    }, { passive: false });

    sliderBox.addEventListener("touchend", function () {
      dragging = false;
      touchDecided = false;
    });
    sliderBox.addEventListener("touchcancel", function () {
      dragging = false;
      touchDecided = false;
    });

    // 初期位置 50%
    update(50);
  });

  render();
})();
</script>
</body>
</html>
`
}

type RunSummary = {
  name: string
  displayedAt: string
  specimens: number
  pages: string[]
  viewports: string[]
}

function formatRunDisplay(name: string): string {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})$/)
  if (!m) {
    return name
  }
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
}

function discoverRuns(parentDir: string): RunSummary[] {
  if (!existsSync(parentDir)) {
    return []
  }

  const entries = readdirSync(parentDir)
  const runs: RunSummary[] = []

  for (const name of entries) {
    if (!RUN_DIR_PATTERN.test(name)) {
      continue
    }
    const fullPath = join(parentDir, name)
    const stat = statSync(fullPath)
    if (!stat.isDirectory()) {
      continue
    }

    const prefixes = discoverPrefixes(fullPath)
    if (prefixes.length === 0) {
      continue
    }

    const parsed = prefixes.map((p) => parsePrefix(p))
    const pages = uniqueSorted(parsed.map((p) => p.page)).filter((v): v is string => v !== null)
    const viewports = uniqueSorted(parsed.map((p) => p.viewport))

    runs.push({
      name,
      displayedAt: formatRunDisplay(name),
      specimens: prefixes.length,
      pages,
      viewports,
    })
  }

  runs.sort((a, b) => b.name.localeCompare(a.name))
  return runs
}

function buildRunsIndexHtml(runs: RunSummary[]): string {
  const items = runs
    .map((run) => {
      const pageLabel = run.pages.length > 0 ? run.pages.join(" / ") : "(single)"
      const viewportLabel = run.viewports.join(" · ")
      return `
        <li class="run-item">
          <a class="run-link" href="${run.name}/index.html">
            <span class="run-time">${run.displayedAt}</span>
            <span class="run-meta">${run.specimens} specimens · ${run.viewports.length} viewport(s)</span>
            <span class="run-pages">${pageLabel}</span>
            <span class="run-vp">${viewportLabel}</span>
            <span class="run-arrow" aria-hidden="true">›</span>
          </a>
        </li>`
    })
    .join("")

  const empty =
    runs.length === 0
      ? '<p class="empty">まだランがありません。先に撮影 → overlay-compose / batch-overlay を実行してください。</p>'
      : ""

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UI Diff Review · Runs</title>
  <style>
    :root {
      color-scheme: dark;
      --ink: #0a0908;
      --ink-2: #15130f;
      --paper: #f6f1e7;
      --paper-muted: #aaa39a;
      --rule: #2b2620;
      --rule-strong: #3a342c;
      --crimson: #d4333f;
      --crimson-soft: rgba(212, 51, 63, 0.15);
      --mono: ui-monospace, "SF Mono", Menlo, monospace;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: var(--ink); color: var(--paper); font-family: ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", sans-serif; }
    header { border-bottom: 1px solid var(--rule-strong); padding: 28px 32px; display: flex; align-items: baseline; gap: 18px; }
    header h1 { font-size: 18px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; font-weight: 500; }
    header .sub { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--paper-muted); }
    main { padding: 32px; max-width: 880px; margin: 0 auto; }
    .runs { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
    .run-item {}
    .run-link {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "time arrow"
        "meta arrow"
        "pages arrow"
        "vp arrow";
      gap: 4px 16px;
      align-items: center;
      padding: 18px 22px;
      border: 1px solid var(--rule-strong);
      border-left: 3px solid var(--crimson);
      background: var(--ink-2);
      color: inherit;
      text-decoration: none;
      transition: background 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
    }
    .run-link:hover { background: #1c1914; border-color: var(--crimson); transform: translateX(2px); }
    .run-time { grid-area: time; font-family: var(--mono); font-size: 14px; letter-spacing: 0.08em; color: var(--paper); }
    .run-meta { grid-area: meta; font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--crimson); }
    .run-pages { grid-area: pages; font-size: 12px; color: var(--paper-muted); }
    .run-vp { grid-area: vp; font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--paper-muted); }
    .run-arrow { grid-area: arrow; color: var(--crimson); font-size: 24px; opacity: 0.6; }
    .empty { color: var(--paper-muted); font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; padding: 32px; border: 1px dashed var(--rule-strong); text-align: center; }
    @media (max-width: 540px) {
      header { padding: 18px 20px; flex-direction: column; gap: 6px; }
      main { padding: 20px; }
      .run-link { padding: 14px 16px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>UI Diff Review</h1>
    <span class="sub">${runs.length} run${runs.length === 1 ? "" : "s"}</span>
  </header>
  <main>
    ${empty}
    <ul class="runs">${items}
    </ul>
  </main>
</body>
</html>
`
}

function writeRunsIndex(parentDir: string): string {
  const runs = discoverRuns(parentDir)
  const html = buildRunsIndexHtml(runs)
  const outPath = join(parentDir, "index.html")
  writeFileSync(outPath, html)
  return outPath
}

// --- Main ---
try {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error("Usage: bun generate-report.ts <output-dir>")
    process.exit(1)
  }

  const outputDir = args[0]

  if (!existsSync(outputDir)) {
    throw new Error(`Output dir not found: ${outputDir}`)
  }

  const prefixes = discoverPrefixes(outputDir)

  if (prefixes.length === 0) {
    const runs = discoverRuns(outputDir)
    if (runs.length === 0) {
      throw new Error(
        `${outputDir} に <prefix>-overlay.png も run dir (例: 2026-04-26_192500) も見つかりません。先に overlay-compose.ts / batch-overlay.ts を実行してください。`,
      )
    }
    const indexPath = writeRunsIndex(outputDir)
    console.log(`Runs index only mode (no overlays in ${outputDir}).`)
    console.log(`Discovered ${runs.length} run(s).`)
    console.log(`Generated: ${indexPath}`)
    console.log(`Open: open ${indexPath}`)
    process.exit(0)
  }

  console.log(`Discovered prefixes: ${prefixes.join(", ")}`)

  const sets = prefixes.map((p) => buildComparisonSet(outputDir, p))
  const pages = uniqueSorted(sets.map((s) => s.page))
  const viewports = uniqueSorted(sets.map((s) => s.viewport))

  console.log(`Pages:     ${pages.length === 0 ? "(none)" : pages.join(", ")}`)
  console.log(`Viewports: ${viewports.join(", ")}`)

  const html = buildHtml(sets)
  const outPath = join(outputDir, "index.html")

  writeFileSync(outPath, html)

  console.log(`Generated: ${outPath}`)

  const resolvedOut = resolve(outputDir)
  const parent = dirname(resolvedOut)
  const runDirName = basename(resolvedOut)

  if (RUN_DIR_PATTERN.test(runDirName)) {
    const indexPath = writeRunsIndex(parent)
    console.log(`Runs index: ${indexPath}`)
    console.log(`Open: open ${indexPath}`)
  } else {
    console.log(
      `Note: ${runDirName} はタイムスタンプ命名 (YYYY-MM-DD_HHMMSS) ではないため、親ディレクトリの runs index は更新していません。`,
    )
    console.log(`Open: open ${outPath}`)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\nError: ${message}`)
  process.exit(1)
}

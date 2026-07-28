#!/usr/bin/env bun

/**
 * Figma REST API を使用してノードを PNG エクスポートするスクリプト
 *
 * Usage: bun figma-export.ts <figma-url> <output-path> [scale]
 *
 * 環境変数: FIGMA_TOKEN または FIGMA_ACCESS_TOKEN が必要
 */

const FIGMA_API_BASE = "https://api.figma.com/v1"

type ParsedFigmaUrl = {
  fileKey: string
  nodeId: string
}

type ExportProps = {
  fileKey: string
  nodeId: string
  token: string
  scale: number
  outputPath: string
}

function parseFigmaUrl(url: string): ParsedFigmaUrl {
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    throw new Error(
      `Invalid Figma URL: "${url}"\n` +
        "Expected format: https://www.figma.com/design/{fileKey}/{title}?node-id={nodeId}",
    )
  }

  const pathParts = urlObj.pathname.split("/").filter(Boolean)

  const designIdx = pathParts.indexOf("design")
  const fileIdx = pathParts.indexOf("file")
  const branchIdx = pathParts.indexOf("branch")

  // branch URL: /design/{fileKey}/branch/{branchKey}/...
  if (branchIdx !== -1 && branchIdx + 1 < pathParts.length) {
    const nodeIdParam = urlObj.searchParams.get("node-id")
    if (!nodeIdParam) {
      throw new Error("Figma URL must include node-id parameter")
    }
    // Figma URLではnode-idをハイフン区切り(1-2)で表記するが、APIではコロン区切り(1:2)が必要
    const nodeId = nodeIdParam.replace(/-/g, ":")
    return { fileKey: pathParts[branchIdx + 1], nodeId }
  }

  // /design/{fileKey}/ or /file/{fileKey}/ formats
  let keyIdx = -1
  if (designIdx !== -1) {
    keyIdx = designIdx + 1
  } else if (fileIdx !== -1) {
    keyIdx = fileIdx + 1
  }

  if (keyIdx === -1 || keyIdx >= pathParts.length) {
    throw new Error("Invalid Figma URL: could not extract file key")
  }

  const nodeIdParam = urlObj.searchParams.get("node-id")
  if (!nodeIdParam) {
    throw new Error("Figma URL must include node-id parameter")
  }

  const nodeId = nodeIdParam.replace(/-/g, ":")
  return { fileKey: pathParts[keyIdx], nodeId }
}

async function exportFigmaNode(props: ExportProps): Promise<void> {
  const exportUrl = `${FIGMA_API_BASE}/images/${props.fileKey}?ids=${encodeURIComponent(props.nodeId)}&format=png&scale=${props.scale}`

  const response = await fetch(exportUrl, {
    headers: { "X-Figma-Token": props.token },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Figma API error: ${response.status} ${response.statusText}\n${body}`)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error(`Figma API returned non-JSON response (status ${response.status})`)
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("images" in data) ||
    typeof (data as Record<string, unknown>).images !== "object"
  ) {
    throw new Error(
      `Figma API returned unexpected response shape: ${JSON.stringify(data).slice(0, 200)}`,
    )
  }

  const images = (data as Record<string, Record<string, string | null>>).images
  const imageUrl = images[props.nodeId]

  if (!imageUrl) {
    throw new Error(`No image URL returned for node ${props.nodeId}`)
  }

  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to download exported image: ${imageResponse.status} ${imageResponse.statusText}\n` +
        "This may indicate the export URL expired. Try running the command again.",
    )
  }

  const buffer = await imageResponse.arrayBuffer()
  await Bun.write(props.outputPath, buffer)

  console.log(`Exported: ${props.outputPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
}

// --- Main ---
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error("Usage: bun figma-export.ts <figma-url> <output-path> [scale]")
  console.error("  scale: 1, 2 (default), or 4")
  process.exit(1)
}

const figmaUrl = args[0]
const outputPath = args[1]
const scaleStr = args[2]
const scale = scaleStr ? Number.parseFloat(scaleStr) : 2

if (Number.isNaN(scale) || scale <= 0 || scale > 4) {
  console.error(`Error: Invalid scale value "${scaleStr}". Must be a number between 0.01 and 4.`)
  process.exit(1)
}

const token = process.env.FIGMA_TOKEN || process.env.FIGMA_ACCESS_TOKEN
if (!token) {
  console.error("Error: Set FIGMA_TOKEN or FIGMA_ACCESS_TOKEN environment variable")
  console.error("  Get your token at: https://www.figma.com/developers/api#access-tokens")
  process.exit(1)
}

try {
  const parsed = parseFigmaUrl(figmaUrl)
  console.log(`File: ${parsed.fileKey}, Node: ${parsed.nodeId}, Scale: ${scale}x`)
  await exportFigmaNode({
    fileKey: parsed.fileKey,
    nodeId: parsed.nodeId,
    token,
    scale,
    outputPath,
  })
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\nExport failed: ${message}`)
  process.exit(1)
}

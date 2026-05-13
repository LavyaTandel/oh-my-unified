import { createHash } from 'node:crypto'

// Compute a stable hash for a line of text
// This hash stays the same even if line numbers shift
export function computeLineHash(line: string): string {
  return createHash('md5').update(line.trimEnd()).digest('hex').slice(0, 8)
}

// Format a hashline reference like "myFile.ts:1a2b3c4d"
export function formatHashLine(filePath: string, lineNumber: number, lineContent: string): string {
  const hash = computeLineHash(lineContent)
  return `${filePath}:${hash}`
}

// Stream through content and generate hashline refs for each line
export function streamHashLines(filePath: string, content: string): string[] {
  return content.split('\n').map((line, i) => formatHashLine(filePath, i + 1, line))
}

import { computeLineHash } from './hash-computation'

export interface HashlineEdit {
  type: 'replace' | 'append' | 'prepend'
  targetHash?: string    // hash of the line to replace
  targetContent?: string // content of the line to replace
  newContent: string
  filePath: string
}

// Apply hashline edits to file content
// Finds target lines by content hash, not line number
export function applyHashlineEdits(content: string, edits: HashlineEdit[]): string {
  const lines = content.split('\n')
  
  for (const edit of edits) {
    switch (edit.type) {
      case 'replace': {
        // Find the line by hash
        const targetLineIndex = lines.findIndex(l => computeLineHash(l) === edit.targetHash)
        if (targetLineIndex === -1) {
          console.warn(`[Hashline] No line found with hash ${edit.targetHash}`)
          continue
        }
        // Replace the target line with new content
        lines[targetLineIndex] = edit.newContent
        break
      }
      case 'append': {
        lines.push(edit.newContent)
        break
      }
      case 'prepend': {
        lines.unshift(edit.newContent)
        break
      }
    }
  }
  
  return lines.join('\n')
}

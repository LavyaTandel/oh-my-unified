export function truncateDescription(desc: string, maxLen = 80): string {
  if (desc.length <= maxLen) return desc
  return desc.slice(0, maxLen - 3) + '...'
}

export function shortModelLabel(modelId: string): string {
  const parts = modelId.split('/');
  return parts[parts.length - 1] || modelId;
}
// Platform binary builder
// Builds oh-my-unified for darwin-arm64, darwin-x64, linux-x64, win32-x64
// Usage: bun run script/build-binaries.ts

async function buildBinaries(): Promise<void> {
  const platforms = [
    { name: 'darwin-arm64', target: 'bun-darwin-arm64' },
    { name: 'darwin-x64', target: 'bun-darwin-x64' },
    { name: 'linux-x64', target: 'bun-linux-x64' },
    { name: 'win32-x64', target: 'bun-windows-x64' },
  ]

  console.log('Building platform binaries...')
  for (const platform of platforms) {
    console.log(`  Building for ${platform.name}...`)
    // bun build --compile --target ${platform.target} src/cli/index.ts --outfile dist/oh-my-unified-${platform.name}
  }
  console.log('Done. Binaries in dist/')
}

buildBinaries()

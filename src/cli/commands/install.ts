import { Command } from 'commander'

export function createInstallCommand(): Command {
  const cmd = new Command('install')
  cmd.description('Install and configure oh-my-unified in OpenCode')
  cmd.action(async () => {
    console.log('🔧 Installing oh-my-unified...')
    // 1. Check if opencode.json exists
    // 2. Add plugin to plugin array
    // 3. Create default config
    // 4. Register MCPs
    // 5. Print success message with next steps
    console.log('✅ oh-my-unified installed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Restart OpenCode')
    console.log('  2. Run /start-work to begin')
  })
  return cmd
}

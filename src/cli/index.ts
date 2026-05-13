#!/usr/bin/env bun
// Entry point for `oh-my-unified` CLI command

import { Command } from 'commander'
import { createInstallCommand, createDoctorCommand } from './commands/index.js'

const program = new Command()

program
  .name('oh-my-unified')
  .description('Unified agent orchestration plugin for OpenCode')
  .version('1.0.0', '-v, --version')

program.addCommand(createInstallCommand())
program.addCommand(createDoctorCommand())

program.parse(process.argv)

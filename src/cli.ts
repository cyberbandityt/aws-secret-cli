#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { secretsCommands } from './commands/secrets.js';
import { ConfigManager } from './utils/config.js';
import chalk from 'chalk';

const program = new Command();

// Add version and description
program
  .name('aws-secrets')
  .description('AWS Secrets Manager CLI with .env integration')
  .version('1.0.0');

// Register commands first
initCommand(program);
secretsCommands(program);

// Add pre-action hook for config check
program.hook('preAction', (command) => {
  // Get the actual command from args
  const commandName = program.args[0];
  
  // Skip check for these commands
  if (commandName === 'init' || !commandName || commandName === 'help') {
    return;
  }

  const configManager = new ConfigManager();
  const config = configManager.read();

  if (!config.region || !config.secretName) {
    console.error(chalk.red('Configuration not found. Please run: aws-secrets init'));
    process.exit(1);
  }
});

program.parse(process.argv);
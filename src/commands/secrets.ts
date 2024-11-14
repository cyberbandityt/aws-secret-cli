import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { AwsSecretsManager } from '../utils/aws.js';
import { EnvManager } from '../utils/env.js';
import { ConfigManager } from '../utils/config.js';
export function secretsCommands(program: Command): void {
    const getAwsManager = () => {

        const configManager = new ConfigManager();
    
        const config = configManager.read();
    
        return new AwsSecretsManager(config);
    
      };
  // Add secret
  program
    .command('add')
    .description('Add or update a secret')
    .argument('<key>', 'secret key')
    .argument('<value>', 'secret value')
    .option('-w, --write', 'write to .env after adding')
    .action(async (key, value, options) => {
      const spinner = ora('Adding secret...').start();
      try {
        const awsManager = getAwsManager();
        const secrets = await awsManager.getSecrets();
        secrets[key] = value;
        await awsManager.updateSecrets(secrets);
        spinner.succeed(chalk.green(`Successfully added secret: ${key}`));

        if (options.write) {
          await EnvManager.writeEnvFile(secrets);
          console.log(chalk.green('Updated .env file'));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to add secret: ${error}`));
      }
    });

  // Get secret
  program
    .command('get')
    .description('Get a secret value')
    .argument('<key>', 'secret key')
    .action(async (key) => {
      const spinner = ora('Fetching secret...').start();
      try {
        const awsManager = getAwsManager();
        const secrets = await awsManager.getSecrets();
        if (key in secrets) {
          spinner.stop();
          console.log(chalk.cyan('\nSecret Value:'));
          console.log(chalk.yellow(secrets[key]));
        } else {
          spinner.info(chalk.yellow(`Secret '${key}' not found`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to get secret: ${error}`));
      }
    });

  // Remove secret
  program
    .command('remove')
    .description('Remove a secret')
    .argument('<key>', 'secret key')
    .option('-w, --write', 'write to .env after removing')
    .action(async (key, options) => {
      const spinner = ora('Removing secret...').start();
      try {
        const awsManager = getAwsManager();
        const secrets = await awsManager.getSecrets();
        if (key in secrets) {
          delete secrets[key];
          await awsManager.updateSecrets(secrets);
          spinner.succeed(chalk.green(`Successfully removed secret: ${key}`));

          if (options.write) {
            await EnvManager.writeEnvFile(secrets);
            console.log(chalk.green('Updated .env file'));
          }
        } else {
          spinner.info(chalk.yellow(`Secret '${key}' not found`));
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to remove secret: ${error}`));
      }
    });

  // List secrets
  program
    .command('list')
    .description('List all secrets')
    .option('-v, --values', 'show secret values')
    .action(async (options) => {
      const spinner = ora('Fetching secrets...').start();
      try {
        const awsManager = getAwsManager();
        const secrets = await awsManager.getSecrets();
        spinner.stop();
        console.log(chalk.cyan('\nSecrets:'));
        Object.entries(secrets).forEach(([key, value]) => {
          if (options.values) {
            console.log(chalk.yellow(`${key}: ${value}`));
          } else {
            console.log(chalk.yellow(key));
          }
        });
      } catch (error) {
        spinner.fail(chalk.red(`Failed to list secrets: ${error}`));
      }
    });
    program
        .command('write')
        .description('Write secrets to .env file')
        .option('-e, --environment <env>', 'environment name', 'development')
        .option('-f, --filename <filename>', 'output filename', '.env')
        .action(async (options) => {
        const spinner = ora('Writing secrets to .env...').start();
        try {
            const awsManager = getAwsManager();
            const secrets = await awsManager.getSecrets();
            await EnvManager.writeEnvFile(secrets, options.environment, options.filename);
            // Continuing src/commands/secrets.ts

        spinner.succeed(chalk.green(`Successfully wrote secrets to ${options.filename}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to write secrets: ${error}`));
    }
  });

// Sync from .env to AWS
program
  .command('sync')
  .description('Sync secrets from .env file to AWS')
  .option('-f, --filename <filename>', 'input filename', '.env')
  .option('-m, --mode <mode>', 'sync mode (merge/overwrite)', 'merge')
  .option('-d, --dry-run', 'show what would be updated without making changes')
  .action(async (options) => {
    const spinner = ora('Reading .env file...').start();
    try {
      // Read local .env file
      const localSecrets = await EnvManager.readEnvFile(options.filename);
      
      // Get current AWS secrets
      const awsManager = getAwsManager();
      const awsSecrets = options.mode === 'merge' 
        ? await awsManager.getSecrets()
        : {};
      
      // Prepare new secrets
      const updatedSecrets = {
        ...awsSecrets,
        ...localSecrets
      };

      // Show diff
      spinner.stop();
      console.log(chalk.cyan('\nChanges to be made:'));
      
      // Show added/modified secrets
      for (const [key, value] of Object.entries(localSecrets)) {
        if (!awsSecrets[key]) {
          console.log(chalk.green(`+ ${key}: ${value}`));
        } else if (awsSecrets[key] !== value) {
          console.log(chalk.yellow(`~ ${key}: ${value}`));
        }
      }

      // Show removed secrets in overwrite mode
      if (options.mode === 'overwrite') {
        for (const key of Object.keys(awsSecrets)) {
          if (!localSecrets[key]) {
            console.log(chalk.red(`- ${key}`));
          }
        }
      }

      // If dry run, stop here
      if (options.dryRun) {
        console.log(chalk.yellow('\nDry run - no changes made'));
        return;
      }

      // Update AWS secrets
      spinner.start('Updating AWS Secrets Manager...');
      await awsManager.updateSecrets(updatedSecrets);
      spinner.succeed(chalk.green('Successfully synced secrets to AWS'));

      // Show summary
      console.log(chalk.cyan('\nSync Summary:'));
      console.log(chalk.white(`Total secrets: ${Object.keys(updatedSecrets).length}`));
      console.log(chalk.green(`Added/Modified: ${Object.keys(localSecrets).length}`));
      if (options.mode === 'overwrite') {
        const removed = Object.keys(awsSecrets).filter(key => !localSecrets[key]).length;
        console.log(chalk.red(`Removed: ${removed}`));
      }

    } catch (error) {
      spinner.fail(chalk.red(`Sync failed: ${error}`));
    }
  });
}
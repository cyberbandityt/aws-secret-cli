import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../utils/config.js';
import { AwsSecretsManager } from '../utils/aws.js';

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize AWS Secrets Manager configuration')
    .action(async () => {
      console.log(chalk.cyan('AWS Secrets Manager CLI Configuration\n'));
      
      const configManager = new ConfigManager();
      const currentConfig = configManager.read();

      try {
        // AWS Region
        const { region } = await inquirer.prompt([
            {
              type: 'input',
              name: 'region',
              message: 'AWS Region:',
              default: currentConfig.region || 'us-east-1',
              validate: (value) => {
                if (!/^[a-z]{2}-[a-z]+-\d{1}$/.test(value)) {
                  return 'Please enter a valid AWS region (e.g., us-east-1)';
                }
                return true;
              },
            }
          ]);

        // AWS Credentials
        const { credentialsType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'credentialsType',
            message: 'How would you like to authenticate with AWS?',
            choices: [
              { name: 'Use AWS CLI credentials', value: 'cli' },
              { name: 'Enter AWS credentials manually', value: 'manual' }
            ]
          }
        ]);

        let credentials = {};
        if (credentialsType === 'manual') {
          const manualCreds = await inquirer.prompt([
            {
              type: 'input',
              name: 'accessKeyId',
              message: 'AWS Access Key ID:',
              validate: (value) => value.length > 0,
            },
            {
              type: 'password',
              name: 'secretAccessKey',
              message: 'AWS Secret Access Key:',
              validate: (value) => value.length > 0,
            }
          ]);
          credentials = manualCreds;
        }

        // Initialize AWS client with provided configuration
        const awsManager = new AwsSecretsManager({
            region,
            ...credentials
          });        
        // Test AWS connection
        const spinner = ora('Testing AWS connection...').start();
        try {
          await awsManager.listAllSecrets();
          spinner.succeed('AWS connection successful');
        } catch (error) {
          spinner.fail('AWS connection failed');
          console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          process.exit(1);
        }

        // Secret configuration
        let { secretAction } = await inquirer.prompt([
          {
            type: 'list',
            name: 'secretAction',
            message: 'Would you like to use an existing secret or create a new one?',
            choices: [
              { name: 'Use existing secret', value: 'existing' },
              { name: 'Create new secret', value: 'new' }
            ]
          }
        ]);

        let secretName;
        if (secretAction === 'existing') {
          const secrets = await awsManager.listAllSecrets();
          if (secrets.length === 0) {
            console.log(chalk.yellow('\nNo existing secrets found. Creating new secret...'));
            secretAction = 'new';
          } else {
            const { selectedSecret } = await inquirer.prompt([
              {
                type: 'list',
                name: 'selectedSecret',
                message: 'Select a secret:',
                choices: secrets.map(secret => ({
                  name: secret.Name,
                  value: secret.Name
                }))
              }
            ]);
            secretName = selectedSecret;
          }
        }

        if (secretAction === 'new') {
          const { newSecretName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newSecretName',
              message: 'Enter name for new secret:',
              validate: (value) => {
                if (!value) return 'Secret name is required';
                if (!/^[a-zA-Z0-9/_+=.@-]+$/.test(value)) {
                  return 'Secret name can only contain alphanumeric characters and /_+=.@-';
                }
                return true;
              }
            }
          ]);
          secretName = newSecretName;
          
          spinner.start('Creating new secret...');
          try {
            await awsManager.createSecret(secretName);
            spinner.succeed('New secret created successfully');
          } catch (error) {
            spinner.fail('Failed to create secret');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
            process.exit(1);
          }
        }

        // Save configuration
        const config = {
          region,
          secretName,
          ...credentials
        };

        if (configManager.write(config)) {
          console.log(chalk.green('\nConfiguration saved successfully!'));
          console.log(chalk.cyan('\nConfiguration Summary:'));
          console.log(chalk.white(`Region: ${config.region}`));
          console.log(chalk.white(`Secret Name: ${config.secretName}`));
          console.log(chalk.white(`Auth Method: ${credentialsType === 'cli' ? 'AWS CLI' : 'Manual Credentials'}`));

          console.log(chalk.cyan('\nYou can now use the following commands:'));
          console.log(chalk.white('  aws-secrets list'));
          console.log(chalk.white('  aws-secrets add KEY VALUE'));
          console.log(chalk.white('  aws-secrets get KEY'));
          console.log(chalk.white('  aws-secrets remove KEY'));
          console.log(chalk.white('  aws-secrets write'));
          console.log(chalk.white('  aws-secrets sync'));
        } else {
          console.error(chalk.red('\nFailed to save configuration'));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Initialization failed:', error));
        process.exit(1);
      }
    });
}
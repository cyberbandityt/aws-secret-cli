import {
    SecretsManagerClient,
    GetSecretValueCommand,
    UpdateSecretCommand,
    ListSecretsCommand,
    CreateSecretCommand
  } from "@aws-sdk/client-secrets-manager";
  import { Config } from '../types/index.js';
  
  export class AwsSecretsManager {
    private client: SecretsManagerClient;
    private secretName?: string;
  
    constructor(config?: Partial<Config>) {
      // Initialize the client with provided config or empty config
      this.client = new SecretsManagerClient({
        region: config?.region,
        ...(config?.accessKeyId && config?.secretAccessKey && {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
          }
        })
      });
      this.secretName = config?.secretName;
    }
  
    // Method to update client configuration
    updateConfig(config: Partial<Config>) {
      this.client = new SecretsManagerClient({
        region: config.region,
        ...(config.accessKeyId && config.secretAccessKey && {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
          }
        })
      });
      if (config.secretName) {
        this.secretName = config.secretName;
      }
    }
  
    async listAllSecrets() {
      try {
        const response = await this.client.send(new ListSecretsCommand({}));
        return response.SecretList || [];
      } catch (error) {
        throw new Error(`Failed to list secrets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    async createSecret(name: string) {
      try {
        await this.client.send(
          new CreateSecretCommand({
            Name: name,
            SecretString: JSON.stringify({}),
          })
        );
      } catch (error) {
        throw new Error(`Failed to create secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    async getSecrets(): Promise<Record<string, string>> {
      if (!this.secretName) {
        throw new Error('Secret name is not configured');
      }
      try {
        const response = await this.client.send(
          new GetSecretValueCommand({
            SecretId: this.secretName,
            VersionStage: 'AWSCURRENT',
          })
        );
        return JSON.parse(response.SecretString || '{}');
      } catch (error) {
        throw new Error(`Failed to fetch secrets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    async updateSecrets(secrets: Record<string, string>): Promise<void> {
      if (!this.secretName) {
        throw new Error('Secret name is not configured');
      }
      try {
        await this.client.send(
          new UpdateSecretCommand({
            SecretId: this.secretName,
            SecretString: JSON.stringify(secrets),
          })
        );
      } catch (error) {
        throw new Error(`Failed to update secrets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
import { AwsSecretsManager } from '../../utils/aws.js';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
  ListSecretsCommand,
  CreateSecretCommand
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { jest } from '@jest/globals';

const secretsManagerMock = mockClient(SecretsManagerClient);

describe('AwsSecretsManager', () => {
  const mockConfig = {
    region: 'us-east-1',
    secretName: 'test-secret',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret'
  };

  beforeEach(() => {
    secretsManagerMock.reset();
  });

  describe('constructor', () => {
    it('should initialize with full config', () => {
      const manager = new AwsSecretsManager(mockConfig);
      expect(manager).toBeDefined();
    });

    it('should initialize with region only', () => {
      const manager = new AwsSecretsManager({ region: 'us-east-1' });
      expect(manager).toBeDefined();
    });

    it('should initialize with empty config', () => {
      const manager = new AwsSecretsManager();
      expect(manager).toBeDefined();
    });
  });

  describe('updateConfig', () => {
    it('should update client with new config', async () => {
      const manager = new AwsSecretsManager();
      const newConfig = {
        region: 'us-west-2',
        secretName: 'new-secret',
        accessKeyId: 'new-key',
        secretAccessKey: 'new-secret'
      };
      
      manager.updateConfig(newConfig);
      
      secretsManagerMock.on(GetSecretValueCommand).resolves({ 
        SecretString: '{}' 
      });
      await expect(manager.getSecrets()).resolves.toEqual({});
    });

    it('should update region only', () => {
      const manager = new AwsSecretsManager();
      manager.updateConfig({ region: 'us-west-2' });
      expect(manager).toBeDefined();
    });

    it('should update secret name only', () => {
      const manager = new AwsSecretsManager(mockConfig);
      manager.updateConfig({ secretName: 'new-secret' });
      expect(manager).toBeDefined();
    });
  });

  describe('listAllSecrets', () => {
    it('should list all secrets successfully', async () => {
      const mockSecrets = [
        { Name: 'secret1', ARN: 'arn1' },
        { Name: 'secret2', ARN: 'arn2' }
      ];

      secretsManagerMock.on(ListSecretsCommand).resolves({
        SecretList: mockSecrets
      });

      const awsManager = new AwsSecretsManager(mockConfig);
      const result = await awsManager.listAllSecrets();

      expect(result).toEqual(mockSecrets);
    });

    it('should handle empty secret list', async () => {
      secretsManagerMock.on(ListSecretsCommand).resolves({
        SecretList: []
      });

      const awsManager = new AwsSecretsManager(mockConfig);
      const result = await awsManager.listAllSecrets();

      expect(result).toEqual([]);
    });

    it('should handle undefined SecretList', async () => {
      secretsManagerMock.on(ListSecretsCommand).resolves({});

      const awsManager = new AwsSecretsManager(mockConfig);
      const result = await awsManager.listAllSecrets();

      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      secretsManagerMock.on(ListSecretsCommand)
        .rejects(new Error('AWS Error'));

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.listAllSecrets())
        .rejects.toThrow('Failed to list secrets: AWS Error');
    });

    it('should handle non-Error objects in catch', async () => {
        secretsManagerMock.on(ListSecretsCommand).rejects(new Error());

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.listAllSecrets())
        .rejects.toThrow('Failed to list secrets: Unknown error');
    });
  });

  describe('getSecrets', () => {
    it('should get secrets successfully', async () => {
      const mockSecrets = { key1: 'value1', key2: 'value2' };
      
      secretsManagerMock.on(GetSecretValueCommand).resolves({
        SecretString: JSON.stringify(mockSecrets)
      });

      const awsManager = new AwsSecretsManager(mockConfig);
      const result = await awsManager.getSecrets();

      expect(result).toEqual(mockSecrets);
    });

    it('should handle empty secrets', async () => {
      secretsManagerMock.on(GetSecretValueCommand).resolves({
        SecretString: '{}'
      });

      const awsManager = new AwsSecretsManager(mockConfig);
      const result = await awsManager.getSecrets();

      expect(result).toEqual({});
    });

    it('should handle undefined SecretString', async () => {
      secretsManagerMock.on(GetSecretValueCommand).resolves({});

      const awsManager = new AwsSecretsManager(mockConfig);
      const result = await awsManager.getSecrets();

      expect(result).toEqual({});
    });

    it('should handle missing secret name', async () => {
      const awsManager = new AwsSecretsManager({ region: 'us-east-1' });
      await expect(awsManager.getSecrets())
        .rejects.toThrow('Secret name is not configured');
    });

    it('should handle invalid JSON in SecretString', async () => {
      secretsManagerMock.on(GetSecretValueCommand).resolves({
        SecretString: 'invalid json'
      });

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.getSecrets())
        .rejects.toThrow('Failed to fetch secrets');
    });
  });

  describe('createSecret', () => {
    it('should create secret successfully', async () => {
      secretsManagerMock.on(CreateSecretCommand).resolves({});

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.createSecret('new-secret'))
        .resolves.not.toThrow();
    });

    it('should handle creation errors', async () => {
      secretsManagerMock.on(CreateSecretCommand)
        .rejects(new Error('AWS Error'));

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.createSecret('new-secret'))
        .rejects.toThrow('Failed to create secret: AWS Error');
    });

    it('should handle non-Error objects in catch', async () => {
        secretsManagerMock.on(CreateSecretCommand).rejects(new Error());

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.createSecret('new-secret'))
        .rejects.toThrow('Failed to create secret: Unknown error');
    });
  });

  describe('updateSecrets', () => {
    it('should update secrets successfully', async () => {
      secretsManagerMock.on(UpdateSecretCommand).resolves({});

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.updateSecrets({ key: 'value' }))
        .resolves.not.toThrow();
    });

    it('should handle update errors', async () => {
      secretsManagerMock.on(UpdateSecretCommand)
        .rejects(new Error('AWS Error'));

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.updateSecrets({ key: 'value' }))
        .rejects.toThrow('Failed to update secrets: AWS Error');
    });

    it('should handle missing secret name', async () => {
      const awsManager = new AwsSecretsManager({ region: 'us-east-1' });
      await expect(awsManager.updateSecrets({ key: 'value' }))
        .rejects.toThrow('Secret name is not configured');
    });

    it('should handle non-Error objects in catch', async () => {
        secretsManagerMock.on(UpdateSecretCommand).rejects(new Error());

      const awsManager = new AwsSecretsManager(mockConfig);
      await expect(awsManager.updateSecrets({ key: 'value' }))
        .rejects.toThrow('Failed to update secrets: Unknown error');
    });
  });
});
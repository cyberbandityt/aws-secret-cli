import { EnvManager } from '../../utils/env.js';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

jest.mock('fs');
jest.mock('path');

// Mock process.cwd
const mockCwd = '/test/path';
jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);

describe('EnvManager', () => {
  const mockSecrets = {
    KEY1: 'value1',
    KEY2: 'value2',
    COMPLEX_KEY: 'value with "quotes" and \nnewlines'
  };

  let expectedPath: string;

  beforeEach(() => {
    jest.clearAllMocks();
    expectedPath = path.join(mockCwd, '.env');
  });

  describe('writeEnvFile', () => {
    it('should write secrets to .env file', async () => {
      await EnvManager.writeEnvFile(mockSecrets);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      // Check that the call includes our test values
      const actualCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      expect(actualCall[0]).toBe(expectedPath);
      expect(actualCall[1]).toMatch(/KEY1="value1"/);
      expect(actualCall[1]).toMatch(/KEY2="value2"/);
    });

    it('should properly escape special characters', async () => {
      await EnvManager.writeEnvFile({
        TEST: 'value with "quotes" and \nnewlines'
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      const actualCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      expect(actualCall[1]).toMatch(/TEST="value with \\"quotes\\" and \\nnewlines"/);
    });

    it('should handle write errors', async () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      await expect(EnvManager.writeEnvFile(mockSecrets))
        .rejects.toThrow('Failed to write .env file');
    });
  });

  describe('readEnvFile', () => {
    it('should read and parse .env file', async () => {
      const mockContent = `
KEY1="value1"
KEY2="value2"
COMPLEX_KEY="value with \\"quotes\\" and \\nnewlines"
      `.trim();

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = await EnvManager.readEnvFile();
      expect(result).toEqual(mockSecrets);
      expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8');
    });

    it('should handle missing file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(EnvManager.readEnvFile())
        .rejects.toThrow('File .env not found');
    });

    it('should handle read errors', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Read error');
      });

      await expect(EnvManager.readEnvFile())
        .rejects.toThrow('Failed to read .env file');
    });

    it('should skip comments and empty lines', async () => {
      const mockContent = `
# This is a comment
KEY1="value1"

# Another comment
KEY2="value2"
      `.trim();

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = await EnvManager.readEnvFile();
      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2'
      });
    });
  });
});
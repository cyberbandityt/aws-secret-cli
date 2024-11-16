import { ConfigManager } from '../../utils/config.js';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

// Mock modules
jest.mock('fs');
jest.mock('path');

// Mock process.cwd
const mockCwd = '/test/path';
jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let consoleSpy: jest.SpiedFunction<typeof console.error>;
  let expectedPath: string;
  
  const mockConfig = {
    region: 'us-east-1',
    secretName: 'test-secret',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret'
  };

  beforeEach(() => {
    configManager = new ConfigManager();
    jest.clearAllMocks();
    // Mock console.error
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Set expected path
    expectedPath = path.join(mockCwd, '.secrets-config.json');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('read', () => {
    it('should read and parse config file when it exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

      const config = configManager.read();
      expect(config).toEqual(mockConfig);
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should return empty object when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = configManager.read();
      expect(config).toEqual({});
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle read errors gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Read error');
      });

      const config = configManager.read();
      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading config:',
        expect.any(Error)
      );
    });
  });

  describe('write', () => {
    const expectedContent = JSON.stringify(mockConfig, null, 2);

    it('should write config to file successfully', () => {
      const result = configManager.write(mockConfig);
      
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(expectedPath, expectedContent);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle write errors gracefully', () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = configManager.write(mockConfig);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error writing config:',
        expect.any(Error)
      );
    });

    it('should write config with proper formatting', () => {
      configManager.write(mockConfig);
      
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(expectedPath, expectedContent);
    });
  });

  describe('file path', () => {
    it('should use correct file path', () => {
      configManager.read();
      
      expect(path.join).toHaveBeenCalledWith(
        mockCwd,
        '.secrets-config.json'
      );
    });
  });
});
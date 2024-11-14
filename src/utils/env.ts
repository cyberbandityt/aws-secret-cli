import fs from 'fs';
import path from 'path';
import { SecretData } from '../types';

export class EnvManager {
  static async readEnvFile(filename: string = '.env'): Promise<SecretData> {
    try {
      const envPath = path.join(process.cwd(), filename);
      if (!fs.existsSync(envPath)) {
        throw new Error(`File ${filename} not found`);
      }

      const content = fs.readFileSync(envPath, 'utf8');
      const secrets: SecretData = {};

      content.split('\n').forEach(line => {
        if (!line || line.startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          value = value.replace(/^["'](.*)["']$/, '$1')
                      .replace(/\\n/g, '\n')
                      .replace(/\\"/g, '"');
          secrets[key] = value;
        }
      });

      return secrets;
    } catch (error) {
      throw new Error(`Failed to read .env file: ${error}`);
    }
  }

  static async writeEnvFile(
    secrets: SecretData,
    environment: string = 'development',
    filename: string = '.env'
  ): Promise<void> {
    try {
      const envPath = path.join(process.cwd(), filename);
      let content = '# This file is auto-generated. Do not edit manually.\n';
      content += `# Environment: ${environment}\n`;
      content += `# Generated at: ${new Date().toISOString()}\n\n`;

      for (const [key, value] of Object.entries(secrets)) {
        const escapedValue = value
          .replace(/\n/g, '\\n')
          .replace(/"/g, '\\"');
        content += `${key}="${escapedValue}"\n`;
      }

      fs.writeFileSync(envPath, content);
    } catch (error) {
      throw new Error(`Failed to write .env file: ${error}`);
    }
  }
}
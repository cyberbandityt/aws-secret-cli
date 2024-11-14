import { join } from 'path';
import fs from 'fs';
import { Config } from '../types';

export class ConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), '.secrets-config.json');
  }

  read(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading config:', error);
    }
    return {} as Config;
  }

  write(config: Config): boolean {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing config:', error);
      return false;
    }
  }
}

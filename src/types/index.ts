// src/types/index.ts
export interface Config {
    region: string;
    secretName: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }
  
  export interface Secret {
    key: string;
    value: string;
  }
  
  export interface SecretOperationOptions {
    environment?: string;
    filename?: string;
    dryRun?: boolean;
    mode?: 'merge' | 'overwrite';
    write?: boolean;
    values?: boolean;
  }
  
  export type SecretData = Record<string, string>;
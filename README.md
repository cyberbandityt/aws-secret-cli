# AWS Secrets CLI

A command-line interface tool for managing AWS Secrets Manager with .env file integration.

## Features

- Interactive initialization and configuration
- Manage AWS Secrets Manager directly from the command line
- Sync between .env files and AWS Secrets Manager
- Support for multiple environments
- Secure credential handling
- Easy secret management workflow

## Installation

```bash
npm install -g aws-secrets-cli
```

## Quick Start

1. Initialize the configuration:
```bash
aws-secrets init
```

2. Add a secret:
```bash
aws-secrets add DATABASE_URL "postgresql://user:pass@localhost:5432/db"
```

3. List all secrets:
```bash
aws-secrets list
```

4. Write secrets to .env file:
```bash
aws-secrets write
```

5. Sync from .env to AWS:
```bash
aws-secrets sync
```

## Commands

### `init`
Initialize AWS Secrets Manager configuration
```bash
aws-secrets init
```

### `add`
Add or update a secret
```bash
aws-secrets add KEY VALUE [options]
Options:
  -e, --environment <env>   environment (dev/staging/prod) (default: "dev")
  --write                   write to .env file after adding (default: false)
```

### `get`
Get a secret value
```bash
aws-secrets get KEY
```

### `remove`
Remove a secret
```bash
aws-secrets remove KEY [options]
Options:
  --write   write to .env file after removing (default: false)
```

### `list`
List all secrets
```bash
aws-secrets list [options]
Options:
  -v, --values   show secret values (default: false)
```

### `write`
Write secrets to .env file
```bash
aws-secrets write [options]
Options:
  -e, --environment <env>   environment (default: "development")
  -f, --filename <file>     output filename (default: ".env")
```

### `sync`
Sync secrets from .env file to AWS Secrets Manager
```bash
aws-secrets sync [options]
Options:
  -f, --filename <file>   input filename (default: ".env")
  -m, --mode <mode>       sync mode (merge/overwrite) (default: "merge")
  -d, --dry-run          show what would be updated without making changes
```

## Configuration

The tool stores its configuration in `.secrets-config.json` in your project root:

```json
{
  "region": "us-east-1",
  "secretName": "my-app-secrets"
}
```

## AWS Credentials

You can authenticate with AWS in two ways:
1. Using AWS CLI credentials (recommended)
2. Manual credential entry during initialization

## Environment Variables

The following environment variables can be used to override configuration:

- `AWS_REGION`: Override AWS region
- `AWS_SECRET_NAME`: Override secret name

## Error Handling

The tool provides detailed error messages and validation:
- AWS credential validation
- Region validation
- Secret name validation
- Configuration validation

## Best Practices

1. Always use `--dry-run` with sync command first
2. Keep `.secrets-config.json` in `.gitignore`
3. Use different secret names for different environments
4. Regularly backup your secrets
5. Use meaningful secret names

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

APACHE2.0 - see LICENSE file for details
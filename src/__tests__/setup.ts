import { jest } from '@jest/globals';

global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

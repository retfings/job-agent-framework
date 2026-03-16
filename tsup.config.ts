import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  platform: 'node',
  target: 'node18',
  external: [
    'fs', 'path', 'url', 'crypto', 'os', 'child_process', 'stream', 'util', 'buffer', 'events', 'assert', 'zlib',
    '@anthropic-ai/sdk', 'chalk', 'commander', 'dotenv', 'ora', '@clack/prompts', 'glob', 'fs.realpath'
  ],
  treeshake: true,
  minify: false,
});

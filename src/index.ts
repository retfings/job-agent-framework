#!/usr/bin/env node

/**
 * Code Agent CLI - 教学项目
 *
 * 一个教你如何用 TypeScript 构建类似 Claude Code 的工具的项目
 *
 * @author Code Agent Tutorial
 * @license MIT
 */

import 'dotenv/config';
import { createCLI } from './cli/commands.js';

async function main() {
  const cli = createCLI();

  // 如果没有提供参数，显示帮助
  if (process.argv.length <= 2) {
    cli.help();
    return;
  }

  try {
    await cli.parseAsync(process.argv);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`错误：${errorMessage}`);
    process.exit(1);
  }
}

main();

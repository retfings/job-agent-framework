#!/usr/bin/env node

/**
 * YOLO - AI 驱动的代码助手
 *
 * 直接进入聊天模式
 *
 * @author YOLO
 * @license MIT
 */

import 'dotenv/config';
import { createCLI } from './cli/commands.js';

async function main() {
  const cli = createCLI();

  // 如果没有提供参数，直接进入聊天模式
  if (process.argv.length <= 2) {
    const { runChatMode } = await import('./cli/modes/chat.js');
    await runChatMode({ model: 'claude-sonnet-4-20250514', dir: process.cwd() });
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

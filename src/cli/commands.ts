/**
 * CLI 命令定义
 *
 * 使用 commander 定义 CLI 命令结构
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 创建 CLI 程序
 */
export function createCLI(): Command {
  const program = new Command();

  // 读取 package.json 获取版本
  let version = '1.0.0';
  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    version = packageJson.version;
  } catch {
    // 忽略错误，使用默认版本
  }

  program
    .name('yolo')
    .description('YOLO - AI 驱动的代码助手')
    .version(version);

  // 默认聊天命令（无子命令时直接进入聊天）
  program
    .command('chat')
    .description('进入交互式聊天模式')
    .option('-m, --model <name>', '指定模型名称', 'claude-sonnet-4-20250514')
    .option('-d, --dir <path>', '指定工作目录', process.cwd())
    .action(async (options) => {
      const { runChatMode } = await import('./modes/chat.js');
      await runChatMode(options);
    });

  // run 命令 - 执行单个任务
  program
    .command('run')
    .description('执行单个任务')
    .argument('<task>', '要执行的任务描述')
    .option('-m, --model <name>', '指定模型名称', 'claude-sonnet-4-20250514')
    .option('-d, --dir <path>', '指定工作目录', process.cwd())
    .action(async (task, options) => {
      const { runTaskMode } = await import('./modes/run.js');
      await runTaskMode(task, options);
    });

  // demo 命令 - 运行演示
  program
    .command('demo')
    .description('运行演示，展示工具调用过程')
    .action(async () => {
      const { runDemo } = await import('./modes/demo.js');
      await runDemo();
    });

  return program;
}

/**
 * 交互式会话模块
 *
 * 使用 @clack/prompts 提供美观的交互界面
 */

import * as prompts from '@clack/prompts';
import chalk from 'chalk';

/**
 * 获取用户输入
 */
export async function getUserInput(defaultPrompt = ''): Promise<string | symbol> {
  const input = await prompts.text({
    message: '输入你的问题或命令 (输入 "quit" 退出)',
    placeholder: defaultPrompt,
    validate: (value) => {
      if (value.length === 0) {
        return '请输入一些内容';
      }
    }
  });

  return input;
}

/**
 * 显示确认对话框
 */
export async function confirm(message: string): Promise<boolean> {
  const result = await prompts.confirm({
    message
  });

  return result === true;
}

/**
 * 显示选择器
 */
export async function select<T extends string>(
  message: string,
  options: { label: string; value: T; hint?: string }[]
): Promise<T | symbol> {
  return prompts.select({
    message,
    options
  });
}

/**
 * 显示加载指示器
 */
export function showSpinner(message: string): { stop: () => void } {
  const spinner = prompts.spinner();
  // 注意：clack 的 spinner 不支持持续更新，这里简化处理
  console.log(chalk.gray(`⏳ ${message}`));
  return {
    stop: () => {
      // 简单的停止处理
    }
  };
}

/**
 * 显示分隔线
 */
export function printDivider(): void {
  console.log(chalk.gray('─'.repeat(50)));
}

/**
 * 格式化输入，添加引用样式
 */
export function formatUserInput(input: string): string {
  return chalk.cyan(`> ${input}`);
}

/**
 * 清除屏幕
 */
export function clearScreen(): void {
  console.clear();
}

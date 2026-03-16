/**
 * CLI 工具函数
 */

import chalk from 'chalk';

/**
 * 打印欢迎信息
 */
export function printWelcome(): void {
  console.log(`
${chalk.cyan('╔══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.white.bold('Code Agent CLI - 教学版')}  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('学习如何构建类似 Claude Code 的工具')}  ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════════════════╝')}
`);
}

/**
 * 打印帮助信息
 */
export function printHelp(): void {
  console.log(`
${chalk.bold('用法:')}
  ${chalk.cyan('code-agent [命令] [选项]')}

${chalk.bold('命令:')}
  ${chalk.cyan('chat')}       交互式聊天模式
  ${chalk.cyan('run')}        执行单个任务
  ${chalk.cyan('help')}       显示帮助信息

${chalk.bold('选项:')}
  ${chalk.cyan('-m, --model <name>')}    指定模型名称
  ${chalk.cyan('-d, --dir <path>')}      指定工作目录
  ${chalk.cyan('-v, --version')}         显示版本号

${chalk.bold('示例:')}
  ${chalk.gray('# 进入交互式聊天')}
  ${chalk.cyan('code-agent chat')}

  ${chalk.gray('# 执行单个任务')}
  ${chalk.cyan('code-agent run "创建一个 hello world 函数"')}

  ${chalk.gray('# 指定工作目录')}
  ${chalk.cyan('code-agent run "分析项目结构" -d ./src')}

${chalk.bold('环境变量:')}
  ${chalk.cyan('ANTHROPIC_API_KEY')}     Anthropic API 密钥（必需）
`);
}

/**
 * 打印思考状态
 */
export function printThinking(iteration: number): void {
  console.log(chalk.gray(`\n🤔 思考中... (第 ${iteration} 轮)`));
}

/**
 * 打印工具调用
 */
export function printToolCall(toolName: string, params: Record<string, unknown>): void {
  console.log(chalk.cyan(`\n🔧 使用工具: ${chalk.bold(toolName)}`));
  if (params.description) {
    console.log(chalk.gray(`   说明：${params.description}`));
  }
}

/**
 * 打印工具结果
 */
export function printToolResult(success: boolean, output: string): void {
  if (success) {
    console.log(chalk.green(`   ✅ 成功`));
  } else {
    console.log(chalk.red(`   ❌ 失败`));
  }
  // 只显示简短的输出预览
  const preview = output.length > 200 ? output.slice(0, 200) + '...' : output;
  console.log(chalk.gray(`   ${preview.replace(/\n/g, '\n   ')}`));
}

/**
 * 打印 Agent 响应
 */
export function printResponse(content: string): void {
  console.log(`\n${chalk.white(content)}\n`);
}

/**
 * 打印错误
 */
export function printError(message: string): void {
  console.log(chalk.red(`\n❌ 错误：${message}\n`));
}

/**
 * 打印事件（用于调试）
 */
export function printEvent(type: string, data: unknown): void {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(chalk.gray(`[${timestamp}] ${type}:`, JSON.stringify(data, null, 2)));
}

/**
 * 打印分隔线
 */
export function printDivider(): void {
  console.log(chalk.gray('\n──────────────────────────────────────────────────────────\n'));
}

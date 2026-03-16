/**
 * 任务模式 - 执行单个任务
 */

import { createAgent } from '../../agent/code-agent.js';
import { ToolRegistry } from '../../tools/registry.js';
import { ReadFileTool } from '../../tools/read.js';
import { WriteFileTool } from '../../tools/write.js';
import { BashTool } from '../../tools/bash.js';
import { SearchFileTool } from '../../tools/search.js';
import * as output from '../output.js';
import chalk from 'chalk';

interface RunOptions {
  model: string;
  dir: string;
}

/**
 * 运行任务模式
 */
export async function runTaskMode(task: string, options: RunOptions): Promise<void> {
  console.log(chalk.cyan('\n🚀 Code Agent - 执行任务\n'));

  // 检查 API Key (支持多个环境变量名称)
  const apiKey = process.env.ANTHROPIC_API_KEY
              || process.env.ANTHROPIC_AUTH_TOKEN
              || process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    output.printError(
      '缺少 API Key 环境变量\n' +
      '请设置以下其中之一：\n' +
      '  export ANTHROPIC_API_KEY=your-api-key\n' +
      '  export ANTHROPIC_AUTH_TOKEN=your-token\n' +
      '  export DASHSCOPE_API_KEY=your-key'
    );
    process.exit(1);
  }

  // 获取 API Base URL (如果有)
  const baseURL = process.env.ANTHROPIC_BASE_URL;

  // 获取模型名称 (支持多个环境变量名称)
  const model = process.env.ANTHROPIC_MODEL
             || process.env.MODEL
             || options.model;

  console.log(chalk.gray(`任务：${task}`));
  console.log(chalk.gray(`目录：${options.dir}`));
  console.log(chalk.gray(`模型：${model}\n`));
  output.printDivider();

  // 创建工具注册表
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(new ReadFileTool());
  toolRegistry.register(new WriteFileTool());
  toolRegistry.register(new BashTool());
  toolRegistry.register(new SearchFileTool());

  // 创建 Agent（传入工具注册表）
  const agent = createAgent({
    apiKey,
    model,
    baseURL,
    workingDirectory: options.dir
  }, toolRegistry);

  // 设置事件处理
  agent.on('thinking', ({ data }) => {
    output.printThinking((data as { iteration: number }).iteration);
  });

  agent.on('tool_call', ({ data }) => {
    const tc = (data as { toolCall: { name: string; input: Record<string, unknown> } }).toolCall;
    output.printToolCall(tc.name, tc.input);
  });

  agent.on('tool_result', ({ data }) => {
    // 简化输出
  });

  agent.on('response', ({ data }) => {
    output.printResponse((data as { content: string }).content);
  });

  agent.on('error', ({ data }) => {
    output.printError((data as { error: string }).error);
  });

  agent.on('complete', ({ data }) => {
    output.printDivider();
    console.log(chalk.green('✅ 任务完成\n'));
  });

  try {
    await agent.sendMessage(task);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    output.printError(errorMessage);
    process.exit(1);
  }
}

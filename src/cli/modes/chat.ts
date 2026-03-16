/**
 * 聊天模式 - 交互式会话
 */

import type { Agent } from '../../agent/types.js';
import { createAgent } from '../../agent/code-agent.js';
import { ToolRegistry } from '../../tools/registry.js';
import { ReadFileTool } from '../../tools/read.js';
import { WriteFileTool } from '../../tools/write.js';
import { BashTool } from '../../tools/bash.js';
import { SearchFileTool } from '../../tools/search.js';
import * as output from '../output.js';
import * as interactive from '../interactive.js';
import chalk from 'chalk';

interface ChatOptions {
  model: string;
  dir: string;
}

/**
 * 运行聊天模式
 */
export async function runChatMode(options: ChatOptions): Promise<void> {
  output.printWelcome();

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

  // 创建工具注册表并注册工具
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(new ReadFileTool());
  toolRegistry.register(new WriteFileTool());
  toolRegistry.register(new BashTool());
  toolRegistry.register(new SearchFileTool());

  // 创建 Agent
  const agent = createAgent({
    apiKey,
    model,
    baseURL,
    workingDirectory: options.dir
  });

  // 设置事件处理
  setupAgentEvents(agent);

  console.log(chalk.gray(`工作目录：${options.dir}`));
  console.log(chalk.gray(`模型：${model}`));
  if (baseURL) {
    console.log(chalk.gray(`API 地址：${baseURL}`));
  }
  console.log(chalk.gray(`输入 "quit" 或 "exit" 退出\n`));

  // 主循环
  while (true) {
    const input = await interactive.getUserInput();

    if (typeof input === 'symbol') {
      // 用户取消
      break;
    }

    if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
      console.log(chalk.gray('\n👋 再见！'));
      break;
    }

    if (input.toLowerCase() === 'help') {
      output.printHelp();
      continue;
    }

    if (input.toLowerCase() === 'reset') {
      agent.reset();
      console.log(chalk.gray('✅ 对话已重置\n'));
      continue;
    }

    try {
      const response = await agent.sendMessage(input as string);
      if (response) {
        output.printResponse(response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      output.printError(errorMessage);
    }

    interactive.printDivider();
  }
}

/**
 * 设置 Agent 事件处理
 */
function setupAgentEvents(agent: Agent): void {
  agent.on('thinking', ({ iteration }) => {
    output.printThinking(iteration as number);
  });

  agent.on('tool_call', ({ toolCall }) => {
    const tc = toolCall as { name: string; input: Record<string, unknown> };
    output.printToolCall(tc.name, tc.input);
  });

  agent.on('tool_result', ({ result, isError }) => {
    // 简化的输出
  });

  agent.on('response', ({ content }) => {
    output.printResponse(content as string);
  });

  agent.on('error', ({ error }) => {
    output.printError(error as string);
  });
}

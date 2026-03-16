/**
 * 示例：自定义 Agent
 *
 * 这个文件展示了如何扩展和自定义 Agent
 */

import { CodeAgent } from '../agent/code-agent.js';
import type { AgentConfig, AgentEvent } from '../agent/types.js';
import { ToolRegistry } from '../tools/registry.js';

/**
 * 示例 1: 带日志的 Agent
 */
export class LoggingAgent extends CodeAgent {
  private logFile: string;

  constructor(config: AgentConfig, logFile: string = 'agent.log') {
    super(config);
    this.logFile = logFile;

    // 添加日志事件处理
    this.setupLogging();
  }

  private setupLogging(): void {
    const fs = require('fs');

    this.on('*', (event: AgentEvent) => {
      const logEntry = JSON.stringify({
        timestamp: new Date(event.timestamp).toISOString(),
        type: event.type,
        data: event.data
      });

      fs.appendFileSync(this.logFile, logEntry + '\n');
    });
  }
}

/**
 * 示例 2: 带确认机制的 Agent
 *
 * 在执行危险操作前要求用户确认
 */
export class ConfirmAgent extends CodeAgent {
  private dangerousTools: Set<string> = new Set(['bash', 'write_file']);

  async sendMessage(message: string): Promise<string> {
    // 这里可以添加确认逻辑
    // 注意：由于 CLI 交互的复杂性，实际实现需要更多代码
    console.log('⚠️  危险操作将被记录');
    return super.sendMessage(message);
  }

  /**
   * 设置需要确认的工具列表
   */
  setDangerousTools(tools: string[]): void {
    this.dangerousTools = new Set(tools);
  }
}

/**
 * 示例 3: 带记忆的 Agent
 *
 * 记住之前的对话和决策
 */
interface Memory {
  key: string;
  value: string;
  createdAt: number;
}

export class MemoryAgent extends CodeAgent {
  private memories: Map<string, Memory> = new Map();

  /**
   * 保存记忆
   */
  saveMemory(key: string, value: string): void {
    this.memories.set(key, {
      key,
      value,
      createdAt: Date.now()
    });
  }

  /**
   * 获取记忆
   */
  getMemory(key: string): string | undefined {
    return this.memories.get(key)?.value;
  }

  /**
   * 获取所有记忆
   */
  getAllMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  /**
   * 清除记忆
   */
  clearMemory(): void {
    this.memories.clear();
  }

  /**
   * 重写 sendMessage，在系统提示词中添加记忆
   */
  async sendMessage(message: string): Promise<string> {
    const memories = this.getAllMemories();
    if (memories.length > 0) {
      const memoryContext = memories
        .map(m => `- ${m.key}: ${m.value}`)
        .join('\n');

      // 注意：实际需要修改系统提示词
      console.log('当前记忆:', memoryContext);
    }

    return super.sendMessage(message);
  }
}

/**
 * 使用示例
 *
 * ```typescript
 * import { createAnthropicProvider } from '../llm/anthropic.js';
 * import { LoggingAgent, ConfirmAgent, MemoryAgent } from './examples/custom-agent.js';
 *
 * const config = {
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 *   workingDirectory: process.cwd()
 * };
 *
 * // 使用日志 Agent
 * const loggingAgent = new LoggingAgent(config, 'my-agent.log');
 * await loggingAgent.sendMessage('创建一个文件');
 *
 * // 使用确认 Agent
 * const confirmAgent = new ConfirmAgent(config);
 * confirmAgent.setDangerousTools(['bash']);
 * await confirmAgent.sendMessage('删除临时文件');
 *
 * // 使用记忆 Agent
 * const memoryAgent = new MemoryAgent(config);
 * memoryAgent.saveMemory('project_name', 'my-app');
 * memoryAgent.saveMemory('preferred_language', 'TypeScript');
 * await memoryAgent.sendMessage('创建项目结构');
 * ```
 */

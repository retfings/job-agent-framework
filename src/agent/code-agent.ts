/**
 * Code Agent 核心实现
 *
 * 这是整个系统的"大脑"，负责：
 * 1. 接收用户输入
 * 2. 调用 LLM 进行思考
 * 3. 执行工具调用
 * 4. 循环直到任务完成
 * 5. 返回最终结果
 */

import type {
  Agent,
  AgentConfig,
  AgentState,
  AgentEvent,
  AgentEventType,
  AgentEventHandler
} from './types.js';
import type { LLMProvider, LLMMessage, ToolCall, LLMResponse } from '../llm/types.js';
import type { ToolRegistry } from '../tools/types.js';
import { createAnthropicProvider } from '../llm/anthropic.js';
import { ToolRegistry as DefaultToolRegistry } from '../tools/registry.js';

// 默认的 Code Agent 系统提示词
const DEFAULT_SYSTEM_PROMPT = `你是一个智能编程助手，类似于 Claude Code。你可以帮助用户：

- 编写和修改代码
- 执行 shell 命令
- 搜索和读取文件
- 调试和解决问题

你拥有以下工具：
- read_file: 读取文件内容
- write_file: 创建或修改文件
- bash: 执行 shell 命令
- search_files: 搜索文件

使用工具的指南：
1. 在修改文件之前，先读取并理解现有代码
2. 执行可能影响系统的命令前，向用户说明将要做什么
3. 如果不确定文件路径，先使用 search_files 搜索
4. 保持代码简洁、清晰，遵循最佳实践
5. 每次只做必要的更改，不要过度工程化

回复用户时：
- 使用简洁清晰的语言
- 解释你做了什么以及为什么
- 如果遇到问题，说明原因并提出解决方案`;

export class CodeAgent implements Agent {
  private config: AgentConfig;
  private llmProvider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private state: AgentState;
  private eventHandlers: Map<AgentEventType, Set<AgentEventHandler>> = new Map();

  constructor(config: AgentConfig, toolRegistry?: ToolRegistry) {
    this.config = {
      maxIterations: 10,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      workingDirectory: process.cwd(),
      ...config
    };

    this.llmProvider = createAnthropicProvider(config.apiKey, {
      model: config.model,
      baseURL: config.baseURL
    });

    this.toolRegistry = toolRegistry || new DefaultToolRegistry();
    this.state = {
      messages: [],
      iterationCount: 0,
      isRunning: false,
      toolCallCount: 0
    };
  }

  /**
   * 发送消息并获取响应（主循环入口）
   */
  async sendMessage(message: string): Promise<string> {
    this.emit('message', { content: message });

    // 添加用户消息到历史
    this.state.messages.push({
      role: 'user',
      content: message
    });

    this.state.isRunning = true;
    this.state.iterationCount = 0;

    try {
      // 主循环：思考 -> 工具调用 -> 结果处理
      while (this.state.isRunning) {
        this.state.iterationCount++;

        // 检查迭代次数限制
        if (this.state.iterationCount > this.config.maxIterations!) {
          this.state.isRunning = false;
          return '⚠️ 已达到最大迭代次数，任务可能未完成。';
        }

        // 思考阶段
        this.emit('thinking', { iteration: this.state.iterationCount });

        const response = await this.llmProvider.sendMessage(
          this.state.messages,
          this.toolRegistry.getDefinitions(),
          {
            systemPrompt: this.config.systemPrompt,
            model: this.config.model
          }
        );

        // 处理响应
        const result = await this.processResponse(response);
        if (result.done) {
          this.state.isRunning = false;
          this.emit('complete', { finalResponse: result.content });
          return result.content;
        }
      }

      return '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { error: errorMessage });
      this.state.isRunning = false;
      throw error;
    }
  }

  /**
   * 处理 LLM 响应
   */
  private async processResponse(
    response: LLMResponse
  ): Promise<{ done: boolean; content: string }> {
    // 如果有文本内容，发回文本事件
    if (response.content) {
      this.emit('response', { content: response.content });
    }

    // 如果有工具调用，执行它们
    if (response.toolCalls.length > 0) {
      const toolResults: LLMMessage[] = [];

      for (const toolCall of response.toolCalls) {
        this.state.toolCallCount++;
        this.emit('tool_call', { toolCall });

        try {
          const result = await this.toolRegistry.executeTool(
            toolCall.name,
            toolCall.input as Record<string, unknown>,
            { workingDirectory: this.config.workingDirectory! }
          );

          this.emit('tool_result', { toolCallId: toolCall.id, result });

          // 将工具结果添加到消息历史
          toolResults.push({
            role: 'user',
            content: [{
              id: toolCall.id,
              name: toolCall.name,
              input: toolCall.input
            } as ToolCall]
          });

          // 注意：这里需要正确处理工具结果的格式
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.emit('tool_result', {
            toolCallId: toolCall.id,
            result: `错误：${errorMessage}`,
            isError: true
          });
        }
      }

      // 如果有工具调用，继续循环
      return { done: false, content: '' };
    }

    // 没有工具调用，返回文本响应
    return { done: true, content: response.content };
  }

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      messages: [],
      iterationCount: 0,
      isRunning: false,
      toolCallCount: 0
    };
  }

  /**
   * 注册事件处理器
   */
  on(event: AgentEventType, handler: AgentEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 触发事件
   */
  private emit(type: AgentEventType, data: unknown): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const event: AgentEvent = {
        type,
        data,
        timestamp: Date.now()
      };
      handlers.forEach(handler => handler(event));
    }
  }
}

/**
 * 创建 Code Agent 实例
 */
export function createAgent(config: AgentConfig): Agent {
  return new CodeAgent(config);
}

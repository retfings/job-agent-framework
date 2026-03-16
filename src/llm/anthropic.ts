/**
 * Anthropic LLM Provider 实现
 *
 * 这是与 Claude API 交互的核心模块
 * 支持工具调用（Tool Calling）功能
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  ToolDefinition,
  LLMOptions,
  ToolCall
} from './types.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel: string;
  private defaultMaxTokens: number;

  constructor(
    apiKey: string,
    options?: { model?: string; maxTokens?: number; baseURL?: string }
  ) {
    this.client = new Anthropic({
      apiKey,
      baseURL: options?.baseURL
    });
    this.defaultModel = options?.model || 'qwen3.5-plus';
    this.defaultMaxTokens = options?.maxTokens || 4096;
  }

  async sendMessage(
    messages: LLMMessage[],
    tools?: ToolDefinition[],
    options?: LLMOptions
  ): Promise<LLMResponse> {
    const systemPrompt = options?.systemPrompt;
    const model = options?.model || this.defaultModel;
    const maxTokens = options?.maxTokens || this.defaultMaxTokens;

    // 转换消息格式为 Anthropic SDK 格式
    const anthropicMessages = this.convertMessages(messages);

    const params: Anthropic.MessageCreateParams = {
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      system: systemPrompt,
    };

    // 添加工具定义
    if (tools && tools.length > 0) {
      params.tools = tools;
    }

    const response = await this.client.messages.create(params);

    // 解析响应
    return this.parseResponse(response);
  }

  async streamSendMessage(
    messages: LLMMessage[],
    tools?: ToolDefinition[],
    options?: LLMOptions,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const systemPrompt = options?.systemPrompt;
    const model = options?.model || this.defaultModel;
    const maxTokens = options?.maxTokens || this.defaultMaxTokens;

    const anthropicMessages = this.convertMessages(messages);

    const params: Anthropic.MessageStreamParams = {
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      system: systemPrompt,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
    }

    // 使用流式响应
    const stream = this.client.messages.stream(params);

    let fullContent = '';
    const toolCalls: Map<string, { name: string; input: string }> = new Map();

    // 处理流事件
    if (onChunk) {
      stream.on('text', (text) => {
        fullContent += text;
        onChunk(text);
      });
    }

    const finalMessage = await stream.finalMessage();
    return this.parseResponse(finalMessage);
  }

  /**
   * 转换消息格式
   */
  private convertMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
    const result: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        // 普通文本消息
        result.push({
          role: msg.role,
          content: msg.content
        });
      } else {
        // 工具调用消息
        const contentBlocks: (Anthropic.ToolUseBlockParam | Anthropic.ToolResultBlockParam)[] = [];

        for (const item of msg.content) {
          // 检查是 tool_result 格式还是旧的 ToolCall 格式
          const isToolResult = (item as any).type === 'tool_result';

          if (msg.role === 'assistant') {
            // Assistant 的工具调用
            const tc = item as ToolCall;
            contentBlocks.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input
            });
          } else {
            // User 的工具结果
            if (isToolResult) {
              // 新的 tool_result 格式
              const toolResult = item as any;
              contentBlocks.push({
                type: 'tool_result',
                tool_use_id: toolResult.tool_use_id,
                content: toolResult.content || ''
              });
            } else {
              // 旧的 ToolCall 格式（兼容）
              const tc = item as ToolCall & { output?: string; success?: boolean };
              contentBlocks.push({
                type: 'tool_result',
                tool_use_id: tc.id,
                content: tc.output || JSON.stringify(tc.input)
              });
            }
          }
        }

        result.push({
          role: msg.role,
          content: contentBlocks
        });
      }
    }

    return result;
  }

  /**
   * 解析 Anthropic 响应
   */
  private parseResponse(response: Anthropic.Message): LLMResponse {
    const contentBlocks = response.content;
    let textContent = '';
    const toolCalls: ToolCall[] = [];

    for (const block of contentBlocks) {
      if (block.type === 'text') {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>
        });
      }
    }

    return {
      content: textContent,
      toolCalls,
      stopReason: response.stop_reason || undefined
    };
  }
}

/**
 * 创建 Anthropic Provider 实例
 */
export function createAnthropicProvider(
  apiKey: string,
  options?: { model?: string; maxTokens?: number }
): LLMProvider {
  return new AnthropicProvider(apiKey, options);
}

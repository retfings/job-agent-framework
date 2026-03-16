/**
 * LLM 相关类型定义
 */

import type { MessageParam, ToolUseParam, ToolResultParam } from '@anthropic-ai/sdk/resources/messages';

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant';

/**
 * 工具调用请求
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * LLM 消息
 */
export interface LLMMessage {
  role: MessageRole;
  content: string | ToolCall[];
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * LLM 响应
 */
export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  stopReason?: string;
}

/**
 * LLM Provider 接口
 */
export interface LLMProvider {
  /**
   * 发送消息并获取响应
   */
  sendMessage(
    messages: LLMMessage[],
    tools?: ToolDefinition[],
    options?: LLMOptions
  ): Promise<LLMResponse>;

  /**
   * 流式响应
   */
  streamSendMessage(
    messages: LLMMessage[],
    tools?: ToolDefinition[],
    options?: LLMOptions,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse>;
}

/**
 * LLM 选项
 */
export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  baseURL?: string;
}

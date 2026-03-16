/**
 * Agent 类型定义
 */

import type { LLMMessage, ToolCall } from '../llm/types.js';
import type { ToolResult } from '../tools/types.js';

/**
 * Agent 配置
 */
export interface AgentConfig {
  /** LLM API Key */
  apiKey: string;
  /** 模型名称 */
  model?: string;
  /** 系统提示词 */
  systemPrompt?: string;
  /** 最大迭代次数（防止无限循环）*/
  maxIterations?: number;
  /** 工作目录 */
  workingDirectory?: string;
  /** API 基础 URL */
  baseURL?: string;
}

/**
 * Agent 运行状态
 */
export interface AgentState {
  /** 对话历史 */
  messages: LLMMessage[];
  /** 当前迭代次数 */
  iterationCount: number;
  /** 是否正在运行 */
  isRunning: boolean;
  /** 累计工具调用次数 */
  toolCallCount: number;
}

/**
 * Agent 事件
 */
export type AgentEventType =
  | 'message'         // 收到用户消息
  | 'thinking'       // 开始思考
  | 'tool_call'      // 调用工具
  | 'tool_result'    // 工具执行结果
  | 'response'       // 生成响应
  | 'error'          // 发生错误
  | 'complete';      // 完成

export interface AgentEvent {
  type: AgentEventType;
  data: unknown;
  timestamp: number;
}

/**
 * Agent 事件回调
 */
export type AgentEventHandler = (event: AgentEvent) => void;

/**
 * Agent 接口
 */
export interface Agent {
  /**
   * 发送消息并获取响应
   */
  sendMessage(message: string): Promise<string>;

  /**
   * 获取当前状态
   */
  getState(): AgentState;

  /**
   * 重置状态
   */
  reset(): void;

  /**
   * 注册事件处理器
   */
  on(event: AgentEventType, handler: AgentEventHandler): void;
}

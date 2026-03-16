/**
 * Tool 系统类型定义
 */

import type { ToolDefinition } from '../llm/types.js';

/**
 * 工具执行结果
 */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * 工具执行上下文
 */
export interface ToolContext {
  workingDirectory: string;
  [key: string]: unknown;
}

/**
 * 工具基类接口
 */
export interface Tool {
  /**
   * 工具名称（用于 LLM 识别）
   */
  name: string;

  /**
   * 工具描述（帮助 LLM 理解何时使用）
   */
  description: string;

  /**
   * 工具输入 Schema（JSON Schema 格式）
   */
  inputSchema: ToolDefinition['input_schema'];

  /**
   * 执行工具
   */
  execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;

  /**
   * 获取工具定义（用于注册到 LLM）
   */
  getDefinition(): ToolDefinition;
}

/**
 * 工具注册表接口
 */
export interface ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  getAll(): Tool[];
  getDefinitions(): ToolDefinition[];
}

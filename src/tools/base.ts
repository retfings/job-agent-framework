/**
 * Tool 基类
 *
 * 所有具体工具都应该继承这个基类
 */

import type { Tool, ToolResult, ToolContext, ToolDefinition } from './types.js';

export abstract class BaseTool implements Tool {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: ToolDefinition['input_schema'];

  /**
   * 获取工具定义
   */
  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      input_schema: this.inputSchema
    };
  }

  /**
   * 执行工具 - 子类必须实现
   */
  abstract execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult>;

  /**
   * 辅助方法：验证必需参数
   */
  protected requireParams(params: Record<string, unknown>, required: string[]): void {
    const missing = required.filter(key => !(key in params));
    if (missing.length > 0) {
      throw new Error(`缺少必需参数：${missing.join(', ')}`);
    }
  }

  /**
   * 辅助方法：安全地获取字符串参数
   */
  protected getStringParam(params: Record<string, unknown>, key: string): string {
    const value = params[key];
    if (typeof value !== 'string') {
      throw new Error(`参数 ${key} 必须是字符串`);
    }
    return value;
  }

  /**
   * 辅助方法：安全地获取对象参数
   */
  protected getObjectParam(params: Record<string, unknown>, key: string): Record<string, unknown> {
    const value = params[key];
    if (typeof value !== 'object' || value === null) {
      throw new Error(`参数 ${key} 必须是对象`);
    }
    return value as Record<string, unknown>;
  }
}

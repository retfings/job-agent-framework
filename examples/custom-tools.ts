/**
 * 示例：创建自定义工具
 *
 * 这个文件展示了如何创建和注册自定义工具
 */

import { BaseTool } from '../tools/base.js';
import type { ToolResult, ToolContext } from '../tools/types.js';

/**
 * 示例 1: 简单的计算工具
 */
export class CalculateTool extends BaseTool {
  name = 'calculate';
  description = '执行数学计算并返回结果';
  inputSchema = {
    type: 'object' as const,
    properties: {
      expression: {
        type: 'string',
        description: '要计算的数学表达式，例如 "2 + 2" 或 "Math.sqrt(16)"'
      }
    },
    required: ['expression']
  };

  async execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const expression = this.getStringParam(params, 'expression');

      // 安全地计算表达式（只允许数学计算）
      // 注意：生产环境中应该使用更安全的解析器
      const result = Function(`"use strict"; return (${expression})`)();

      return {
        success: true,
        output: `计算结果：${result}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        error: `计算失败：${errorMessage}`
      };
    }
  }
}

/**
 * 示例 2: HTTP 请求工具
 */
export class HttpTool extends BaseTool {
  name = 'http_request';
  description = '发送 HTTP 请求并获取响应';
  inputSchema = {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: '请求的 URL'
      },
      method: {
        type: 'string',
        description: 'HTTP 方法',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      headers: {
        type: 'object',
        description: '请求头'
      },
      body: {
        type: 'string',
        description: '请求体（JSON 字符串）'
      }
    },
    required: ['url']
  };

  async execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const url = this.getStringParam(params, 'url');
      const method = (params.method as string) || 'GET';
      const headers = (params.headers as Record<string, string>) || {};
      const body = params.body as string | undefined;

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (body && method !== 'GET') {
        options.body = body;
      }

      const response = await fetch(url, options);
      const data = await response.text();

      return {
        success: true,
        output: `状态码：${response.status}\n\n${data}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        error: `HTTP 请求失败：${errorMessage}`
      };
    }
  }
}

/**
 * 示例 3: 读取环境变量工具
 */
export class EnvTool extends BaseTool {
  name = 'get_env';
  description = '获取环境变量的值';
  inputSchema = {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: '环境变量名称'
      }
    },
    required: ['name']
  };

  async execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const name = this.getStringParam(params, 'name');
      const value = process.env[name];

      if (value === undefined) {
        return {
          success: true,
          output: `环境变量 "${name}" 未设置`
        };
      }

      return {
        success: true,
        output: `${name}=${value}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        error: `获取环境变量失败：${errorMessage}`
      };
    }
  }
}

/**
 * 使用示例：注册自定义工具
 *
 * ```typescript
 * import { ToolRegistry } from './tools/registry.js';
 * import { CalculateTool, HttpTool, EnvTool } from './examples/custom-tools.js';
 *
 * const registry = new ToolRegistry();
 *
 * // 注册内置工具
 * registry.register(new ReadFileTool());
 * registry.register(new WriteFileTool());
 *
 * // 注册自定义工具
 * registry.register(new CalculateTool());
 * registry.register(new HttpTool());
 * registry.register(new EnvTool());
 * ```
 */

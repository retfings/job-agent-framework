/**
 * Tool Registry - 工具注册表
 *
 * 管理所有可用工具的中央注册表
 * 负责工具的注册、查找和获取定义
 */

import type { Tool, ToolRegistry as ToolRegistryInterface } from './types.js';
import type { ToolDefinition } from '../llm/types.js';

export class ToolRegistry implements ToolRegistryInterface {
  private tools: Map<string, Tool> = new Map();

  /**
   * 注册一个工具
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`⚠️  工具 "${tool.name}" 已存在，将被覆盖`);
    }
    this.tools.set(tool.name, tool);
    console.log(`✅ 工具已注册：${tool.name}`);
  }

  /**
   * 获取指定名称的工具
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有已注册的工具
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取所有工具的定义（用于 LLM）
   */
  getDefinitions(): ToolDefinition[] {
    return this.getAll().map(tool => tool.getDefinition());
  }

  /**
   * 执行工具
   */
  async executeTool(
    name: string,
    params: Record<string, unknown>,
    context: { workingDirectory: string }
  ): Promise<string> {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`未知的工具：${name}`);
    }

    console.log(`🔧 执行工具：${name}`);
    const result = await tool.execute(params, context);

    if (result.success) {
      console.log(`✅ 工具执行成功`);
    } else {
      console.log(`❌ 工具执行失败：${result.error}`);
    }

    return result.success ? result.output : `错误：${result.error}`;
  }
}

/**
 * 创建默认的工具注册表并注册所有内置工具
 */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // 导入并注册所有内置工具
  import('./read.js').then(({ ReadFileTool }) => {
    registry.register(new ReadFileTool());
  });

  import('./write.js').then(({ WriteFileTool }) => {
    registry.register(new WriteFileTool());
  });

  import('./bash.js').then(({ BashTool }) => {
    registry.register(new BashTool());
  });

  import('./search.js').then(({ SearchFileTool }) => {
    registry.register(new SearchFileTool());
  });

  return registry;
}

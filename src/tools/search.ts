/**
 * Search File Tool - 搜索文件
 *
 * 允许 AI 搜索符合条件的文件，用于探索项目结构
 */

import { BaseTool } from './base.js';
import type { ToolResult, ToolContext } from './types.js';
import { join } from 'path';

// 动态导入 glob 以支持 CommonJS
let _glob: typeof import('glob').glob;
async function getGlob() {
  if (!_glob) {
    const globModule = await import('glob');
    _glob = globModule.glob;
  }
  return _glob;
}

export class SearchFileTool extends BaseTool {
  name = 'search_files';
  description = '搜索匹配模式的文件。用于查找项目中的特定文件、探索目录结构或定位代码。支持 glob 模式匹配。';
  inputSchema = {
    type: 'object' as const,
    properties: {
      pattern: {
        type: 'string',
        description: 'glob 搜索模式，例如 "*.ts" 或 "**/*.test.ts"'
      },
      maxResults: {
        type: 'number',
        description: '最大返回结果数量，默认 100'
      }
    },
    required: ['pattern']
  };

  async execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const pattern = this.getStringParam(params, 'pattern');
      const maxResults = (params.maxResults as number) || 100;

      const glob = await getGlob();
      const files = await glob(pattern, {
        cwd: context.workingDirectory,
        nodir: true,
        limit: maxResults
      });

      if (files.length === 0) {
        return {
          success: true,
          output: '未找到匹配的文件'
        };
      }

      return {
        success: true,
        output: `找到 ${files.length} 个文件:\n${files.map(f => `  - ${f}`).join('\n')}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        error: `搜索文件失败：${errorMessage}`
      };
    }
  }
}

/**
 * Write File Tool - 写入文件内容
 *
 * 允许 AI 创建或修改文件，是实现代码生成和修改的核心工具
 */

import { BaseTool } from './base.js';
import type { ToolResult, ToolContext } from './types.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export class WriteFileTool extends BaseTool {
  name = 'write_file';
  description = '写入内容到文件。可以用于创建新文件、修改现有文件或覆盖现有内容。如果文件已存在，将被完全替换。';
  inputSchema = {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: '文件的路径（可以是绝对路径或相对于工作目录的路径）'
      },
      content: {
        type: 'string',
        description: '要写入文件的完整内容'
      },
      encoding: {
        type: 'string',
        description: '文件编码，默认为 utf-8'
      }
    },
    required: ['path', 'content']
  };

  async execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const filePath = this.getStringParam(params, 'path');
      const content = this.getStringParam(params, 'content');
      const encoding = (params.encoding as string) || 'utf-8';

      // 如果是相对路径，则相对于工作目录
      const fullPath = filePath.startsWith('/')
        ? filePath
        : join(context.workingDirectory, filePath);

      // 确保目录存在
      const dir = dirname(fullPath);
      await mkdir(dir, { recursive: true });

      // 写入文件
      await writeFile(fullPath, content, { encoding: encoding as BufferEncoding });

      // 计算行数
      const lines = content.split('\n').length;

      return {
        success: true,
        output: `文件写入成功：${fullPath} (${lines} 行)`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        error: `写入文件失败：${errorMessage}`
      };
    }
  }
}

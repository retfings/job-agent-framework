/**
 * Read File Tool - 读取文件内容
 *
 * 这是 Code Agent 最基础也是最重要的工具之一
 * 允许 AI 读取项目中的文件内容来理解代码
 */

import { BaseTool } from './base.js';
import type { ToolResult, ToolContext } from './types.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class ReadFileTool extends BaseTool {
  name = 'read_file';
  description = '读取文件的内容。用于查看现有代码、配置文件或其他文本文件的内容。';
  inputSchema = {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: '文件的路径（可以是绝对路径或相对于工作目录的路径）'
      },
      encoding: {
        type: 'string',
        description: '文件编码，默认为 utf-8'
      }
    },
    required: ['path']
  };

  async execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const filePath = this.getStringParam(params, 'path');
      const encoding = (params.encoding as string) || 'utf-8';

      // 如果是相对路径，则相对于工作目录
      const fullPath = filePath.startsWith('/')
        ? filePath
        : join(context.workingDirectory, filePath);

      const content = await readFile(fullPath, { encoding: encoding as BufferEncoding });

      // 添加行数信息
      const lines = content.split('\n');
      const numberedContent = lines
        .map((line, index) => `${String(index + 1).padStart(4)} | ${line}`)
        .join('\n');

      return {
        success: true,
        output: `文件内容 (${lines.length} 行):\n${numberedContent}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        error: `读取文件失败：${errorMessage}`
      };
    }
  }
}

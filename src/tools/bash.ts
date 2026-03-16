/**
 * Bash Tool - 执行 shell 命令
 *
 * 允许 AI 在终端执行命令，用于运行测试、构建项目、安装依赖等
 *
 * ⚠️ 安全提示：这个工具具有强大的能力，应该谨慎使用
 * 在生产环境中可能需要添加安全限制（如禁止某些命令）
 */

import { BaseTool } from './base.js';
import type { ToolResult, ToolContext } from './types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BashTool extends BaseTool {
  name = 'bash';
  description = '在终端执行 shell 命令。用于运行测试、构建、安装依赖、git 操作等。命令在工作目录下执行。';
  inputSchema = {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        description: '要执行的完整 shell 命令'
      },
      description: {
        type: 'string',
        description: '对命令用途的简短描述（用于向用户说明将要做什么）'
      }
    },
    required: ['command']
  };

  async execute(
    params: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const command = this.getStringParam(params, 'command');
      const description = params.description as string | undefined;

      // 显示命令描述（如果有）
      if (description) {
        console.log(`📋 执行：${description}`);
      }
      console.log(`💻 命令：${command}`);

      // 执行命令
      const { stdout, stderr } = await execAsync(command, {
        cwd: context.workingDirectory,
        maxBuffer: 10 * 1024 * 1024, // 10MB 缓冲区
        encoding: 'utf-8'
      });

      let output = stdout;
      if (stderr) {
        output += output ? `\n--- STDERR ---\n${stderr}` : stderr;
      }

      return {
        success: true,
        output: output || '(无输出)'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // exec 错误包含额外的信息
      if (error && typeof error === 'object' && 'code' in error) {
        const execError = error as { code?: number | string; stdout?: string; stderr?: string };
        let details = `退出码：${execError.code}`;
        if (execError.stdout) details += `\n输出：${execError.stdout}`;
        if (execError.stderr) details += `\n错误：${execError.stderr}`;
        return {
          success: false,
          output: '',
          error: `${errorMessage}\n${details}`
        };
      }
      return {
        success: false,
        output: '',
        error: `执行命令失败：${errorMessage}`
      };
    }
  }
}

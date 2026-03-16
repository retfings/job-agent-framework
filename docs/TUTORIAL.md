# Code Agent CLI 教程

## 第一课：理解 Code Agent 的工作原理

Code Agent（代码智能体）是一种能够理解自然语言指令并执行编程任务的 AI 系统。

### 核心组件

1. **LLM (大语言模型)** - 思考引擎
   - 理解用户指令
   - 决定使用哪些工具
   - 生成响应

2. **Tools (工具)** - 执行能力
   - 读取文件
   - 写入文件
   - 执行命令
   - 搜索文件

3. **Agent (代理)** - 协调者
   - 管理对话历史
   - 控制执行循环
   - 处理工具调用

### 工作流程

```
用户："帮我创建一个 TypeScript 项目"
         ↓
Agent 将请求发送给 LLM
         ↓
LLM 分析并决定使用 write_file 工具
         ↓
Agent 执行 write_file 工具
         ↓
工具返回执行结果
         ↓
LLM 确认任务完成
         ↓
Agent 向用户返回最终响应
```

## 第二课：工具系统详解

### 工具的结构

每个工具由以下部分组成：

1. **name** - 工具的唯一标识
2. **description** - 描述工具的用途（LLM 用它来决定何时使用）
3. **inputSchema** - JSON Schema 格式的参数定义
4. **execute** - 实际执行的逻辑

### 示例：创建自定义工具

```typescript
import { BaseTool } from './tools/base.js';

// 创建一个计算工具
class CalculateTool extends BaseTool {
  name = 'calculate';
  description = '执行数学计算';
  inputSchema = {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '要计算的数学表达式'
      }
    },
    required: ['expression']
  };

  async execute(params, context) {
    try {
      const result = eval(params.expression); // 注意：生产环境不要用 eval
      return {
        success: true,
        output: `计算结果：${result}`
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }
}
```

## 第三课：实战 - 添加新工具

让我们添加一个列出目录内容的工具：

```typescript
// src/tools/list.ts
import { BaseTool } from './base.js';
import { readdir } from 'fs/promises';
import { join } from 'path';

export class ListDirectoryTool extends BaseTool {
  name = 'list_directory';
  description = '列出目录中的文件和子目录';
  inputSchema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '目录路径'
      }
    },
    required: ['path']
  };

  async execute(params, context) {
    const dirPath = this.getStringParam(params, 'path');
    const fullPath = dirPath.startsWith('/')
      ? dirPath
      : join(context.workingDirectory, dirPath);

    const entries = await readdir(fullPath, { withFileTypes: true });

    const output = entries
      .map(e => e.isDirectory() ? `📁 ${e.name}/` : `📄 ${e.name}`)
      .join('\n');

    return { success: true, output };
  }
}
```

然后在注册表中注册：

```typescript
import { ListDirectoryTool } from './tools/list.js';

const registry = new ToolRegistry();
registry.register(new ListDirectoryTool());
```

## 第四课：理解 Agent 循环

Agent 的核心是一个循环：

```typescript
async sendMessage(message: string): Promise<string> {
  // 1. 添加用户消息到历史
  this.messages.push({ role: 'user', content: message });

  while (true) {
    // 2. 调用 LLM
    const response = await this.llm.sendMessage(this.messages, tools);

    // 3. 检查是否有工具调用
    if (response.toolCalls.length > 0) {
      // 4. 执行工具
      for (const toolCall of response.toolCalls) {
        const result = await this.executeTool(toolCall);
      }
      // 5. 继续循环
      continue;
    }

    // 6. 没有工具调用，返回文本响应
    return response.content;
  }
}
```

## 作业

1. 创建一个 `git` 工具，支持执行 git 命令
2. 创建一个 `explain` 工具，用于解释代码
3. 修改系统提示词，让 Agent 有不同的行为风格

## 下一步

阅读 `docs/ARCHITECTURE.md` 了解更多架构细节。

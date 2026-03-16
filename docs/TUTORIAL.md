# YOLO 教程 - 理解 Vibe Coding

## 什么是 Vibe Coding？

**Vibe Coding** 是一种全新的编程范式：你用自然语言描述想要什么，AI 帮你写代码。你负责"感觉"（vibe）—— 知道什么是对的，什么是错的 —— 而 AI 负责具体的实现细节。

YOLO 就是为实现 Vibe Coding 而生的工具。它让你像与同事聊天一样与 AI 协作，完成编程任务。

---

## 第一课：理解 Code Agent 的工作原理

Code Agent（代码智能体）是一种能够理解自然语言指令并执行编程任务的 AI 系统。

### 核心组件

```
┌─────────────────────────────────────────────────────────┐
│                     YOLO 系统                            │
│                                                         │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐     │
│  │    CLI    │ →   │   Agent   │ →   │   Tools   │     │
│  │  用户界面  │     │   大脑    │     │   双手    │     │
│  └───────────┘     └───────────┘     └───────────┘     │
│                        ↓                                │
│                  ┌───────────┐                          │
│                  │   LLM     │                          │
│                  │  思考引擎  │                          │
│                  └───────────┘                          │
└─────────────────────────────────────────────────────────┘
```

1. **CLI 层** - 用户界面
   - 接收用户输入
   - 显示 AI 响应
   - 支持多种交互模式

2. **Agent 层** - 系统的大脑
   - 理解用户意图
   - 调用 LLM 进行决策
   - 管理对话历史
   - 控制执行循环

3. **LLM 层** - 思考引擎
   - 理解自然语言
   - 决定使用哪些工具
   - 生成响应内容

4. **Tools 层** - 系统的双手
   - `read_file` - 读取文件
   - `write_file` - 写入文件
   - `bash` - 执行命令
   - `search_files` - 搜索文件

### 工作流程

```
用户："帮我创建一个 TypeScript 项目"
         ↓
Agent 将请求发送给 LLM（附带工具列表）
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

---

## 第二课：工具系统详解

### 工具的结构

每个工具由以下部分组成：

| 部分 | 作用 | 示例 |
|-----|------|------|
| `name` | 工具的唯一标识 | `'read_file'` |
| `description` | 描述工具用途（LLM 用它决定何时使用） | `'读取文件内容...'` |
| `inputSchema` | JSON Schema 格式的参数定义 | `{ type: 'object', ... }` |
| `execute` | 实际执行的逻辑 | `async execute(params, context)` |

### 示例：创建自定义工具

```typescript
import { BaseTool } from './tools/base.js';
import type { ToolResult, ToolContext } from './types.js';

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

  async execute(params, context): Promise<ToolResult> {
    try {
      const result = eval(params.expression);
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

### 在注册表中注册

```typescript
// src/tools/registry.ts
import { CalculateTool } from './calculate.js';

export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // ... 注册其他工具

  registry.register(new CalculateTool());

  return registry;
}
```

---

## 第三课：实战 - 添加新工具

让我们添加一个列出目录内容的工具：

### 步骤 1: 创建工具文件

```typescript
// src/tools/list.ts
import { BaseTool } from './base.js';
import type { ToolResult, ToolContext } from './types.js';
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

  async execute(params, context): Promise<ToolResult> {
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

### 步骤 2: 在 registry.ts 中注册

```typescript
// 在 createDefaultRegistry() 中添加
import('./list.js').then(({ ListDirectoryTool }) => {
  registry.register(new ListDirectoryTool());
});
```

### 步骤 3: 测试新工具

```bash
yolo run "列出当前目录的内容"
```

---

## 第四课：理解 Agent 循环

Agent 的核心是一个思考 - 行动的循环：

### 代码实现

```typescript
// src/agent/code-agent.ts
async sendMessage(message: string): Promise<string> {
  // 1. 添加用户消息到历史
  this.state.messages.push({
    role: 'user',
    content: message
  });

  // 2. 进入主循环
  while (this.state.isRunning) {
    // 3. 调用 LLM
    const response = await this.llmProvider.sendMessage(
      this.state.messages,
      this.toolRegistry.getDefinitions(),
      { systemPrompt: this.config.systemPrompt }
    );

    // 4. 处理响应
    if (response.toolCalls.length > 0) {
      // 有工具调用，执行它们
      for (const toolCall of response.toolCalls) {
        const result = await this.toolRegistry.executeTool(
          toolCall.name,
          toolCall.input,
          { workingDirectory: this.config.workingDirectory }
        );

        // 将结果添加到消息历史
        this.state.messages.push({
          role: 'user',
          content: [{ type: 'tool_result', ... }]
        });
      }
      // 继续循环
      continue;
    }

    // 5. 没有工具调用，返回文本响应
    return response.content;
  }
}
```

### 循环图解

```
┌─────────────────────┐
│   用户发送消息       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 添加到消息历史       │
│ messages.push(...)  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 调用 LLM             │
│ - 发送历史消息       │
│ - 发送工具定义       │
└──────────┬──────────┘
           ↓
    ┌──────┴──────┐
    ↓             ↓
┌─────────┐   ┌─────────┐
│ 有工具  │   │ 无工具  │
│ 调用    │   │ 调用    │
└────┬────┘   └────┬────┘
     ↓             ↓
┌─────────┐   ┌─────────┐
│ 执行工具 │   │ 返回    │
│ 添加结果 │   │ 文本    │
│ 到历史   │   │ 响应    │
└────┬────┘   └─────────┘
     │
     └──────→ 继续循环
```

---

## 第五课：事件系统

YOLO 内置了事件系统，让你可以观察 Agent 的执行过程。

### 事件类型

| 事件 | 触发时机 | 数据 |
|-----|---------|------|
| `message` | 收到用户消息 | `{ content: string }` |
| `thinking` | 开始思考 | `{ iteration: number }` |
| `response` | LLM 返回文本 | `{ content: string }` |
| `tool_call` | 调用工具 | `{ toolCall: ToolCall }` |
| `tool_result` | 工具执行完成 | `{ toolCallId, result }` |
| `complete` | 任务完成 | `{ finalResponse: string }` |
| `error` | 发生错误 | `{ error: string }` |

### 使用示例

```typescript
const agent = createAgent({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN!,
  model: 'claude-sonnet-4-20250514'
});

// 监听所有事件
agent.on('thinking', (event) => {
  console.log(`🤔 思考中... (第 ${event.data.iteration} 次)`);
});

agent.on('tool_call', (event) => {
  const { name, input } = event.data.toolCall;
  console.log(`🔧 调用工具：${name}`);
});

agent.on('tool_result', (event) => {
  console.log(`✅ 工具执行完成`);
});

agent.on('complete', (event) => {
  console.log(`🎉 任务完成！`);
  console.log(event.data.finalResponse);
});

// 发送消息
await agent.sendMessage('创建一个 hello world 程序');
```

---

## 第六课：系统提示词

系统提示词是 Agent 行为的指南。你可以在创建 Agent 时自定义它。

### 默认系统提示词

```typescript
const DEFAULT_SYSTEM_PROMPT = `你是一个智能编程助手，类似于 Claude Code。你可以帮助用户：

- 编写和修改代码
- 执行 shell 命令
- 搜索和读取文件
- 调试和解决问题

你拥有以下工具：
- read_file: 读取文件内容
- write_file: 创建或修改文件
- bash: 执行 shell 命令
- search_files: 搜索文件

使用工具的指南：
1. 在修改文件之前，先读取并理解现有代码
2. 执行可能影响系统的命令前，向用户说明将要做什么
3. 如果不确定文件路径，先使用 search_files 搜索
4. 保持代码简洁、清晰，遵循最佳实践
5. 每次只做必要的更改，不要过度工程化`;
```

### 自定义系统提示词

```typescript
const agent = createAgent({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN!,
  systemPrompt: `你是一个专业的 Python 开发者助手。

你擅长：
- Django/Flask Web 开发
- 数据分析和机器学习
- 自动化脚本

在编写代码时：
- 总是使用类型注解
- 添加详细的文档字符串
- 遵循 PEP 8 规范`
});
```

---

## 作业

1. **创建一个 `git` 工具**，支持执行 git 命令：
   ```typescript
   class GitTool extends BaseTool {
     name = 'git';
     description = '执行 git 命令';
     inputSchema = {
       type: 'object',
       properties: {
         command: { type: 'string', description: 'git 命令' }
       }
     };
     // ...
   }
   ```

2. **创建一个 `explain` 工具**，用于解释代码

3. **修改系统提示词**，让 Agent 有不同的行为风格（例如：更简洁、更详细、更注重安全等）

---

## 下一步

- 阅读 [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) 了解完整的架构细节
- 查看源码 `src/agent/code-agent.ts` 理解核心实现
- 开始你的第一个 Vibe Coding 项目！

---

## 常见问题

### Q: 如何查看调试信息？

A: 监听所有事件：
```typescript
agent.on('*', (event) => {
  console.log(event.type, event.data);
});
```

### Q: 如何限制 Agent 的权限？

A: 在 ToolContext 中添加权限检查：
```typescript
async execute(params, context) {
  if (!context.permissions?.includes('bash')) {
    return { success: false, error: '无权限执行命令' };
  }
}
```

### Q: 如何让 Agent 记住之前的对话？

A: AgentState 会自动维护消息历史，你只需要复用同一个 Agent 实例即可。

# YOLO 架构文档

## 总体架构

YOLO 是一个 AI 驱动的代码助手，采用分层架构设计，灵感来自 Claude Code。系统通过工具调用（Tool Calling）机制，让大语言模型能够理解和执行编程任务。

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI 用户界面层                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   chat 模式  │  │   run 模式   │  │  demo 模式   │          │
│  │  (交互式)    │  │  (单次任务)  │  │  (演示)      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Agent 层                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    CodeAgent                        │    │
│  │  - 管理对话历史 (AgentState)                         │    │
│  │  - 控制执行循环 (sendMessage → processResponse)      │    │
│  │  - 协调工具调用 (事件系统)                            │    │
│  │  - 系统提示词管理                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        工具层                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 ToolRegistry                        │    │
│  │  - 工具注册/查找/执行                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  read    │ │  write   │ │   bash   │ │  search  │       │
│  │  file    │ │  file    │ │  tool    │ │  files   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       LLM Provider 层                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               AnthropicProvider                     │    │
│  │  - 消息格式转换 (LLMMessage ↔ Anthropic)             │    │
│  │  - API 调用 (sendMessage / streamSendMessage)        │    │
│  │  - 响应解析 (文本/工具调用)                           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Anthropic API / DashScope                │
│              (Claude / Qwen 等大模型)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 项目结构

```
yolo/
├── src/
│   ├── index.ts              # 入口文件
│   ├── agent/                # Agent 层
│   │   ├── index.ts          # 统一导出
│   │   ├── code-agent.ts     # CodeAgent 核心实现（"大脑"）
│   │   └── types.ts          # Agent 类型定义
│   │
│   ├── llm/                  # LLM Provider 层
│   │   ├── index.ts          # 统一导出
│   │   ├── provider.ts       # 导出 AnthropicProvider
│   │   ├── anthropic.ts      # Anthropic SDK 封装
│   │   └── types.ts          # LLM 类型定义
│   │
│   ├── tools/                # 工具层
│   │   ├── index.ts          # 统一导出
│   │   ├── base.ts           # BaseTool 基类
│   │   ├── types.ts          # Tool 类型定义
│   │   ├── registry.ts       # ToolRegistry 注册表
│   │   ├── read.ts           # read_file 工具
│   │   ├── write.ts          # write_file 工具
│   │   ├── bash.ts           # bash 工具
│   │   └── search.ts         # search_files 工具
│   │
│   └── cli/                  # CLI 用户界面层
│       ├── index.ts          # 统一导出
│       ├── commands.ts       # commander 命令定义
│       ├── interactive.ts    # 交互式 UI
│       ├── output.ts         # 输出格式化
│       └── modes/            # 运行模式
│           ├── index.ts
│           ├── chat.ts       # 聊天模式
│           ├── run.ts        # 单次任务模式
│           └── demo.ts       # 演示模式
│
├── docs/
│   ├── ARCHITECTURE.md       # 架构文档（本文件）
│   └── TUTORIAL.md           # 教程文档
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## 核心模块详解

### 1. Agent 层 - 系统的大脑

**职责**: 接收用户输入、调用 LLM、执行工具调用、循环直到任务完成

**核心文件**: `src/agent/code-agent.ts`

#### 核心类：CodeAgent

```typescript
class CodeAgent implements Agent {
  // 主循环入口
  async sendMessage(message: string): Promise<string>

  // 处理 LLM 响应
  private async processResponse(response: LLMResponse)

  // 事件系统
  on(event: AgentEventType, handler: Handler)
}
```

#### Agent 执行流程

```
用户输入
   ↓
添加消息到历史 (AgentState.messages)
   ↓
┌──────────────────────────────┐
│      主循环 (while 运行)      │
│                              │
│  1. 调用 LLM Provider         │
│     sendMessage(messages,    │
│                tools)        │
│                              │
│  2. 解析响应                  │
│     - 文本内容 → 返回         │
│     - 工具调用 → 执行          │
│                              │
│  3. 执行工具                  │
│     ToolRegistry.execute()   │
│                              │
│  4. 添加工具结果到历史         │
│     messages.push(result)    │
│                              │
│  5. 继续循环                  │
└──────────────────────────────┘
```

#### 事件系统

Agent 通过事件系统让外部可以观察执行过程：

| 事件类型 | 触发时机 | 数据 |
|---------|---------|------|
| `message` | 收到用户消息 | `{ content: string }` |
| `thinking` | 开始思考 | `{ iteration: number }` |
| `response` | LLM 返回文本 | `{ content: string }` |
| `tool_call` | 调用工具 | `{ toolCall: ToolCall }` |
| `tool_result` | 工具执行完成 | `{ toolCallId, result }` |
| `complete` | 任务完成 | `{ finalResponse: string }` |
| `error` | 发生错误 | `{ error: string }` |

---

### 2. LLM Provider 层 - 与大模型通信

**职责**: 封装与 Anthropic API 的交互，处理消息格式转换和响应解析

**核心文件**: `src/llm/anthropic.ts`

#### 核心类：AnthropicProvider

```typescript
class AnthropicProvider implements LLMProvider {
  private client: Anthropic;  // Anthropic SDK 实例

  // 发送消息（支持工具调用）
  async sendMessage(
    messages: LLMMessage[],
    tools?: ToolDefinition[],
    options?: LLMOptions
  ): Promise<LLMResponse>

  // 流式响应
  async streamSendMessage(...)
}
```

#### 消息格式转换

LLM Provider 负责将内部消息格式转换为 Anthropic SDK 格式：

```typescript
// 内部格式
interface LLMMessage {
  role: 'user' | 'assistant';
  content: string | (ToolCall | ToolResult)[];
}

// 转换为 Anthropic 格式
interface AnthropicMessageParam {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}
```

---

### 3. 工具层 - 执行具体操作

**职责**: 提供可执行的工具，让 AI 能够与文件系统、shell 等交互

#### 核心组件

| 组件 | 文件 | 职责 |
|-----|------|------|
| BaseTool | `tools/base.ts` | 工具基类，提供辅助方法 |
| ToolRegistry | `tools/registry.ts` | 工具注册表，管理所有工具 |
| ReadFileTool | `tools/read.ts` | 读取文件内容 |
| WriteFileTool | `tools/write.ts` | 创建/修改文件 |
| BashTool | `tools/bash.ts` | 执行 shell 命令 |
| SearchFileTool | `tools/search.ts` | 搜索文件 |

#### 工具结构

每个工具由以下部分组成：

```typescript
class ReadFileTool extends BaseTool {
  // 1. 工具名称（LLM 用它来识别）
  name = 'read_file';

  // 2. 工具描述（LLM 用它来理解何时使用）
  description = '读取文件的内容...';

  // 3. 输入 Schema（JSON Schema 格式，LLM 用它来生成参数）
  inputSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' },
      encoding: { type: 'string', description: '编码' }
    },
    required: ['path']
  };

  // 4. 执行逻辑
  async execute(params, context): Promise<ToolResult> {
    // ...
  }
}
```

#### ToolRegistry 注册表

```typescript
class ToolRegistry {
  // 注册工具
  register(tool: Tool): void

  // 获取工具
  get(name: string): Tool | undefined

  // 获取所有工具
  getAll(): Tool[]

  // 获取所有工具定义（发给 LLM）
  getDefinitions(): ToolDefinition[]

  // 执行工具
  async executeTool(name, params, context): Promise<ToolResult>
}
```

---

### 4. CLI 层 - 用户界面

**职责**: 提供用户交互界面，支持多种运行模式

**核心文件**: `src/cli/commands.ts`, `src/cli/modes/*.ts`

#### 命令结构

```bash
yolo          # 默认进入 chat 模式
yolo chat     # 显式进入聊天模式
yolo run "任务" # 执行单次任务
yolo demo     # 运行演示
yolo --help   # 查看帮助
```

#### 运行模式

| 模式 | 文件 | 描述 |
|-----|------|------|
| chat | `modes/chat.ts` | 交互式聊天模式，支持多轮对话 |
| run | `modes/run.ts` | 执行单次任务后退出 |
| demo | `modes/demo.ts` | 演示模式，展示工具调用过程 |

---

## 数据流详解

### 完整的数据流

```
┌──────────────┐
│   用户输入    │ "创建一个 TypeScript 项目"
└──────┬───────┘
       ↓
┌─────────────────────────────────────────────┐
│ CLI 层接收并调用 Agent.sendMessage()          │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ Agent 添加用户消息到历史                       │
│ messages.push({ role: 'user', content })   │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ Agent 调用 LLM Provider.sendMessage()        │
│ - 发送 messages                              │
│ - 发送 tools 定义                             │
│ - 发送 systemPrompt                          │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ AnthropicProvider 转换格式并调用 API          │
│ - convertMessages(messages)                 │
│ - client.messages.create(params)            │
│ - parseResponse(response)                   │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ LLM 分析并决定使用工具                        │
│ 响应：{                                      │
│   content: "",                               │
│   toolCalls: [{                              │
│     id: "xxx",                               │
│     name: "write_file",                      │
│     input: { path: "index.ts", ... }         │
│   }]                                         │
│ }                                            │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ Agent.processResponse() 检测到工具调用        │
│ 发射事件：tool_call                         │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ ToolRegistry.executeTool()                   │
│ - 查找工具：registry.get('write_file')       │
│ - 执行：tool.execute(params, context)        │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ 工具返回结果                                  │
│ { success: true, output: '文件写入成功' }    │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ Agent 将工具调用和结果添加到历史               │
│ messages.push({ role: 'assistant',          │
│   content: [toolCall] })                    │
│ messages.push({ role: 'user',               │
│   content: [{ type: 'tool_result', ... }] })│
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ 继续循环，再次调用 LLM                         │
│ LLM 看到工具结果后，决定任务完成                │
│ 响应：{ content: "项目已创建完成",            │
│        toolCalls: [] }                       │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│ Agent 检测到没有工具调用，返回文本响应          │
│ 发射事件：complete                           │
└──────────────┬──────────────────────────────┘
               ↓
┌──────────────┐
│ 返回给用户    │ "项目已创建完成！"
└──────────────┘
```

---

## 扩展指南

### 添加新的 LLM Provider

1. 在 `src/llm/` 创建新的 provider 文件
2. 实现 `LLMProvider` 接口：
   ```typescript
   interface LLMProvider {
     sendMessage(
       messages: LLMMessage[],
       tools?: ToolDefinition[],
       options?: LLMOptions
     ): Promise<LLMResponse>;

     streamSendMessage(...): Promise<LLMResponse>;
   }
   ```
3. 在 `agent/code-agent.ts` 中使用新的 provider

### 添加新工具

1. 创建工具类继承 `BaseTool`：
   ```typescript
   class NewTool extends BaseTool {
     name = 'new_tool';
     description = '描述';
     inputSchema = { /* JSON Schema */ };

     async execute(params, context): Promise<ToolResult> {
       // 实现逻辑
       return { success: true, output: '结果' };
     }
   }
   ```

2. 在 `tools/index.ts` 导出
3. 在 `createDefaultRegistry()` 中注册

### 添加新的运行模式

1. 在 `src/cli/modes/` 创建新文件
2. 实现模式逻辑
3. 在 `commands.ts` 中添加新命令

---

## 核心类型定义速查

### Agent 类型

```typescript
interface Agent {
  sendMessage(message: string): Promise<string>;
  on(event: AgentEventType, handler: Handler): void;
  getState(): AgentState;
  reset(): void;
}

interface AgentState {
  messages: LLMMessage[];
  iterationCount: number;
  isRunning: boolean;
  toolCallCount: number;
}
```

### LLM 类型

```typescript
interface LLMProvider {
  sendMessage(messages, tools?, options?): Promise<LLMResponse>;
}

interface LLMMessage {
  role: 'user' | 'assistant';
  content: string | (ToolCall | ToolResult)[];
}

interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  stopReason?: string;
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}
```

### Tool 类型

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: ToolDefinition['input_schema'];
  execute(params, context): Promise<ToolResult>;
  getDefinition(): ToolDefinition;
}

interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

interface ToolContext {
  workingDirectory: string;
  [key: string]: unknown;
}
```

---

## 最佳实践

1. **工具设计**: 保持单一职责，每个工具只做一件事
2. **错误处理**: 总是返回有意义的错误信息
3. **安全性**: 对危险操作（如 bash）添加确认机制
4. **可观测性**: 使用事件系统记录执行过程
5. **提示词工程**: 编写清晰的系统提示词，指导 AI 行为

---

## 常见问题

### Q: 如何调试 Agent？

A: 监听所有事件：
```typescript
agent.on('*', (event) => {
  console.log(event.type, event.data);
});
```

### Q: 如何限制工具权限？

A: 在工具执行前添加权限检查：
```typescript
async execute(params, context) {
  if (!context.permissions.includes('write')) {
    return { success: false, error: '无权限' };
  }
}
```

### Q: 如何添加记忆功能？

A: 扩展 AgentState，添加长期存储：
```typescript
interface AgentState {
  messages: LLMMessage[];
  memory: Map<string, string>; // 添加记忆
}
```

### Q: 支持哪些模型？

A: 默认支持：
- `claude-sonnet-4-20250514` (默认)
- `claude-opus-4-20250514`
- 通过 DashScope 支持：`qwen3.5-plus` 等

---

## 总结

YOLO 采用清晰的分层架构：

- **CLI 层**: 用户界面，支持多种交互模式
- **Agent 层**: 决策中枢，管理对话和执行循环
- **工具层**: 执行能力，提供文件/命令操作
- **LLM 层**: 智能引擎，理解指令并决策

这种设计使得系统易于理解、易于扩展，开发者可以快速添加新的工具或替换 LLM Provider。

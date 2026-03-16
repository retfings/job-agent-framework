# 快速开始指南

## 5 分钟上手 Code Agent CLI

### 前置要求

- Node.js >= 18
- API Key (阿里云 DashScope 或 Anthropic)

### 步骤 1: 安装依赖

```bash
npm install
```

### 步骤 2: 设置环境变量

根据你的 API 提供商选择配置：

#### 使用阿里云 DashScope API

```bash
# Linux/Mac
export ANTHROPIC_AUTH_TOKEN="sk-xxx"
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export ANTHROPIC_MODEL="qwen3.5-plus"

# Windows PowerShell
$env:ANTHROPIC_AUTH_TOKEN="sk-xxx"
$env:ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
$env:ANTHROPIC_MODEL="qwen3.5-plus"
```

#### 使用 Anthropic 原生 API

```bash
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

### 步骤 3: 运行

```bash
# 查看演示
npm run dev demo

# 进入交互式聊天
npm run dev chat

# 执行单个任务
npm run dev run "帮我创建一个 hello world 函数"
```

## 使用示例

### 示例 1: 创建文件

```
> 帮我创建一个 TypeScript 函数，计算两个数的和

💻 使用工具：write_file
   路径：src/add.ts
   内容：export function add(a: number, b: number): number { ... }

✅ 文件创建成功！
```

### 示例 2: 读取并分析代码

```
> 读取 src/index.ts 并解释它的作用

📖 使用工具：read_file
   路径：src/index.ts

🤔 思考中...

这个文件是项目的入口...
```

### 示例 3: 执行命令

```
> 运行测试

💻 使用工具：bash
   命令：npm test

✅ 测试通过！
```

## 命令参考

| 命令 | 描述 |
|------|------|
| `chat` | 交互式聊天模式 |
| `run <task>` | 执行单个任务 |
| `demo` | 运行演示 |
| `help` | 显示帮助 |

## 选项

| 选项 | 描述 |
|------|------|
| `-m, --model` | 指定模型名称 |
| `-d, --dir` | 指定工作目录 |

## 下一步

- 阅读 `docs/TUTORIAL.md` 学习工作原理
- 阅读 `docs/ARCHITECTURE.md` 了解架构设计
- 尝试添加自定义工具

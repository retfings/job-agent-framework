# YOLO

AI 驱动的代码助手，直接进入聊天模式。

## 🚀 快速开始

### 安装

```bash
npm i -g @retfings/yolo
```

### 使用

```bash
# 直接进入聊天模式
yolo

# 查看帮助
yolo --help

# 执行单个任务
yolo run "创建一个 hello world 程序"

# 运行演示
yolo demo
```

### 环境变量设置

#### 使用阿里云 DashScope API

```bash
export ANTHROPIC_AUTH_TOKEN="sk-xxx"
export ANTHROPIC_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export ANTHROPIC_MODEL="qwen3.5-plus"
```

#### 或使用 Anthropic 原生 API

```bash
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

## 📝 许可证

MIT

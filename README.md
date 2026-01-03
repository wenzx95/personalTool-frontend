# PersonalTool Frontend

个人工具集前端 - 基于Vue 3 + TypeScript + Element Plus。

## 技术栈

- Vue 3.4
- TypeScript 5.3
- Vite 5.0
- Element Plus 2.5
- Vue Router 4.2
- Pinia 2.1
- Axios 1.6
- ECharts 5.4

## 功能模块

- 博客系统
- A股复盘系统
- 个人记账工具
- JSON格式化工具

## 快速开始

### 环境要求

- Node.js 18+
- npm/yarn/pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发

```bash
npm run dev
```

访问：http://localhost:3000

### 构建

```bash
npm run build
```

构建产物在 `dist/` 目录。

### Docker构建

```bash
# 构建镜像
docker build -t personalTool-frontend:latest .

# 运行
docker run -p 80:80 personalTool-frontend:latest
```

## 项目结构

```
src/
├── api/              # API请求
│   └── request.ts    # Axios封装
├── views/            # 页面组件
│   ├── BlogView.vue
│   ├── StockView.vue
│   ├── AccountView.vue
│   └── JsonView.vue
├── components/       # 公共组件
├── router/          # 路由配置
├── stores/          # Pinia状态管理
├── App.vue          # 根组件
└── main.ts          # 入口文件
```


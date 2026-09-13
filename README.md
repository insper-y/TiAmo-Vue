# Tiamo AI - Vue3 版本

基于 Vue3 + Vite + Vue Router 重构的 Tiamo AI 数据管理系统前端。

## 技术栈

- **Vue 3.4** - 渐进式 JavaScript 框架
- **Vite 5** - 下一代前端构建工具
- **Vue Router 4** - Vue.js 官方路由
- **Axios** - HTTP 客户端

## 项目结构

```
tiamo-vue/
├── index.html              # 入口 HTML
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根组件
│   ├── router/
│   │   └── index.js        # 路由配置
│   ├── api/
│   │   └── index.js        # API 封装（所有接口）
│   ├── utils/
│   │   └── index.js        # 工具函数（认证、提示、确认框）
│   ├── assets/
│   │   └── css/
│   │       └── global.css  # 全局样式（手机UI卡片式布局）
│   ├── components/
│   │   ├── PageHeader.vue  # 页面头部组件
│   │   └── Pagination.vue  # 分页组件
│   └── views/
│       ├── Login.vue           # 登录页
│       ├── Register.vue        # 注册页（邀请码）
│       ├── ForgotPassword.vue  # 忘记密码（邮箱验证）
│       ├── Dashboard.vue       # 主控制台（所有功能标签页）
│       ├── Logs.vue            # 操作日志
│       └── RunLog.vue          # 运行日志
```

## 功能页面

### 认证相关
- 登录（记住密码、显示/隐藏密码）
- 注册（管理员邀请码，3分钟有效）
- 忘记密码（邮箱验证码，三步流程）

### 主控制台（Dashboard）
- **首页** - 欢迎卡片、常用功能网格、最近活动
- **用户管理**（管理员）- 用户列表、角色切换、状态切换、删除、生成邀请码
- **商品数据** - 商品列表、新增、编辑、删除、搜索、分页
- **回收站** - 已删除商品、恢复、彻底删除、申请恢复/删除
- **数据库管理**（管理员）- 表列表、表结构、备份数据库
- **数据导出** - 用户/商品/操作日志/运行日志的下载和发送邮箱
- **邮件配置**（管理员）- SMTP配置、日报通知开关
- **相册** - 图片/视频上传、分类查看、预览
- **我的申请** - 申请记录、已阅读、清理已读
- **待审批**（管理员）- 审批列表、批量通过/拒绝
- **日志入口** - 操作日志、运行日志跳转

### 独立页面
- **操作日志** - 全局操作记录、筛选、统计、详情、自动刷新、清空
- **运行日志** - 服务器状态监控（CPU/内存/JVM/磁盘/线程/运行时长）、运行日志列表、级别筛选、自动刷新

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式运行（http://localhost:3000）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 部署到 GitHub Pages

1. 构建项目：`npm run build`
2. 将 `dist` 目录内容推送到 GitHub 仓库
3. 启用 GitHub Pages

## API 配置

后端 API 地址在 `src/api/index.js` 中配置：

```javascript
const API_BASE = 'https://tiamo-z.duckdns.org:80'
```

如需修改，请更改此常量。

## 响应式设计

- **手机端（≤768px）**：卡片式布局、底部导航栏、弹窗从底部滑出
- **电脑端（≥769px）**：PC表格布局、弹窗居中显示、功能网格6列

## 浏览器兼容性

- Chrome / Edge / Firefox / Safari 最新版本
- 移动端 iOS Safari / Android Chrome

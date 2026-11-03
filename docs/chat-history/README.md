# 开发会话记录

本目录保存项目开发过程中的 AI 协作会话记录，便于回溯需求上下文与决策过程。

| 文件 | 说明 |
|------|------|
| `session-2026-11-03.jsonl` | Claude Code 原始会话记录（JSONL 格式，完整保真，含全部工具调用与返回） |
| `session-2026-11-03.md` | 上方的可读版导出（用户/助手消息 + 工具调用摘要） |
| `export-session.js` | 导出脚本：`node export-session.js <源.jsonl> <输出.md>` |

## 本次会话概要（2026-11-03 ~ 11-04）

1. **环境修复**：npmmirror 源下 GitHub 不可达导致原生模块编译失败 → 手动填充 node-gyp 头文件缓存 + sharp 走 npmmirror 镜像
2. **依赖修复**：后端 `@nestjs/schematics` 与 typescript 版本冲突（`--legacy-peer-deps`）；前端 `vue-toastification` v1→v2-rc（Vue 3 兼容）
3. **代码修复**（共 9 处）：
   - SCSS 变量未导入导致构建失败 → 拆分 `_variables.scss` + vite `additionalData`
   - 后端未托管 `thumbnails/` 静态目录 → 画廊图片 404
   - 注册接口不返回 token / token 15 分钟过期 / 401 无跳转 → 登录态自愈三件套
   - CORS 写死 5173 → 改为反射任意 origin
   - `limit` 上限 100 → 500（TimelineView 请求 200 导致 400）
   - 首页未登录时误导性空状态 → 登录引导
4. **测试数据**：`backend/seed-media.js` 种子脚本，63 条免费图片/视频（picsum + test-videos.co.uk），跨度 2016–2026
5. **迭代进行中**（见任务清单）：
   - ✅ 迭代 1：设计系统重构 + 首页编辑化改版（已提交推送 `3c5648b`）
   - 🔄 迭代 2：历史上的今天（后端接口 + 首页模块已完成，待补当日测试数据与浏览器验证）

# 知行日课

原 Vue 学习管理网站已接入 Express 后端。任务、每日记录、专注次数和累计分钟数通过接口读写，保存在本机 `server/data/study-data.json`。首次运行会生成三条示例任务。数据文件已加入 `.gitignore`，不会随代码上传。

## 本地运行

需要 Node.js 18 或更高版本。

```bash
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:5173`。`npm run dev` 会同时启动 Vue 和 Express；前端 `/api` 请求由 Vite 转发至本机的 `3001` 端口。

也可先执行 `npm run build`，再运行 `npm start`，打开 `http://127.0.0.1:3001`。Express 会同时提供网页和接口。

## 功能说明

- 添加、完成、删除和筛选学习任务，支持分类。
- 自动统计完成率和待办数量。
- 15、25、45 分钟专注计时，可暂停及重置。
- 编辑每日记录并自动保存到 Express 后端。
- 适配桌面、平板和手机屏幕。

## 后端接口

| 方法 | 路径 | 功能 |
| --- | --- | --- |
| GET | `/api/health` | 检查服务状态 |
| GET | `/api/state` | 读取任务、记录及专注数据 |
| POST | `/api/tasks` | 新增任务，提交 `title`、`subject` |
| PATCH | `/api/tasks/:id` | 更新完成状态，提交 `done` |
| DELETE | `/api/tasks/:id` | 删除任务 |
| PUT | `/api/note` | 保存每日记录，提交 `note` |
| POST | `/api/focus-sessions` | 完成一次专注，提交 `minutes`（15、25 或 45） |

请求和响应使用 JSON。后端会校验输入。测试命令：`npm test`。

## 说明

- 服务默认只监听本机 `127.0.0.1`，不会开放本机文件夹。要让别人在线使用后端，需要另行部署到支持 Node.js 的服务器并配置访问控制。
- 之前公开的 Sites 链接仍是纯静态版本，不能运行 Express，也不会保存到本机后端。
- 旧版浏览器 `localStorage` 中的数据不会自动写入新后端；新版本使用服务端数据文件。

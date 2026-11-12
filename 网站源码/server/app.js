import express from 'express'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultFile = path.join(root, 'server', 'data', 'study-data.json')
const initialState = () => ({
  tasks: [
    { id: randomUUID(), title: '完成 Vue 组件练习', subject: '前端开发', priority: '高', done: false },
    { id: randomUUID(), title: '整理数据结构课堂笔记', subject: '数据结构', priority: '中', done: false },
    { id: randomUUID(), title: '阅读英语文章 20 分钟', subject: '英语学习', priority: '低', done: true },
  ],
  note: '今天最重要的一件事：完成一个小目标，并认真复盘。',
  sessions: 0,
  totalFocusMinutes: 0,
})

export function createApp({ dataFile = defaultFile, serveFrontend = true } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))

  function save(state) {
    mkdirSync(path.dirname(dataFile), { recursive: true })
    const temporaryFile = `${dataFile}.${process.pid}.tmp`
    writeFileSync(temporaryFile, JSON.stringify(state, null, 2), 'utf8')
    renameSync(temporaryFile, dataFile)
  }

  function load() {
    if (!existsSync(dataFile)) {
      const state = initialState()
      save(state)
      return state
    }
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  }

  function withState(handler) {
    return (req, res, next) => {
      try { handler(load(), req, res) } catch (error) { next(error) }
    }
  }

  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.get('/api/state', withState((state, _req, res) => res.json(state)))

  app.post('/api/tasks', withState((state, req, res) => {
    const { title, subject } = req.body ?? {}
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 80 ||
        typeof subject !== 'string' || !['前端开发', '数据结构', '英语学习', '其他学习'].includes(subject)) {
      return res.status(400).json({ error: '请填写有效的任务名称和分类' })
    }
    const task = { id: randomUUID(), title: title.trim(), subject, priority: '中', done: false }
    state.tasks.unshift(task)
    save(state)
    res.status(201).json(task)
  }))

  app.patch('/api/tasks/:id', withState((state, req, res) => {
    if (typeof req.body?.done !== 'boolean' || Object.keys(req.body).length !== 1) {
      return res.status(400).json({ error: 'done 必须为布尔值' })
    }
    const task = state.tasks.find(item => item.id === req.params.id)
    if (!task) return res.status(404).json({ error: '任务不存在' })
    task.done = req.body.done
    save(state)
    res.json(task)
  }))

  app.delete('/api/tasks/:id', withState((state, req, res) => {
    const index = state.tasks.findIndex(item => item.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: '任务不存在' })
    state.tasks.splice(index, 1)
    save(state)
    res.status(204).end()
  }))

  app.put('/api/note', withState((state, req, res) => {
    if (typeof req.body?.note !== 'string' || req.body.note.length > 5000) {
      return res.status(400).json({ error: '记录不能超过 5000 字' })
    }
    state.note = req.body.note
    save(state)
    res.json({ note: state.note })
  }))

  app.post('/api/focus-sessions', withState((state, req, res) => {
    if (![15, 25, 45].includes(req.body?.minutes)) {
      return res.status(400).json({ error: '专注时长无效' })
    }
    state.sessions += 1
    state.totalFocusMinutes += req.body.minutes
    save(state)
    res.status(201).json({ sessions: state.sessions, totalFocusMinutes: state.totalFocusMinutes })
  }))

  if (serveFrontend) {
    const dist = path.join(root, 'dist')
    app.use(express.static(dist))
    app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: 'JSON 格式无效' })
    }
    if (error.type === 'entity.too.large') return res.status(413).json({ error: '请求内容过大' })
    console.error(error)
    res.status(500).json({ error: '服务器处理失败' })
  })
  return app
}

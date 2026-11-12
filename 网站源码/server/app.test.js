import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import { createApp } from './app.js'

const directory = mkdtempSync(path.join(tmpdir(), 'zhixing-api-'))
const dataFile = path.join(directory, 'study-data.json')
const server = createApp({ dataFile, serveFrontend: false }).listen(0, '127.0.0.1')
await new Promise(resolve => server.once('listening', resolve))
const base = `http://127.0.0.1:${server.address().port}`

after(() => {
  server.close()
  rmSync(directory, { recursive: true, force: true })
})

async function api(route, method = 'GET', body) {
  const response = await fetch(base + route, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, data: response.status === 204 ? null : await response.json() }
}

test('任务、笔记和专注记录通过接口保存并能重新读取', async () => {
  const initial = await api('/api/state')
  assert.equal(initial.status, 200)
  assert.equal(initial.data.tasks.length, 3)

  const created = await api('/api/tasks', 'POST', { title: '  完成后端练习  ', subject: '前端开发' })
  assert.equal(created.status, 201)
  assert.equal(created.data.title, '完成后端练习')
  assert.equal((await api(`/api/tasks/${created.data.id}`, 'PATCH', { done: true })).data.done, true)
  assert.equal((await api('/api/note', 'PUT', { note: '已学习 Express' })).data.note, '已学习 Express')
  assert.deepEqual((await api('/api/focus-sessions', 'POST', { minutes: 25 })).data, { sessions: 1, totalFocusMinutes: 25 })

  const reloaded = await api('/api/state')
  assert.equal(reloaded.data.tasks[0].done, true)
  assert.equal(reloaded.data.note, '已学习 Express')
  assert.equal(reloaded.data.totalFocusMinutes, 25)
  assert.equal((await api(`/api/tasks/${created.data.id}`, 'DELETE')).status, 204)
  assert.equal((await api('/api/state')).data.tasks.length, 3)
})

test('无效内容和不存在的任务会被拒绝', async () => {
  assert.equal((await api('/api/tasks', 'POST', { title: '', subject: '前端开发' })).status, 400)
  assert.equal((await api('/api/focus-sessions', 'POST', { minutes: -1 })).status, 400)
  assert.equal((await api('/api/note', 'PUT', { note: 12 })).status, 400)
  assert.equal((await api('/api/tasks/not-found', 'PATCH', { done: true })).status, 404)
})

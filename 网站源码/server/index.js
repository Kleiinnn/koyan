import { createApp } from './app.js'

const port = Number(process.env.PORT) || 3001
createApp().listen(port, '127.0.0.1', () => {
  console.log(`知行日课后端已启动：http://127.0.0.1:${port}`)
})

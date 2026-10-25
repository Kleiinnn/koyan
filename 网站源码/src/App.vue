<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const STORAGE_KEY = 'zhixing-vue-study-v1'
const sampleTasks = [
  { id: 1, title: '完成 Vue 组件练习', subject: '前端开发', priority: '高', done: false },
  { id: 2, title: '整理数据结构课堂笔记', subject: '数据结构', priority: '中', done: false },
  { id: 3, title: '阅读英语文章 20 分钟', subject: '英语学习', priority: '低', done: true },
]
const tasks = ref(sampleTasks)
const newTask = ref('')
const newSubject = ref('前端开发')
const filter = ref('全部')
const note = ref('今天最重要的一件事：完成一个小目标，并认真复盘。')
const noteSaved = ref(false)
const duration = ref(25)
const secondsLeft = ref(25 * 60)
const isRunning = ref(false)
const sessions = ref(0)
const totalFocusMinutes = ref(0)
const activeNav = ref('概览')
let timer
let saveNoticeTimer

const today = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 11 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
})
const doneCount = computed(() => tasks.value.filter(task => task.done).length)
const pendingCount = computed(() => tasks.value.length - doneCount.value)
const progress = computed(() => tasks.value.length ? Math.round(doneCount.value / tasks.value.length * 100) : 0)
const visibleTasks = computed(() => tasks.value.filter(task => filter.value === '全部' || (filter.value === '待完成' ? !task.done : task.done)))
const timerText = computed(() => `${String(Math.floor(secondsLeft.value / 60)).padStart(2, '0')}:${String(secondsLeft.value % 60).padStart(2, '0')}`)
const ringStyle = computed(() => ({ background: `conic-gradient(#d56b4d ${progress.value}%, #e7e7df 0)` }))

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (Array.isArray(saved.tasks)) tasks.value = saved.tasks
    if (typeof saved.note === 'string') note.value = saved.note
    if (Number.isInteger(saved.sessions)) sessions.value = saved.sessions
    if (Number.isInteger(saved.totalFocusMinutes)) totalFocusMinutes.value = saved.totalFocusMinutes
  } catch { /* Keep initial sample content when browser storage is invalid. */ }
})
onUnmounted(() => { clearInterval(timer); clearTimeout(saveNoticeTimer) })
watch([tasks, note, sessions, totalFocusMinutes], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: tasks.value, note: note.value, sessions: sessions.value, totalFocusMinutes: totalFocusMinutes.value }))
}, { deep: true })

function addTask() {
  const title = newTask.value.trim()
  if (!title) return
  tasks.value.unshift({ id: Date.now(), title, subject: newSubject.value, priority: '中', done: false })
  newTask.value = ''
  filter.value = '全部'
}
function deleteTask(id) { tasks.value = tasks.value.filter(task => task.id !== id) }
function saveNote() {
  noteSaved.value = true
  clearTimeout(saveNoticeTimer)
  saveNoticeTimer = setTimeout(() => noteSaved.value = false, 2200)
}
function stopTimer() { clearInterval(timer); timer = undefined; isRunning.value = false }
function toggleTimer() {
  if (isRunning.value) { stopTimer(); return }
  if (secondsLeft.value === 0) secondsLeft.value = duration.value * 60
  isRunning.value = true
  timer = setInterval(() => {
    if (secondsLeft.value > 1) { secondsLeft.value--; return }
    stopTimer()
    secondsLeft.value = 0
    sessions.value++
    totalFocusMinutes.value += duration.value
    if ('Notification' in window && Notification.permission === 'granted') new Notification('知行日课', { body: '专注结束，休息一下吧！' })
  }, 1000)
}
function setDuration(minutes) { stopTimer(); duration.value = minutes; secondsLeft.value = minutes * 60 }
function resetTimer() { stopTimer(); secondsLeft.value = duration.value * 60 }
function jumpTo(id, label) {
  activeNav.value = label
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#top" @click.prevent="jumpTo('top', '概览')"><span class="brand-mark">知</span><span>知行日课<small>STUDY FLOW</small></span></a>
      <div class="sidebar-label">工作空间</div>
      <nav aria-label="主导航">
        <button v-for="item in [{ label: '概览', icon: '◫', id: 'top' }, { label: '学习任务', icon: '☑', id: 'tasks' }, { label: '专注时间', icon: '◷', id: 'focus' }, { label: '今日记录', icon: '▤', id: 'notes' }]" :key="item.label" :class="['nav-item', { active: activeNav === item.label }]" @click="jumpTo(item.id, item.label)"><span>{{ item.icon }}</span>{{ item.label }}</button>
      </nav>
      <div class="sidebar-bottom"><div class="tip-icon">✦</div><strong>每日一点进步</strong><p>把大目标拆成今天可以完成的小行动。</p></div>
    </aside>

    <main id="top" class="main">
      <header class="topbar"><div class="mobile-brand"><span class="brand-mark">知</span> 知行日课</div><span class="top-date">{{ today }}</span><span class="avatar" aria-label="访客头像">学</span></header>
      <div class="content">
        <section class="hero"><div><div class="eyebrow">YOUR LEARNING SPACE <span></span> 让努力看得见</div><h1>{{ greeting }}，<br><em>今天也向前一步。</em></h1><p>把想做的事写下来，把重要的事完成。你的每一次专注，都在积累改变。</p><button class="hero-cta" @click="jumpTo('tasks', '学习任务')">开始规划今天 <span>↗</span></button></div><div class="hero-art" aria-hidden="true"><div class="sun"></div><div class="book book-back"></div><div class="book book-front"></div><div class="pencil"></div><div class="hero-spark one">✦</div><div class="hero-spark two">✦</div></div></section>

      <section class="section stats" aria-label="学习数据"><div class="stat-card"><div class="stat-icon peach">☑</div><div><span>今日已完成</span><strong>{{ doneCount }} <small>/ {{ tasks.length }}</small></strong><p>继续保持好节奏</p></div></div><div class="stat-card"><div class="stat-icon lilac">◷</div><div><span>累计专注</span><strong>{{ totalFocusMinutes }} <small>分钟</small></strong><p>每分钟都算数</p></div></div><div class="stat-card"><div class="stat-icon mint">↗</div><div><span>当前待办</span><strong>{{ pendingCount }} <small>项任务</small></strong><p>一步一步来</p></div></div></section>

        <div class="grid">
          <section id="tasks" class="panel task-panel"><div class="panel-head"><div><div class="kicker">PLAN YOUR DAY</div><h2>今日学习任务</h2><p>把目标变成可执行的计划</p></div><span class="count-badge">{{ pendingCount }} 项待完成</span></div><form class="add-form" @submit.prevent="addTask"><input v-model="newTask" aria-label="新任务名称" placeholder="添加一项新的学习任务..." maxlength="80"><select v-model="newSubject" aria-label="任务分类"><option>前端开发</option><option>数据结构</option><option>英语学习</option><option>其他学习</option></select><button type="submit" aria-label="添加任务">＋</button></form><div class="filter-row"><button v-for="item in ['全部', '待完成', '已完成']" :key="item" :class="{ selected: filter === item }" @click="filter = item">{{ item }}</button></div><div class="task-list"><div v-for="task in visibleTasks" :key="task.id" :class="['task', { done: task.done }]"><label class="task-check"><input v-model="task.done" type="checkbox" :aria-label="`完成${task.title}`"><span></span></label><div class="task-body"><strong>{{ task.title }}</strong><div><span class="subject">{{ task.subject }}</span><span v-if="task.priority === '高'" class="priority">优先处理</span></div></div><button class="delete" :aria-label="`删除${task.title}`" @click="deleteTask(task.id)">×</button></div><div v-if="!visibleTasks.length" class="empty">这里暂时没有任务，添加一项开始吧 ✨</div></div></section>

          <div class="right-col"><section class="panel progress-panel"><div class="kicker">TODAY'S PROGRESS</div><h2>今日进度</h2><div class="progress-wrap"><div class="progress-ring" :style="ringStyle"><div><strong>{{ progress }}%</strong><span>已完成</span></div></div><div class="progress-copy"><strong>每完成一项，<br>离目标更近一点。</strong><p>已经完成 {{ doneCount }} 项任务，继续加油！</p></div></div><div class="progress-line"><span>今日目标</span><strong>{{ doneCount }} / {{ tasks.length }}</strong></div><div class="bar"><span :style="{ width: `${progress}%` }"></span></div></section>
          <section id="focus" class="panel focus-panel"><div class="panel-head"><div><div class="kicker">FOCUS SESSION</div><h2>专注时间</h2></div><span class="focus-icon">◷</span></div><p>给自己一段不被打扰的时间。</p><div class="timer">{{ timerText }}</div><div class="timer-options"><button v-for="minutes in [15, 25, 45]" :key="minutes" :class="{ selected: duration === minutes }" @click="setDuration(minutes)">{{ minutes }} 分钟</button></div><div class="timer-actions"><button class="start-btn" @click="toggleTimer">{{ isRunning ? '暂停专注' : '开始专注' }}</button><button class="reset-btn" @click="resetTimer" aria-label="重置计时器">↺</button></div><small>已完成 {{ sessions }} 次专注</small></section></div>
        </div>

        <section id="notes" class="panel note-panel"><div class="note-heading"><div><div class="kicker">A LITTLE REFLECTION</div><h2>今日记录</h2><p>写下想法，让每一天都有迹可循。</p></div><span class="note-illustration">✎</span></div><textarea v-model="note" aria-label="今日记录" placeholder="今天学到了什么？有什么值得记录的事？" rows="4"></textarea><div class="note-footer"><span>内容会自动保存在当前浏览器</span><button @click="saveNote">{{ noteSaved ? '已保存 ✓' : '保存记录' }}</button></div></section>
        <footer>© 2026 知行日课 · 用 Vue 3 构建的前端学习空间</footer>
      </div>
    </main>
  </div>
</template>

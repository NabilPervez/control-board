// S2 Safe localStorage + pure state reducers (testable without a DOM).
export const KEY = 'controlboard:v1'

export const emptyState = () => ({
  version: 1,
  items: [], // { id, text, type: 'can'|'cant', released, createdAt }
  cards: [], // { id, text, status: 'todo'|'doing'|'done', order, itemId, createdAt, doneAt }
  settings: { cycleStart: today(), theme: 'auto' },
})

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))

export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function load(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return emptyState()
    return migrate(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

export function save(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function migrate(data) {
  const base = emptyState()
  if (!data || typeof data !== 'object') return base
  return {
    version: 1,
    items: Array.isArray(data.items) ? data.items.filter((i) => i && i.id && typeof i.text === 'string') : [],
    cards: Array.isArray(data.cards) ? data.cards.filter((c) => c && c.id && typeof c.text === 'string') : [],
    settings: { ...base.settings, ...(data.settings || {}) },
  }
}

// Plan/Do alternation: day 0 of cycle = Plan, day 1 = Do, repeat.
export function cycleDay(cycleStart, now = today()) {
  const a = new Date(cycleStart + 'T00:00:00')
  const b = new Date(now + 'T00:00:00')
  const diff = Math.round((b - a) / 86400000)
  return ((diff % 2) + 2) % 2 === 0 ? 'plan' : 'do'
}

// ---- reducers (pure) ----
export function addItem(s, text, type) {
  const t = text.trim()
  if (!t) return s
  const item = { id: uid(), text: t, type, released: false, createdAt: Date.now() }
  return { ...s, items: [item, ...s.items] }
}

export const updateItem = (s, id, patch) => ({
  ...s,
  items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
})

export const removeItem = (s, id) => ({ ...s, items: s.items.filter((i) => i.id !== id) })

export function addCard(s, text, itemId = null) {
  const t = text.trim()
  if (!t) return s
  const order = nextOrder(s.cards, 'todo')
  const card = { id: uid(), text: t, status: 'todo', order, itemId, createdAt: Date.now(), doneAt: null }
  return { ...s, cards: [...s.cards, card] }
}

export const removeCard = (s, id) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) })

export const updateCard = (s, id, patch) => ({
  ...s,
  cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
})

function nextOrder(cards, status) {
  const col = cards.filter((c) => c.status === status)
  return col.length ? Math.max(...col.map((c) => c.order)) + 1 : 0
}

// L5-style stable reorder: move card into status column at index, renumber that column.
export function moveCard(s, id, status, index = Infinity) {
  const card = s.cards.find((c) => c.id === id)
  if (!card) return s
  const others = s.cards.filter((c) => c.id !== id)
  const col = others.filter((c) => c.status === status).sort((a, b) => a.order - b.order)
  const i = Math.max(0, Math.min(index, col.length))
  const moved = {
    ...card,
    status,
    doneAt: status === 'done' ? card.doneAt || Date.now() : null,
  }
  col.splice(i, 0, moved)
  const renum = new Map(col.map((c, n) => [c.id, n]))
  const rest = others.filter((c) => c.status !== status)
  return { ...s, cards: [...rest, ...col.map((c) => ({ ...c, order: renum.get(c.id) }))] }
}

export const column = (s, status) =>
  s.cards.filter((c) => c.status === status).sort((a, b) => a.order - b.order)

export function clearDone(s, olderThanDays = 0, now = Date.now()) {
  const cutoff = now - olderThanDays * 86400000
  return { ...s, cards: s.cards.filter((c) => !(c.status === 'done' && (c.doneAt || 0) <= cutoff)) }
}

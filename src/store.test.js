import { describe, it, expect } from 'vitest'
import * as S from './store.js'

const mem = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}

describe('storage', () => {
  it('round-trips and survives corrupt data', () => {
    const st = mem()
    let s = S.addItem(S.emptyState(), 'Call dentist', 'can')
    expect(S.save(s, st)).toBe(true)
    expect(S.load(st).items[0].text).toBe('Call dentist')
    st.setItem(S.KEY, '{not json')
    expect(S.load(st).items).toEqual([])
  })
  it('save returns false when storage throws', () => {
    expect(S.save(S.emptyState(), { setItem() { throw new Error('full') } })).toBe(false)
  })
})

describe('items and cards', () => {
  it('dumps to inbox then sorts later', () => {
    let s = S.addItem(S.emptyState(), 'Random worry', 'inbox')
    expect(s.items[0].type).toBe('inbox')
    s = S.updateItem(s, s.items[0].id, { type: 'cant' })
    expect(s.items[0].type).toBe('cant')
  })
  it('ignores blank input', () => {
    expect(S.addItem(S.emptyState(), '   ', 'can').items).toHaveLength(0)
  })
  it('moves cards with stable order and done timestamp', () => {
    let s = S.emptyState()
    s = S.addCard(s, 'a'); s = S.addCard(s, 'b'); s = S.addCard(s, 'c')
    const [a, b] = S.column(s, 'todo')
    s = S.moveCard(s, a.id, 'doing')
    s = S.moveCard(s, b.id, 'doing', 0)
    expect(S.column(s, 'doing').map((c) => c.text)).toEqual(['b', 'a'])
    s = S.moveCard(s, a.id, 'done')
    expect(S.column(s, 'done')[0].doneAt).toBeTypeOf('number')
    s = S.moveCard(s, a.id, 'todo')
    expect(S.column(s, 'todo').find((c) => c.id === a.id).doneAt).toBeNull()
  })
  it('clearDone removes done cards only', () => {
    let s = S.addCard(S.addCard(S.emptyState(), 'x'), 'y')
    s = S.moveCard(s, s.cards[0].id, 'done')
    s = S.clearDone(s, 0, Date.now() + 1)
    expect(s.cards.map((c) => c.text)).toEqual(['y'])
  })
})

describe('cycle', () => {
  it('alternates plan/do', () => {
    expect(S.cycleDay('2026-10-13', '2026-10-13')).toBe('plan')
    expect(S.cycleDay('2026-10-13', '2026-10-14')).toBe('do')
    expect(S.cycleDay('2026-10-13', '2026-10-15')).toBe('plan')
  })
})

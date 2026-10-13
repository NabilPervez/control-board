import { useEffect, useMemo, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import * as S from './store.js'

const COLS = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

export default function App() {
  const [state, setState] = useState(() => S.load())
  const [tab, setTab] = useState(() => (S.cycleDay(S.load().settings.cycleStart) === 'do' ? 'do' : 'plan'))
  const [toast, setToast] = useState(null)
  const undoRef = useRef(null)

  useEffect(() => {
    if (!S.save(state)) showToast('Couldn’t save — storage is full or blocked')
  }, [state])

  useEffect(() => {
    const t = state.settings.theme
    if (t === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', t)
  }, [state.settings.theme])

  function showToast(msg, undo) {
    undoRef.current = undo || null
    setToast({ msg, undo: !!undo, key: Date.now() })
  }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const act = (fn) => setState((s) => fn(s))
  const withUndo = (msg, fn) => {
    const prev = state
    setState(fn(state))
    showToast(msg, () => setState(prev))
  }

  const day = S.cycleDay(state.settings.cycleStart)

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">Today is a {day === 'plan' ? 'Plan' : 'Do'} day</p>
          <h1>{tab === 'plan' ? 'What can I control?' : 'Do the list'}</h1>
        </div>
        <Menu state={state} setState={setState} showToast={showToast} />
      </header>

      <main>
        {tab === 'plan' ? (
          <Plan state={state} act={act} withUndo={withUndo} showToast={showToast} />
        ) : (
          <Do state={state} act={act} withUndo={withUndo} />
        )}
      </main>

      <nav className="bottom" aria-label="Sections">
        <button className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>
          Plan
        </button>
        <button className={tab === 'do' ? 'on' : ''} onClick={() => setTab('do')}>
          Do
        </button>
      </nav>

      <InstallBanner />
      <UpdateToast />
      {toast && (
        <div className="toast" role="status" key={toast.key}>
          <span>{toast.msg}</span>
          {toast.undo && (
            <button onClick={() => { undoRef.current?.(); setToast(null) }}>Undo</button>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------------- Plan ---------------- */
function Plan({ state, act, withUndo, showToast }) {
  const [text, setText] = useState('')
  const [showCant, setShowCant] = useState(false)
  const inputRef = useRef(null)
  const can = state.items.filter((i) => i.type === 'can')
  const cant = state.items.filter((i) => i.type === 'cant' && !i.released)
  const released = state.items.filter((i) => i.type === 'cant' && i.released)

  const add = (type) => {
    if (!text.trim()) return inputRef.current?.focus()
    act((s) => S.addItem(s, text, type))
    setText('')
    inputRef.current?.focus()
    if (type === 'cant') showToast('Parked in “Let it go”')
  }

  return (
    <section className="plan">
      <div className="card dump">
        <label htmlFor="dump" className="eyebrow">Brain dump</label>
        <textarea
          id="dump"
          ref={inputRef}
          rows={2}
          value={text}
          placeholder="What’s on your mind?"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add('can') } }}
        />
        <div className="row">
          <button className="btn primary" onClick={() => add('can')}>I can control this</button>
          <button className="btn ghost" onClick={() => add('cant')}>I can’t</button>
        </div>
      </div>

      <h2>Can control <span className="count">{can.length}</span></h2>
      {can.length === 0 && <p className="empty">Nothing yet. Dump a thought above and tap “I can control this.”</p>}
      <ul className="list">
        {can.map((i) => (
          <ItemRow key={i.id} item={i} act={act} withUndo={withUndo} cards={state.cards}
            onAction={() => { act((s) => S.addCard(s, i.text, i.id)); showToast('Added to To Do') }} />
        ))}
      </ul>

      <button className="letgo-head" onClick={() => setShowCant((v) => !v)} aria-expanded={showCant}>
        <span>Let it go</span>
        <span className="count">{cant.length}</span>
        <span aria-hidden>{showCant ? '▾' : '▸'}</span>
      </button>
      {showCant && (
        <ul className="list muted">
          {cant.length === 0 && <li className="empty">Nothing here. Good.</li>}
          {cant.map((i) => (
            <ItemRow key={i.id} item={i} act={act} withUndo={withUndo} />
          ))}
          {released.length > 0 && <li className="released-note">{released.length} released</li>}
        </ul>
      )}
    </section>
  )
}

function ItemRow({ item, act, withUndo, onAction, cards = [] }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(item.text)
  const actions = cards.filter((c) => c.itemId === item.id).length
  const commit = () => {
    setEditing(false)
    if (val.trim() && val !== item.text) act((s) => S.updateItem(s, item.id, { text: val.trim() }))
    else setVal(item.text)
  }
  return (
    <li className="item">
      {editing ? (
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()} aria-label="Edit item" />
      ) : (
        <button className="item-text" onClick={() => setEditing(true)}>
          {item.text}
          {actions > 0 && <small> · {actions} action{actions > 1 ? 's' : ''}</small>}
        </button>
      )}
      <div className="item-actions">
        {item.type === 'can' ? (
          <>
            <button className="chip strong" onClick={onAction}>+ Action</button>
            <button className="chip" onClick={() => act((s) => S.updateItem(s, item.id, { type: 'cant' }))} title="Move to Let it go">↓</button>
          </>
        ) : (
          <>
            <button className="chip" onClick={() => act((s) => S.updateItem(s, item.id, { released: true }))}>Release</button>
            <button className="chip" onClick={() => act((s) => S.updateItem(s, item.id, { type: 'can' }))} title="Actually I can">↑</button>
          </>
        )}
        <button className="chip" aria-label="Delete" onClick={() => withUndo('Deleted', (s) => S.removeItem(s, item.id))}>✕</button>
      </div>
    </li>
  )
}

/* ---------------- Do (kanban) ---------------- */
function Do({ state, act, withUndo }) {
  const [text, setText] = useState('')
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const doneCount = S.column(state, 'done').length

  return (
    <section className="do">
      <Timer />
      <form className="quick" onSubmit={(e) => { e.preventDefault(); act((s) => S.addCard(s, text)); setText('') }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Quick-add an action" aria-label="New action" />
        <button className="btn primary" disabled={!text.trim()}>Add</button>
      </form>

      <div className="board">
        {COLS.map((col, ci) => {
          const cards = S.column(state, col.id)
          return (
            <div key={col.id}
              className={`col ${over === col.id ? 'over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOver(col.id) }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => { e.preventDefault(); if (drag) act((s) => S.moveCard(s, drag, col.id)); setDrag(null); setOver(null) }}>
              <div className="col-head">
                <h2>{col.label}</h2>
                <span className="count">{cards.length}</span>
                {col.id === 'done' && doneCount > 0 && (
                  <button className="chip" onClick={() => withUndo('Cleared done', (s) => S.clearDone(s, 0))}>Clear</button>
                )}
              </div>
              {cards.length === 0 && <p className="empty">{col.id === 'todo' ? 'Turn a “Can control” item into an action.' : '—'}</p>}
              {cards.map((c, i) => (
                <article key={c.id} className={`kcard ${c.status}`} draggable
                  onDragStart={() => setDrag(c.id)} onDragEnd={() => setDrag(null)}>
                  <p>{c.text}</p>
                  <div className="kactions">
                    {ci > 0 && <button className="chip" aria-label={`Move to ${COLS[ci - 1].label}`} onClick={() => act((s) => S.moveCard(s, c.id, COLS[ci - 1].id))}>←</button>}
                    {i > 0 && <button className="chip" aria-label="Move up" onClick={() => act((s) => S.moveCard(s, c.id, col.id, i - 1))}>↑</button>}
                    <button className="chip" aria-label="Delete" onClick={() => withUndo('Deleted', (s) => S.removeCard(s, c.id))}>✕</button>
                    {ci < 2 && <button className="chip strong" onClick={() => act((s) => S.moveCard(s, c.id, COLS[ci + 1].id))}>
                      {ci === 0 ? 'Start' : 'Done ✓'}
                    </button>}
                  </div>
                </article>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* 45-minute focus timer (wall-clock, D6 chime, D9 wake lock) */
const BLOCK = 45 * 60 * 1000
function Timer() {
  const [endAt, setEndAt] = useState(() => Number(safeGet('controlboard:timer')) || null)
  const [now, setNow] = useState(Date.now())
  const lock = useRef(null)
  useEffect(() => {
    if (!endAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [endAt])
  useEffect(() => {
    safeSet('controlboard:timer', endAt || '')
    if (endAt && 'wakeLock' in navigator) navigator.wakeLock.request('screen').then((l) => (lock.current = l)).catch(() => {})
    else lock.current?.release?.()
  }, [endAt])
  const left = endAt ? Math.max(0, endAt - now) : BLOCK
  useEffect(() => {
    if (endAt && left === 0) { chime(); setEndAt(null) }
  }, [left, endAt])
  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  const pct = 1 - left / BLOCK
  return (
    <div className="timer card">
      <div className="ring" style={{ '--p': pct }} aria-hidden />
      <div>
        <p className="eyebrow">45-minute block</p>
        <p className="time" aria-live="polite">{mm}:{ss}</p>
      </div>
      {endAt ? (
        <button className="btn ghost" onClick={() => setEndAt(null)}>Stop</button>
      ) : (
        <button className="btn primary" onClick={() => setEndAt(Date.now() + BLOCK)}>Start</button>
      )}
    </div>
  )
}

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.25
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
      o.start(t); o.stop(t + 1)
    })
    navigator.vibrate?.([200, 100, 200])
  } catch { /* no audio */ }
}
const safeGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const safeSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

/* ---------------- Menu: export/import (S3), theme, restart cycle ---------------- */
function Menu({ state, setState, showToast }) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef(null)
  const exportJson = async () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const name = `control-board-${S.today()}.json`
    const file = new File([blob], name, { type: 'application/json' })
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: name }); return }
    } catch { /* fall through */ }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = name; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const importJson = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    try {
      const data = S.migrate(JSON.parse(await f.text()))
      const prev = state
      setState(data)
      showToast(`Imported ${data.items.length} items, ${data.cards.length} cards`, () => setState(prev))
    } catch { showToast('That file isn’t a Control Board backup') }
    e.target.value = ''
  }
  const themes = ['auto', 'light', 'dark']
  return (
    <div className="menu">
      <button className="icon-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>⋯</button>
      {open && (
        <div className="menu-pop" onClick={() => setOpen(false)}>
          <button onClick={() => { setState((s) => ({ ...s, settings: { ...s.settings, cycleStart: S.today() } })); showToast('Cycle restarted — today is Plan day') }}>Restart cycle (today = Plan)</button>
          <button onClick={() => setState((s) => ({ ...s, settings: { ...s.settings, theme: themes[(themes.indexOf(s.settings.theme) + 1) % 3] } }))}>
            Theme: {state.settings.theme}
          </button>
          <button onClick={exportJson}>Export backup</button>
          <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>Import backup</button>
          <p className="fine">Everything stays on this device. No account, no tracking.</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
    </div>
  )
}

/* D2 install banner */
function InstallBanner() {
  const [evt, setEvt] = useState(null)
  const [hidden, setHidden] = useState(() => safeGet('controlboard:a2hs') === 'no')
  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), [])
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setEvt(e) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  if (hidden || standalone || (!evt && !isIos)) return null
  const dismiss = () => { safeSet('controlboard:a2hs', 'no'); setHidden(true) }
  return (
    <div className="banner">
      <span>{evt ? 'Install Control Board for one-tap access.' : 'Install: tap Share, then “Add to Home Screen.”'}</span>
      {evt && <button className="btn primary" onClick={async () => { evt.prompt(); await evt.userChoice; setEvt(null); dismiss() }}>Install</button>}
      <button className="chip" aria-label="Dismiss" onClick={dismiss}>✕</button>
    </div>
  )
}

/* D1 update toast */
function UpdateToast() {
  const { needRefresh: [need, setNeed], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) { if (reg) setInterval(() => reg.update(), 60 * 60 * 1000) },
  })
  if (!need) return null
  return (
    <div className="banner">
      <span>A new version is available.</span>
      <button className="chip" onClick={() => setNeed(false)}>Later</button>
      <button className="btn primary" onClick={() => updateServiceWorker(true)}>Reload</button>
    </div>
  )
}

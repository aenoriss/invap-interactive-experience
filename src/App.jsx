import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AREAS } from './data.js'
import Viewer from './Viewer.jsx'

// A guided visit in five scenes: the landing, the opening film, the four areas, an area's
// film, and its product in 3D. `scene` says which one is up, `areaId` which area is in play.
//
// The address carries both (#habitat, #habitat/producto), so a product can be linked to and
// the back button works.

function fromHash() {
  const [id, part] = window.location.hash.slice(1).split('/')
  if (id === 'areas') return { scene: 'areas', areaId: AREAS[0].id }
  const area = AREAS.find((a) => a.id === id)
  if (!area) return { scene: 'landing', areaId: AREAS[0].id }
  return { scene: part === 'producto' ? 'product' : 'film', areaId: area.id }
}

// A film that fills the screen, with a way past it. Browsers refuse to start a film with
// sound unless a click led to it, so if playing fails it starts muted and offers the sound.
function Film({ src, onEnd, label }) {
  const video = useRef(null)
  const [muted, setMuted] = useState(false)
  useEffect(() => {
    const v = video.current
    v.muted = false
    v.play().catch(() => { v.muted = true; setMuted(true); v.play().catch(() => {}) })
  }, [src])
  return (
    <section className="film">
      <video ref={video} src={src} playsInline onEnded={onEnd} />
      <div className="film-bar">
        <p>{label}</p>
        {muted && <button className="ghost" onClick={() => { video.current.muted = false; setMuted(false) }}>Activar sonido</button>}
        <button className="ghost" onClick={onEnd}>Saltar</button>
      </div>
    </section>
  )
}

// The company's mark with the year beside it: the way back, on every scene that has a top line.
// INVAP 2071 as one mark: the wordmark, a leaning stroke, the year in outline.
const Lockup = () => <span className="lockup"><img src="/invap.svg" alt="INVAP" /><i className="slash" /><span className="year">2071</span></span>
const Mark = ({ onClick }) => <button className="wordmark" onClick={onClick} aria-label="INVAP 2071"><Lockup /></button>

// The four areas as one switch. A single green capsule lies under the area in play and
// slides to the next one: it is measured from the button it has to sit under, again when
// the window changes or the typeface arrives, since both change the buttons' widths.
function Switch({ area, onPick }) {
  const nav = useRef(null)
  const [at, setAt] = useState(null)
  useLayoutEffect(() => {
    const measure = () => {
      const on = nav.current.querySelector('.is-on')
      if (on) setAt({ left: on.offsetLeft, width: on.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [area.id])
  return (
    <nav ref={nav}>
      {at && <i className="slider" style={{ transform: `translateX(${at.left}px)`, width: at.width }} />}
      {AREAS.map((a) => <button key={a.id} className={a.id === area.id ? 'is-on' : ''} onClick={() => onPick(a.id)}>{a.title}</button>)}
    </nav>
  )
}

export default function App() {
  const [{ scene, areaId }, setState] = useState(fromHash)
  const [hover, setHover] = useState(null)
  const area = AREAS.find((a) => a.id === areaId)

  const go = (next, id = areaId) => {
    const hash = next === 'landing' || next === 'intro' ? '' : next === 'areas' ? '#areas' : next === 'film' ? `#${id}` : `#${id}/producto`
    if (window.location.hash !== hash) window.history.pushState(null, '', hash || window.location.pathname)
    setState({ scene: next, areaId: id })
  }
  useEffect(() => {
    const back = () => setState(fromHash())
    window.addEventListener('popstate', back)
    return () => window.removeEventListener('popstate', back)
  }, [])

  const index = AREAS.indexOf(area)
  const other = (step) => AREAS[(index + step + AREAS.length) % AREAS.length]

  return (
    <main className={'app scene-' + scene}>
      {scene === 'landing' && (
        <section className="landing">
          <video className="backdrop" src="/media/earth.webm" autoPlay muted loop playsInline />
          <div className="landing-copy">
            <h1><Lockup /></h1>
            <p className="claim">Cincuenta años después, la humanidad vive entre planetas.</p>
            <p className="lede">Una visita guiada a lo que una empresa argentina de tecnología podría estar construyendo.</p>
            <button className="primary" onClick={() => go('intro')}>Sumate al futuro</button>
          </div>
          <ul className="contents">
            <li>Un catálogo imaginado</li>
            {AREAS.map((a) => <li key={a.id}>{a.title}</li>)}
          </ul>
        </section>
      )}

      {scene === 'intro' && <Film src="/media/intro.webm" label="Película de apertura" onEnd={() => go('areas')} />}

      {scene === 'areas' && (
        <section className="areas">
          <header className="top over">
            <Mark onClick={() => go('landing')} />
          </header>
          {/* Four strips, each the full height of the window, each with its own film behind
              it and its own words on it. The one under the pointer widens and tells more. */}
          <ul className="strips">
            {AREAS.map((a, i) => (
              <li key={a.id} style={{ '--n': i }} className={hover === a.id ? 'is-on' : ''}>
                <button onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(a.id)} onClick={() => { setHover(null); go('film', a.id) }}>
                  <video src={`/media/loop-${a.id}.webm`} autoPlay muted loop playsInline />
                  <span className="strip-copy">
                    <strong>{a.title}</strong>
                    <em>{a.device}</em>
                    <span className="strip-body">{a.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {scene === 'film' && <Film src={`/media/film-${area.id}.webm`} label={`${area.title} en 2071`} onEnd={() => go('product')} />}

      {scene === 'product' && (
        <section className="product">
          <header className="top">
            <Mark onClick={() => go('areas')} />
            <Switch area={area} onPick={(id) => go('product', id)} />
          </header>
          <div className="stage">
            <Viewer area={area} />
            <article className="sheet" key={area.id}>
              <h2 className="headline">{area.header}</h2>
              <h3>{area.device}</h3>
              <p>{area.text}</p>
              <ul>{area.facts.map((f) => <li key={f}>{f}</li>)}</ul>
              <div className="sheet-nav">
                <button className="ghost" onClick={() => go('film', area.id)}>Ver la película</button>
                <button className="ghost" onClick={() => go('product', other(1).id)}>Siguiente: {other(1).device}</button>
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  )
}

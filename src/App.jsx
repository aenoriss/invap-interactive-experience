import React, { useEffect, useRef, useState } from 'react'
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
const Mark = ({ onClick }) => <button className="wordmark" onClick={onClick}><img src="/invap.svg" alt="INVAP" /><span>2071</span></button>

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
            <p className="eyebrow">Un catálogo imaginado</p>
            <h1><img src="/invap.svg" alt="INVAP" /><span>2071</span></h1>
            <p className="lede">Cincuenta años después, la humanidad vive entre planetas. Esta es una visita guiada a lo que una empresa argentina de tecnología podría estar construyendo.</p>
            <button className="primary" onClick={() => go('intro')}>Sumate al futuro</button>
          </div>
        </section>
      )}

      {scene === 'intro' && <Film src="/media/intro.webm" label="Película de apertura" onEnd={() => go('areas')} />}

      {scene === 'areas' && (
        <section className="areas">
          <header className="top over">
            <Mark onClick={() => go('landing')} />
            <p className="eyebrow">Cuatro áreas</p>
          </header>
          {/* Four strips, each the full height of the window, each with its own film behind
              it and its own words on it. The one under the pointer widens and tells more. */}
          <ul className="strips">
            {AREAS.map((a, i) => (
              <li key={a.id} style={{ '--n': i }} className={hover === a.id ? 'is-on' : ''}>
                <button onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(a.id)} onClick={() => { setHover(null); go('film', a.id) }}>
                  <video src={`/media/loop-${a.id}.webm`} autoPlay muted loop playsInline />
                  <span className="strip-copy">
                    <span className="eyebrow">{a.theme}</span>
                    <strong>{a.title}</strong>
                    <span className="strip-body">{a.body}</span>
                    <em>{a.device}</em>
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
            <nav>
              {AREAS.map((a) => <button key={a.id} className={a.id === area.id ? 'is-on' : ''} onClick={() => go('product', a.id)}>{a.title}</button>)}
            </nav>
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

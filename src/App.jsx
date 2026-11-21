import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AREAS } from './data.js'
import Viewer from './Viewer.jsx'

// A guided visit in three scenes: the landing, the four areas, and an area's product in 3D.
// `scene` says which one is up, `areaId` which area is in play.
//
// The videos are never on the way: moving between scenes is immediate. Each video is
// something the visitor chooses to watch, from a button, and it opens over the scene they
// are on and closes back to it.
//
// The address carries the scene (#areas, #habitat), so a product can be linked to and the
// back button works.

function fromHash() {
  const [id] = window.location.hash.slice(1).split('/')
  if (id === 'areas') return { scene: 'areas', areaId: AREAS[0].id }
  const area = AREAS.find((a) => a.id === id)
  if (!area) return { scene: 'landing', areaId: AREAS[0].id }
  return { scene: 'product', areaId: area.id }
}

// A video over the whole window, closed by its button, by Escape, or by reaching its end.
// Browsers refuse to start one with sound unless a click led to it, so if playing fails it
// starts muted and offers the sound.
// `lift` raises the picture clear of the bar, for a video that carries its own caption on
// its lower edge (the opening one counts the years there).
// `enter` is given for the intro: its way out is the green "Join the future", which goes on
// into the visit, where the other videos have a plain "Close".
function Film({ src, onEnd, label, lift, enter }) {
  const video = useRef(null)
  const [muted, setMuted] = useState(false)
  useEffect(() => {
    const v = video.current
    v.muted = false
    v.play().catch(() => { v.muted = true; setMuted(true); v.play().catch(() => {}) })
    const key = (e) => { if (e.key === 'Escape') onEnd() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [src])
  return (
    <section className={'film' + (lift ? ' is-lifted' : '')}>
      <video ref={video} src={src} playsInline onEnded={onEnd} />
      <div className="film-bar">
        <p>{label}</p>
        {muted && <button className="ghost" onClick={() => { video.current.muted = false; setMuted(false) }}>Turn sound on</button>}
        {enter
          ? <button className="primary" onClick={enter}>Join the future</button>
          : <button className="ghost" onClick={onEnd}>Close</button>}
      </div>
    </section>
  )
}

// The company's mark with the year beside it: the way back, on every scene that has a top line.
// INVAP 2071 as one mark: the wordmark, a leaning stroke, the year in outline.
const Lockup = () => <span className="lockup"><img src="/invap.svg" alt="INVAP" /><i className="slash" /><span className="year">2071</span></span>
const Mark = ({ onClick }) => <button className="wordmark" onClick={onClick} aria-label="INVAP 2071"><Lockup /></button>

// A product's description with its scientific terms explained: each term the area lists is
// lit in green and opens a short note, for a reader who has not met the idea before.
function Explained({ text, terms = {} }) {
  const words = Object.keys(terms)
  if (!words.length) return <p>{text}</p>
  const cut = new RegExp('(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')')
  return (
    <p className="explained">
      {text.split(cut).map((piece, i) => terms[piece]
        ? <span className="term" tabIndex={0} key={i}>{piece}<span className="tip" role="tooltip"><strong>{piece}</strong>{terms[piece]}</span></span>
        : piece)}
    </p>
  )
}

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
  const [film, setFilm] = useState(null)             // the video being watched, if any: { src, label }
  const area = AREAS.find((a) => a.id === areaId)

  const go = (next, id = areaId) => {
    const hash = next === 'landing' ? '' : next === 'areas' ? '#areas' : `#${id}`
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
            <p className="claim">Fifty years on, <em>humanity lives among the planets</em>.</p>
            <p className="lede">We worked with{' '}
              {/* Who INVAP is, for someone who does not know: opens on hover, focus or tap. */}
              <span className="term" tabIndex={0} aria-describedby="what-is-invap">INVAP
                <span className="tip" role="tooltip" id="what-is-invap">
                  <strong>What INVAP is</strong>
                  A state-owned Argentine technology company, founded in 1976 in San Carlos de Bariloche. It designs and builds research nuclear reactors, satellites and radars, among them the OPAL reactor in Australia and the ARSAT and SAOCOM satellites.
                </span>
              </span>{' '}to imagine <b>its role in a distant future</b>: how we will <mark>live on other worlds</mark>, <mark>travel between them</mark>, <mark>stay in touch</mark> and <mark>produce the energy</mark> to do it.</p>
            <div className="actions">
              <button className="primary" onClick={() => go('areas')}>Join the future</button>
              <button className="ghost" onClick={() => setFilm({ src: '/media/intro.webm', label: 'Intro video', lift: true, enter: true })}>Intro video</button>
            </div>
          </div>
        </section>
      )}

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
                <button onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(a.id)} onClick={() => { setHover(null); go('product', a.id) }}>
                  <video src={`/media/loop-${a.media}.webm`} autoPlay muted loop playsInline />
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


      {scene === 'product' && (
        <section className="product">
          <header className="top">
            <Mark onClick={() => go('areas')} />
            <Switch area={area} onPick={(id) => go('product', id)} />
          </header>
          <div className="stage">
            <Viewer area={area} />
            <article className="sheet" key={area.id}>
              {/* The area's video, as a small moving preview at the head of the sheet: a click plays it in full. */}
              <button className="preview" onClick={() => setFilm({ src: `/media/film-${area.media}.webm`, label: `${area.title} in 2071` })} aria-label={`Watch the ${area.title} video`}>
                <video src={`/media/preview-${area.media}.webm`} autoPlay muted loop playsInline />
                <span><i />Watch video</span>
              </button>
              <h2 className="headline">{area.header}</h2>
              <h3>{area.device}</h3>
              <Explained text={area.text} terms={area.terms} />
              <ul>{area.facts.map((f) => <li key={f}>{f}</li>)}</ul>
              <div className="sheet-nav">
                <button className="ghost" onClick={() => go('product', other(1).id)}>Next: {other(1).device}</button>
              </div>
            </article>
          </div>
        </section>
      )}

      {film && <Film src={film.src} label={film.label} lift={film.lift} onEnd={() => setFilm(null)}
        enter={film.enter ? () => { setFilm(null); go('areas') } : null} />}
    </main>
  )
}

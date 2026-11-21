import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

// The product, in the round. One renderer for the life of the component; changing the area
// swaps the model in it. The camera is placed from the model's own size, so each product
// fills the frame whatever its proportions. It turns slowly by itself and can be dragged.
//
// What makes it read as an object and not a diagram: every part has a physical material
// (metal or not, how rough), reflections come from a lit room, the tone curve is a film's,
// and anything that emits light blooms.

const BACK = 0x060a14                    // the page's own near-black, so the frame has no edge
const ROOM = 1.18                        // every model stands this much further back, for air round it
const GREEN = new THREE.Color('#0d7a36') // INVAP green as paint, a little lifted so it reads when lit

// Two of the models were built with a blue accent. Their accent and their lights are
// turned to the brand's green here, in one place.
// Lights in the model files were set for another renderer and come in several times too
// strong here: every emitting part is held to one level, just over what blooms.
function recolour(material) {
  if (material.name === 'celeste') material.color.copy(GREEN)
  if (material.name === 'foliage') material.color.setScalar(2.4)   // the wood is seen through glass: lift its painted greens
  if (material.name === 'glass') material.opacity = 0.09
  if (material.name === 'glow') { material.color.set('#b9ffd2'); material.emissive.set('#5dff9a') }
  if (material.emissive && (material.emissive.r + material.emissive.g + material.emissive.b) > 0) {
    material.emissive.set('#4dff95')
    material.emissiveIntensity = 1.15
    material.color.set('#0c2a18')
  }
  // Reflections of the lit room are kept low, and nothing is left mirror-smooth: full
  // metals with a polished finish otherwise show the room more than their own colour.
  material.envMapIntensity = 0.32
  if (!material.transparent) {
    material.roughness = Math.max(material.roughness, 0.42)
    material.metalness = Math.min(material.metalness, 0.8)
  }
}

// The reactor's tubes: plasma held in glass. Slow clouds of charge rise through each tube,
// thin filaments cross them, and the glass catches light at its edges. Written as a shader
// so it moves; only its brightest filaments pass the level that blooms.
const time = { value: 0 }
const plasma = () => new THREE.ShaderMaterial({
  uniforms: { time },
  vertexShader: `
    varying vec3 vWorld; varying vec3 vNormal;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz; vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: `
    uniform float time; varying vec3 vWorld; varying vec3 vNormal;
    float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float noise(vec3 p) {
      vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
    void main() {
      vec3 p = vWorld * vec3(2.2, 1.1, 2.2);
      p.y -= time * 0.35;
      float cloud = fbm(p + fbm(p * 0.7 + time * 0.05) * 1.6);
      float filament = pow(1.0 - abs(fbm(p * vec3(1.6, 0.5, 1.6) + 7.0) * 2.0 - 1.0), 9.0);
      float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(cameraPosition - vWorld))), 2.5);
      vec3 deep = vec3(0.0, 0.07, 0.035), mid = vec3(0.02, 0.5, 0.2), hot = vec3(0.55, 1.0, 0.72);
      vec3 c = mix(deep, mid, smoothstep(0.25, 0.7, cloud));
      c += hot * filament * 1.5;
      c += vec3(0.25, 0.6, 0.4) * rim * 0.6;
      gl_FragColor = vec4(c, 1.0);
    }`,
})

// A laser link: a thin beam leaving a terminal, bright at the aperture and gone a few
// lengths of the craft away, with packets of light running out along it.
const beam = (length) => {
  const shape = new THREE.CylinderGeometry(0.03, 0.03, length, 8, 1, true).translate(0, length / 2, 0)
  return new THREE.Mesh(shape, new THREE.ShaderMaterial({
    uniforms: { time },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying float along; void main() { along = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float time; varying float along;
      void main() {
        float fade = pow(1.0 - along, 1.6);
        float packets = 0.55 + 0.45 * smoothstep(0.6, 1.0, sin(along * 60.0 - time * 9.0));
        gl_FragColor = vec4(vec3(0.35, 1.5, 0.75) * fade * packets, 1.0);
      }`,
  }))
}

export default function Viewer({ area }) {
  const mount = useRef(null)
  const stage = useRef(null)
  const tip = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = mount.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    el.prepend(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BACK)
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture
    // One hard sun and a faint cool fill from behind, as a craft is lit in orbit. No
    // coloured light: green belongs to the parts that are green.
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.35)
    sun.position.set(5, 6, 4)
    const rim = new THREE.DirectionalLight(0xdfe8ff, 0.55)
    rim.position.set(-6, 1.5, -5)
    scene.add(sun, rim)

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.8
    controls.minPolarAngle = 0.45
    controls.maxPolarAngle = 1.8

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    // Only what emits light is brighter than 1, so only that blooms.
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.45, 1.0)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
    // Every named part is drawn round in a quiet grey, so it can be seen that it answers;
    // the one under the pointer turns green. Each part has its own pass (made when a model
    // loads), because one pass draws round everything it is given as a single shape.
    const mark = (pass, on) => {
      pass.edgeStrength = on ? 4.5 : 2.6
      pass.edgeThickness = on ? 1.6 : 1
      pass.visibleEdgeColor.set(on ? '#d9ffe9' : '#7fe0aa')        // at rest a light green, near white when held
      pass.hiddenEdgeColor.set(on ? '#3f9a6c' : '#2a6a48')
    }
    const outlineParts = (parts) => {
      const s = stage.current
      for (const old of s.outlines) { composer.removePass(old); old.dispose() }
      s.outlines = parts.map((p) => {
        const pass = new OutlinePass(new THREE.Vector2(1, 1), scene, camera, p.objects)
        pass.edgeThickness = 1
        pass.edgeGlow = 0
        mark(pass, false)
        composer.insertPass(pass, composer.passes.length - 1)      // before the pass that writes to the screen
        return pass
      })
      size()
    }

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h)
      composer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    size()
    const watch = new ResizeObserver(size)
    watch.observe(el)

    // The model names its own parts. Whatever part is under the pointer is outlined in green
    // and a note opens beside the pointer with its name and what it does; the model stops
    // turning while a part is held. A tap does the same on a touch screen.
    const canvas = renderer.domElement, ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const pointer = { x: 0, y: 0, inside: false, down: false, from: null }
    const show = (i) => {
      const s = stage.current
      if (s.hit === i) return
      s.hit = i
      s.outlines.forEach((pass, j) => mark(pass, j === i))
      controls.autoRotate = i < 0
      canvas.style.cursor = i < 0 ? '' : 'pointer'
      const t = tip.current
      t.classList.toggle('is-on', i >= 0)
      if (i >= 0) { t.firstChild.textContent = s.parts[i].label; t.lastChild.textContent = s.parts[i].note || '' }
    }
    const probe = () => {
      const s = stage.current
      if (!s?.parts || !s.model) return
      const r = canvas.getBoundingClientRect()
      // The nearest thing the pointer is over decides. Glass and light beams are looked
      // through, and a part that is a shell round others (the dome) only counts when
      // nothing inside it is hit.
      const under = (dx, dy) => {
        ndc.set(((pointer.x + dx - r.left) / r.width) * 2 - 1, -((pointer.y + dy - r.top) / r.height) * 2 + 1)
        ray.setFromCamera(ndc, camera)
        let shell = -1
        for (const h of ray.intersectObject(s.model, true)) {
          const i = s.parts.findIndex((p) => p.objects.includes(h.object))
          if (i < 0) { if (h.object.material.transparent || s.through?.test(h.object.name)) continue; break }
          if (s.parts[i].shell) { if (shell < 0) shell = i; continue }
          return i
        }
        return shell
      }
      let found = under(0, 0)
      // A part made of thin pipes is hard to land on, so it also answers when the pointer
      // is within a few pixels of it, and wins over the broad part behind it.
      if (!s.parts[found]?.thin && s.parts.some((p) => p.thin)) {
        for (const [dx, dy] of [[9, 0], [-9, 0], [0, 9], [0, -9], [7, 7], [-7, 7], [7, -7], [-7, -7]]) {
          const near = under(dx, dy)
          if (s.parts[near]?.thin) { found = near; break }
        }
      }
      show(found)
      const t = tip.current, left = pointer.x - r.left, right = left > r.width * 0.6
      t.style.transform = `translate(${left + (right ? -18 : 18)}px, ${pointer.y - r.top + 14}px)` + (right ? ' translateX(-100%)' : '')
    }
    const move = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = true }
    const press = (e) => { pointer.down = true; pointer.from = [e.clientX, e.clientY]; if (e.pointerType === 'mouse') show(-1) }
    const release = (e) => {
      pointer.down = false
      // A press that did not travel is a tap: it picks the part under it.
      if (pointer.from && Math.hypot(e.clientX - pointer.from[0], e.clientY - pointer.from[1]) < 6) { move(e); probe(); if (e.pointerType !== 'mouse') pointer.inside = false }
    }
    const leave = () => { pointer.inside = false; show(-1) }
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerdown', press)
    canvas.addEventListener('pointerup', release)
    canvas.addEventListener('pointerleave', leave)

    let raf = 0, count = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      time.value = performance.now() / 1000
      controls.update()
      composer.render()
      // Looked up a few times a second, not every frame: the ship has 200,000 faces to test.
      if (pointer.inside && !pointer.down && ++count % 5 === 0) probe()
    }
    frame()

    // The large ship is stored compressed; this fetches the small decoder it needs, once.
    const draco = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    const loader = new GLTFLoader().setDRACOLoader(draco)
    // Stars, far behind: two thousand points on a shell, a few of them brighter.
    const spots = new Float32Array(2000 * 3), shine = new Float32Array(2000 * 3), dir = new THREE.Vector3()
    for (let i = 0; i < 2000; i++) {
      dir.randomDirection().multiplyScalar(180).toArray(spots, i * 3)
      const b = 0.12 + Math.random() ** 4 * 0.8
      shine.set([b, b, b * (0.9 + Math.random() * 0.25)], i * 3)
    }
    const sky = new THREE.BufferGeometry()
    sky.setAttribute('position', new THREE.BufferAttribute(spots, 3))
    sky.setAttribute('color', new THREE.BufferAttribute(shine, 3))
    const stars = new THREE.Points(sky, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true }))
    stars.visible = false
    scene.add(stars)

    stage.current = { scene, camera, controls, loader, stars, outlineParts, outlines: [], model: null, wanted: null, parts: null, hit: -1 }
    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerdown', press)
      canvas.removeEventListener('pointerup', release)
      canvas.removeEventListener('pointerleave', leave)
      watch.disconnect()
      controls.dispose()
      draco.dispose()
      pmrem.dispose()
      composer.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const s = stage.current
    setReady(false)
    s.wanted = area.id
    s.loader.load(area.model, (gltf) => {
      if (s.wanted !== area.id) return                     // another product was asked for meanwhile
      if (s.model) s.scene.remove(s.model)
      const model = gltf.scene
      const lit = area.plasma && new RegExp(area.plasma), glass = lit && plasma()
      model.traverse((n) => {
        if (!n.isMesh) return
        // Foliage is coloured per corner. The file carries that paint in its second colour
        // set (the first is blank white), so it is moved to where the material reads it.
        if (n.geometry.attributes.color_1) n.geometry.setAttribute('color', n.geometry.attributes.color_1)
        if (lit && lit.test(n.material.name)) { glass.name = n.material.name; n.material = glass } else recolour(n.material)
        // The lamp at the top of the dome stands in for the Sun, so it burns warm white,
        // not the green of the indicator lights (it shares their material in the file).
        if (/^lamp$/.test(n.name)) {
          n.material = n.material.clone()
          n.material.emissive.set('#ffe9b8')
          n.material.color.set('#fff6dc')
          n.material.emissiveIntensity = 1.9
        }
      })
      // Centre it and measure it.
      const box = new THREE.Box3().setFromObject(model)
      const centre = box.getCenter(new THREE.Vector3())
      model.position.sub(centre)
      model.updateMatrixWorld(true)
      const radius = box.getSize(new THREE.Vector3()).length() / 2
      // A craft in space hangs at a tilt among stars, with no floor implied; what stands on
      // the ground stays level and has none.
      const pivot = new THREE.Group()
      pivot.add(model)
      if (area.space) pivot.rotation.set(...area.space)
      s.stars.visible = !!area.space
      s.scene.add(pivot)
      s.model = pivot
      // Laser links are added after the measuring, so they do not push the craft back.
      for (const b of area.beams || []) {
        const ray = beam(radius * 2.4)
        ray.position.set(...b.at)
        ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...b.to).normalize())
        model.add(ray)
      }
      // Far enough back that a ball round the whole model fits the narrower side of the frame.
      // That is a loose fit for long thin things, so each area says how much closer to come.
      const fit = radius / Math.sin(THREE.MathUtils.degToRad(s.camera.fov / 2)) * (s.camera.aspect < 1 ? 1 / s.camera.aspect : 1)
      s.camera.position.copy(new THREE.Vector3(...area.view.from).normalize().multiplyScalar(fit * (area.view.close || 0.7) * ROOM))
      s.controls.target.set(0, radius * area.view.lift, 0)
      s.controls.update()
      // The meshes that make each named part up, found by material name (`match`) or by
      // their own name (`name`).
      s.parts = area.parts.map((p) => {
        const byMaterial = p.match && new RegExp(p.match), byName = p.name && new RegExp(p.name)
        const objects = []
        model.traverse((n) => {
          if (n.isMesh && ((byMaterial && byMaterial.test(n.material.name)) || (byName && (byName.test(n.name) || byName.test(n.parent?.name || ''))))) objects.push(n)
        })
        return { ...p, objects }
      })
      s.hit = -1
      s.through = area.through ? new RegExp(area.through) : null
      s.outlineParts(s.parts)
      s.controls.autoRotate = true
      pivot.updateMatrixWorld(true)
      setReady(true)
    })
  }, [area])

  return (
    <div className={'viewer' + (ready ? ' is-ready' : '')} ref={mount} aria-label={`3D model: ${area.device}`}>
      <div className="part-tip" ref={tip} role="tooltip"><strong /><span /></div>
      <p className="viewer-hint">Drag to rotate · point at a part</p>
    </div>
  )
}

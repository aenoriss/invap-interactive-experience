import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

// The product, in the round. One renderer for the life of the component; changing the area
// swaps the model in it. The camera is placed from the model's own size, so each product
// fills the frame whatever its proportions. It turns slowly by itself and can be dragged.
//
// What makes it read as an object and not a diagram: every part has a physical material
// (metal or not, how rough), reflections come from a lit room, the tone curve is a film's,
// and anything that emits light blooms.

const BACK = 0x060a14                    // the page's own near-black, so the frame has no edge
const GREEN = new THREE.Color('#0d7a36') // INVAP green as paint, a little lifted so it reads when lit

// Two of the models were built with a blue accent. Their accent and their lights are
// turned to the brand's green here, in one place.
// Lights in the model files were set for another renderer and come in several times too
// strong here: every emitting part is held to one level, just over what blooms.
function recolour(material) {
  if (material.name === 'celeste') material.color.copy(GREEN)
  if (material.name === 'glow') { material.color.set('#b9ffd2'); material.emissive.set('#5dff9a') }
  if (material.emissive && (material.emissive.r + material.emissive.g + material.emissive.b) > 0) {
    material.emissive.set('#4dff95')
    material.emissiveIntensity = 1.15
    material.color.set('#0c2a18')
  }
  material.envMapIntensity = 0.75
}

export default function Viewer({ area }) {
  const mount = useRef(null)
  const stage = useRef(null)
  const labels = useRef([])
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
    // One hard sun and a green rim from behind, as a craft is lit in orbit.
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.35)
    sun.position.set(5, 6, 4)
    const rim = new THREE.DirectionalLight(0x4dd68a, 1.1)
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

    // Each frame the labels are moved to where their parts are on screen. One on the far
    // side of the model is faded, so the eye is not sent to something it cannot see.
    const at = new THREE.Vector3(), toCamera = new THREE.Vector3()
    let raf = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      controls.update()
      composer.render()
      const s = stage.current
      if (!s || !s.parts) return
      const w = el.clientWidth, h = el.clientHeight
      toCamera.copy(camera.position).sub(controls.target).normalize()
      s.parts.forEach((p, i) => {
        const tag = labels.current[i]
        if (!tag) return
        at.copy(p.point).project(camera)
        tag.style.transform = `translate(${(at.x + 1) / 2 * w}px, ${(1 - at.y) / 2 * h}px)`
        tag.style.opacity = p.point.dot(toCamera) > -0.2 * s.radius ? 1 : 0.15
      })
    }
    frame()

    // The large ship is stored compressed; this fetches the small decoder it needs, once.
    const draco = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    const loader = new GLTFLoader().setDRACOLoader(draco)
    stage.current = { scene, camera, controls, loader, model: null, wanted: null, parts: null, radius: 1 }
    return () => {
      cancelAnimationFrame(raf)
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
      model.traverse((n) => { if (n.isMesh) (Array.isArray(n.material) ? n.material : [n.material]).forEach(recolour) })
      // Centre it and measure it.
      const box = new THREE.Box3().setFromObject(model)
      const centre = box.getCenter(new THREE.Vector3())
      model.position.sub(centre)
      model.updateMatrixWorld(true)
      const radius = box.getSize(new THREE.Vector3()).length() / 2
      s.scene.add(model)
      s.model = model
      // Far enough back that a ball round the whole model fits the narrower side of the frame.
      // That is a loose fit for long thin things, so each area says how much closer to come.
      const fit = radius / Math.sin(THREE.MathUtils.degToRad(s.camera.fov / 2)) * (s.camera.aspect < 1 ? 1 / s.camera.aspect : 1)
      s.camera.position.copy(new THREE.Vector3(...area.view.from).normalize().multiplyScalar(fit * (area.view.close || 0.7)))
      s.controls.target.set(0, radius * area.view.lift, 0)
      s.controls.update()
      // Where each label goes: a point given outright, or the middle (or top) of every part
      // whose material name fits the pattern.
      s.parts = area.parts.map((p) => {
        if (p.at) return { point: new THREE.Vector3(...p.at).sub(centre) }
        const fits = new RegExp(p.match), found = new THREE.Box3()
        model.traverse((n) => { if (n.isMesh && fits.test(n.material.name)) found.expandByObject(n) })
        if (found.isEmpty()) return { point: new THREE.Vector3() }
        const point = found.getCenter(new THREE.Vector3())
        if (p.pick === 'top') point.y = found.max.y
        if (p.pick === 'side') point.x = found.max.x        // for parts ranged round an axis, whose middle is the axis
        return { point }
      })
      s.radius = radius
      setReady(true)
    })
  }, [area])

  return (
    <div className={'viewer' + (ready ? ' is-ready' : '')} ref={mount} aria-label={`Modelo 3D: ${area.device}`}>
      {area.parts.map((p, i) => <span className="part" key={area.id + i} ref={(n) => { labels.current[i] = n }}><i />{p.label}</span>)}
      <p className="viewer-hint">Arrastrá para girar</p>
    </div>
  )
}

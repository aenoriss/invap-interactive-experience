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
    // The part whose label is lit is drawn round in green. One part at a time: the pass
    // outlines the silhouette of everything it is given as one shape.
    const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera)
    outline.edgeStrength = 3.2
    outline.edgeThickness = 1
    outline.edgeGlow = 0
    outline.visibleEdgeColor.set('#6fd39b')
    outline.hiddenEdgeColor.set('#1f6a45')
    composer.addPass(outline)
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
      time.value = performance.now() / 1000
      controls.update()
      composer.render()
      const s = stage.current
      if (!s || !s.parts) return
      const w = el.clientWidth, h = el.clientHeight
      toCamera.copy(camera.position).sub(controls.target).normalize()
      // One label is lit at a time and its part is outlined. It moves on by itself every
      // few seconds, and stays on the label the pointer is over.
      if (!s.hold && performance.now() - (s.since || 0) > 2800) { s.active = ((s.active || 0) + 1) % s.parts.length; s.since = performance.now() }
      outline.selectedObjects = s.parts[s.active]?.objects || []
      s.parts.forEach((p, i) => {
        const tag = labels.current[i]
        if (!tag) return
        tag.classList.toggle('is-on', i === s.active)
        at.copy(p.point).project(camera)
        // Past the middle of the frame the name goes to the left of its ring (with a margin
        // either side of the line, so it does not flicker as the model turns through it).
        const side = at.x > 0.16 ? true : at.x < 0.04 ? false : tag.classList.contains('flip')
        tag.classList.toggle('flip', side)
        tag.style.transform = `translate(${(at.x + 1) / 2 * w}px, ${(1 - at.y) / 2 * h}px)` + (side ? ' translateX(-100%)' : '')
        tag.style.opacity = i === s.active ? 1 : p.point.dot(toCamera) > -0.2 * s.radius ? 0.5 : 0.15
      })
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

    stage.current = { scene, camera, controls, loader, stars, model: null, wanted: null, parts: null, radius: 1 }
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
      const lit = area.plasma && new RegExp(area.plasma), glass = lit && plasma()
      model.traverse((n) => {
        if (!n.isMesh) return
        // Foliage is coloured per corner. The file carries that paint in its second colour
        // set (the first is blank white), so it is moved to where the material reads it.
        if (n.geometry.attributes.color_1) n.geometry.setAttribute('color', n.geometry.attributes.color_1)
        if (lit && lit.test(n.material.name)) { glass.name = n.material.name; n.material = glass } else recolour(n.material)
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
      // Where each label goes: a point given outright, or the middle (or top) of every part
      // whose material name fits the pattern.
      // Parts are measured with the model upright, then turned with it: measured tilted,
      // "the top" of a part would be the top of its leaning box, which is off the part.
      const tilt = pivot.rotation.clone()
      pivot.rotation.set(0, 0, 0)
      pivot.updateMatrixWorld(true)
      const tilted = (point) => point.applyEuler(tilt)
      s.parts = area.parts.map((p) => {
        // The meshes that make the part up, found by material name (`match`) or by their own
        // name (`name`): these are what is outlined in green while the part's label is lit.
        const byMaterial = p.match && new RegExp(p.match), byName = p.name && new RegExp(p.name)
        const objects = [], found = new THREE.Box3()
        model.traverse((n) => {
          if (!n.isMesh) return
          if ((byMaterial && byMaterial.test(n.material.name)) || (byName && (byName.test(n.name) || byName.test(n.parent?.name || '')))) { objects.push(n); found.expandByObject(n) }
        })
        // Where the label stands: a point given outright, or the middle (or top) of the part.
        if (p.at) return { objects, point: tilted(new THREE.Vector3(...p.at).sub(centre)) }
        if (p.from) return { objects, point: tilted(new THREE.Vector3(...p.from)) }      // measured from the model's middle
        if (found.isEmpty()) return { objects, point: new THREE.Vector3() }
        const point = found.getCenter(new THREE.Vector3())
        if (p.pick === 'top') point.y = found.max.y
        if (p.pick === 'side') point.x = found.max.x        // for parts ranged round an axis, whose middle is the axis
        return { objects, point: tilted(point) }
      })
      s.active = 0
      pivot.rotation.copy(tilt)
      pivot.updateMatrixWorld(true)
      s.radius = radius
      setReady(true)
    })
  }, [area])

  return (
    <div className={'viewer' + (ready ? ' is-ready' : '')} ref={mount} aria-label={`3D model: ${area.device}`}>
      {area.parts.map((p, i) => (
        <span className="part" key={area.id + i} ref={(n) => { labels.current[i] = n }}
          onMouseEnter={() => { const s = stage.current; s.active = i; s.hold = true }}
          onMouseLeave={() => { const s = stage.current; s.hold = false; s.since = performance.now() }}>
          <i />{p.label}
        </span>
      ))}
      <p className="viewer-hint">Drag to rotate</p>
    </div>
  )
}

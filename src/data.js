// The four areas of the 2071 catalogue, each with its product.
//
// The copy is held to what fifty years could plausibly bring: the Moon and Mars, not other
// stars. Nothing travels faster than light, reactors shed heat through radiators, and a
// habitat has to grow food. The four products are one system: the reactor powers the dome
// and the ship, and the satellite links them.
//
// `id` is what the address shows; `media` names the area's video files, which keep their
// original Spanish names. `facts` only restate what each product's own text says. `parts`
// name places on the model for the labels that follow it as it turns: either a point in the
// model file's own coordinates (`at`, Y up), or the parts whose material name fits a pattern
// (`match`), labelled at their middle, their top or their side. `beams` are laser links drawn
// from a point along a direction; `plasma` names the parts drawn as moving plasma; `space`
// marks a craft adrift in space and gives the tilt it hangs at.
export const AREAS = [
  {
    id: 'habitat',
    media: 'habitat',
    title: 'Habitat',
    body: 'We tend to picture space as a cold and desolate place. See how INVAP is changing that, taking the Earth to the Moon and to Mars.',
    header: 'Taking the Earth into space',
    device: 'Elmapu',
    text: 'Elmapu domes are closed ecosystems: air, water and nutrients circulate without ever leaving the habitat. Under a pressurised dome grow the crops that feed the colony and a forest that renews its air. A bank of regolith stops radiation at the foot of the dome, and where sunlight is too weak an Antu reactor provides the light.',
    facts: ['Air, water and nutrients in a closed loop', 'Crops and forest under one dome', 'For colonies on the Moon and Mars'],
    model: '/models/elmapu.glb',
    view: { from: [-0.55, 0.7, 1.4], lift: 0.08, close: 0.4 },
    parts: [{ label: 'Pressurised dome', at: [0, 2.9, 0] }, { label: 'Crops', at: [-1.5, 0.45, 0.3] }, { label: 'Forest', at: [1.1, 0.9, -0.9] }, { label: 'Airlock', at: [4.3, 0.2, 0] }],
  },
  {
    id: 'transport',
    media: 'transporte',
    title: 'Transport',
    body: 'Space has always held the human imagination. What used to be a dream is now a cargo route. See how INVAP links the Earth, the Moon and Mars.',
    header: 'Taking on the last frontier',
    device: 'Patoruzú',
    text: 'The Patoruzú is an interplanetary cargo ship. Its modules are built on Earth and assembled in lunar orbit, with materials lifted from the surface by the Moon\'s space elevator. An Antu reactor powers its ion engines, which push gently but for months on end, and its rings spin to give the crew gravity on the way.',
    facts: ['Modules built on Earth', 'Assembled in lunar orbit', 'A route between the Earth, the Moon and Mars'],
    model: '/models/patoruzu.glb',
    view: { from: [1.2, 0.45, 1.0], lift: 0, close: 0.62 },
    space: [0.08, 0, -0.1],
    parts: [{ label: 'Gravity rings', match: '^Coil', pick: 'top' }, { label: 'Bridge', match: 'Cockpit_Window|Command_Top_Windows' }, { label: 'Ion engines', match: '^Thruster_Nozzles' }],
  },
  {
    id: 'communication',
    media: 'comunicacion',
    title: 'Communication',
    body: 'The solar system has become one connected network, and INVAP is at the centre of it. See how we connect the most remote colonies.',
    header: 'Connecting the worlds',
    device: 'Mafalda II',
    text: 'The Mafalda II satellite is a node of the Interplanetary Internet. It receives data by radio from nearby colonies and relays it by laser to other nodes millions of kilometres away, at rates radio cannot reach. The signal travels at the speed of light: between the Earth and Mars it takes 3 to 22 minutes, and the network holds each message until the next link is in view. The keys that encrypt it are shared through quantum entanglement.',
    facts: ['Laser links between planets', 'Stores and forwards when no link is in view', 'Keys shared through quantum entanglement'],
    model: '/models/mafalda.glb',
    view: { from: [0.8, 0.6, 1.35], lift: 0.05, close: 0.74 },
    space: [0.1, 0, 0.16],
    parts: [{ label: 'Radio antenna', at: [-0.6, 2.75, 0] }, { label: 'Laser terminal', at: [0.55, 1.4, -0.45] }, { label: 'Solar panels', at: [3.15, 0, 0] }],
    beams: [{ at: [0.776, 1.558, -0.586], to: [0.744, 0.496, -0.447] }, { at: [0.224, -1.637, 0.909], to: [0.351, -0.621, 0.701] }],
  },
  {
    id: 'energy',
    media: 'energia',
    title: 'Energy',
    body: 'The settling of space will run on new technologies that produce energy cleanly and safely, giving more autonomy to the exploration of the solar system.',
    header: 'Lighting up the cosmos',
    device: 'Antu Reactor',
    text: 'Antu reactors produce energy by nuclear fusion: they join hydrogen nuclei, the same reaction that lights the Sun, inside a plasma held in place by magnetic fields. There is no chain reaction that could run away, and they leave almost no long-lived waste. They are small enough to fit in ships, stations and small colonies. In a vacuum, waste heat can only be radiated away, which is the job of their four radiators.',
    facts: ['Nuclear fusion', 'No chain reaction', 'For ships, stations and colonies'],
    model: '/models/antu.glb',
    view: { from: [1.25, 0.4, 0.75], lift: 0, close: 1.05 },
    space: [0.24, 0, -0.3],
    plasma: 'Reactor_Core',
    parts: [{ label: 'Plasma chamber', match: 'Reactor_Core' }, { label: 'Radiators', at: [2.386, 0.783, -2.387] }, { label: 'Cooling loop', match: 'Reactor_Pipes', pick: 'top' }],
  },
]

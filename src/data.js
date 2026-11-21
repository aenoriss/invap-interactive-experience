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
    terms: {
      'closed ecosystems': 'A habitat that recycles its own air, water and nutrients, as the Earth does, with nothing brought in from outside.',
      regolith: 'The loose layer of dust and broken rock that covers the Moon and Mars.',
      radiation: 'High-energy particles from the Sun and from deep space. Earth\'s air and magnetic field stop most of them; the Moon and Mars have neither.',
    },
    facts: ['Air, water and nutrients in a closed loop', 'Crops and forest under one dome', 'For colonies on the Moon and Mars'],
    model: '/models/elmapu.glb',
    view: { from: [-0.55, 0.7, 1.4], lift: 0.08, close: 0.4 },
    through: '^(dome_|node)',          // the dome and its frame are pointed through, at what is inside
    parts: [
      { label: 'Crops', name: '^(crops|beds)', note: 'Four crops in rotation feed the colony and recycle its water.' },
      { label: 'Forest', name: '^(conifers|canopies|trunks)', note: 'Trees take in the carbon dioxide people breathe out and give back oxygen.' },
      { label: 'Airlock', name: '^(tunnel|hatch)', note: 'The only way in or out: people pass through without letting the air escape.' },
      { label: 'Solar panels', name: '^pv_', note: 'Power for the dome while the Sun is up. Through the long night an Antu reactor takes over.' },
      { label: 'Pond', name: '^pond', note: 'Open water: part of the dome\'s water cycle, and a reserve for the crops.' },
      { label: 'Antenna', name: '^mast', thin: true, note: 'The colony\'s radio link to the satellites overhead.' },
    ],
  },
  {
    id: 'transport',
    media: 'transporte',
    title: 'Transport',
    body: 'Space has always held the human imagination. What used to be a dream is now a cargo route. See how INVAP links the Earth, the Moon and Mars.',
    header: 'Taking on the last frontier',
    device: 'Patoruzú',
    text: 'The Patoruzú is an interplanetary cargo ship. Its modules are built on Earth and assembled in lunar orbit, with materials lifted from the surface by the Moon\'s space elevator. An Antu reactor powers its ion engines, which push gently but for months on end, and its rings spin to give the crew gravity on the way.',
    terms: {
      'space elevator': 'A cable from the surface up to a station in space, climbed by cargo cars. On the Moon, where gravity is weak, fibres that exist today are strong enough.',
      'ion engines': 'Engines that push electrically charged gas out at very high speed. The thrust is gentle but uses very little propellant, so it can run for months.',
      'rings spin': 'A spinning ring presses whatever is inside it against its outer wall, and that pressure feels like weight.',
    },
    facts: ['Modules built on Earth', 'Assembled in lunar orbit', 'A route between the Earth, the Moon and Mars'],
    model: '/models/patoruzu.glb',
    view: { from: [1.2, 0.45, 1.0], lift: 0, close: 0.62 },
    space: [0.08, 0, -0.1],
    parts: [
      { label: 'Gravity rings', match: '^Coil', note: 'They spin so that the crew feels weight during months of travel.' },
      { label: 'Bridge', match: 'Cockpit|Command_Top', note: 'Where the crew flies the ship and watches over the cargo.' },
      { label: 'Ion engines', match: '^(Thruster|Engine_Mount)', note: 'Electric engines: a gentle push that never stops, fed by the reactor.' },
    ],
  },
  {
    id: 'communication',
    media: 'comunicacion',
    title: 'Communication',
    body: 'The solar system has become one connected network, and INVAP is at the centre of it. See how we connect the most remote colonies.',
    header: 'Connecting the worlds',
    device: 'Mafalda II',
    text: 'The Mafalda II satellite is a node of the Interplanetary Internet. It receives data by radio from nearby colonies and relays it by laser to other nodes millions of kilometres away, at rates radio cannot reach. The signal travels at the speed of light: between the Earth and Mars it takes 3 to 22 minutes, and the network holds each message until the next link is in view. The keys that encrypt it are shared through quantum entanglement.',
    terms: {
      'Interplanetary Internet': 'A network built for long delays: each node stores a message and forwards it when the next link becomes available.',
      'by laser': 'Light carries far more data than radio, in a far narrower beam, so less of it is lost over distance.',
      'speed of light': 'About 300,000 km per second. Nothing carries information faster, so distant worlds always answer with a delay.',
      'quantum entanglement': 'Two particles created together stay linked: measuring one tells you about the other. It cannot send a message, but it lets two places share a secret key.',
    },
    facts: ['Laser links between planets', 'Stores and forwards when no link is in view', 'Keys shared through quantum entanglement'],
    model: '/models/mafalda.glb',
    view: { from: [0.8, 0.6, 1.35], lift: 0.05, close: 0.74 },
    space: [0.1, 0, 0.16],
    parts: [
      { label: 'Radio antenna', name: '^(dish|feed)', note: 'Listens to nearby colonies by radio, which spreads wide and is easy to catch.' },
      { label: 'Laser terminal', name: '^laser_', note: 'A telescope that sends and receives the laser links to other nodes.' },
      { label: 'Solar panels', name: '^wing_', note: 'Power for the satellite this close to the Sun. Farther out it would need a reactor.' },
    ],
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
    terms: {
      'nuclear fusion': 'Joining light atomic nuclei into heavier ones, which releases energy. It is the opposite of fission, which splits heavy nuclei.',
      plasma: 'Gas so hot that its atoms have lost their electrons. Fusion needs it at over a hundred million degrees.',
      'chain reaction': 'In a fission reactor each split atom triggers others. Fusion has no such cascade: if conditions slip, the reaction simply stops.',
      radiators: 'Panels that shed heat as infrared light. With no air or water around, it is the only way to cool anything in space.',
    },
    facts: ['Nuclear fusion', 'No chain reaction', 'For ships, stations and colonies'],
    model: '/models/antu.glb',
    view: { from: [1.25, 0.4, 0.75], lift: 0, close: 1.05 },
    space: [0.24, 0, -0.3],
    plasma: 'Reactor_Core',
    parts: [
      { label: 'Plasma chamber', match: 'Reactor_Core', note: 'Where magnetic fields hold the plasma while its nuclei fuse.' },
      { label: 'Radiators', name: '^(radiator|heat_pipe|manifold)', note: 'They shed waste heat as infrared light, the only way to cool down in a vacuum.' },
      { label: 'Cooling loop', match: 'Reactor_Pipes', thin: true, note: 'Carries heat from the chambers out to the radiators.' },
    ],
  },
]

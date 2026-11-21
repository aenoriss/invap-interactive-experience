// The four areas of the 2071 catalogue, each with its product.
//
// The copy is held to what fifty years could plausibly bring: the Moon and Mars, not other
// stars. Nothing travels faster than light, reactors shed heat through radiators, and a
// habitat has to grow food. The four products are one system: the reactor powers the dome
// and the ship, and the satellite links them.
//
// `facts` only restate what each product's own text says. `parts` name places on the model
// for the labels that follow it as it turns: either a point in the model file's own
// coordinates (`at`, Y up), or the parts whose material name fits a pattern (`match`),
// labelled at their middle, their top or their side. `beams` are laser links drawn from a
// point along a direction; `plasma` names the parts drawn as moving plasma; `space` marks
// a craft adrift in space and gives the tilt it hangs at.
export const AREAS = [
  {
    id: 'habitat',
    title: 'Hábitat',
    body: 'Cuando pensamos en el espacio solemos hacerlo como un lugar frío y desolado. Conocé cómo INVAP está cambiando esta realidad, llevando la Tierra a la Luna y a Marte.',
    header: 'Llevando la Tierra al espacio',
    device: 'Elmapu',
    text: 'Los domos Elmapu son ecosistemas cerrados: el aire, el agua y los nutrientes circulan sin salir del hábitat. Bajo una cúpula presurizada crecen los cultivos que alimentan a la colonia y un bosque que renueva el aire. Un talud de regolito frena la radiación al pie del domo, y donde el Sol no alcanza la luz la pone un reactor Antu.',
    facts: ['Aire, agua y nutrientes en ciclo cerrado', 'Cultivos y bosque bajo una misma cúpula', 'Para colonias en la Luna y en Marte'],
    model: '/models/elmapu.glb',
    view: { from: [-0.55, 0.7, 1.4], lift: 0.08, close: 0.4 },
    parts: [{ label: 'Cúpula presurizada', at: [0, 2.9, 0] }, { label: 'Cultivos', at: [-1.5, 0.45, 0.3] }, { label: 'Bosque', at: [1.1, 0.9, -0.9] }, { label: 'Esclusa', at: [4.3, 0.2, 0] }],
  },
  {
    id: 'transporte',
    title: 'Transporte',
    body: 'El espacio siempre ha cautivado la imaginación humana. Lo que antes era un sueño hoy es una ruta de carga. Descubrí cómo INVAP une la Tierra, la Luna y Marte.',
    header: 'Desafiando la última frontera',
    device: 'Patoruzú',
    text: 'El Patoruzú es una nave de carga interplanetaria. Sus módulos se fabrican en la Tierra y se ensamblan en órbita lunar, con materiales que suben desde la superficie por el ascensor espacial de la Luna. Un reactor Antu alimenta sus motores iónicos, que empujan poco pero durante meses, y sus anillos giran para dar gravedad a la tripulación en el viaje.',
    facts: ['Módulos hechos en la Tierra', 'Ensamblaje en órbita lunar', 'Ruta entre la Tierra, la Luna y Marte'],
    model: '/models/patoruzu.glb',
    view: { from: [1.2, 0.45, 1.0], lift: 0, close: 0.62 },
    space: [0.08, 0, -0.1],
    parts: [{ label: 'Anillos de gravedad', match: '^Coil', pick: 'top' }, { label: 'Puente de mando', match: 'Cockpit_Window|Command_Top_Windows' }, { label: 'Motores iónicos', match: '^Thruster_Nozzles' }],
  },
  {
    id: 'comunicacion',
    title: 'Comunicación',
    body: 'El sistema solar se ha convertido en una red interconectada e INVAP se encuentra en el centro de este nuevo paradigma. Descubrí cómo conectamos las colonias más remotas.',
    header: 'Conectando los mundos',
    device: 'Mafalda II',
    text: 'El satélite Mafalda II es un nodo de la Internet Interplanetaria. Recibe por radio los datos de las colonias cercanas y los retransmite por láser a otros nodos, a millones de kilómetros, con un caudal que la radio no alcanza. La señal viaja a la velocidad de la luz: entre la Tierra y Marte tarda de 3 a 22 minutos, y la red guarda cada mensaje hasta que el siguiente enlace está a la vista. Las claves que lo cifran se reparten por entrelazamiento cuántico.',
    facts: ['Enlaces láser entre planetas', 'Guarda y reenvía cuando no hay enlace', 'Claves repartidas por entrelazamiento cuántico'],
    model: '/models/mafalda.glb',
    view: { from: [0.8, 0.6, 1.35], lift: 0.05, close: 0.74 },
    space: [0.1, 0, 0.16],
    parts: [{ label: 'Antena de radio', at: [-0.6, 2.75, 0] }, { label: 'Terminal láser', at: [0.55, 1.4, -0.45] }, { label: 'Paneles solares', at: [3.15, 0, 0] }],
    beams: [{ at: [0.776, 1.558, -0.586], to: [0.744, 0.496, -0.447] }, { at: [0.224, -1.637, 0.909], to: [0.351, -0.621, 0.701] }],
  },
  {
    id: 'energia',
    title: 'Energía',
    body: 'La colonización del espacio será alimentada por nuevas tecnologías que producirán energía de manera limpia y segura, brindando mayor autonomía en la exploración del sistema solar.',
    header: 'Iluminando el cosmos',
    device: 'Reactor Antu',
    text: 'Los Reactores Antu producen energía por fusión nuclear: unen núcleos de hidrógeno, la misma reacción que enciende al Sol, dentro de un plasma confinado por campos magnéticos. No hay reacción en cadena que pueda descontrolarse y casi no dejan residuos de larga vida. Su tamaño permite instalarlos en naves, estaciones y colonias pequeñas. En el vacío el calor sobrante solo puede irradiarse, y de eso se ocupan sus cuatro radiadores.',
    facts: ['Fusión nuclear', 'Sin reacción en cadena', 'Para naves, estaciones y colonias'],
    model: '/models/antu.glb',
    view: { from: [1.25, 0.4, 0.75], lift: 0, close: 0.82 },
    space: [0.24, 0, -0.3],            // adrift: the tilt it hangs at, among stars
    plasma: 'Reactor_Core',
    parts: [{ label: 'Cámara de plasma', match: 'Reactor_Core' }, { label: 'Radiadores', at: [2.386, 0.783, -2.387] }, { label: 'Circuito de refrigeración', match: 'Reactor_Pipes', pick: 'top' }],
  },
]
